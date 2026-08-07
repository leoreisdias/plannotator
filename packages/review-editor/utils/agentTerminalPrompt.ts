export type ReviewAgentTerminalScope = {
  label?: string;
  text?: string;
  filePath?: string;
  lineStart?: number;
  lineEnd?: number;
  side?: "old" | "new";
  selectedCode?: string;
};

export function buildReviewAgentTerminalPrompt(options: {
  question: string;
  reviewContext?: string;
  diffType?: string;
  base?: string | null;
  scope?: ReviewAgentTerminalScope;
}): string {
  const { scope } = options;
  const view = [
    options.diffType ? `Diff view: ${options.diffType}` : "",
    options.base ? `Base: ${options.base}` : "",
  ].filter(Boolean).join("\n");
  const location = scope?.filePath
    ? [
        `File: ${scope.filePath}`,
        scope.lineStart != null
          ? `Lines: ${scope.lineStart}${scope.lineEnd != null && scope.lineEnd !== scope.lineStart ? `-${scope.lineEnd}` : ""}${scope.side ? ` (${scope.side} side)` : ""}`
          : "",
      ].filter(Boolean).join("\n")
    : "";
  const selectedContext = scope?.selectedCode || scope?.text;
  const selectedContextFence = selectedContext?.includes("```") ? "````" : "```";

  return [
    "# Plannotator Review Ask",
    options.reviewContext || "Inspect the current workspace changes before answering.",
    view,
    location,
    scope?.label ? `Context: ${scope.label}` : "",
    selectedContext ? `Selected context:\n${selectedContextFence}\n${selectedContext}\n${selectedContextFence}` : "",
    `Question:\n${options.question}`,
  ].filter(Boolean).join("\n\n");
}
