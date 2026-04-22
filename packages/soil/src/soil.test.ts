import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Effect, Schema, Stream } from "effect";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { loadProjectConfig } from "./config.ts";
import { detectEtagConflict, threeWayMerge } from "./conflict.ts";
import { decideTaskCommand } from "./decider.ts";
import { computeEtag } from "./etag.ts";
import { keyBetween } from "./fractionalIndex.ts";
import { generateSlug, generateTaskId } from "./id.ts";
import { migrateTaskContent } from "./migration.ts";
import { parseTaskFile } from "./parser.ts";
import { projectTaskEvent } from "./projector.ts";
import { makeSoilReactor } from "./reactor.ts";
import { renderFilename, renderTaskDocument } from "./renderer.ts";
import { filterTasks, readyTasks, sortTasks } from "./search.ts";
import { TaskDocument, TaskPriority, TaskStatus, TaskType } from "./schema.ts";
import { watchProject } from "./watcher.ts";

function sampleDoc(overrides: Partial<TaskDocument> = {}): TaskDocument {
  return {
    id: "dnc-abc1" as any,
    slug: "test-task",
    title: "Test task",
    status: "todo",
    type: "task",
    priority: "normal",
    tags: [],
    createdAt: "2026-01-01T00:00:00Z" as any,
    updatedAt: "2026-01-01T00:00:00Z" as any,
    order: "V",
    parent: null,
    blocking: [],
    blockedBy: [],
    body: "Task body.",
    ...overrides,
  };
}

describe("schema", () => {
  it("validates TaskStatus literals", () => {
    expect(Schema.decodeUnknownSync(TaskStatus)("todo")).toBe("todo");
    expect(Schema.decodeUnknownSync(TaskStatus)("in-progress")).toBe("in-progress");
    expect(() => Schema.decodeUnknownSync(TaskStatus)("invalid")).toThrow();
  });

  it("validates TaskType literals", () => {
    expect(Schema.decodeUnknownSync(TaskType)("task")).toBe("task");
    expect(Schema.decodeUnknownSync(TaskType)("epic")).toBe("epic");
    expect(() => Schema.decodeUnknownSync(TaskType)("invalid")).toThrow();
  });

  it("validates TaskPriority literals", () => {
    expect(Schema.decodeUnknownSync(TaskPriority)("high")).toBe("high");
    expect(() => Schema.decodeUnknownSync(TaskPriority)("invalid")).toThrow();
  });

  it("validates a full TaskDocument", () => {
    const doc = sampleDoc({ id: "dnc-abc123" as any });
    const result = Schema.decodeUnknownSync(TaskDocument)(doc);
    expect(result.id).toBe("dnc-abc123");
    expect(result.status).toBe("todo");
  });
});

describe("etag", () => {
  it("produces deterministic hashes", () => {
    expect(computeEtag("hello world")).toBe(computeEtag("hello world"));
  });

  it("produces different hashes for different content", () => {
    expect(computeEtag("hello world")).not.toBe(computeEtag("hello world!"));
  });

  it("normalizes line endings", () => {
    expect(computeEtag("line1\nline2")).toBe(computeEtag("line1\r\nline2"));
  });
});

describe("fractionalIndex", () => {
  it("generates a midpoint between null values", () => {
    expect(keyBetween(null, null)).toBeTruthy();
  });

  it("generates a key before another", () => {
    expect(keyBetween(null, "V") < "V").toBe(true);
  });

  it("generates a key after another", () => {
    expect(keyBetween("V", null) > "V").toBe(true);
  });

  it("generates a key between two values", () => {
    const key = keyBetween("A", "Z");
    expect(key > "A").toBe(true);
    expect(key < "Z").toBe(true);
  });

  it("maintains ordering over many insertions", () => {
    const keys: string[] = [keyBetween(null, null)];
    for (let i = 0; i < 20; i++) {
      const newKey = keyBetween(keys[keys.length - 1]!, null);
      expect(newKey > keys[keys.length - 1]!).toBe(true);
      keys.push(newKey);
    }
  });
});

