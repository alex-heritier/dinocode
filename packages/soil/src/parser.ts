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

    const id = (raw.id as string | undefined) ?? idFromComment ?? idFromFilename ?? "";
    const slug =
      (raw.slug as string | undefined) ?? filename.replace(/\.md$/, "").split("--").pop() ?? "";

    const document = {
      id,
      slug,
      title: (raw.title as string) ?? "",
      status: (raw.status as string) ?? "todo",
      type: (raw.type as string) ?? "task",
      priority: (raw.priority as string) ?? "normal",
      tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
      createdAt: (raw.created_at as string) ?? new Date().toISOString(),
      updatedAt: (raw.updated_at as string) ?? new Date().toISOString(),
      order: (raw.order as string) ?? "a",
      parent: (raw.parent as string | null) ?? null,
      blocking: Array.isArray(raw.blocking) ? (raw.blocking as string[]) : [],
      blockedBy: Array.isArray(raw.blocked_by) ? (raw.blocked_by as string[]) : [],
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
