import { describe, expect, it } from "vitest";

import {
  addToAllowList,
  buildPolicy,
  DEFAULT_DENYLIST,
  DEFAULT_WORKSPACE_ALLOWLIST,
  evaluateAllowlist,
  extractOrigin,
  parseHostPattern,
} from "../security/Allowlist.ts";

const agentPolicy = buildPolicy();

describe("parseHostPattern", () => {
  it("parses plain hosts", () => {
    expect(parseHostPattern("Example.com")).toEqual({
      raw: "Example.com",
      host: "example.com",
      wildcard: false,
    });
  });

  it("parses wildcard hosts", () => {
    expect(parseHostPattern("*.example.com")).toEqual({
      raw: "*.example.com",
      host: "example.com",
      wildcard: true,
    });
  });

  it("captures the path prefix for scoped deny entries", () => {
    expect(parseHostPattern("github.com/login")).toEqual({
      raw: "github.com/login",
      host: "github.com",
      wildcard: false,
      pathPrefix: "/login",
    });
  });

  it("rejects mid-label wildcards", () => {
    expect(() => parseHostPattern("foo*.example.com")).toThrow();
    expect(() => parseHostPattern("*.*.example.com")).toThrow();
  });

  it("rejects empty patterns", () => {
    expect(() => parseHostPattern("   ")).toThrow();
  });
});

describe("extractOrigin", () => {
  it("normalises host to lowercase", () => {
    expect(extractOrigin("https://EXAMPLE.com/path")?.host).toBe("example.com");
  });

  it("returns undefined for unparseable urls", () => {
    expect(extractOrigin("not a url")).toBeUndefined();
    expect(extractOrigin("")).toBeUndefined();
  });
});

describe("evaluateAllowlist — default policy matrix", () => {
  const cases: Array<{
    url: string;
    initiator: "user" | "agent";
    expected: string;
  }> = [
    { url: "http://localhost:3000/app", initiator: "agent", expected: "allowed" },
    { url: "http://127.0.0.1/", initiator: "agent", expected: "allowed" },
    { url: "http://[::1]/", initiator: "agent", expected: "allowed" },
    { url: "http://my-box.local/", initiator: "agent", expected: "allowed" },
    { url: "http://deep.nested.local/", initiator: "agent", expected: "allowed" },
    { url: "https://example.com/", initiator: "agent", expected: "denied" },
    { url: "https://example.com/", initiator: "user", expected: "confirmRequired" },
    { url: "not a url", initiator: "user", expected: "denied" },
  ];

  for (const c of cases) {
    it(`${c.initiator} -> ${c.url} => ${c.expected}`, () => {
      const decision = evaluateAllowlist({
        url: c.url,
        initiator: c.initiator,
        policy: agentPolicy,
      });
      expect(decision.decision).toBe(c.expected);
    });
  }
});

describe("evaluateAllowlist — deny list beats allow list", () => {
  it("denies default denylisted hosts", () => {
    for (const host of ["accounts.google.com", "id.apple.com"]) {
      const decision = evaluateAllowlist({
        url: `https://${host}/`,
        initiator: "user",
        policy: agentPolicy,
      });
      expect(decision.decision).toBe("denied");
      expect(decision.reason).toBe("Denylisted");
    }
  });

  it("scopes path-prefix deny entries correctly", () => {
    const loginBlocked = evaluateAllowlist({
      url: "https://github.com/login",
      initiator: "user",
      policy: agentPolicy,
    });
    expect(loginBlocked.decision).toBe("denied");
    expect(loginBlocked.reason).toBe("Denylisted");

    const repoOk = evaluateAllowlist({
      url: "https://github.com/alex/project",
      initiator: "user",
      policy: agentPolicy,
    });
    expect(repoOk.decision).toBe("confirmRequired");
  });

  it("wildcard deny rules match subdomains", () => {
    const decision = evaluateAllowlist({
      url: "https://my-company.okta.com/sso",
      initiator: "user",
      policy: agentPolicy,
    });
    expect(decision.decision).toBe("denied");
    expect(decision.matchedPattern).toBe("*.okta.com");
  });

  it("does not let an allow-list entry override a deny", () => {
    const policy = buildPolicy({ allowedOrigins: ["accounts.google.com"] });
    const decision = evaluateAllowlist({
      url: "https://accounts.google.com/",
      initiator: "user",
      policy,
    });
    expect(decision.decision).toBe("denied");
  });
});

describe("policy overrides", () => {
  it("buildPolicy extends the defaults", () => {
    const policy = buildPolicy({
      allowedOrigins: ["staging.example.com"],
      deniedOrigins: ["malicious.test"],
    });
    expect(policy.allowList).toContain("staging.example.com");
    expect(policy.denyList).toContain("malicious.test");
    for (const d of DEFAULT_WORKSPACE_ALLOWLIST) {
      expect(policy.allowList).toContain(d);
    }
    for (const d of DEFAULT_DENYLIST) {
      expect(policy.denyList).toContain(d);
    }
  });

  it("addToAllowList is idempotent and case-insensitive", () => {
    const a = addToAllowList({ policy: agentPolicy, origin: "Foo.com" });
    const b = addToAllowList({ policy: a, origin: "foo.com" });
    expect(a.allowList.filter((p) => p === "foo.com")).toHaveLength(1);
    expect(b.allowList).toEqual(a.allowList);
  });
});

describe("purity", () => {
  it("same input always yields the same decision", () => {
    const first = evaluateAllowlist({
      url: "https://unknown.test/",
      initiator: "agent",
      policy: agentPolicy,
    });
    const second = evaluateAllowlist({
      url: "https://unknown.test/",
      initiator: "agent",
      policy: agentPolicy,
    });
    expect(first).toEqual(second);
  });
});
