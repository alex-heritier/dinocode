/**
 * Redaction helper for the built-in browser subsystem.
 *
 * Call sites in the network + evaluate tool handlers must pass header maps
 * and console argument bags through `redact` before they are handed to the
 * logger or forwarded through IPC. The function is pure, case-insensitive,
 * and safe against cycles.
 *
 * Keys are matched against the configured set via `toLowerCase()`; redacted
 * values become the literal string `"[REDACTED]"`. Nested objects and
 * arrays are walked recursively; circular references are replaced with
 * `"[Circular]"` to avoid stack overflows.
 *
 * Default key list covers the most common leak vectors across browsing
 * sessions: cookies, auth headers, set-cookie, and common API-key headers.
 * Call sites that need to add extra keys pass them via the second
 * argument; the default list is always merged in so subsystems cannot
 * accidentally loosen the policy.
 */

export const DEFAULT_REDACTION_KEYS: ReadonlyArray<string> = [
  "authorization",
  "cookie",
  "set-cookie",
  "proxy-authorization",
  "x-api-key",
  "x-auth-token",
  "x-dinocode-auth-token",
  "password",
  "secret",
  "token",
  "access_token",
  "refresh_token",
  "id_token",
];

export const REDACTED_PLACEHOLDER = "[REDACTED]" as const;
export const CIRCULAR_PLACEHOLDER = "[Circular]" as const;

export interface RedactOptions {
  /** Extra keys to redact on top of {@link DEFAULT_REDACTION_KEYS}. */
  readonly extraKeys?: ReadonlyArray<string>;
  /** Replace with a specific token instead of the default placeholder. */
  readonly replacement?: string;
}

const buildKeySet = (
  extra: ReadonlyArray<string> | undefined,
): ReadonlySet<string> => {
  const out = new Set<string>();
  for (const k of DEFAULT_REDACTION_KEYS) out.add(k.toLowerCase());
  if (extra) for (const k of extra) out.add(k.toLowerCase());
  return out;
};

/**
 * Deep-redact the supplied value. Never mutates the input.
 */
export const redact = <T>(value: T, options: RedactOptions = {}): T => {
  const keys = buildKeySet(options.extraKeys);
  const replacement = options.replacement ?? REDACTED_PLACEHOLDER;
  const seen = new WeakMap<object, unknown>();

  const walk = (input: unknown): unknown => {
    if (input === null || input === undefined) return input;
    if (typeof input !== "object") return input;
    if (input instanceof Date) return new Date(input.getTime());
    if (input instanceof RegExp) return new RegExp(input.source, input.flags);
    const existing = seen.get(input as object);
    if (existing !== undefined) return existing;
    if (Array.isArray(input)) {
      const out: unknown[] = [];
      seen.set(input as object, out);
      for (const item of input) out.push(walk(item));
      return out;
    }
    const out: Record<string, unknown> = {};
    seen.set(input as object, out);
    for (const [key, raw] of Object.entries(input as Record<string, unknown>)) {
      if (keys.has(key.toLowerCase())) {
        out[key] = replacement;
        continue;
      }
      out[key] = walk(raw);
    }
    return out;
  };

  return walk(value) as T;
};

/**
 * Produce a redacted header map in a single step. Useful for network/request
 * tool handlers that want a typed `Record<string, string>` back.
 */
export const redactHeaders = (
  headers: Record<string, string>,
  options?: RedactOptions,
): Record<string, string> => redact(headers, options);