describe("id", () => {
  it("generates unique task IDs with prefix", () => {
    const a = generateTaskId("dnc-");
    const b = generateTaskId("dnc-");
    expect(a).toMatch(/^dnc-.+/);
    expect(b).toMatch(/^dnc-.+/);
    expect(a).not.toBe(b);
  });

  it("generates slugs from titles", () => {
    expect(generateSlug("Hello World")).toBe("hello-world");
    expect(generateSlug("Fix: bug in parser!")).toBe("fix-bug-in-parser");
    expect(generateSlug("")).toBe("");
  });
});

describe("parser", () => {
  it("parses a valid task file", async () => {
    const content = `---
# dnc-test1
title: Test task
status: todo
type: task
priority: normal
created_at: "2026-01-01T00:00:00Z"
updated_at: "2026-01-01T00:00:00Z"
---
Body content here.
`;
    const result = await Effect.runPromise(parseTaskFile(content, "dnc-test1--test-task.md"));
    expect(result.document.title).toBe("Test task");
    expect(result.document.body).toBe("Body content here.\n");
  });

  it("rejects content without front matter", async () => {
    await expect(
      Effect.runPromise(parseTaskFile("No front matter", "test.md")),
    ).rejects.toBeDefined();
  });

  it("round-trips through parse and render", async () => {
    const original = sampleDoc({ id: "dnc-rt01" as any, slug: "round-trip" });
    const rendered = renderTaskDocument(original);
    const reparsed = await Effect.runPromise(parseTaskFile(rendered, "dnc-rt01--round-trip.md"));
    expect(reparsed.document.title).toBe(original.title);
    expect(reparsed.document.status).toBe(original.status);
    expect(reparsed.document.priority).toBe(original.priority);
  });
});

describe("renderer", () => {
  it("renders a task document to markdown with front matter", () => {
    const rendered = renderTaskDocument(sampleDoc());
    expect(rendered).toContain("---");
    expect(rendered).toContain("title: Test task");
    expect(rendered).toContain("status: todo");
    expect(rendered).toContain("Task body.");
  });

  it("renders filenames correctly", () => {
    expect(renderFilename(sampleDoc({ id: "dnc-x1" as any, slug: "my-task" }))).toBe(
      "dnc-x1--my-task.md",
    );
  });
});

describe("decider", () => {
  it("emits task.created for task.create", async () => {
    const events = await Effect.runPromise(
      decideTaskCommand(
        {},
        {
          type: "task.create",
          projectId: "proj1",
          title: "New task",
        },
      ),
    );
    expect(events.length).toBe(1);
    expect(events[0]!.type).toBe("task.created");
  });

  it("rejects update for missing task", async () => {
    await expect(
      Effect.runPromise(
        decideTaskCommand(
          {},
          {
            type: "task.update",
            taskId: "dnc-missing" as any,
            patch: { title: "Updated" },
          },
        ),
      ),
    ).rejects.toBeDefined();
  });

  it("rejects archive for in-progress task", async () => {
    const state = {
      "dnc-abc1": {
        ...sampleDoc(),
        etag: "0" as any,
      },
    };
    await expect(
      Effect.runPromise(
        decideTaskCommand(state as any, {
          type: "task.archive",
          taskId: "dnc-abc1",
        }),
      ),
    ).rejects.toBeDefined();
  });
});

