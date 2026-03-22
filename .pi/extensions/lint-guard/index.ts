import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { registerLintOnEdit } from "./lint-on-edit.js";
import { registerLintOnStop } from "./lint-on-stop.js";

export default function (pi: ExtensionAPI) {
  const projectRoot = process.cwd();

  registerLintOnEdit(pi, projectRoot);
  registerLintOnStop(pi, projectRoot);
}
