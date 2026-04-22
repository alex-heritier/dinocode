import { useEffect, useRef, useState } from "react";
import type { BoardSnapshot, BoardStreamItem, EnvironmentId, ProjectId } from "@t3tools/contracts";
import { readEnvironmentApi } from "../environmentApi.ts";

export function useBoardSubscription(environmentId: EnvironmentId, projectId: ProjectId) {
  const [snapshot, setSnapshot] = useState<BoardSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const snapshotRef = useRef<BoardSnapshot | null>(null);

  useEffect(() => {
    const api = readEnvironmentApi(environmentId);
    if (!api) {
      setError("Environment API not available");
      return;
    }

    const handleItem = (item: BoardStreamItem) => {
      if (item.kind === "snapshot") {
        snapshotRef.current = item.snapshot;
        setSnapshot(item.snapshot);
      } else if (item.kind === "card-upserted") {
        const current = snapshotRef.current;
        if (!current) return;
        const nextColumns = current.columns.map((col) => {
          const existingIndex = col.cards.findIndex((c) => c.id === item.card.id);
          if (existingIndex >= 0) {
            const nextCards = [...col.cards];
            nextCards[existingIndex] = item.card;
            return { ...col, cards: nextCards };
          }
          if (col.id === item.card.status) {
            return { ...col, cards: [...col.cards, item.card] };
          }
          return col;
        });
        snapshotRef.current = { ...current, columns: nextColumns };
        setSnapshot(snapshotRef.current);
      } else if (item.kind === "card-removed") {
        const current = snapshotRef.current;
        if (!current) return;
        const nextColumns = current.columns.map((col) => ({
          ...col,
          cards: col.cards.filter((c) => c.id !== item.cardId),
        }));
        snapshotRef.current = { ...current, columns: nextColumns };
        setSnapshot(snapshotRef.current);
      }
    };

    const unsubscribe = api.orchestration.subscribeBoard({ projectId }, handleItem, {
      onResubscribe: () => {
        snapshotRef.current = null;
        setSnapshot(null);
      },
    });

    return () => {
      unsubscribe();
    };
  }, [environmentId, projectId]);

  return { snapshot, error };
}