describe("projector", () => {
  it("projects task.created event", () => {
    const event = {
      type: "task.created" as const,
      taskId: "dnc-p1",
      document: sampleDoc({ id: "dnc-p1" as any, slug: "proj" }),
    };
    const state = projectTaskEvent({}, event);
    expect(state["dnc-p1"]).toBeDefined();
    expect(state["dnc-p1"]!.etag).toBeTruthy();
  });

  it("projects task.updated event", () => {
    const initial = projectTaskEvent(
      {},
      {
        type: "task.created",
        taskId: "dnc-p1",
        document: sampleDoc({ id: "dnc-p1" as any }),
      },
    );
    const updated = projectTaskEvent(initial, {
      type: "task.updated",
      taskId: "dnc-p1",
      patch: { title: "New title" },
    });
    expect(updated["dnc-p1"]!.title).toBe("New title");
  });

  it("removes task on task.deleted", () => {
    const initial = projectTaskEvent(
      {},
      {
        type: "task.created",
        taskId: "dnc-p1",
        document: sampleDoc({ id: "dnc-p1" as any }),
      },
    );
    const deleted = projectTaskEvent(initial, { type: "task.deleted", taskId: "dnc-p1" });
    expect(deleted["dnc-p1"]).toBeUndefined();
  });
});

describe("conflict", () => {
  it("detects etag mismatch", () => {
    const doc = sampleDoc();
    const result = detectEtagConflict("not-a-real-etag", doc);
    expect(result.hasConflict).toBe(true);
  });

  it("reports no conflict when etags match", () => {
    const doc = sampleDoc();
    const etag = computeEtag(renderTaskDocument(doc));
    const result = detectEtagConflict(etag, doc);
    expect(result.hasConflict).toBe(false);
  });

  it("three-way merges with concurrent title changes flagging conflict", () => {
    const base = sampleDoc();
    const local = sampleDoc({ title: "Local" });
    const remote = sampleDoc({ title: "Remote" });
    const result = threeWayMerge({ base, local, remote });
    expect(result.conflicts.length).toBe(1);
    expect(result.conflicts[0]!.field).toBe("title");
  });

  it("three-way merges without conflict when only one side changes", () => {
    const base = sampleDoc({ status: "todo" });
    const local = sampleDoc({ status: "in-progress" });
    const remote = sampleDoc({ status: "todo" });
    const result = threeWayMerge({ base, local, remote });
    expect(result.conflicts.length).toBe(0);
    expect(result.merged.status).toBe("in-progress");
  });
});

describe("search", () => {
  const tasks: TaskDocument[] = [
    sampleDoc({ id: "dnc-a1" as any, title: "Alpha", status: "todo", priority: "high" }),
    sampleDoc({
      id: "dnc-a2" as any,
      title: "Beta",
      status: "in-progress",
      priority: "normal",
    }),
    sampleDoc({
      id: "dnc-a3" as any,
      title: "Gamma",
      status: "completed",
      priority: "low",
    }),
    sampleDoc({
      id: "dnc-a4" as any,
      title: "Delta",
      status: "todo",
      blockedBy: ["dnc-a2" as any],
    }),
  ];

  it("filters by status", () => {
    const result = filterTasks(tasks, { status: ["todo"] });
    expect(result.map((t) => t.id)).toEqual(["dnc-a1", "dnc-a4"]);
  });

  it("filters by search text", () => {
    const result = filterTasks(tasks, { search: "alpha" });
    expect(result.length).toBe(1);
  });

  it("excludes status", () => {
    const result = filterTasks(tasks, { excludeStatus: ["completed"] });
    expect(result.length).toBe(3);
  });

  it("finds ready (unblocked) tasks", () => {
    const ready = readyTasks(tasks);
    expect(ready.map((t) => t.id)).toContain("dnc-a1");
    expect(ready.map((t) => t.id)).not.toContain("dnc-a2");
    expect(ready.map((t) => t.id)).not.toContain("dnc-a4");
  });

  it("sorts by priority", () => {
    const sorted = sortTasks(tasks, { by: "priority" });
    expect(sorted[0]!.priority).toBe("high");
  });
});

