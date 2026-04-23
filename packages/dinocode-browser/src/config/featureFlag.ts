/**
 * Feature-flag helper for the built-in browser subsystem.
 *
 * The flag is a single boolean on the client settings object:
 * `features.builtInBrowser`. Every gated surface (face toggle, tool
 * registration, preview button, `BrowserManager.install`) consults
 * {@link isBuiltInBrowserEnabled} exactly once. No other place in the
 * code reads `features.builtInBrowser` directly — keeping the read
 * through this helper means we can evolve the resolution rules
 * (channel-based defaults, env overrides, gradual rollout) without
 * hunting down individual call sites.
 *
 * Resolution order:
 *   1. Explicit `settings.features.builtInBrowser` — when the user has
 *      toggled the switch, honour it.
 *   2. `DINOCODE_BROWSER_FLAG` env var (set by the launcher or CI).
 *      Values `1`/`true`/`on` → enabled; `0`/`false`/`off` → disabled;
 *      unknown → ignored.
 *   3. Release channel default — `alpha` / `beta` default to enabled,
 *      `master` defaults to disabled. Callers pass the channel in as
 *      an explicit argument so we never sniff globals from inside the
 *      helper.
 *
 * This helper is pure (same inputs → same output) so the various test
 * matrices in `featureFlag.test.ts` can run without mocking.
 */

export type BrowserReleaseChannel = "master" | "alpha" | "beta";

export interface BrowserFeatureSettings {
  readonly builtInBrowser?: boolean;
}

export interface BrowserClientSettings {
  readonly features?: BrowserFeatureSettings;
}

export interface ResolveBrowserFlagInput {
  readonly settings?: BrowserClientSettings;
  readonly channel: BrowserReleaseChannel;
  readonly env?: Record<string, string | undefined>;
}

export const BROWSER_FEATURE_ENV_VAR = "DINOCODE_BROWSER_FLAG" as const;

const parseEnvFlag = (value: string | undefined): boolean | undefined => {
  if (value === undefined) return undefined;
  const trimmed = value.trim().toLowerCase();
  if (["1", "true", "on", "enabled", "yes"].includes(trimmed)) return true;
  if (["0", "false", "off", "disabled", "no"].includes(trimmed)) return false;
  return undefined;
};

const DEFAULT_BY_CHANNEL: Readonly<Record<BrowserReleaseChannel, boolean>> = {
  master: false,
  alpha: true,
  beta: true,
};

export const defaultForChannel = (channel: BrowserReleaseChannel): boolean =>
  DEFAULT_BY_CHANNEL[channel];

export interface BrowserFlagResolution {
  readonly enabled: boolean;
  readonly source: "settings" | "env" | "channel";
  readonly channel: BrowserReleaseChannel;
}

/**
 * Resolve the built-in-browser flag for the current runtime.
 *
 * The returned `source` field records which precedence rule fired, which
 * lets the logger emit one structured `flag.resolve` line at startup
 * and `flag.toggle` when the user flips the switch.
 */
export const resolveBuiltInBrowserFlag = (
  input: ResolveBrowserFlagInput,
): BrowserFlagResolution => {
  const explicit = input.settings?.features?.builtInBrowser;
  if (typeof explicit === "boolean") {
    return { enabled: explicit, source: "settings", channel: input.channel };
  }
  const env = parseEnvFlag(input.env?.[BROWSER_FEATURE_ENV_VAR]);
  if (env !== undefined) {
    return { enabled: env, source: "env", channel: input.channel };
  }
  return {
    enabled: defaultForChannel(input.channel),
    source: "channel",
    channel: input.channel,
  };
};

/**
 * Canonical entry point used by every gated surface.
 *
 * Call sites should pass in the already-resolved runtime state:
 *
 *   // dinocode-integration: dinocode-browser feature flag gate.
 *   if (!isBuiltInBrowserEnabled(resolveBuiltInBrowserFlag({ settings, channel, env }))) {
 *     return;
 *   }
 */
export const isBuiltInBrowserEnabled = (
  resolution: BrowserFlagResolution | BrowserClientSettings,
  channel?: BrowserReleaseChannel,
  env?: Record<string, string | undefined>,
): boolean => {
  if ("enabled" in resolution) return resolution.enabled;
  return resolveBuiltInBrowserFlag({
    settings: resolution,
    channel: channel ?? "master",
    ...(env !== undefined ? { env } : {}),
  }).enabled;
};
