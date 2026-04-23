/**
 * Shared schemas and types for the built-in browser subsystem.
 *
 * Everything in this folder MUST be process-agnostic — no electron, no
 * react-dom, no node:* imports that aren't available in the renderer. Types
 * defined here cross the main ↔ preload ↔ renderer boundary and are also
 * re-used by agent tool schemas.
 */

export * from "./ids.ts";
export * from "./errors.ts";
export * from "./schemas.ts";
