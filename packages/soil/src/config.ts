import { Effect, Schema } from "effect";
import * as YAML from "yaml";
import * as fs from "node:fs";
import * as path from "node:path";

import { SoilConfigError } from "./errors.ts";
import { ProjectConfig } from "./schema.ts";

export interface ProjectContext {
  readonly workspaceRoot: string;
  readonly tasksPath: string;
  readonly prefix: string;
  readonly idLength: number;
  readonly defaultStatus: "in-progress" | "todo" | "draft" | "completed" | "scrapped";
  readonly defaultType: "milestone" | "epic" | "bug" | "feature" | "task";
}

export function loadProjectConfig(
  workspaceRoot: string,
): Effect.Effect<ProjectContext, SoilConfigError> {
  return Effect.gen(function* () {
    const configPath = path.join(workspaceRoot, ".dinocode", "config.yml");

    let raw: Record<string, unknown> = {};
    if (fs.existsSync(configPath)) {
      const content = yield* Effect.try({
        try: () => fs.readFileSync(configPath, "utf-8"),
        catch: (error) =>
          new SoilConfigError({
            message: `Failed to read config: ${error}`,
            path: configPath,
          }),
      });
      const parsedYaml = content.trim().length === 0 ? null : YAML.parse(content);
      if (parsedYaml && typeof parsedYaml === "object") {
        raw = parsedYaml as Record<string, unknown>;
      }
    }

    const parsed = yield* Effect.try({
      try: () => Schema.decodeUnknownSync(ProjectConfig)(raw),
      catch: (error) =>
        new SoilConfigError({
          message: `Invalid config format: ${error}`,
          path: configPath,
        }),
    });

    const tasksPath = parsed.tasks?.path ?? ".dinocode/tasks";

    return {
      workspaceRoot,
      tasksPath: path.resolve(workspaceRoot, tasksPath),
      prefix: parsed.tasks?.prefix ?? "dnc-",
      idLength: parsed.tasks?.idLength ?? 4,
      defaultStatus: parsed.tasks?.defaultStatus ?? "todo",
      defaultType: parsed.tasks?.defaultType ?? "task",
    };
  });
}