describe("migration", () => {
  it("preserves canonical content as no-op", async () => {
    const doc = sampleDoc({ id: "dnc-m1" as any, slug: "canonical" });
    const rendered = renderTaskDocument(doc);
    const filename = renderFilename(doc);
    const result = await Effect.runPromise(migrateTaskContent(rendered, filename));
    expect(result.canonicalFilename).toBe(filename);
  });

  it("yields migration result with canonical filename", async () => {
    const doc = sampleDoc({ id: "dnc-m2" as any, slug: "slug-test" });
    const rendered = renderTaskDocument(doc);
    const result = await Effect.runPromise(migrateTaskContent(rendered, "dnc-m2--slug-test.md"));
    expect(result.canonicalFilename).toBe("dnc-m2--slug-test.md");
    expect(result.changed).toBe(false);
  });
});

describe("reactor + watcher integration", () => {
  let workdir: string;

  beforeEach(() => {
    workdir = fs.mkdtempSync(path.join(os.tmpdir(), "soil-test-"));
    fs.mkdirSync(path.join(workdir, ".dinocode"), { recursive: true });
    fs.writeFileSync(path.join(workdir, ".dinocode", "config.yml"), "");
  });

  afterEach(() => {
    fs.rmSync(workdir, { recursive: true, force: true });
  });

  it("writes, updates, archives, and deletes task files", async () => {
    const context = await Effect.runPromise(loadProjectConfig(workdir));
    const reactor = makeSoilReactor({ context });
    const doc = sampleDoc({ id: "dnc-r1" as any, slug: "react-test", status: "todo" });

    await Effect.runPromise(
      reactor.apply([{ type: "task.created", taskId: doc.id, document: doc }]),
    );
    const tasksDir = context.tasksPath;
    const filename = renderFilename(doc);
    expect(fs.existsSync(path.join(tasksDir, filename))).toBe(true);

    await Effect.runPromise(
      reactor.apply([
        {
          type: "task.updated",
          taskId: doc.id,
          patch: { status: "completed" },
        },
      ]),
    );
    const updatedContent = fs.readFileSync(path.join(tasksDir, filename), "utf-8");
    expect(updatedContent).toContain("status: completed");

    await Effect.runPromise(reactor.apply([{ type: "task.archived", taskId: doc.id }]));
    expect(fs.existsSync(path.join(tasksDir, filename))).toBe(false);
    expect(fs.existsSync(path.join(tasksDir, "archive", filename))).toBe(true);

    await Effect.runPromise(reactor.apply([{ type: "task.deleted", taskId: doc.id }]));
    expect(fs.existsSync(path.join(tasksDir, "archive", filename))).toBe(false);
  });

  it("lists existing tasks from disk", async () => {
    const context = await Effect.runPromise(loadProjectConfig(workdir));
    const reactor = makeSoilReactor({ context });
    await Effect.runPromise(
      reactor.apply([
        {
          type: "task.created",
          taskId: "dnc-list1",
          document: sampleDoc({ id: "dnc-list1" as any, slug: "list-one" }),
        },
        {
          type: "task.created",
          taskId: "dnc-list2",
          document: sampleDoc({ id: "dnc-list2" as any, slug: "list-two" }),
        },
      ]),
    );
    const tasks = await Effect.runPromise(reactor.listTasks());
    expect(tasks.length).toBe(2);
  });

  it.skip("emits watcher events on disk changes", async () => {
    const context = await Effect.runPromise(loadProjectConfig(workdir));
    const reactor = makeSoilReactor({ context });
    await Effect.runPromise(
      reactor.apply([
        {
          type: "task.created",
          taskId: "dnc-watch1",
          document: sampleDoc({ id: "dnc-watch1" as any, slug: "watch-test" }),
        },
      ]),
    );
    const events = await Effect.runPromise(
      watchProject({ context, debounceMs: 10 }).pipe(Stream.take(1), Stream.runCollect),
    );
    expect(events.length).toBeGreaterThan(0);
  });
});
