import { describe, expect, it } from "vitest";

import {
  BROWSER_FEATURE_ENV_VAR,
  defaultForChannel,
  isBuiltInBrowserEnabled,
  resolveBuiltInBrowserFlag,
} from "../config/featureFlag.ts";

describe("defaultForChannel", () => {
  it("is off on master, on for alpha/beta", () => {
    expect(defaultForChannel("master")).toBe(false);
    expect(defaultForChannel("alpha")).toBe(true);
    expect(defaultForChannel("beta")).toBe(true);
  });
});

describe("resolveBuiltInBrowserFlag", () => {
  it("uses channel default when nothing else is set", () => {
    const master = resolveBuiltInBrowserFlag({ channel: "master" });
    expect(master).toEqual({
      enabled: false,
      source: "channel",
      channel: "master",
    });
    const beta = resolveBuiltInBrowserFlag({ channel: "beta" });
    expect(beta.enabled).toBe(true);
    expect(beta.source).toBe("channel");
  });

  it("honours an explicit settings value", () => {
    const onMaster = resolveBuiltInBrowserFlag({
      channel: "master",
      settings: { features: { builtInBrowser: true } },
    });
    expect(onMaster).toEqual({
      enabled: true,
      source: "settings",
      channel: "master",
    });
    const offBeta = resolveBuiltInBrowserFlag({
      channel: "beta",
      settings: { features: { builtInBrowser: false } },
    });
    expect(offBeta).toEqual({
      enabled: false,
      source: "settings",
      channel: "beta",
    });
  });

  it("falls back to env when settings is silent", () => {
    const enabled = resolveBuiltInBrowserFlag({
      channel: "master",
      env: { [BROWSER_FEATURE_ENV_VAR]: "1" },
    });
    expect(enabled.enabled).toBe(true);
    expect(enabled.source).toBe("env");

    const disabled = resolveBuiltInBrowserFlag({
      channel: "alpha",
      env: { [BROWSER_FEATURE_ENV_VAR]: "off" },
    });
    expect(disabled.enabled).toBe(false);
    expect(disabled.source).toBe("env");

    const ignored = resolveBuiltInBrowserFlag({
      channel: "master",
      env: { [BROWSER_FEATURE_ENV_VAR]: "maybe" },
    });
    expect(ignored.source).toBe("channel");
  });

  it("settings always wins over env", () => {
    const res = resolveBuiltInBrowserFlag({
      channel: "master",
      settings: { features: { builtInBrowser: false } },
      env: { [BROWSER_FEATURE_ENV_VAR]: "1" },
    });
    expect(res.enabled).toBe(false);
    expect(res.source).toBe("settings");
  });
});

describe("isBuiltInBrowserEnabled", () => {
  it("accepts a pre-resolved flag", () => {
    expect(
      isBuiltInBrowserEnabled({
        enabled: true,
        source: "settings",
        channel: "master",
      }),
    ).toBe(true);
  });

  it("accepts settings directly when given channel + env", () => {
    expect(
      isBuiltInBrowserEnabled(
        { features: { builtInBrowser: true } },
        "master",
        {},
      ),
    ).toBe(true);
    expect(isBuiltInBrowserEnabled({ features: {} }, "master", {})).toBe(false);
    expect(isBuiltInBrowserEnabled({ features: {} }, "beta", {})).toBe(true);
  });
});
