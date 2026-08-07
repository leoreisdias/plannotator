import type { AgentTerminalAgent } from "@plannotator/core/agent-terminal";
import { storage } from "@plannotator/ui/utils/storage";

const DEFAULT_AGENT_KEY = "plannotator-annotate-agent-terminal-default";

export function getSavedAgentTerminalAgentId(): string | null {
  return storage.getItem(DEFAULT_AGENT_KEY);
}

export function saveAgentTerminalAgentId(agentId: string): void {
  storage.setItem(DEFAULT_AGENT_KEY, agentId);
}

export function resolveAgentTerminalAgentId(
  agents: AgentTerminalAgent[],
  savedAgentId: string | null,
): string {
  const availableAgents = agents.filter((agent) => agent.available);
  if (savedAgentId && availableAgents.some((agent) => agent.id === savedAgentId)) {
    return savedAgentId;
  }
  return availableAgents[0]?.id ?? "";
}

export function resolveAgentTerminalWebSocketUrl(path: string): string {
  const url = new URL(path, window.location.href);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}
