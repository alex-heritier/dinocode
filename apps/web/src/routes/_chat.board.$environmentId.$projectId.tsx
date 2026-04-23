import { Link, createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { scopeProjectRef } from "@t3tools/client-runtime";

import { KanbanBoard, type KanbanDropResult } from "../components/board/KanbanBoard.tsx";
import { TaskCreateForm } from "../components/board/TaskCreateForm.tsx";
import { TaskDetailSheet } from "../components/board/TaskDetailSheet.tsx";
import { SidebarInset } from "../components/ui/sidebar.tsx";
import type { BoardSnapshot, EnvironmentId, ProjectId, TaskId } from "@t3tools/contracts";
import { readEnvironmentApi } from "../environmentApi.ts";
import { readLocalApi } from "../localApi.ts";
import { useBoardSubscription } from "../rpc/boardState.ts";
import { newCommandId } from "../lib/utils.ts";
import { useNewThreadHandler } from "../hooks/useHandleNewThread.ts";
import { usePreferredEditor } from "../editorPreferences.ts";
import { useServerAvailableEditors } from "../rpc/serverState.ts";
import { selectProjectByRef, useStore } from "../store.ts";
import { toastManager } from "../components/ui/toast";

type BoardCard = BoardSnapshot["columns"][number]["cards"][number];

function BoardRouteComponent() {
  const { environmentId, projectId } = Route.useParams({
    select: (params) => ({
      environmentId: params.environmentId as EnvironmentId,
      projectId: params.projectId as ProjectId,
    }),
  });
  const { snapshot, error } = useBoardSubscription(environmentId, projectId);
  const activeProject = useStore((state) =>
    selectProjectByRef(state, scopeProjectRef(environmentId, projectId)),
  );
  const projectCwd = activeProject?.cwd ?? null;

  const [selectedCard, setSelectedCard] = useState<BoardCard | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [boardError, setBoardError] = useState<string | null>(null);

  const availableEditors = useServerAvailableEditors();
  const [preferredEditor] = usePreferredEditor(availableEditors);
  const { handleNewThread } = useNewThreadHandler();

  const handleCardDrop = useCallback(
    async (drop: KanbanDropResult) => {
      const api = readEnvironmentApi(environmentId);
      if (!api) {
        setBoardError("Environment API unavailable.");
        return;
      }
      setBoardError(null);
      try {
        await api.orchestration.dispatchCommand({
          type: "task.update",
          commandId: newCommandId(),
          taskId: drop.cardId,
          patch: { status: drop.to, order: drop.order },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to move task.";
        setBoardError(message);
      }
    },
    [environmentId],
  );

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

  const handleStartSession = useCallback(
    (_taskId: TaskId) => {
      // Pre-filling the draft with task context is tracked by dinocode-lo2j.
      // For now, just open a fresh thread for the task's project.
      void handleNewThread(scopeProjectRef(environmentId, projectId));
      setSelectedCard(null);
      setDetailError(null);
    },
    [environmentId, handleNewThread, projectId],
  );

  const handleOpenFolder = useCallback(() => {
    const api = readLocalApi();
    if (!api) {
      setDetailError("Local API unavailable — cannot open folder.");
      return;
    }
    if (projectCwd === null) {
      setDetailError("Project path is unknown.");
      return;
    }
    setDetailError(null);
    void api.shell.openInEditor(projectCwd, preferredEditor ?? "file-manager");
  }, [preferredEditor, projectCwd]);

  const handleCopyPath = useCallback(() => {
    if (projectCwd === null) {
      setDetailError("Project path is unknown.");
      return;
    }
    setDetailError(null);
    void navigator.clipboard.writeText(projectCwd).then(
      () => {
        toastManager.add({
          type: "success",
          title: "Path copied",
          description: projectCwd,
        });
      },
      () => {
        setDetailError("Clipboard write failed.");
      },
    );
  }, [projectCwd]);

  const handleSheetOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setSelectedCard(null);
      setDetailError(null);
    }
  }, []);

  return (
    <SidebarInset className="h-dvh min-h-0 overflow-hidden bg-background text-foreground">
      <div className="flex h-full min-h-0 flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{activeProject?.name ?? "Kanban Board"}</h1>
          <Link
            to="/board"
            className="text-sm text-muted-foreground underline-offset-2 hover:underline"
          >
            ← All boards
          </Link>
        </div>

        <TaskCreateForm environmentId={environmentId} projectId={projectId} />

        {boardError !== null && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">
            {boardError}
          </div>
        )}

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
            <KanbanBoard
              snapshot={snapshot}
              onCardClick={setSelectedCard}
              onCardDrop={handleCardDrop}
            />
          </div>
        )}

        <TaskDetailSheet
          environmentId={environmentId}
          projectId={projectId}
          projectCwd={projectCwd}
          card={selectedCard}
          errorMessage={detailError}
          onOpenChange={handleSheetOpenChange}
          onDelete={handleDeleteTask}
          onStartSession={handleStartSession}
          onOpenFolder={handleOpenFolder}
          onCopyPath={handleCopyPath}
        />
      </div>
    </SidebarInset>
  );
}

export const Route = createFileRoute("/_chat/board/$environmentId/$projectId")({
  component: BoardRouteComponent,
});
