/**
 * Navigation security primitives for the built-in browser subsystem.
 *
 * Pure decision modules only — no FS, no network, no clock. Higher
 * layers (BrowserManager, tool handlers, renderer confirm UI) compose
 * these with persistence and user interaction.
 */

export * from "./Allowlist.ts";
