import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import {
  getScriptPath,
  incrementStopAttempts,
  resetStopAttempts,
  isCircuitBroken,
  getStopAttempts,
  getMaxAttempts,
} from "./utils.js";

export function registerLintOnStop(pi: ExtensionAPI, projectRoot: string): void {
  pi.on("agent_end", async () => {
    const attempt = incrementStopAttempts();

    const pyResult = await pi.exec(
      "bash",
      [getScriptPath("lint-py.sh"), "strict", "./backend"],
      { cwd: projectRoot },
    );
    const tsResult = await pi.exec(
      "bash",
      [getScriptPath("lint-ts.sh"), "full", "./ui"],
      { cwd: projectRoot },
    );

    // Both pass — reset and allow completion
    if (pyResult.code === 0 && tsResult.code === 0) {
      resetStopAttempts();
      return;
    }

    // Build combined lint output
    let combined = "";
    if (pyResult.code !== 0) {
      combined += `--- Python (strict) ---\n${pyResult.stdout || pyResult.stderr}\n\n`;
    }
    if (tsResult.code !== 0) {
      combined += `--- TypeScript (full) ---\n${tsResult.stdout || tsResult.stderr}\n\n`;
    }

    // Circuit breaker — allow completion after MAX_ATTEMPTS
    if (isCircuitBroken()) {
      resetStopAttempts();
      return;
    }

    const remaining = getMaxAttempts() - getStopAttempts();
    pi.sendUserMessage(
      `Pre-completion lint check FAILED (attempt ${attempt}/${getMaxAttempts()}).\n\n${combined}Fix these issues before completing. ${remaining} attempt(s) remaining.`,
      { deliverAs: "followUp" },
    );
  });
}
