// dinocode-integration: small component that surfaces the project's Board
// face alongside its Chat face in the sidebar. Kept here with a pure data
// contract so it can be lifted into `packages/dinocode-board` later.

import { Link } from "@tanstack/react-router";
import { type MouseEvent, useCallback } from "react";
import type { EnvironmentId, ProjectId, ThreadId } from "@t3tools/contracts";
import { KanbanSquareIcon, MessageSquareIcon } from "lucide-react";

import { Tooltip, TooltipPopup, TooltipTrigger } from "../ui/tooltip";
import { cn } from "../../lib/utils.ts";

export interface ProjectFacePillProps {
  environmentId: EnvironmentId;
  projectId: ProjectId;
  /** Most recently-visited thread id for this project, or null if none exist yet. */
  lastVisitedThreadId: ThreadId | null;
  /** When null, the Chat segment triggers `onCreateNewThread` instead of navigating. */
  onCreateNewThread: () => void;
  isChatActive: boolean;
  isBoardActive: boolean;
  openThreadCount: number;
  openTaskCount?: number | undefined;
  /** Shortcut label for the ⌘⇧B face-toggle, if bound. Shown in tooltips. */
  toggleFaceShortcutLabel?: string | null;
}

export function ProjectFacePill(props: ProjectFacePillProps) {
  const {
    environmentId,
    projectId,
    lastVisitedThreadId,
    onCreateNewThread,
    isChatActive,
    isBoardActive,
    openThreadCount,
    openTaskCount,
    toggleFaceShortcutLabel,
  } = props;

  const handleChatClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
      if (lastVisitedThreadId === null) {
        event.preventDefault();
        event.stopPropagation();
        onCreateNewThread();
      }
    },
    [lastVisitedThreadId, onCreateNewThread],
  );

  const chatLabel = openThreadCount > 0 ? `Chat · ${openThreadCount}` : "Chat";
  const boardLabel =
    typeof openTaskCount === "number" && openTaskCount > 0 ? `Board · ${openTaskCount}` : "Board";

  const segmentBase =
    "inline-flex flex-1 items-center justify-center gap-1 rounded-sm px-2 py-0.5 text-[11px] font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring";
  const segmentInactive = "text-muted-foreground/80 hover:text-foreground hover:bg-background/60";
  const segmentActive = "bg-background text-foreground shadow-sm";

  const chatTooltip = toggleFaceShortcutLabel
    ? `Open chat (${toggleFaceShortcutLabel} toggles faces)`
    : "Open most recent thread";
  const boardTooltip = toggleFaceShortcutLabel
    ? `Open kanban board (${toggleFaceShortcutLabel} toggles faces)`
    : "Open kanban board";

  return (
    <div
      role="group"
      aria-label="Project face"
      className="mx-2 mt-0.5 mb-1 flex items-center gap-0.5 rounded-md bg-muted/40 p-0.5"
      data-testid="project-face-pill"
    >
      {lastVisitedThreadId === null ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                data-testid="project-face-pill-chat"
                aria-pressed={isChatActive}
                className={cn(segmentBase, isChatActive ? segmentActive : segmentInactive)}
                onClick={handleChatClick}
              >
                <MessageSquareIcon className="size-3" aria-hidden="true" />
                <span className="truncate">{chatLabel}</span>
              </button>
            }
          />
          <TooltipPopup side="top">Start the first thread in this project</TooltipPopup>
        </Tooltip>
      ) : (
        <Tooltip>
          <TooltipTrigger
            render={
              <Link
                to="/$environmentId/$threadId"
                params={{
                  environmentId: environmentId as string,
                  threadId: lastVisitedThreadId as string,
                }}
                data-testid="project-face-pill-chat"
                aria-current={isChatActive ? "page" : undefined}
                className={cn(segmentBase, isChatActive ? segmentActive : segmentInactive)}
                onClick={handleChatClick}
              >
                <MessageSquareIcon className="size-3" aria-hidden="true" />
                <span className="truncate">{chatLabel}</span>
              </Link>
            }
          />
          <TooltipPopup side="top">{chatTooltip}</TooltipPopup>
        </Tooltip>
      )}

      <Tooltip>
        <TooltipTrigger
          render={
            <Link
              to="/board/$environmentId/$projectId"
              params={{
                environmentId: environmentId as string,
                projectId: projectId as string,
              }}
              data-testid="project-face-pill-board"
              aria-current={isBoardActive ? "page" : undefined}
              className={cn(segmentBase, isBoardActive ? segmentActive : segmentInactive)}
            >
              <KanbanSquareIcon className="size-3" aria-hidden="true" />
              <span className="truncate">{boardLabel}</span>
            </Link>
          }
        />
        <TooltipPopup side="top">{boardTooltip}</TooltipPopup>
      </Tooltip>
    </div>
  );
}
