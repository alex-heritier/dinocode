// dinocode-integration: dinocode-board kanban column drop target.
import { useDroppable } from "@dnd-kit/core";
import type { BoardColumn as BoardColumnType } from "@t3tools/contracts";
import { KanbanCard } from "./KanbanCard.tsx";

interface KanbanColumnProps {
  column: BoardColumnType;
  onCardClick?: ((card: BoardColumnType["cards"][number]) => void) | undefined;
}

const COLUMN_TITLES: Record<string, string> = {
  "in-progress": "In Progress",
  todo: "Todo",
  draft: "Draft",
  completed: "Completed",
  scrapped: "Scrapped",
};

export function KanbanColumn({ column, onCardClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      data-testid={`kanban-column-${column.id}`}
      className={`flex min-w-[16rem] flex-1 flex-col gap-3 rounded-xl border p-3 transition-colors ${
        isOver ? "border-primary/60 bg-primary/5" : "bg-muted/30"
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {COLUMN_TITLES[column.id] ?? column.title}
        </h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {column.cards.length}
        </span>
      </div>
      <div className="flex min-h-[4rem] flex-col gap-2">
        {column.cards.map((card) => (
          <KanbanCard key={card.id} card={card} draggable onClick={onCardClick} />
        ))}
      </div>
    </div>
  );
}
