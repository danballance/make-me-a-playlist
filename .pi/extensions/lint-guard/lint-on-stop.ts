import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import {
  getScriptPath,
  incrementStopAttempts,
  resetStopAttempts,
  isCircuitBroken,
  getStopAttempts,
  getMaxAttempts,
  isHarnessActive,
} from "./utils.js";

interface LintResult {
  code: number;
  stdout?: string;
  stderr?: string;
}

function buildCombinedLintOutput(
  pyResult: LintResult,
  tsResult: LintResult,
): string {
  let combined = "";

  if (pyResult.code !== 0) {
    combined += `--- Python (strict) ---\n${pyResult.stdout || pyResult.stderr}\n\n`;
  }
  if (tsResult.code !== 0) {
    combined += `--- TypeScript (full) ---\n${tsResult.stdout || tsResult.stderr}\n\n`;
  }

  return combined;
}

function buildCircuitBreakerMessage(
  attempt: number,
  maxAttempts: number,
  combined: string,
): string {
  return (
    `Pre-completion lint check FAILED (attempt ${attempt}/${maxAttempts}).\n\n`
    + "Lint guard reached its retry limit and is aborting this run so the benchmark can fail cleanly instead of hanging.\n\n"
    + combined
  );
}

export function registerLintOnStop(pi: ExtensionAPI, projectRoot: string): void {
  pi.on("agent_end", async (_event, ctx) => {
    if (isHarnessActive(ctx.sessionManager)) {
      resetStopAttempts();
      return;
    }

    const attempt = incrementStopAttempts();
    const maxAttempts = getMaxAttempts();

    if (ctx.hasUI) {
      ctx.ui.setStatus("lint-guard", `Stop lint attempt ${attempt}/${maxAttempts} (python)`);
    }

    const pyResult = await pi.exec(
      "bash",
      [getScriptPath("lint-py.sh"), "strict", "./backend"],
      { cwd: projectRoot },
    );

    if (ctx.hasUI) {
      ctx.ui.setStatus("lint-guard", `Stop lint attempt ${attempt}/${maxAttempts} (typescript)`);
    }

    const tsResult = await pi.exec(
      "bash",
      [getScriptPath("lint-ts.sh"), "full", "./ui"],
      { cwd: projectRoot },
    );

    if (pyResult.code === 0 && tsResult.code === 0) {
      resetStopAttempts();
      if (ctx.hasUI) ctx.ui.setStatus("lint-guard", "Stop lint passed");
      return;
    }

    const combined = buildCombinedLintOutput(pyResult, tsResult);

    if (isCircuitBroken()) {
      const message = buildCircuitBreakerMessage(attempt, maxAttempts, combined);
      resetStopAttempts();

      if (ctx.hasUI) {
        ctx.ui.setStatus("lint-guard", "Stop lint circuit breaker opened; shutting down");
        ctx.ui.notify(message, "error");
      }

      await pi.sendMessage(
        {
          customType: "lint-guard",
          content: message,
          display: true,
          details: {
            attempt,
            maxAttempts,
            combined,
            action: "shutdown",
          },
        },
        { deliverAs: "steer" },
      );

      ctx.shutdown();
      return;
    }

    if (ctx.hasUI) ctx.ui.setStatus("lint-guard", "Stop lint failed; requesting fixes");
    const remaining = maxAttempts - getStopAttempts();
    await pi.sendUserMessage(
      `Pre-completion lint check FAILED (attempt ${attempt}/${maxAttempts}).\n\n${combined}Fix these issues before completing. ${remaining} attempt(s) remaining.`,
      { deliverAs: "followUp" },
    );
  });
}
