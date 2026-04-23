import { Link, createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";

import { KanbanBoard } from "../components/board/KanbanBoard.tsx";
import { TaskCreateForm } from "../components/board/TaskCreateForm.tsx";
import { SidebarInset } from "../components/ui/sidebar.tsx";
import type { BoardSnapshot, EnvironmentId, ProjectId, TaskId } from "@t3tools/contracts";
import { readEnvironmentApi } from "../environmentApi.ts";
import { useBoardSubscription } from "../rpc/boardState.ts";
import { newCommandId } from "../lib/utils.ts";

type BoardCard = BoardSnapshot["columns"][number]["cards"][number];

function BoardRouteComponent() {
  const { environmentId, projectId } = Route.useParams({
    select: (params) => ({
      environmentId: params.environmentId as EnvironmentId,
      projectId: params.projectId as ProjectId,
    }),
  });
  const { snapshot, error } = useBoardSubscription(environmentId, projectId);
  const [selectedCard, setSelectedCard] = useState<BoardCard | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  const handleDeleteTask = useCallback(
    async (taskId: TaskId) => {
      const api = readEnvironmentApi(environmentId);
      if (!api) {
        setDetailError("Environment API unavailable.");
        return;
      }
      setDetailError(null);
      try {
        await api.orchestration.dispatchCommand({
          type: "task.delete",
          commandId: newCommandId(),
          taskId,
        });
        setSelectedCard(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete task.";
        setDetailError(message);
      }
    },
    [environmentId],
  );

  return (
    <SidebarInset className="h-dvh min-h-0 overflow-hidden bg-background text-foreground">
      <div className="flex h-full min-h-0 flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Kanban Board</h1>
          <Link
            to="/board"
            className="text-sm text-muted-foreground underline-offset-2 hover:underline"
          >
            ← All boards
          </Link>
        </div>

        <TaskCreateForm environmentId={environmentId} projectId={projectId} />

        {error !== null ? (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            Failed to load board: {error}
          </div>
        ) : snapshot === null ? (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            Loading board…
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-hidden">
            <KanbanBoard snapshot={snapshot} onCardClick={setSelectedCard} />
          </div>
        )}

        {selectedCard !== null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => {
              setSelectedCard(null);
              setDetailError(null);
            }}
          >
            <div
              className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold">{selectedCard.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">ID: {selectedCard.id}</p>
              <p className="mt-1 text-sm text-muted-foreground">Status: {selectedCard.status}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Priority: {selectedCard.priority}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Type: {selectedCard.type}</p>
              {selectedCard.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedCard.tags.map((tag) => (
                    <span key={tag} className="rounded bg-muted px-2 py-0.5 text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {detailError !== null && (
                <div className="mt-3 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">
                  {detailError}
                </div>
              )}
              <div className="mt-4 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => void handleDeleteTask(selectedCard.id)}
                  className="rounded border border-destructive/40 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                  onClick={() => {
                    setSelectedCard(null);
                    setDetailError(null);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarInset>
  );
}

export const Route = createFileRoute("/_chat/board/$environmentId/$projectId")({
  component: BoardRouteComponent,
});
