import { describe, it, expect, beforeEach } from "vitest";
import {
  routeLinter,
  resetStopAttempts,
  incrementStopAttempts,
  isCircuitBroken,
  getStopAttempts,
  getMaxAttempts,
  isHarnessActive,
} from "../utils.js";

describe("routeLinter", () => {
  it("routes .py files to lint-py.sh with fast tier", () => {
    const route = routeLinter("/some/path/file.py");
    expect(route).not.toBeNull();
    expect(route!.script).toContain("lint-py.sh");
    expect(route!.tier).toBe("fast");
    expect(route!.dir).toBe("./backend");
  });

  it("routes .ts files to lint-ts.sh with fast tier", () => {
    const route = routeLinter("/some/path/file.ts");
    expect(route).not.toBeNull();
    expect(route!.script).toContain("lint-ts.sh");
    expect(route!.tier).toBe("fast");
    expect(route!.dir).toBe("./ui");
  });

  it("routes .tsx files to lint-ts.sh", () => {
    const route = routeLinter("/some/path/component.tsx");
    expect(route).not.toBeNull();
    expect(route!.script).toContain("lint-ts.sh");
  });

  it("routes .js files to lint-ts.sh", () => {
    const route = routeLinter("config.js");
    expect(route).not.toBeNull();
    expect(route!.script).toContain("lint-ts.sh");
  });

  it("routes .jsx files to lint-ts.sh", () => {
    const route = routeLinter("component.jsx");
    expect(route).not.toBeNull();
    expect(route!.script).toContain("lint-ts.sh");
  });

  it("returns null for non-lintable files", () => {
    expect(routeLinter("file.md")).toBeNull();
    expect(routeLinter("file.json")).toBeNull();
    expect(routeLinter("file.yaml")).toBeNull();
    expect(routeLinter("file.sh")).toBeNull();
    expect(routeLinter("Dockerfile")).toBeNull();
  });
});

describe("isHarnessActive", () => {
  it("returns true for the latest active harness state entry", () => {
    const sessionManager = {
      getEntries: () => [
        {
          type: "custom",
          customType: "pi-harness-state",
          data: { active: false },
        },
        {
          type: "custom",
          customType: "pi-harness-state",
          data: { active: true },
        },
      ],
    };

    expect(isHarnessActive(sessionManager)).toBe(true);
  });

  it("returns false when the latest harness state is inactive", () => {
    const sessionManager = {
      getEntries: () => [
        {
          type: "custom",
          customType: "pi-harness-state",
          data: { active: true },
        },
        {
          type: "custom",
          customType: "pi-harness-state",
          data: { active: false },
        },
      ],
    };

    expect(isHarnessActive(sessionManager)).toBe(false);
  });

  it("returns false when there is no harness state entry", () => {
    expect(isHarnessActive({ getEntries: () => [] })).toBe(false);
  });
});

describe("circuit breaker", () => {
  beforeEach(() => {
    resetStopAttempts();
  });

  it("starts at 0 attempts", () => {
    expect(getStopAttempts()).toBe(0);
    expect(isCircuitBroken()).toBe(false);
  });

  it("increments and returns new count", () => {
    expect(incrementStopAttempts()).toBe(1);
    expect(incrementStopAttempts()).toBe(2);
    expect(getStopAttempts()).toBe(2);
  });

  it("breaks at MAX_ATTEMPTS", () => {
    const max = getMaxAttempts();
    for (let i = 0; i < max; i++) {
      incrementStopAttempts();
    }
    expect(isCircuitBroken()).toBe(true);
  });

  it("does not break before MAX_ATTEMPTS", () => {
    const max = getMaxAttempts();
    for (let i = 0; i < max - 1; i++) {
      incrementStopAttempts();
    }
    expect(isCircuitBroken()).toBe(false);
  });

  it("resets to 0", () => {
    incrementStopAttempts();
    incrementStopAttempts();
    resetStopAttempts();
    expect(getStopAttempts()).toBe(0);
    expect(isCircuitBroken()).toBe(false);
  });
});
