import type { BoardCard as BoardCardType } from "@t3tools/contracts";

interface KanbanCardProps {
  card: BoardCardType;
  onClick?: ((card: BoardCardType) => void) | undefined;
}

export function KanbanCard({ card, onClick }: KanbanCardProps) {
  return (
    <div
      className="cursor-pointer rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
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
