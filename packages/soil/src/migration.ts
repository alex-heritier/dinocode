import { Effect } from "effect";

import { SoilParseError, SoilValidationError } from "./errors.ts";
import { parseTaskFile } from "./parser.ts";
import { renderFilename, renderTaskDocument } from "./renderer.ts";
import { generateSlug } from "./id.ts";
import type { TaskDocument } from "./schema.ts";

export interface MigrationResult {
  readonly document: TaskDocument;
  readonly originalFilename: string;
  readonly canonicalFilename: string;
  readonly changed: boolean;
  readonly rendered: string;
}

export function migrateTaskContent(
  content: string,
  filename: string,
): Effect.Effect<MigrationResult, SoilParseError | SoilValidationError> {
  return Effect.gen(function* () {
    const parsed = yield* parseTaskFile(content, filename);
    const original = parsed.document;
    const canonicalSlug = original.slug || generateSlug(original.title);
    const migrated: TaskDocument = {
      ...original,
      slug: canonicalSlug,
    };
    const canonical = renderFilename(migrated);
    const rendered = renderTaskDocument(migrated);
    const changed = content !== rendered || canonical !== filename;
    return {
      document: migrated,
      originalFilename: filename,
      canonicalFilename: canonical,
      changed,
      rendered,
    };
  });
}

export interface SlugRenamePlan {
  readonly oldFilename: string;
  readonly newFilename: string;
}

export function planSlugRename(document: TaskDocument, newSlug: string): SlugRenamePlan {
  const oldFilename = `${document.id}--${document.slug}.md`;
  const newFilename = `${document.id}--${newSlug}.md`;
  return { oldFilename, newFilename };
}
