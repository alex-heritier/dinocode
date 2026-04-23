// dinocode-integration: dinocode-board inline task.create form.
import { useState, useCallback, type FormEvent } from "react";
import type { EnvironmentId, ProjectId, TaskStatus, TaskPriority } from "@t3tools/contracts";

import { readEnvironmentApi } from "../../environmentApi.ts";
import { newCommandId } from "../../lib/utils.ts";

interface TaskCreateFormProps {
  environmentId: EnvironmentId;
  projectId: ProjectId;
  defaultStatus?: TaskStatus;
}

const STATUSES: TaskStatus[] = ["draft", "todo", "in-progress", "completed", "scrapped"];
const PRIORITIES: TaskPriority[] = ["critical", "high", "normal", "low", "deferred"];

export function TaskCreateForm({
  environmentId,
  projectId,
  defaultStatus = "todo",
}: TaskCreateFormProps) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = title.trim();
      if (trimmed.length === 0 || submitting) return;

      const api = readEnvironmentApi(environmentId);
      if (!api) {
        setError("Environment API unavailable.");
        return;
      }

      setSubmitting(true);
      setError(null);
      try {
        await api.orchestration.dispatchCommand({
          type: "task.create",
          commandId: newCommandId(),
          projectId,
          title: trimmed,
          status,
          priority,
        });
        setTitle("");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create task.";
        setError(message);
      } finally {
        setSubmitting(false);
      }
    },
    [environmentId, projectId, priority, status, submitting, title],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 rounded-xl border bg-card/50 p-3 shadow-sm"
      data-testid="kanban-new-task-form"
    >
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New task title…"
          className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          aria-label="New task title"
          autoComplete="off"
          disabled={submitting}
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as TaskStatus)}
          className="rounded-md border bg-background px-2 py-1.5 text-sm"
          aria-label="Status"
          disabled={submitting}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority)}
          className="rounded-md border bg-background px-2 py-1.5 text-sm"
          aria-label="Priority"
          disabled={submitting}
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={submitting || title.trim().length === 0}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Add task"}
        </button>
      </div>
      {error !== null && <div className="text-xs text-destructive">{error}</div>}
    </form>
  );
}
