"use client";

import type { ToastManagerAddOptions } from "@base-ui/react/toast";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { getClientSettings } from "~/hooks/useSettings";
import type { ThreadToastData } from "./toast";

export type StackedThreadToastOptions = {
  type: "error" | "warning" | "success" | "info" | "loading";
  title: ReactNode;
  description?: ReactNode;
  timeout?: number;
  priority?: "low" | "high";
  actionProps?: ComponentPropsWithoutRef<"button">;
  /** Merged into `data`; `actionLayout` is always forced to `"stacked-end"` by the helper. */
  actionVariant?: ThreadToastData["actionVariant"];
  data?: Omit<ThreadToastData, "actionLayout">;
  /**
   * When true (default: auto), the helper also mirrors the toast to the system
   * Notification API if the app is not focused, the toast type is error or
   * warning, and the `criticalToastDesktopNotifications` client setting is on.
   * Pass `false` to suppress mirroring for a specific toast (e.g. the toast is
   * already acknowledged through another surface).
   */
  mirrorToSystemNotification?: boolean;
};

/**
 * Thread toast using the stacked body + bottom action row (copy for errors, CTA on its own row).
 */
export function stackedThreadToast(
  options: StackedThreadToastOptions,
): ToastManagerAddOptions<ThreadToastData> {
  const {
    type,
    title,
    description,
    timeout,
    priority,
    actionProps,
    actionVariant,
    data,
    mirrorToSystemNotification,
  } = options;

  // Helper-owned `actionLayout` must win over any caller-provided `data`, so spread
  // the caller's data first and apply `actionLayout: "stacked-end"` last.
  const mergedData: ThreadToastData = {
    ...(data !== undefined ? data : {}),
    actionLayout: "stacked-end",
  };
  if (actionVariant !== undefined) {
    mergedData.actionVariant = actionVariant;
  }

  const payload: ToastManagerAddOptions<ThreadToastData> = {
    type,
    title,
    data: mergedData,
  };

  if (description !== undefined) {
    payload.description = description;
  }
  if (timeout !== undefined) {
    payload.timeout = timeout;
  }
  if (priority !== undefined) {
    payload.priority = priority;
  }
  if (actionProps !== undefined) {
    payload.actionProps = actionProps;
  }

  if (mirrorToSystemNotification !== false) {
    // Fire-and-forget: any failure (permission denied, unsupported platform,
    // non-critical toast, app focused, setting off) short-circuits inside the
    // mirror so the toast itself always renders normally.
    void maybeMirrorToSystemNotification({ type, title, description });
  }

  return payload;
}

// ── System Notification mirror ───────────────────────────────────────

let permissionRequestInFlight: Promise<NotificationPermission> | null = null;

/**
 * Return the current notification permission, requesting it lazily on the
 * first opt-in invocation. Subsequent calls reuse the cached permission and
 * never re-prompt (browsers deny repeated `requestPermission` calls anyway).
 */
async function ensureNotificationPermission(): Promise<NotificationPermission> {
  if (typeof Notification === "undefined") return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  if (permissionRequestInFlight) return permissionRequestInFlight;
  try {
    permissionRequestInFlight = Notification.requestPermission();
    return await permissionRequestInFlight;
  } catch {
    return "denied";
  } finally {
    permissionRequestInFlight = null;
  }
}

function flattenReactNodeForNotification(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) {
    return node.map(flattenReactNodeForNotification).filter(Boolean).join(" ");
  }
  // Best effort for React elements: try reading `children` off the props.
  const asRecord = node as unknown as { props?: { children?: ReactNode } };
  if (asRecord && typeof asRecord === "object" && "props" in asRecord) {
    const props = asRecord.props;
    if (props && "children" in props) {
      return flattenReactNodeForNotification(props.children);
    }
  }
  return "";
}

async function maybeMirrorToSystemNotification(options: {
  type: StackedThreadToastOptions["type"];
  title: ReactNode;
  description?: ReactNode;
}): Promise<void> {
  // Only error/warning are considered critical enough to warrant an OS-level
  // notification; success/info/loading stay in-app.
  if (options.type !== "error" && options.type !== "warning") return;

  // Guard against non-browser runtimes (SSR, jsdom without Notification, tests).
  if (typeof window === "undefined") return;
  if (typeof Notification === "undefined") return;
  if (typeof document === "undefined") return;

  // Opt-in setting must be on.
  const settings = getClientSettings();
  if (!settings.criticalToastDesktopNotifications) return;

  // Only fire when the app is not focused; otherwise the in-app toast is enough.
  if (document.hasFocus()) return;

  const permission = await ensureNotificationPermission();
  if (permission !== "granted") return;

  const title = flattenReactNodeForNotification(options.title) || "Dinocode";
  const body = flattenReactNodeForNotification(options.description);

  try {
    // Warnings shouldn't steal focus; errors can be more insistent.
    const notificationOptions: NotificationOptions = {
      tag: `dinocode-${options.type}`,
      requireInteraction: options.type === "error",
      silent: options.type === "warning",
    };
    if (body) notificationOptions.body = body;
    new Notification(title, notificationOptions);
  } catch (error) {
    console.warn("[toast] Failed to mirror to system notification", error);
  }
}
