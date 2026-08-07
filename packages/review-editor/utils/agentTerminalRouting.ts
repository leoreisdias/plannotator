export type ReviewAIRoute = "terminal" | "provider" | "provider-fallback" | "terminal-unavailable" | "unavailable";

export function routeReviewAIRequest<T>(options: {
  terminalReady: boolean;
  terminalPrompt: string;
  sendToTerminal: (message: string) => boolean;
  aiAvailable: boolean;
  providerRequest: T;
  sendToProvider: (request: T) => void;
}): ReviewAIRoute {
  if (options.terminalReady) {
    if (options.sendToTerminal(options.terminalPrompt)) return "terminal";
    if (!options.aiAvailable) return "terminal-unavailable";
    options.sendToProvider(options.providerRequest);
    return "provider-fallback";
  }
  if (!options.aiAvailable) return "unavailable";
  options.sendToProvider(options.providerRequest);
  return "provider";
}
