import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { CSSProperties } from "react";
import type { BoardCard as BoardCardType } from "@t3tools/contracts";

interface KanbanCardProps {
  card: BoardCardType;
  onClick?: ((card: BoardCardType) => void) | undefined;
  draggable?: boolean;
}

export function KanbanCard({ card, onClick, draggable = false }: KanbanCardProps) {
  if (!draggable) {
    return <KanbanCardView card={card} onClick={onClick} />;
  }
  return <DraggableKanbanCard card={card} onClick={onClick} />;
}

function DraggableKanbanCard({
  card,
  onClick,
}: {
  card: BoardCardType;
  onClick?: ((card: BoardCardType) => void) | undefined;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
  });

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <KanbanCardView card={card} onClick={onClick} />
    </div>
  );
}

function KanbanCardView({
  card,
  onClick,
}: {
  card: BoardCardType;
  onClick?: ((card: BoardCardType) => void) | undefined;
}) {
  return (
    <div
      data-testid={`kanban-card-${card.id}`}
      className="cursor-grab rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
      onClick={() => onClick?.(card)}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium leading-tight">{card.title}</h4>
        <span
          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
            card.priority === "critical"
              ? "bg-red-100 text-red-700"
              : card.priority === "high"
                ? "bg-orange-100 text-orange-700"
                : card.priority === "low"
                  ? "bg-slate-100 text-slate-700"
                  : "bg-blue-50 text-blue-700"
          }`}
        >
          {card.priority}
        </span>
      </div>
      {card.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {card.tags.map((tag) => (
            <span
              key={tag}
              className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
