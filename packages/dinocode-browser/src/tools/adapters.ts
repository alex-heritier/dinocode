/**
 * Provider adapters that translate {@link DinocodeToolDefinition} into the
 * shapes expected by Codex, Claude, and Cursor agent SDKs.
 *
 * Each adapter returns a plain object (no classes) so callers can serialize
 * or compose freely. The adapters are intentionally lossy in the *output*
 * direction — provider SDKs only need `name`, `description`, and a JSON
 * Schema for inputs; Dinocode keeps the richer Effect `Schema` on the
 * server side for validation.
 *
 * We avoid runtime dependencies on provider SDKs here. The `unknown` return
 * types are narrowed by the provider-specific wiring in `apps/server` via a
 * single `// dinocode-integration: dinocode-browser tool adapter` line.
 */

import { Schema } from "effect";

/**
 * Minimal subset of a tool definition that adapters need to read. Using a
 * structural type lets `BROWSER_TOOL_DEFINITIONS` (which is a tuple of
 * tools with different `Input`/`Output` schema types) feed into every
 * adapter without running into handler variance issues.
 */
interface AnyDef {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: Schema.Top;
}

const inputJsonSchema = (def: AnyDef): unknown => Schema.toJsonSchemaDocument(def.inputSchema);

export interface CodexToolShape {
  readonly type: "function";
  readonly function: {
    readonly name: string;
    readonly description: string;
    readonly parameters: unknown;
  };
}

export const toCodexTool = (def: AnyDef): CodexToolShape => ({
  type: "function",
  function: {
    name: def.name,
    description: def.description,
    parameters: inputJsonSchema(def),
  },
});

export interface ClaudeToolShape {
  readonly name: string;
  readonly description: string;
  readonly input_schema: unknown;
}

export const toClaudeTool = (def: AnyDef): ClaudeToolShape => ({
  name: def.name,
  description: def.description,
  input_schema: inputJsonSchema(def),
});

export interface CursorToolShape {
  readonly name: string;
  readonly description: string;
  readonly schema: unknown;
}

export const toCursorTool = (def: AnyDef): CursorToolShape => ({
  name: def.name,
  description: def.description,
  schema: inputJsonSchema(def),
});

export const toAllProviderShapes = (def: AnyDef) => ({
  codex: toCodexTool(def),
  claude: toClaudeTool(def),
  cursor: toCursorTool(def),
});
