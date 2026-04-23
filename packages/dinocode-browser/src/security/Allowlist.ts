/**
 * Navigation allowlist — the single enforcement point for origin safety
 * in the built-in browser subsystem.
 *
 * The module is intentionally pure: input (origin, policy) → decision.
 * No FS, no network, no clock. Persistence and UI live in higher layers
 * so this can be reused from tool handlers, the renderer, and CLI tests
 * with zero setup.
 *
 * The decision flow is always:
 *
 *   1. Host parsed from the URL. An invalid URL is `denied` with reason
 *      `InvalidUrl` — agent tools MUST NOT attempt the navigation.
 *   2. If the host matches any pattern in `denyList` → `denied` with
 *      reason `Denylisted`. Deny beats allow.
 *   3. If the host matches any pattern in `allowList` → `allowed`.
 *   4. Otherwise `confirmRequired` (user-initiated) or `denied`
 *      (agent-initiated). Agents never see a prompt; the tool returns a
 *      `NavigationBlocked` error so the agent can ask the user.
 *
 * Pattern syntax is small on purpose:
 *   - `example.com`   — exact host match.
 *   - `*.example.com` — any subdomain of example.com. Must include at
 *     least one label before `.example.com`; the bare apex is NOT matched.
 *   - `*.local`       — the workspace-default TLD wildcard.
 *   - IPv4/IPv6 literals — matched exactly after normalisation.
 *
 * No regex, no glob surface beyond the `*.` prefix; anything else is a
 * policy bug and is surfaced via {@link parseHostPattern}.
 */

export type AllowlistInitiator = "user" | "agent";

export type AllowlistDecisionKind = "allowed" | "denied" | "confirmRequired";

export type AllowlistDeniedReason =
  | "InvalidUrl"
  | "Denylisted"
  | "NotInAllowlist";

export interface AllowlistDecision {
  readonly decision: AllowlistDecisionKind;
  readonly reason?: AllowlistDeniedReason;
  readonly matchedPattern?: string;
  readonly origin?: string;
  readonly host?: string;
}

export interface AllowlistPolicy {
  readonly allowList: ReadonlyArray<string>;
  readonly denyList: ReadonlyArray<string>;
}

/**
 * Default workspace allowlist. `localhost`, the IPv4/IPv6 loopback, and
 * any `.local` host — the minimum a developer needs to load a dev server
 * without surfacing a confirm dialog on every navigation.
 */
export const DEFAULT_WORKSPACE_ALLOWLIST: ReadonlyArray<string> = [
  "localhost",
  "127.0.0.1",
  "::1",
  "*.local",
];

/**
 * Default deny-list — hosts we never want an agent (or the user) to
 * navigate into via the embedded browser because they are common
 * credential-phishing / OAuth / third-party-auth targets. The real
 * product can extend this via `browser.denyList` in `.dinocode/config.yml`.
 */
export const DEFAULT_DENYLIST: ReadonlyArray<string> = [
  "accounts.google.com",
  "login.microsoftonline.com",
  "login.live.com",
  "github.com/login",
  "github.com/sessions",
  "appleid.apple.com",
  "id.apple.com",
  "auth0.com",
  "*.okta.com",
];

export interface ParsedHostPattern {
  readonly raw: string;
  /** Lowercased host or suffix (after an optional `*.`). */
  readonly host: string;
  /** True when pattern begins with `*.` (subdomain wildcard). */
  readonly wildcard: boolean;
  /**
   * Optional path prefix — captured for deny-list entries like
   * `github.com/login` so we can scope the deny to a specific path.
   * `undefined` when the pattern targets the whole host.
   */
  readonly pathPrefix?: string;
}

const WILDCARD_PREFIX = "*.";

export const parseHostPattern = (raw: string): ParsedHostPattern => {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) {
    throw new Error(`allowlist pattern is empty`);
  }
  let body = trimmed;
  let pathPrefix: string | undefined;
  const pathSlash = body.indexOf("/");
  if (pathSlash !== -1) {
    pathPrefix = body.slice(pathSlash);
    body = body.slice(0, pathSlash);
  }
  if (body.startsWith(WILDCARD_PREFIX)) {
    const suffix = body.slice(WILDCARD_PREFIX.length);
    if (!suffix || suffix.includes("*")) {
      throw new Error(`invalid wildcard host pattern: ${raw}`);
    }
    return {
      raw,
      host: suffix,
      wildcard: true,
      ...(pathPrefix !== undefined ? { pathPrefix } : {}),
    };
  }
  if (body.includes("*")) {
    throw new Error(`invalid host pattern (only *.prefix allowed): ${raw}`);
  }
  return {
    raw,
    host: body,
    wildcard: false,
    ...(pathPrefix !== undefined ? { pathPrefix } : {}),
  };
};

