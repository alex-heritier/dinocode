/**
 * Dev-server detection for the built-in browser subsystem.
 *
 * Pure decision modules — no FS or network. The main-process service
 * reads files and probes ports, then feeds the results into
 * {@link detectDevServer}.
 */

export * from "./DevServerDetector.ts";
