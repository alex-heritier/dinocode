import type { TaskDocument } from "./schema.ts";

function formatArray(arr: readonly string[]): string {
  if (arr.length === 0) return "[]";
  return `[${arr.join(", ")}]`;
}

export function renderTaskDocument(task: TaskDocument): string {
  const lines: string[] = [`# ${task.id}`];
  const fields: Array<[string, string]> = [
    ["title", task.title],
    ["status", task.status],
    ["type", task.type],
    ["priority", task.priority],
    ["created_at", task.createdAt],
    ["updated_at", task.updatedAt],
    ["order", task.order],
  ];

  if (task.parent !== undefined && task.parent !== null) {
    fields.push(["parent", task.parent]);
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
