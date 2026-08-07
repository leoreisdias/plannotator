import { describe, expect, test } from "bun:test";
import { buildReviewAgentTerminalPrompt } from "./agentTerminalPrompt";

describe("buildReviewAgentTerminalPrompt", () => {
  test("includes the active review and line selection without breaking nested fences", () => {
    const prompt = buildReviewAgentTerminalPrompt({
      question: "Is this safe?",
      reviewContext: "Review the uncommitted workspace diff.",
      diffType: "since-base",
      base: "main",
      scope: {
        filePath: "src/example.ts",
        lineStart: 12,
        lineEnd: 14,
        side: "new",
        selectedCode: "```ts\nconst value = 1;\n```",
      },
    });

    expect(prompt).toContain("Review the uncommitted workspace diff.");
    expect(prompt).toContain("Diff view: since-base\nBase: main");
    expect(prompt).toContain("File: src/example.ts\nLines: 12-14 (new side)");
    expect(prompt).toContain("Selected context:\n````\n```ts\nconst value = 1;\n```\n````");
    expect(prompt).toContain("Question:\nIs this safe?");
  });
});
