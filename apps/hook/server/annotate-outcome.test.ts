import { describe, expect, test } from "bun:test";
import { APPROVED_PLAINTEXT_MARKER, formatAnnotateOutcome } from "./annotate-outcome";

describe("formatAnnotateOutcome", () => {
  test("preserves plaintext gate output", () => {
    expect(formatAnnotateOutcome({ feedback: "", approved: true }, "plaintext")).toBe(APPROVED_PLAINTEXT_MARKER);
    expect(formatAnnotateOutcome({ feedback: "", exit: true }, "plaintext")).toBeNull();
    expect(formatAnnotateOutcome({ feedback: "Revise this." }, "plaintext")).toBe("Revise this.");
  });

  test("preserves structured JSON gate output", () => {
    expect(formatAnnotateOutcome({ feedback: "", approved: true }, "json")).toBe(JSON.stringify({ decision: "approved" }));
    expect(formatAnnotateOutcome({ feedback: "", exit: true }, "json")).toBe(JSON.stringify({ decision: "dismissed" }));
    expect(formatAnnotateOutcome({
      feedback: "Revise this.",
      selectedMessageId: "message-1",
      feedbackScope: "message",
    }, "json")).toBe(JSON.stringify({
      decision: "annotated",
      feedback: "Revise this.",
      selectedMessageId: "message-1",
      feedbackScope: "message",
    }));
  });

  test("preserves hook-native blocking output", () => {
    expect(formatAnnotateOutcome({ feedback: "", approved: true }, "hook")).toBeNull();
    expect(formatAnnotateOutcome({ feedback: "", exit: true }, "hook")).toBeNull();
    expect(formatAnnotateOutcome({ feedback: "Revise this." }, "hook")).toBe(JSON.stringify({
      decision: "block",
      reason: "Revise this.",
    }));
  });
});
