# 3. Add the Agent Terminal to code review

Date: 2026-08-06

## Status

Accepted

## Context

Code review already gives an agent the current diff, file, line selection, and pull-request context through Ask AI. Users who open an explicit Agent Terminal should be able to continue that same review conversation with a local coding agent without switching surfaces.

ADR 0002 intentionally limited the first Agent Terminal release to Annotate mode. Its PTY, WebSocket, runtime, remote-access, and lifecycle constraints remain valid. This decision supersedes only its product-scope restriction for code review.

## Decision

The optional WebTUI-powered Agent Terminal is available in local Code Review sessions when the Review server reports terminal capability. Bun and Pi expose the same capability and tokenized WebSocket contract.

The terminal launches lazily in the Review server's resolved workspace directory. Opening Review or its terminal panel does not start an agent; the user explicitly chooses and starts one built-in WebTUI agent. The existing one-session limit, managed Node runtime, Bun sidecar isolation, shutdown cleanup, remote-mode default-off behavior, and graceful capability failure are preserved.

While the terminal reports ready, Code Review Ask AI actions route to it instead of the configured provider. The message includes the current review context and, when present, the active diff type, base, file, line range, diff side, selected code, pull-request description selection, or comment selection. Existing annotation and approval flows are unchanged.

If a ready terminal rejects a send, Review clears terminal readiness and falls back to the configured Ask AI provider when one is available. If no provider is available, Review reports that the terminal is not ready and does not discard the request silently. Normal Ask AI provider routing resumes whenever the terminal is not ready.

The terminal panel replaces the left file-tree area while open and is resizable and collapsible. The initial implementation is desktop-only: both the panel and its control are hidden below the `lg` breakpoint. A mobile terminal requires a separately designed sheet or equivalent responsive surface.

Shared Agent Terminal components, settings helpers, and theme APIs use mode-neutral names. Existing persisted keys remain unchanged when renaming them would unnecessarily reset user preferences.

## Consequences

Review now has an explicit local-agent path in addition to provider-backed Ask AI and background review jobs. The ready terminal becomes the visible Ask AI destination, so provider history and permission surfaces are hidden until normal provider routing resumes.

Review owns additional regression coverage for prompt construction and terminal-versus-provider routing. Server changes must preserve Bun/Pi parity. The terminal remains separate from automatic review jobs, arbitrary command entry, multiple concurrent agents, and mobile support.

The scope exclusions in ADR 0002 continue to apply to plan review, archive, goal setup, and `annotate-last`.
