// Slash-command templates match this approval marker literally.
export const APPROVED_PLAINTEXT_MARKER = "The user approved.";

export type AnnotateOutcomeFormat = "hook" | "json" | "plaintext";

export type AnnotateOutcome = {
  feedback: string;
  exit?: boolean;
  approved?: boolean;
  selectedMessageId?: string;
  feedbackScope?: "message" | "messages";
};

export function formatAnnotateOutcome(
  result: AnnotateOutcome,
  format: AnnotateOutcomeFormat,
): string | null {
  if (format === "hook") {
    if (result.approved || result.exit) return null;
    if (result.feedback) {
      return JSON.stringify({ decision: "block", reason: result.feedback });
    }
    return null;
  }

  if (format === "json") {
    if (result.approved) {
      return JSON.stringify({ decision: "approved" });
    }
    if (result.exit) {
      return JSON.stringify({ decision: "dismissed" });
    }
    return JSON.stringify({
      decision: "annotated",
      feedback: result.feedback || "",
      ...(result.selectedMessageId && { selectedMessageId: result.selectedMessageId }),
      ...(result.feedbackScope && { feedbackScope: result.feedbackScope }),
    });
  }

  if (result.exit) return null;
  if (result.approved) return APPROVED_PLAINTEXT_MARKER;
  return result.feedback || null;
}
