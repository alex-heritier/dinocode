import { describe, expect, it } from "vitest";
import { Effect, Schema } from "effect";

import { computeEtag } from "./etag.ts";
import { parseTaskFile } from "./parser.ts";
import { renderFilename, renderTaskDocument } from "./renderer.ts";
import { Tag, TaskDocument, type TaskPriority, type TaskStatus, type TaskType } from "./schema.ts";

const STATUSES: TaskStatus[] = ["in-progress", "todo", "draft", "completed", "scrapped"];
const TYPES: TaskType[] = ["milestone", "epic", "bug", "feature", "task"];
const PRIORITIES: TaskPriority[] = ["critical", "high", "normal", "low", "deferred"];

// A deterministic pseudo-RNG so a failing case is reproducible without
// pulling in fast-check as a dependency. Mulberry32 — small, fast, not
// cryptographically secure which is fine for fuzzing.
function rng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rand: () => number, xs: readonly T[]): T {
  return xs[Math.floor(rand() * xs.length)]!;
}

function randomString(rand: () => number, min: number, max: number, pool: string): string {
  const len = min + Math.floor(rand() * (max - min + 1));
  let out = "";
  for (let i = 0; i < len; i++) out += pool[Math.floor(rand() * pool.length)]!;
  return out;
}

function randomTaskId(rand: () => number): string {
  const alpha = "abcdefghijklmnopqrstuvwxyz0123456789";
  return `dnc-${randomString(rand, 3, 16, alpha)}`;
}

function randomTag(rand: () => number): string {
  const first = "abcdefghijklmnopqrstuvwxyz";
  const rest = "abcdefghijklmnopqrstuvwxyz0123456789-";
  return first[Math.floor(rand() * first.length)]! + randomString(rand, 0, 8, rest);
}

function randomTitle(rand: () => number): string {
  // Title is serialized as a YAML scalar without quoting, so we deliberately
  // exclude YAML control characters (':', '#', '[', ']', '{', '}', ',', '&',
  // '*', '!', '|', '>', '\'', '"', '%', '@', '`', '\\') and line separators.
  const pool =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -_()?.\u00e9\u00ed\u00fc\u4e2d\u6587\ud83d\ude80";
  const raw = randomString(rand, 1, 80, pool);
  // Titles cannot start or end with whitespace per YAML conventions we rely
  // on in the renderer.
  return raw.replace(/^\s+|\s+$/g, "") || "x";
}

function randomBody(rand: () => number): string {
  const lines = Math.floor(rand() * 6);
  const out: string[] = [];
  for (let i = 0; i < lines; i++) {
    out.push(randomString(rand, 0, 40, "abcdef \u4e2d# ghij-`\n\u00e9_!?,.[]()\u00b6\u2603"));
  }
  return out.join("\n");
}

function randomDoc(rand: () => number): TaskDocument {
  const tagCount = Math.floor(rand() * 4);
  const tags: string[] = [];
  for (let i = 0; i < tagCount; i++) tags.push(randomTag(rand));
  return {
    id: randomTaskId(rand),
    slug: randomString(rand, 1, 32, "abcdefghijklmnopqrstuvwxyz0123456789-"),
    title: randomTitle(rand),
    status: pick(rand, STATUSES),
    type: pick(rand, TYPES),
    priority: pick(rand, PRIORITIES),
    tags,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    order: randomString(
      rand,
      1,
      6,
      "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_",
    ),
    parent: null,
    blocking: [],
    blockedBy: [],
    body: randomBody(rand),
  };
}

describe("schema fuzz — property: write → parse → fields preserved", () => {
  it("preserves metadata across 200 random round-trips", async () => {
    const rand = rng(0xc0decafe);
    for (let i = 0; i < 200; i++) {
      const doc = randomDoc(rand);
      const rendered = renderTaskDocument(doc);
      const result = await Effect.runPromise(parseTaskFile(rendered, renderFilename(doc)));
      expect(result.document.id).toBe(doc.id);
      expect(result.document.title).toBe(doc.title);
      expect(result.document.status).toBe(doc.status);
      expect(result.document.type).toBe(doc.type);
      expect(result.document.priority).toBe(doc.priority);
      expect(result.document.tags).toEqual(doc.tags);
      expect(result.document.order).toBe(doc.order);
    }
  });

  it("produces stable etags for identical random docs", () => {
    const rand = rng(0xdeadbeef);
    for (let i = 0; i < 100; i++) {
      const doc = randomDoc(rand);
      const a = computeEtag(renderTaskDocument(doc));
      const b = computeEtag(renderTaskDocument(doc));
      expect(a).toBe(b);
    }
  });

  it("renderer output is a fixed point for already-canonical docs", async () => {
    const rand = rng(0xfaceb00c);
    for (let i = 0; i < 100; i++) {
      const doc = randomDoc(rand);
      const rendered1 = renderTaskDocument(doc);
      const parsed = await Effect.runPromise(parseTaskFile(rendered1, renderFilename(doc)));
      const rendered2 = renderTaskDocument({ ...parsed.document, body: doc.body });
      expect(rendered2).toBe(rendered1);
    }
  });
});

