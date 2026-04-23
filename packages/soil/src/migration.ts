import { Effect } from "effect";

import { SoilParseError, SoilValidationError } from "./errors.ts";
import { parseTaskFile } from "./parser.ts";
import { renderFilename, renderTaskDocument } from "./renderer.ts";
import { generateSlug } from "./id.ts";
import type { TaskDocument } from "./schema.ts";

// Current on-disk task-schema version. Only bumped by migrations registered in
// `DEFAULT_MIGRATIONS`. See `docs/soil-migrations.md` for the migration
// contract.
export const CURRENT_TASK_SCHEMA_VERSION = 1;

/**
 * A single schema-version step for task front-matter. Migrations operate on
 * the parsed YAML object, not on `TaskDocument`, so that retired fields can be
 * removed before the current schema validates the document.
 *
 * Every migration must:
 *   - set `toVersion === fromVersion + 1`
 *   - be pure (no IO)
 *   - return a typed `SoilValidationError` on malformed input instead of
 *     throwing
 */
export interface TaskSchemaMigration {
  readonly fromVersion: number;
  readonly toVersion: number;
  readonly description: string;
  readonly apply: (
    raw: Record<string, unknown>,
  ) => Effect.Effect<Record<string, unknown>, SoilValidationError>;
  readonly invert?: (
    raw: Record<string, unknown>,
  ) => Effect.Effect<Record<string, unknown>, SoilValidationError>;
}

/**
 * Ordered list of migrations shipped by soil. Consumers should treat this as
 * opaque and prefer `runSchemaMigrations` over reading the array directly.
 */
export const DEFAULT_MIGRATIONS: readonly TaskSchemaMigration[] = [];

/**
 * Fail-fast assertion that the registered migrations form an unbroken chain
 * from `1` to `CURRENT_TASK_SCHEMA_VERSION`. Thrown at import time if the
 * registry is malformed; used as a guard when soil consumers ship new
 * migrations.
 */
export function assertMigrationsFormChain(
  migrations: readonly TaskSchemaMigration[] = DEFAULT_MIGRATIONS,
): void {
  let expected = 1;
  for (const migration of migrations) {
    if (migration.fromVersion !== expected) {
      throw new Error(
        `soil migrations are not a chain: expected fromVersion=${expected}, got ${migration.fromVersion}`,
      );
    }
    if (migration.toVersion !== expected + 1) {
      throw new Error(
        `soil migration v${migration.fromVersion}→v${migration.toVersion} must bump by exactly 1`,
      );
    }
    expected = migration.toVersion;
  }
  const final = migrations.length === 0 ? 1 : expected;
  if (final !== CURRENT_TASK_SCHEMA_VERSION) {
    throw new Error(
      `soil migrations terminate at v${final} but CURRENT_TASK_SCHEMA_VERSION is v${CURRENT_TASK_SCHEMA_VERSION}`,
    );
  }
}

// Run at module load so malformed registries fail fast in tests + imports.
assertMigrationsFormChain(DEFAULT_MIGRATIONS);

export interface SchemaMigrationRunOptions {
  readonly from?: number;
  readonly to?: number;
  readonly registry?: readonly TaskSchemaMigration[];
}

export interface SchemaMigrationTrace {
  readonly fromVersion: number;
  readonly toVersion: number;
  readonly description: string;
}

export interface SchemaMigrationResult {
  readonly raw: Record<string, unknown>;
  readonly appliedFrom: number;
  readonly appliedTo: number;
  readonly trace: readonly SchemaMigrationTrace[];
}

/**
 * Apply the ordered registry of migrations to a raw YAML object, stopping at
 * `options.to` (defaults to `CURRENT_TASK_SCHEMA_VERSION`).
 *
 * The input object is read-only; each migration returns a new object so
 * consumers can compare before/after if they need a diff.
 */
export function runSchemaMigrations(
  raw: Record<string, unknown>,
  options: SchemaMigrationRunOptions = {},
): Effect.Effect<SchemaMigrationResult, SoilValidationError> {
  return Effect.gen(function* () {
    const registry = options.registry ?? DEFAULT_MIGRATIONS;
    const inferredFrom = typeof raw.schema_version === "number" ? raw.schema_version : 1;
    const from = options.from ?? inferredFrom;
    const to = options.to ?? CURRENT_TASK_SCHEMA_VERSION;

    if (from > to) {
      return yield* new SoilValidationError({
        message: `Cannot migrate from v${from} to v${to}: downgrades require --downgrade`,
        path: (raw.id as string | undefined) ?? "",
      });
    }

    let current = { ...raw };
    const trace: SchemaMigrationTrace[] = [];
    let version = from;
    while (version < to) {
      const step = registry.find((m) => m.fromVersion === version);
      if (!step) {
        return yield* new SoilValidationError({
          message: `No migration registered from v${version}; cannot reach v${to}`,
          path: (raw.id as string | undefined) ?? "",
        });
      }
      current = yield* step.apply(current);
      trace.push({
        fromVersion: step.fromVersion,
        toVersion: step.toVersion,
        description: step.description,
      });
      version = step.toVersion;
    }

    if (version > 1) {
      current = { ...current, schema_version: version };
    } else {
      // Avoid emitting `schema_version: 1`; its absence is the canonical v1.
      delete (current as Record<string, unknown>).schema_version;
    }

    return {
      raw: current,
      appliedFrom: from,
      appliedTo: version,
      trace,
    };
  });
}

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