export interface ExtractedOrigin {
  readonly host: string;
  readonly origin: string;
  readonly pathname: string;
}

/**
 * Extract the normalised host + origin from a URL string. Returns
 * `undefined` for unparseable inputs.
 */
export const extractOrigin = (url: string): ExtractedOrigin | undefined => {
  try {
    const parsed = new URL(url);
    let host = parsed.hostname.toLowerCase();
    if (host.startsWith("[") && host.endsWith("]")) {
      host = host.slice(1, -1);
    }
    if (!host) return undefined;
    return {
      host,
      origin: `${parsed.protocol}//${parsed.host}`.toLowerCase(),
      pathname: parsed.pathname,
    };
  } catch {
    return undefined;
  }
};

const matchesHost = (pattern: ParsedHostPattern, host: string): boolean => {
  if (pattern.wildcard) {
    if (!host.endsWith(`.${pattern.host}`)) return false;
    const label = host.slice(0, -pattern.host.length - 1);
    return label.length > 0 && !label.endsWith(".");
  }
  return pattern.host === host;
};

const matchesPath = (
  pattern: ParsedHostPattern,
  pathname: string,
): boolean => {
  if (pattern.pathPrefix === undefined) return true;
  return pathname.startsWith(pattern.pathPrefix);
};

const findMatch = (
  patterns: ReadonlyArray<string>,
  host: string,
  pathname: string,
): string | undefined => {
  for (const raw of patterns) {
    let parsed: ParsedHostPattern;
    try {
      parsed = parseHostPattern(raw);
    } catch {
      continue;
    }
    if (matchesHost(parsed, host) && matchesPath(parsed, pathname)) {
      return raw;
    }
  }
  return undefined;
};

export interface EvaluateInput {
  readonly url: string;
  readonly initiator: AllowlistInitiator;
  readonly policy: AllowlistPolicy;
}

/**
 * Evaluate a navigation against the allowlist policy. Pure function —
 * same input always yields the same decision. Agents never receive a
 * `confirmRequired`; when an origin is unknown the decision is `denied`
 * with reason `NotInAllowlist`, and the caller is expected to map that
 * to a `NavigationBlocked` tool error.
 */
export const evaluateAllowlist = (input: EvaluateInput): AllowlistDecision => {
  const extracted = extractOrigin(input.url);
  if (!extracted) {
    return { decision: "denied", reason: "InvalidUrl" };
  }
  const { host, origin, pathname } = extracted;
  const denyMatch = findMatch(input.policy.denyList, host, pathname);
  if (denyMatch) {
    return {
      decision: "denied",
      reason: "Denylisted",
      matchedPattern: denyMatch,
      host,
      origin,
    };
  }
  const allowMatch = findMatch(input.policy.allowList, host, pathname);
  if (allowMatch) {
    return {
      decision: "allowed",
      matchedPattern: allowMatch,
      host,
      origin,
    };
  }
  if (input.initiator === "user") {
    return { decision: "confirmRequired", host, origin };
  }
  return { decision: "denied", reason: "NotInAllowlist", host, origin };
};

export interface ExtendPolicyInput {
  readonly policy: AllowlistPolicy;
  readonly origin: string;
}

/** Return a new policy with `origin` appended to the allow-list (if missing). */
export const addToAllowList = (input: ExtendPolicyInput): AllowlistPolicy => {
  const normalised = input.origin.trim().toLowerCase();
  if (!normalised) return input.policy;
  if (input.policy.allowList.some((p) => p.trim().toLowerCase() === normalised)) {
    return input.policy;
  }
  return {
    ...input.policy,
    allowList: [...input.policy.allowList, normalised],
  };
};

/**
 * Build the default policy — workspace-level allow-list + deny-list,
 * extended with any origins declared in `.dinocode/config.yml`.
 */
export const buildPolicy = (overrides: {
  readonly allowedOrigins?: ReadonlyArray<string>;
  readonly deniedOrigins?: ReadonlyArray<string>;
} = {}): AllowlistPolicy => ({
  allowList: [
    ...DEFAULT_WORKSPACE_ALLOWLIST,
    ...(overrides.allowedOrigins ?? []),
  ],
  denyList: [...DEFAULT_DENYLIST, ...(overrides.deniedOrigins ?? [])],
});