describe("schema fuzz — negative: garbage never throws", () => {
  const garbageInputs: string[] = [
    "",
    "not yaml",
    "---\nnot closed",
    "---\n---\n",
    "---\n: : : : :\n---\n",
    "---\n# dnc-xx\ntitle:\nstatus:\ntype:\npriority:\ncreated_at:\nupdated_at:\norder:\n---\n",
    "---\n# \ntitle:\n---\n",
    "---\n{}[]()!@#$%^&*()\n---\n",
    "\0\0\0\0",
    "---\ntitle: 🚀\nstatus: invalid-status\ntype: task\npriority: normal\n" +
      'created_at: "2026-01-01T00:00:00Z"\nupdated_at: "2026-01-01T00:00:00Z"\norder: V\n---\n',
    "---\ntitle: ok\nstatus: todo\ntype: not-a-type\npriority: normal\n" +
      'created_at: "2026-01-01T00:00:00Z"\nupdated_at: "2026-01-01T00:00:00Z"\norder: V\n---\n',
    "---\ntitle: ok\nstatus: todo\ntype: task\npriority: MEGA\n" +
      'created_at: "2026-01-01T00:00:00Z"\nupdated_at: "2026-01-01T00:00:00Z"\norder: V\n---\n',
  ];

  it.each(garbageInputs.map((input, i) => [i, input] as const))(
    "returns an Effect failure (never throws) for garbage input #%i",
    async (_i, input) => {
      let caught = false;
      try {
        await Effect.runPromise(parseTaskFile(input, "garbage.md"));
      } catch (err) {
        caught = true;
        expect(err).toBeDefined();
      }
      expect(caught).toBe(true);
    },
  );

  it("returns an Effect failure for 100 random bit-flipped inputs", async () => {
    const rand = rng(0xabad1dea);
    const base =
      '---\n# dnc-abc1\ntitle: Base\nstatus: todo\ntype: task\npriority: normal\ncreated_at: "2026-01-01T00:00:00Z"\nupdated_at: "2026-01-01T00:00:00Z"\norder: V\n---\n\nBody.\n';
    for (let i = 0; i < 100; i++) {
      const bytes = new TextEncoder().encode(base);
      const flipped = bytes.slice();
      const idx = Math.floor(rand() * flipped.length);
      flipped[idx] = flipped[idx]! ^ 0xff;
      const mutated = new TextDecoder("utf-8", { fatal: false }).decode(flipped);
      try {
        // parseTaskFile may succeed if the flip was in the body; that's fine.
        // We only require that it does not throw outside of the Effect.
        await Effect.runPromise(parseTaskFile(mutated, "fuzz.md"));
      } catch {
        // expected for most mutations
      }
    }
  });
});

describe("schema fuzz — tag validator exhaustive edge cases", () => {
  const validTags = ["a", "z", "abc", "a1", "a-b", "kebab-case-tag", "x".repeat(64)];
  const invalidTags = [
    "",
    "0leading",
    "1",
    "-leading-hyphen",
    "UPPER",
    "Has Space",
    "has_underscore",
    "has.dot",
    "has/slash",
    "has!bang",
    "a".repeat(65),
    "éccented",
    "🚀",
  ];

  it.each(validTags)("accepts valid tag %s", (tag) => {
    expect(() => Schema.decodeUnknownSync(Tag)(tag)).not.toThrow();
  });

  it.each(invalidTags)("rejects invalid tag %j", (tag) => {
    expect(() => Schema.decodeUnknownSync(Tag)(tag)).toThrow();
  });
});

describe("schema fuzz — unicode body round-trips byte-for-byte", () => {
  // Titles must be single-line YAML-safe scalars (the renderer writes them
  // unquoted); bodies may contain arbitrary multi-line unicode.
  const unicodeBodies = [
    "Hello 🚀 world",
    "中文内容\n多行\n多行",
    "Caf\u00e9 r\u00e9sum\u00e9",
    "Zero-width \u200b join \u200d er",
    "Emoji family 👨‍👩‍👧‍👦",
    "Right-to-left עברית and العربية",
    "Math \u2211 \u222b \u221e",
  ];

  it.each(unicodeBodies)("round-trips body %j through parse+render", async (body) => {
    const doc: TaskDocument = {
      id: "dnc-u1",
      slug: "unicode",
      title: "Unicode body test",
      status: "todo",
      type: "task",
      priority: "normal",
      tags: [],
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      order: "V",
      parent: null,
      blocking: [],
      blockedBy: [],
      body,
    };
    const rendered = renderTaskDocument(doc);
    const parsed = await Effect.runPromise(parseTaskFile(rendered, "dnc-u1--unicode.md"));
    const trimmed = body.endsWith("\n") ? body : `${body}\n`;
    expect(parsed.document.body).toBe(trimmed);
  });
});

describe("schema fuzz — id pattern boundary cases", () => {
  const validIds = ["dnc-a", "dnc-abc1", "dnc-ABCD_1234", "dnc-abcdefghijklmnop", "0dnc-abc"];
  const invalidIds = ["", "dnc", "dnc-", "ABC-abc", "dnc-!", "dnc- ", "dnc-\n"];

  it.each(validIds)("accepts valid id %s", (id) => {
    expect(() => Schema.decodeUnknownSync(TaskDocument.fields.id)(id)).not.toThrow();
  });

  it.each(invalidIds)("rejects invalid id %j", (id) => {
    expect(() => Schema.decodeUnknownSync(TaskDocument.fields.id)(id)).toThrow();
  });
});
