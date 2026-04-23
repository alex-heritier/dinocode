import { Effect, Schema } from "effect";
import * as YAML from "yaml";

import { SoilParseError, SoilValidationError } from "./errors.ts";
import { TaskDocument } from "./schema.ts";

export interface ParsedTask {
  readonly document: TaskDocument;
  readonly path: string;
}

function normalizeLineEndings(content: string): string {
  return content.replace(/\r\n/g, "\n");
}

function extractFrontMatter(content: string): { frontMatter: string; body: string } | null {
  const normalized = normalizeLineEndings(content);
  if (!normalized.startsWith("---\n")) return null;
  const endIndex = normalized.indexOf("\n---\n", 4);
  if (endIndex === -1) return null;
  return {
    frontMatter: normalized.slice(4, endIndex),
    body: normalized.slice(endIndex + 5),
  };
}

function parseFrontMatter(frontMatter: string): Record<string, unknown> {
  return YAML.parse(frontMatter) as Record<string, unknown>;
}

export function parseTaskFile(
  content: string,
  path: string,
): Effect.Effect<ParsedTask, SoilParseError | SoilValidationError> {
  return Effect.gen(function* () {
    const extracted = extractFrontMatter(content);
    if (extracted === null) {
      return yield* new SoilParseError({
        message: "Missing YAML front matter",
        path,
      });
    }

    const raw = parseFrontMatter(extracted.frontMatter);

    const idCommentMatch = extracted.frontMatter.match(/^#\s*(\S+)/m);
    const idFromComment = idCommentMatch ? idCommentMatch[1] : undefined;

    const filename = path.split("/").pop() ?? "";
    const filenameIdMatch = filename.match(/^([a-z0-9]+-[a-zA-Z0-9_-]+)--/);
    const idFromFilename = filenameIdMatch ? filenameIdMatch[1] : undefined;

    // Unquoted YAML scalars that look numeric/boolean arrive here as non-string
    // values. Coerce them back to strings so schema validation doesn't reject
    // a hand-authored `order: 42` or `title: 2026`.
    const coerce = (v: unknown): string | undefined => {
      if (v === undefined || v === null) return undefined;
      if (typeof v === "string") return v;
      if (typeof v === "number" || typeof v === "boolean" || typeof v === "bigint") {
        return String(v);
      }
      return undefined;
    };
    const coerceArray = (v: unknown): string[] => {
      if (!Array.isArray(v)) return [];
      return v.map((item) => coerce(item) ?? "").filter((s) => s.length > 0);
    };

    const id = coerce(raw.id) ?? idFromComment ?? idFromFilename ?? "";
    const slug = coerce(raw.slug) ?? filename.replace(/\.md$/, "").split("--").pop() ?? "";

    const document = {
      id,
      slug,
      title: coerce(raw.title) ?? "",
      status: coerce(raw.status) ?? "todo",
      type: coerce(raw.type) ?? "task",
      priority: coerce(raw.priority) ?? "normal",
      tags: coerceArray(raw.tags),
      createdAt: coerce(raw.created_at) ?? new Date().toISOString(),
      updatedAt: coerce(raw.updated_at) ?? new Date().toISOString(),
      order: coerce(raw.order) ?? "a",
      parent: coerce(raw.parent) ?? null,
      blocking: coerceArray(raw.blocking),
      blockedBy: coerceArray(raw.blocked_by),
      body: extracted.body.trimStart(),
    };

    const validated = yield* Effect.try({
      try: () => Schema.decodeUnknownSync(TaskDocument)(document),
      catch: (error) =>
        new SoilValidationError({
          message: `Task validation failed: ${error}`,
          path,
        }),
    });

    return { document: validated, path };
  });
}
