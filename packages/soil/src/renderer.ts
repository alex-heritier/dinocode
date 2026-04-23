import type { TaskDocument } from "./schema.ts";

// YAML 1.2 / 1.1 values that must be quoted when serialized as a plain
// scalar to ensure they round-trip as strings (otherwise YAML will parse
// them as numbers, booleans, or null). We also quote leading/trailing
// whitespace and any value containing YAML-hostile characters.
const YAML_BOOL_OR_NULL = /^(true|false|yes|no|on|off|null|~)$/i;
const YAML_NUMBER =
  /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$|^[+-]?0[xX][0-9a-fA-F]+$|^[+-]?0o[0-7]+$|^[+-]?\.inf$|^\.nan$/i;
// Also treat pure-digit-ish strings (e.g. "007", "08") as numeric.
const YAML_PURE_DIGITS = /^[+-]?\d+$/;

function needsQuoting(value: string): boolean {
  if (value.length === 0) return true;
  if (/^\s|\s$/.test(value)) return true;
  if (/[#:\[\]{},&*!|>'"%@`\n\r\t\\]/.test(value)) return true;
  if (YAML_BOOL_OR_NULL.test(value)) return true;
  if (YAML_NUMBER.test(value)) return true;
  if (YAML_PURE_DIGITS.test(value)) return true;
  return false;
}

function quoteScalar(value: string): string {
  // Double-quoted scalar with standard escapes so unicode round-trips.
  const escaped = value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
  return `"${escaped}"`;
}

function formatScalar(value: string): string {
  return needsQuoting(value) ? quoteScalar(value) : value;
}

function formatArray(arr: readonly string[]): string {
  if (arr.length === 0) return "[]";
  return `[${arr.map(formatScalar).join(", ")}]`;
}

export function renderTaskDocument(task: TaskDocument): string {
  const lines: string[] = [`# ${task.id}`];
  const fields: Array<[string, string]> = [
    ["title", formatScalar(task.title)],
    ["status", task.status],
    ["type", task.type],
    ["priority", task.priority],
    ["created_at", formatScalar(task.createdAt)],
    ["updated_at", formatScalar(task.updatedAt)],
    ["order", formatScalar(task.order)],
  ];

  if (task.parent !== undefined && task.parent !== null) {
    fields.push(["parent", formatScalar(task.parent)]);
  }
  if (task.blocking.length > 0) {
    fields.push(["blocking", formatArray(task.blocking)]);
  }
  if (task.blockedBy.length > 0) {
    fields.push(["blocked_by", formatArray(task.blockedBy)]);
  }
  if (task.tags.length > 0) {
    fields.push(["tags", formatArray(task.tags)]);
  }

  for (const [k, v] of fields) {
    lines.push(`${k}: ${v}`);
  }

  const trailingNewline = task.body.endsWith("\n") ? "" : "\n";
  return `---\n${lines.join("\n")}\n---\n\n${task.body}${trailingNewline}`;
}

export function renderFilename(task: TaskDocument): string {
  return `${task.id}--${task.slug}.md`;
}
