// dinocode-integration: right-side slide-over detail sheet for a kanban
// card. Primary action surface for a task; surfaces Start Session, Open
// Folder, Copy Path, and Delete.

import { FolderOpenIcon, MessageSquarePlusIcon, CopyIcon, Trash2Icon } from "lucide-react";
import { useCallback } from "react";
import type { BoardSnapshot, EnvironmentId, ProjectId, TaskId } from "@t3tools/contracts";

import { Sheet, SheetPanel, SheetPopup, SheetHeader, SheetTitle } from "../ui/sheet";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils.ts";

type BoardCard = BoardSnapshot["columns"][number]["cards"][number];

export interface TaskDetailSheetProps {
  environmentId: EnvironmentId;
  projectId: ProjectId;
  /** Path on the local filesystem to the project's root, if known. Enables Open Folder + Copy Path. */
  projectCwd: string | null;
  card: BoardCard | null;
  /** Shown when present (create/delete/move errors). */
  errorMessage: string | null;
  onOpenChange: (open: boolean) => void;
  onDelete: (taskId: TaskId) => void;
  onStartSession: (taskId: TaskId) => void;
  onOpenFolder: () => void;
  onCopyPath: () => void;
}

const STATUS_LABELS: Record<BoardCard["status"], string> = {
  draft: "Draft",
  todo: "Todo",
  "in-progress": "In Progress",
  completed: "Completed",
  scrapped: "Scrapped",
};

const STATUS_TONES: Record<BoardCard["status"], string> = {
  draft: "bg-muted text-muted-foreground",
  todo: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  "in-progress": "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  scrapped: "bg-destructive/15 text-destructive",
};

const PRIORITY_TONES: Record<BoardCard["priority"], string> = {
  critical: "bg-destructive/15 text-destructive",
  high: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  normal: "bg-muted text-muted-foreground",
  low: "bg-muted/60 text-muted-foreground",
  deferred: "bg-muted/40 text-muted-foreground",
};

export function TaskDetailSheet(props: TaskDetailSheetProps) {
  const { card, errorMessage, onOpenChange, onDelete, onStartSession, onOpenFolder, onCopyPath } =
    props;

  const handleOpenChange = useCallback(
    (open: boolean) => {
      onOpenChange(open);
    },
    [onOpenChange],
  );

  return (
    <Sheet open={card !== null} onOpenChange={handleOpenChange}>
      {card && (
        <SheetPopup side="right" className="max-w-md">
          <SheetHeader className="gap-3 pb-4">
            <div className="flex items-center gap-2 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
              <span>Task</span>
              <span aria-hidden="true">·</span>
              <code
                className="font-mono text-[11px] tracking-normal normal-case"
                data-testid="task-detail-id"
              >
                {card.id}
              </code>
            </div>
            <SheetTitle className="text-lg" data-testid="task-detail-title">
              {card.title}
            </SheetTitle>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge
                variant="secondary"
                className={cn("px-2 py-0.5 text-[10px]", STATUS_TONES[card.status])}
              >
                {STATUS_LABELS[card.status]}
              </Badge>
              <Badge
                variant="secondary"
                className={cn("px-2 py-0.5 text-[10px] capitalize", PRIORITY_TONES[card.priority])}
              >
                {card.priority}
              </Badge>
              <Badge variant="outline" className="px-2 py-0.5 text-[10px] capitalize">
                {card.type}
              </Badge>
              {card.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="px-2 py-0.5 text-[10px]">
                  #{tag}
                </Badge>
              ))}
            </div>
          </SheetHeader>

          <SheetPanel className="flex flex-col gap-5 pt-0">
            <section className="text-sm text-muted-foreground">
              <p className="italic">
                Full body, blockers, and bound threads will appear here once the Dinocode server
                exposes per-task details. For now, jump into an agent session or open the file.
              </p>
            </section>

            <section aria-labelledby="task-detail-threads">
              <h4
                id="task-detail-threads"
                className="mb-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase"
              >
                Threads
              </h4>
              <p className="text-sm text-muted-foreground">No threads bound yet.</p>
            </section>

            <section aria-labelledby="task-detail-actions">
              <h4
                id="task-detail-actions"
                className="mb-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase"
              >
                Actions
              </h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onStartSession(card.id)}
                  data-testid="task-detail-start-session"
                >
                  <MessageSquarePlusIcon className="size-3.5" aria-hidden="true" />
                  Start session
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onOpenFolder}
                  disabled={props.projectCwd === null}
                  data-testid="task-detail-open-folder"
                  title={
                    props.projectCwd === null
                      ? "Project path is unknown."
                      : "Open project folder in editor"
                  }
                >
                  <FolderOpenIcon className="size-3.5" aria-hidden="true" />
                  Open folder
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCopyPath}
                  disabled={props.projectCwd === null}
                  data-testid="task-detail-copy-path"
                >
                  <CopyIcon className="size-3.5" aria-hidden="true" />
                  Copy path
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete(card.id)}
                  data-testid="task-detail-delete"
                >
                  <Trash2Icon className="size-3.5" aria-hidden="true" />
                  Delete
                </Button>
              </div>
              {errorMessage !== null && (
                <p
                  className="mt-3 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive"
                  role="alert"
                >
                  {errorMessage}
                </p>
              )}
            </section>
          </SheetPanel>
        </SheetPopup>
      )}
    </Sheet>
  );
}
