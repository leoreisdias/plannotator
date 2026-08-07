import { describe, expect, test } from "bun:test";
import type { AgentTerminalAgent } from "@plannotator/core/agent-terminal";
import { resolveAgentTerminalAgentId } from "./agentTerminal";

const agents: AgentTerminalAgent[] = [
  { id: "claude", name: "Claude", available: true },
  { id: "opencode", name: "OpenCode", available: false },
  { id: "codex", name: "Codex", available: true },
];

describe("resolveAgentTerminalAgentId", () => {
  test("keeps a saved available agent", () => {
    expect(resolveAgentTerminalAgentId(agents, "codex")).toBe("codex");
  });

  test("skips a saved unavailable agent", () => {
    expect(resolveAgentTerminalAgentId(agents, "opencode")).toBe("claude");
  });

  test("returns empty when no agents are available", () => {
    expect(
      resolveAgentTerminalAgentId(
        agents.map((agent) => ({ ...agent, available: false })),
        "claude",
      ),
    ).toBe("");
  });
});
