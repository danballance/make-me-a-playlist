import { beforeEach, describe, expect, it, vi } from "vitest";
import { registerLintOnStop } from "../lint-on-stop.js";
import {
  getMaxAttempts,
  getStopAttempts,
  incrementStopAttempts,
  resetStopAttempts,
} from "../utils.js";

function createPiMock() {
  let agentEndHandler:
    | ((event: object, ctx: Record<string, unknown>) => Promise<void>)
    | undefined;

  const pi = {
    on: vi.fn((event: string, handler: (event: object, ctx: Record<string, unknown>) => Promise<void>) => {
      if (event === "agent_end") {
        agentEndHandler = handler;
      }
    }),
    exec: vi.fn(),
    sendMessage: vi.fn(),
    sendUserMessage: vi.fn(),
  };

  return {
    pi,
    getAgentEndHandler() {
      if (!agentEndHandler) {
        throw new Error("agent_end handler was not registered");
      }
      return agentEndHandler;
    },
  };
}

function createSessionManager(entries: object[] = []) {
  return {
    getEntries: vi.fn(() => entries),
  };
}

function createHarnessEntry(active: boolean) {
  return {
    type: "custom",
    customType: "pi-harness-state",
    data: {
      active,
      currentPhase: active ? "implementation" : "documentation",
      completed: active ? ["planning", "test-creation"] : ["planning", "test-creation", "implementation", "documentation"],
    },
  };
}

function createContextMock(entries: object[] = []) {
  return {
    hasUI: true,
    ui: {
      setStatus: vi.fn(),
      notify: vi.fn(),
    },
    sessionManager: createSessionManager(entries),
    shutdown: vi.fn(),
  };
}

describe("registerLintOnStop", () => {
  beforeEach(() => {
    resetStopAttempts();
  });

  it("skips stop lint while the harness is still active", async () => {
    const { pi, getAgentEndHandler } = createPiMock();
    const ctx = createContextMock([createHarnessEntry(true)]);

    incrementStopAttempts();

    registerLintOnStop(pi as never, "/workspace");
    const handler = getAgentEndHandler();

    await handler({}, ctx as never);

    expect(pi.exec).not.toHaveBeenCalled();
    expect(pi.sendUserMessage).not.toHaveBeenCalled();
    expect(pi.sendMessage).not.toHaveBeenCalled();
    expect(getStopAttempts()).toBe(0);
  });

  it("requests fixes before the circuit breaker opens for non-harness runs", async () => {
    const { pi, getAgentEndHandler } = createPiMock();
    const ctx = createContextMock();

    pi.exec
      .mockResolvedValueOnce({ code: 1, stdout: "python lint failed" })
      .mockResolvedValueOnce({ code: 0, stdout: "" });

    registerLintOnStop(pi as never, "/workspace");
    const handler = getAgentEndHandler();

    await handler({}, ctx as never);

    expect(pi.sendUserMessage).toHaveBeenCalledTimes(1);
    expect(pi.sendUserMessage).toHaveBeenCalledWith(
      expect.stringContaining(`Pre-completion lint check FAILED (attempt 1/${getMaxAttempts()}).`),
      { deliverAs: "followUp" },
    );
    expect(pi.sendMessage).not.toHaveBeenCalled();
    expect(ctx.shutdown).not.toHaveBeenCalled();
  });

  it("requests fixes after the harness has completed", async () => {
    const { pi, getAgentEndHandler } = createPiMock();
    const ctx = createContextMock([createHarnessEntry(false)]);

    pi.exec
      .mockResolvedValueOnce({ code: 0, stdout: "" })
      .mockResolvedValueOnce({ code: 1, stdout: "typescript lint failed" });

    registerLintOnStop(pi as never, "/workspace");
    const handler = getAgentEndHandler();

    await handler({}, ctx as never);

    expect(pi.exec).toHaveBeenCalledTimes(2);
    expect(pi.sendUserMessage).toHaveBeenCalledTimes(1);
    expect(pi.sendUserMessage).toHaveBeenCalledWith(
      expect.stringContaining("typescript lint failed"),
      { deliverAs: "followUp" },
    );
  });

  it("shuts down cleanly when the circuit breaker opens", async () => {
    const { pi, getAgentEndHandler } = createPiMock();
    const ctx = createContextMock();
    const maxAttempts = getMaxAttempts();

    pi.exec.mockResolvedValue({ code: 1, stdout: "lint failed", stderr: "" });

    registerLintOnStop(pi as never, "/workspace");
    const handler = getAgentEndHandler();

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      await handler({}, ctx as never);
    }

    expect(pi.sendUserMessage).toHaveBeenCalledTimes(maxAttempts - 1);
    expect(pi.sendMessage).toHaveBeenCalledTimes(1);
    expect(pi.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        customType: "lint-guard",
        display: true,
        content: expect.stringContaining(`attempt ${maxAttempts}/${maxAttempts}`),
      }),
      { deliverAs: "steer" },
    );
    expect(ctx.ui.setStatus).toHaveBeenCalledWith(
      "lint-guard",
      "Stop lint circuit breaker opened; shutting down",
    );
    expect(ctx.ui.notify).toHaveBeenCalledWith(
      expect.stringContaining("retry limit"),
      "error",
    );
    expect(ctx.shutdown).toHaveBeenCalledTimes(1);
    expect(getStopAttempts()).toBe(0);
  });
});
