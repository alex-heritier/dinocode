import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { KanbanBoard } from "../components/board/KanbanBoard.tsx";
import type { BoardSnapshot, EnvironmentId, ProjectId } from "@t3tools/contracts";
import { useBoardSubscription } from "../rpc/boardState.ts";

function BoardRouteComponent() {
  const { environmentId, projectId } = Route.useParams({
    select: (params) => ({
      environmentId: params.environmentId as EnvironmentId,
      projectId: params.projectId as ProjectId,
    }),
  });
  const { snapshot, error } = useBoardSubscription(environmentId, projectId);
  const [selectedCard, setSelectedCard] = useState<
    BoardSnapshot["columns"][number]["cards"][number] | null
  >(null);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-destructive">Failed to load board: {error}</div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading board...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-4">
      <KanbanBoard snapshot={snapshot} onCardClick={setSelectedCard} />
      {selectedCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">{selectedCard.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">ID: {selectedCard.id}</p>
            <p className="mt-1 text-sm text-muted-foreground">Status: {selectedCard.status}</p>
            <p className="mt-1 text-sm text-muted-foreground">Priority: {selectedCard.priority}</p>
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
            <button
              className="mt-4 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              onClick={() => setSelectedCard(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/_chat/board/$environmentId/$projectId")({
  component: BoardRouteComponent,
});
