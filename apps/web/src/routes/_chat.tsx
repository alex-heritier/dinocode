import { Outlet, createFileRoute, redirect, useLocation, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect } from "react";

import { useCommandPaletteStore } from "../commandPaletteStore";
import { useHandleNewThread } from "../hooks/useHandleNewThread";
import {
  startNewLocalThreadFromContext,
  startNewThreadFromContext,
} from "../lib/chatThreadActions";
import { isTerminalFocused } from "../lib/terminalFocus";
import { resolveShortcutCommand } from "../keybindings";
import { selectThreadTerminalState, useTerminalStateStore } from "../terminalStateStore";
import { useThreadSelectionStore } from "../threadSelectionStore";
import { resolveSidebarNewThreadEnvMode } from "~/components/Sidebar.logic";
import { useSettings } from "~/hooks/useSettings";
import { useServerKeybindings } from "~/rpc/serverState";
// dinocode-integration: ⌘⇧B flips the active project between chat and board.
import { resolveToggleFaceAction } from "~/components/board/toggleFace.logic";
import { selectSidebarThreadsAcrossEnvironments, useStore } from "~/store";
import { useUiStateStore } from "~/uiStateStore";
import { scopeProjectRef, scopedThreadKey, scopeThreadRef } from "@t3tools/client-runtime";

function ChatRouteGlobalShortcuts() {
  const clearSelection = useThreadSelectionStore((state) => state.clearSelection);
  const selectedThreadKeysSize = useThreadSelectionStore((state) => state.selectedThreadKeys.size);
  const { activeDraftThread, activeThread, defaultProjectRef, handleNewThread, routeThreadRef } =
    useHandleNewThread();
  const keybindings = useServerKeybindings();
  const terminalOpen = useTerminalStateStore((state) =>
    routeThreadRef
      ? selectThreadTerminalState(state.terminalStateByThreadKey, routeThreadRef).terminalOpen
      : false,
  );
  const appSettings = useSettings();
  const router = useRouter();
  const pathname = useLocation({ select: (loc) => loc.pathname });

  const handleToggleFace = useCallback(() => {
    const storeState = useStore.getState();
    const sidebarThreads = selectSidebarThreadsAcrossEnvironments(storeState);
    const visitedMap = useUiStateStore.getState().threadLastVisitedAtById;
    const allThreads = sidebarThreads.map((thread) => ({
      environmentId: thread.environmentId,
      id: thread.id,
      projectId: thread.projectId,
      archivedAt: thread.archivedAt,
      lastVisitedAt:
        visitedMap[scopedThreadKey(scopeThreadRef(thread.environmentId, thread.id))] ?? null,
    }));
    const action = resolveToggleFaceAction({
      pathname,
      activeThread: activeThread
        ? {
            environmentId: activeThread.environmentId,
            id: activeThread.id,
            projectId: activeThread.projectId,
            archivedAt: activeThread.archivedAt,
            lastVisitedAt: null,
          }
        : null,
      allThreads,
    });

    switch (action.kind) {
      case "navigate-to-board": {
        void router.navigate({
          to: "/board/$environmentId/$projectId",
          params: {
            environmentId: action.environmentId as string,
            projectId: action.projectId as string,
          },
        });
        return;
      }
      case "navigate-to-thread": {
        void router.navigate({
          to: "/$environmentId/$threadId",
          params: {
            environmentId: action.environmentId as string,
            threadId: action.threadId as string,
          },
        });
        return;
      }
      case "create-new-thread": {
        void handleNewThread(scopeProjectRef(action.environmentId, action.projectId), {
          envMode: resolveSidebarNewThreadEnvMode({
            defaultEnvMode: appSettings.defaultThreadEnvMode,
          }),
        });
        return;
      }
      case "noop":
        return;
    }
  }, [activeThread, appSettings.defaultThreadEnvMode, handleNewThread, pathname, router]);

  useEffect(() => {
    const onWindowKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const command = resolveShortcutCommand(event, keybindings, {
        context: {
          terminalFocus: isTerminalFocused(),
          terminalOpen,
        },
      });

      if (useCommandPaletteStore.getState().open) {
        return;
      }

      if (event.key === "Escape" && selectedThreadKeysSize > 0) {
        event.preventDefault();
        clearSelection();
        return;
      }

      if (command === "chat.newLocal") {
        event.preventDefault();
        event.stopPropagation();
        void startNewLocalThreadFromContext({
          activeDraftThread,
          activeThread,
          defaultProjectRef,
          defaultThreadEnvMode: resolveSidebarNewThreadEnvMode({
            defaultEnvMode: appSettings.defaultThreadEnvMode,
          }),
          handleNewThread,
        });
        return;
      }

      if (command === "chat.new") {
        event.preventDefault();
        event.stopPropagation();
        void startNewThreadFromContext({
          activeDraftThread,
          activeThread,
          defaultProjectRef,
          defaultThreadEnvMode: resolveSidebarNewThreadEnvMode({
            defaultEnvMode: appSettings.defaultThreadEnvMode,
          }),
          handleNewThread,
        });
        return;
      }

      if (command === "project.toggleFace") {
        event.preventDefault();
        event.stopPropagation();
        handleToggleFace();
      }
    };

    window.addEventListener("keydown", onWindowKeyDown);
    return () => {
      window.removeEventListener("keydown", onWindowKeyDown);
    };
  }, [
    activeDraftThread,
    activeThread,
    clearSelection,
    handleNewThread,
    handleToggleFace,
    keybindings,
    defaultProjectRef,
    selectedThreadKeysSize,
    terminalOpen,
    appSettings.defaultThreadEnvMode,
  ]);

  return null;
}

function ChatRouteLayout() {
  return (
    <>
      <ChatRouteGlobalShortcuts />
      <Outlet />
    </>
  );
}

export const Route = createFileRoute("/_chat")({
  beforeLoad: async ({ context }) => {
    if (context.authGateState.status !== "authenticated") {
      throw redirect({ to: "/pair", replace: true });
    }
  },
  component: ChatRouteLayout,
});
