import { describe, expect, test } from "bun:test";
import { routeReviewAIRequest } from "./agentTerminalRouting";

describe("routeReviewAIRequest", () => {
  test("sends the prepared prompt to a ready agent terminal", () => {
    const terminalMessages: string[] = [];
    const providerRequests: string[] = [];

    const outcome = routeReviewAIRequest({
      terminalReady: true,
      terminalPrompt: "review prompt",
      sendToTerminal: (message) => {
        terminalMessages.push(message);
        return true;
      },
      aiAvailable: true,
      providerRequest: "provider request",
      sendToProvider: (request) => providerRequests.push(request),
    });

    expect(outcome).toBe("terminal");
    expect(terminalMessages).toEqual(["review prompt"]);
    expect(providerRequests).toEqual([]);
  });

  test("falls back to the provider when a ready terminal rejects the send", () => {
    const providerRequests: string[] = [];

    const outcome = routeReviewAIRequest({
      terminalReady: true,
      terminalPrompt: "review prompt",
      sendToTerminal: () => false,
      aiAvailable: true,
      providerRequest: "provider request",
      sendToProvider: (request) => providerRequests.push(request),
    });

    expect(outcome).toBe("provider-fallback");
    expect(providerRequests).toEqual(["provider request"]);
  });

  test("reports terminal unavailability when no provider can accept a failed send", () => {
    const outcome = routeReviewAIRequest({
      terminalReady: true,
      terminalPrompt: "review prompt",
      sendToTerminal: () => false,
      aiAvailable: false,
      providerRequest: "provider request",
      sendToProvider: () => {
        throw new Error("provider should not be called");
      },
    });

    expect(outcome).toBe("terminal-unavailable");
  });

  test("reports Ask AI unavailable when neither destination is ready", () => {
    const outcome = routeReviewAIRequest({
      terminalReady: false,
      terminalPrompt: "review prompt",
      sendToTerminal: () => {
        throw new Error("terminal should not be called");
      },
      aiAvailable: false,
      providerRequest: "provider request",
      sendToProvider: () => {
        throw new Error("provider should not be called");
      },
    });

    expect(outcome).toBe("unavailable");
  });
});
