/**
 * Marshals CDP `Runtime.RemoteObject` descriptors and runtime exception
 * details into the console-ring-buffer's storage shape.
 *
 * Keeps the schema stable across call sites:
 *   - primitives round-trip as-is
 *   - objects are truncated with a `[Circular]` marker on cycles
 *   - errors are decomposed into `{ message, stack }`
 *
 * The module is pure (no CDP dependency) so it can be fed from either the
 * real adapter, the test harness, or a replay tool.
 */

export type ConsoleArgKind =
  | "string"
  | "number"
  | "boolean"
  | "null"
  | "undefined"
  | "bigint"
  | "symbol"
  | "object"
  | "array"
  | "error"
  | "function"
  | "regexp"
  | "date"
  | "unknown";

export interface MarshalledArg {
  readonly kind: ConsoleArgKind;
  readonly text: string;
  readonly truncated?: boolean | undefined;
  readonly json?: string | undefined;
}

export interface MarshalOptions {
  readonly maxDepth?: number;
  readonly maxStringLength?: number;
}

const CIRCULAR = "[Circular]";
const DEFAULT_MAX_DEPTH = 6;
const DEFAULT_MAX_STRING = 4096;

const clip = (text: string, max: number): { text: string; truncated: boolean } => {
  if (text.length <= max) return { text, truncated: false };
  return { text: `${text.slice(0, Math.max(0, max - 1))}…`, truncated: true };
};

const kindOf = (value: unknown): ConsoleArgKind => {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (Array.isArray(value)) return "array";
  if (value instanceof Error) return "error";
  if (value instanceof RegExp) return "regexp";
  if (value instanceof Date) return "date";
  const t = typeof value;
  if (t === "string") return "string";
  if (t === "number") return "number";
  if (t === "boolean") return "boolean";
  if (t === "bigint") return "bigint";
  if (t === "symbol") return "symbol";
  if (t === "function") return "function";
  if (t === "object") return "object";
  return "unknown";
};

const safeJson = (value: unknown, maxDepth: number): string => {
  const seen = new WeakSet<object>();
  const walk = (input: unknown, depth: number): unknown => {
    if (depth > maxDepth) {
      if (input !== null && typeof input === "object") return "[Truncated]";
      return input;
    }
    if (input === null || typeof input !== "object") {
      if (typeof input === "bigint") return `${input.toString()}n`;
      if (typeof input === "function") return `[Function ${(input as Function).name || "anonymous"}]`;
      if (typeof input === "symbol") return input.toString();
      return input;
    }
    if (seen.has(input as object)) return CIRCULAR;
    seen.add(input as object);
    if (Array.isArray(input)) return input.map((item) => walk(item, depth + 1));
    if (input instanceof Error) {
      return { name: input.name, message: input.message, stack: input.stack ?? null };
    }
    if (input instanceof RegExp) return input.toString();
    if (input instanceof Date) return input.toISOString();
    const out: Record<string, unknown> = {};
    for (const [key, next] of Object.entries(input as Record<string, unknown>)) {
      out[key] = walk(next, depth + 1);
    }
    return out;
  };
  try {
    return JSON.stringify(walk(value, 0));
  } catch {
    return JSON.stringify(CIRCULAR);
  }
};

export const marshalArg = (value: unknown, options: MarshalOptions = {}): MarshalledArg => {
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  const maxStringLength = options.maxStringLength ?? DEFAULT_MAX_STRING;
  const kind = kindOf(value);

  if (kind === "string") {
    const clipped = clip(value as string, maxStringLength);
    return { kind, text: clipped.text, truncated: clipped.truncated || undefined };
  }
  if (kind === "number" || kind === "boolean" || kind === "bigint") {
    return { kind, text: String(value) };
  }
  if (kind === "null") return { kind, text: "null" };
  if (kind === "undefined") return { kind, text: "undefined" };
  if (kind === "symbol") return { kind, text: (value as symbol).toString() };
  if (kind === "function") {
    const fn = value as Function;
    return { kind, text: `[Function ${fn.name || "anonymous"}]` };
  }
  if (kind === "regexp") return { kind, text: (value as RegExp).toString() };
  if (kind === "date") return { kind, text: (value as Date).toISOString() };
  if (kind === "error") {
    const err = value as Error;
    const json = safeJson({ name: err.name, message: err.message, stack: err.stack ?? null }, maxDepth);
    const stack = err.stack ?? `${err.name}: ${err.message}`;
    const clipped = clip(stack, maxStringLength);
    return { kind, text: clipped.text, truncated: clipped.truncated || undefined, json };
  }
  const json = safeJson(value, maxDepth);
  const clipped = clip(json, maxStringLength);
  return { kind, text: clipped.text, truncated: clipped.truncated || undefined, json };
};

export const marshalArgs = (
  values: ReadonlyArray<unknown>,
  options?: MarshalOptions,
): ReadonlyArray<MarshalledArg> => values.map((v) => marshalArg(v, options));
