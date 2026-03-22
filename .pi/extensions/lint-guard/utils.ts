import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// ── Script path resolution ────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));

export function getScriptPath(scriptName: string): string {
  return join(__dirname, "scripts", scriptName);
}

// ── File routing ──────────────────────────────────────────────────────

export interface LintRoute {
  script: string;
  tier: string;
  dir: string;
}

export function routeLinter(filePath: string): LintRoute | null {
  if (filePath.endsWith(".py")) {
    return { script: getScriptPath("lint-py.sh"), tier: "fast", dir: "./backend" };
  }
  if (/\.(tsx?|jsx?)$/.test(filePath)) {
    return { script: getScriptPath("lint-ts.sh"), tier: "fast", dir: "./ui" };
  }
  return null;
}

// ── Circuit breaker ───────────────────────────────────────────────────

const MAX_ATTEMPTS = 3;
let stopAttempts = 0;

export function resetStopAttempts(): void {
  stopAttempts = 0;
}

export function incrementStopAttempts(): number {
  return ++stopAttempts;
}

export function isCircuitBroken(): boolean {
  return stopAttempts >= MAX_ATTEMPTS;
}

export function getStopAttempts(): number {
  return stopAttempts;
}

export function getMaxAttempts(): number {
  return MAX_ATTEMPTS;
}
