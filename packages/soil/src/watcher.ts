import { Effect, Queue, Stream } from "effect";
import * as fs from "node:fs";
import * as path from "node:path";

import type { ProjectContext } from "./config.ts";
import { SoilParseError, SoilValidationError } from "./errors.ts";
import { parseTaskFile } from "./parser.ts";
import { computeEtag } from "./etag.ts";
import { renderTaskDocument } from "./renderer.ts";
import type { TaskDocument } from "./schema.ts";

export type FileChangeKind = "added" | "updated" | "removed";

export interface FileChangeEvent {
  readonly kind: FileChangeKind;
  readonly path: string;
  readonly taskId: string | null;
  readonly document: TaskDocument | null;
  readonly etag: string | null;
  readonly archived: boolean;
}

export interface WatcherOptions {
  readonly context: ProjectContext;
  readonly archiveSubfolder?: string;
  readonly isIgnored?: (absolutePath: string) => boolean;
  readonly debounceMs?: number;
}

function extractTaskId(filename: string): string | null {
  const match = filename.match(/^([a-z0-9]+-[a-zA-Z0-9_-]+)--/);
  return match ? (match[1] ?? null) : null;
}

async function readAndParse(
  filePath: string,
): Promise<{ document: TaskDocument | null; etag: string | null }> {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const result = await Effect.runPromise(
      parseTaskFile(content, filePath).pipe(
        Effect.catchTags({
          SoilParseError: () => Effect.succeed(null),
          SoilValidationError: () => Effect.succeed(null),
        }),
      ),
    );
    if (!result) return { document: null, etag: null };
    const etag = computeEtag(renderTaskDocument(result.document));
    return { document: result.document, etag };
  } catch {
    return { document: null, etag: null };
  }
}

export function watchProject(
  options: WatcherOptions,
): Stream.Stream<FileChangeEvent, SoilParseError | SoilValidationError> {
  const { context } = options;
  const archiveSubfolder = options.archiveSubfolder ?? "archive";
  const tasksDir = context.tasksPath;
  const archiveDir = path.join(tasksDir, archiveSubfolder);
  const isIgnored = options.isIgnored ?? (() => false);
  const debounceMs = options.debounceMs ?? 50;

  const setup = async <E>(queue: Queue.Enqueue<FileChangeEvent, E>): Promise<() => void> => {
    if (!fs.existsSync(tasksDir)) {
      fs.mkdirSync(tasksDir, { recursive: true });
    }
    const pending = new Map<string, NodeJS.Timeout>();
    const lastEtag = new Map<string, string>();

    const scheduleEvent = (filePath: string) => {
      const existing = pending.get(filePath);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(async () => {
        pending.delete(filePath);
        if (isIgnored(filePath)) return;
        const filename = path.basename(filePath);
        if (!filename.endsWith(".md")) return;
        const archived = filePath.startsWith(archiveDir + path.sep);
        const exists = fs.existsSync(filePath);
        if (!exists) {
          const previousEtag = lastEtag.get(filePath);
          lastEtag.delete(filePath);
          const taskId = extractTaskId(filename);
          Queue.offerUnsafe(queue, {
            kind: "removed",
            path: filePath,
            taskId,
            document: null,
            etag: previousEtag ?? null,
            archived,
          });
          return;
        }
        const { document, etag } = await readAndParse(filePath);
        if (!document || !etag) return;
        const prior = lastEtag.get(filePath);
        if (prior === etag) return;
        lastEtag.set(filePath, etag);
        Queue.offerUnsafe(queue, {
          kind: prior === undefined ? "added" : "updated",
          path: filePath,
          taskId: document.id,
          document,
          etag,
          archived,
        });
      }, debounceMs);
      pending.set(filePath, timer);
    };

    const watchers: fs.FSWatcher[] = [];
    const watchDir = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      const w = fs.watch(dir, { persistent: false }, (_event, filename) => {
        if (!filename) return;
        scheduleEvent(path.join(dir, filename));
      });
      watchers.push(w);
    };

    watchDir(tasksDir);
    if (fs.existsSync(archiveDir)) {
      watchDir(archiveDir);
    }

    const dirs = [tasksDir, archiveDir];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) continue;
      for (const entry of fs.readdirSync(dir)) {
        if (!entry.endsWith(".md")) continue;
        const filePath = path.join(dir, entry);
        const { document, etag } = await readAndParse(filePath);
        if (document && etag) {
          lastEtag.set(filePath, etag);
          Queue.offerUnsafe(queue, {
            kind: "added",
            path: filePath,
            taskId: document.id,
            document,
            etag,
            archived: dir === archiveDir,
          });
        }
      }
    }

    return () => {
      for (const timer of pending.values()) clearTimeout(timer);
      pending.clear();
      for (const w of watchers) w.close();
    };
  };

  return Stream.callback<FileChangeEvent, SoilParseError | SoilValidationError>((queue) =>
    Effect.gen(function* () {
      const cleanup = yield* Effect.promise(() => setup(queue));
      yield* Effect.addFinalizer(() => Effect.sync(cleanup));
    }),
  );
}
