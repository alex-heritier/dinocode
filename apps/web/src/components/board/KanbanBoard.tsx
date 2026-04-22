import type { BoardSnapshot } from "@t3tools/contracts";
import { KanbanColumn } from "./KanbanColumn.tsx";

interface KanbanBoardProps {
  snapshot: BoardSnapshot;
  onCardClick?: ((card: BoardSnapshot["columns"][number]["cards"][number]) => void) | undefined;
}

export function KanbanBoard({ snapshot, onCardClick }: KanbanBoardProps) {
  return (
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
  );
}
