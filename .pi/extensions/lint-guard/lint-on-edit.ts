import type {
  ExtensionAPI,
  ToolResultEvent,
  ToolResultEventResult,
} from "@mariozechner/pi-coding-agent";
import { routeLinter, resetStopAttempts } from "./utils.js";

export function registerLintOnEdit(pi: ExtensionAPI, projectRoot: string): void {
  pi.on("tool_result", async (event: ToolResultEvent): Promise<ToolResultEventResult | void> => {
    if (event.toolName !== "edit" && event.toolName !== "write") return;

    // Reset circuit breaker — active editing means next stop gets fresh attempts
    resetStopAttempts();

    const filePath = (event.input as Record<string, unknown>).path as string | undefined;
    if (!filePath) return;

    const route = routeLinter(filePath);
    if (!route) return;

    const result = await pi.exec("bash", [route.script, route.tier, route.dir], {
      cwd: projectRoot,
    });

    if (result.code !== 0) {
      const lintOutput = result.stdout || result.stderr;
      return {
        content: [
          ...event.content,
          {
            type: "text" as const,
            text: `\nLint check (${route.tier}) failed:\n${lintOutput}\n\nFix these issues before continuing.`,
          },
        ],
        isError: true,
      };
    }
  });
}
