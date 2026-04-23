// dinocode-integration: dinocode-board kanban drag-and-drop surface.
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  pointerWithin,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useCallback, useMemo, useState } from "react";
import type { BoardSnapshot, TaskId, TaskStatus } from "@t3tools/contracts";
import { keyBetween } from "@dinocode/soil/fractionalIndex";

import { KanbanColumn } from "./KanbanColumn.tsx";
import { KanbanCard } from "./KanbanCard.tsx";

type Card = BoardSnapshot["columns"][number]["cards"][number];

export interface KanbanDropResult {
  readonly cardId: TaskId;
  readonly from: TaskStatus;
  readonly to: TaskStatus;
  /** Order key for the dropped card (appended to end of destination column). */
  readonly order: string;
}

interface KanbanBoardProps {
  snapshot: BoardSnapshot;
  onCardClick?: ((card: Card) => void) | undefined;
  onCardDrop?: ((result: KanbanDropResult) => void | Promise<void>) | undefined;
}

export function KanbanBoard({ snapshot, onCardClick, onCardDrop }: KanbanBoardProps) {
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  const cardIndex = useMemo(() => {
    const byId = new Map<TaskId, { card: Card; column: TaskStatus }>();
    for (const column of snapshot.columns) {
      for (const card of column.cards) {
        byId.set(card.id, { card, column: column.id });
      }
    }
    return byId;
  }, [snapshot]);

  const columnOrderKeys = useMemo(() => {
    const byStatus = new Map<TaskStatus, string[]>();
    for (const column of snapshot.columns) {
      byStatus.set(
        column.id,
        column.cards.map((c) => c.order),
      );
    }
    return byStatus;
  }, [snapshot]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = event.active.id as TaskId;
      const entry = cardIndex.get(id);
      if (entry) setActiveCard(entry.card);
    },
    [cardIndex],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveCard(null);
      if (!event.over) return;
      const cardId = event.active.id as TaskId;
      const targetStatus = event.over.id as TaskStatus;
      const entry = cardIndex.get(cardId);
      if (!entry) return;
      if (entry.column === targetStatus) return;

      const destKeys = columnOrderKeys.get(targetStatus) ?? [];
      const lastKey = destKeys.length > 0 ? destKeys[destKeys.length - 1]! : null;
      const order = keyBetween(lastKey, null);

      void onCardDrop?.({
        cardId,
        from: entry.column,
        to: targetStatus,
        order,
      });
    },
    [cardIndex, columnOrderKeys, onCardDrop],
  );

  const handleDragCancel = useCallback(() => {
    setActiveCard(null);
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-semibold">Board</h2>
          <span className="text-sm text-muted-foreground">
            {snapshot.columns.reduce((sum, col) => sum + col.cards.length, 0)} tasks
          </span>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {snapshot.columns.map((column) => (
            <KanbanColumn key={column.id} column={column} onCardClick={onCardClick} />
          ))}
        </div>
      </div>
      <DragOverlay>{activeCard !== null ? <KanbanCard card={activeCard} /> : null}</DragOverlay>
    </DndContext>
  );
}
