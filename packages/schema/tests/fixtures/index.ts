import type { BaseEntry } from "../../src/common.js";

export const BASE_FIXTURE: BaseEntry = {
  name: "tdd-workflow",
  displayName: "TDD Workflow",
  description: "Write tests first, enforce red-green-refactor discipline.",
  author: { name: "Sabahattin Kalkan", github: "sabahattink" },
  tags: ["testing", "tdd"],
  category: "testing",
  version: "1.2.0",
  license: "MIT",
  verified: false,
  createdAt: "2026-04-18T12:00:00.000Z",
  updatedAt: "2026-04-18T12:00:00.000Z",
  sourceCommit: "a".repeat(40),
  sha256: "b".repeat(64),
};

export function base(overrides: Partial<BaseEntry> = {}): BaseEntry {
  return { ...BASE_FIXTURE, ...overrides };
}
