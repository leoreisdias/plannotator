---
name: plannotator-visual-plan
disable-model-invocation: true
description: Author a Plannotator Flavored Markdown visual plan packet and open it in annotate gate.
---

# Plannotator Visual Plan

Create a visual plan packet in Plannotator Flavored Markdown (PFM), then open it through annotate gate for approval or requested changes.

## Build The Packet

1. Inspect the codebase or source material enough to name real files, commands, risks, and decisions.
2. Write a readable markdown packet with `plannotator-visual-plan` frontmatter and Plannotator visual directives.
3. Keep the packet standalone: a reviewer who did not read the chat should understand the scope, planned changes, risks, and verification.
4. Include the visual blocks that help the plan scan faster. Read `references/visual-blocks.md` before authoring the first packet in a run.
5. Save the packet as `plan.md` inside a task-specific folder when there are supporting fragments, or as a single `.md` file for small plans.

Use this frontmatter:

```markdown
---
plannotator: visual-plan
title: Human-readable plan title
---
```

## Open The Gate

Run Plannotator yourself and wait for the browser session to finish:

```bash
plannotator annotate --gate <file-or-folder>
```

If approved, continue with the approved plan. If feedback or annotations return, revise the source packet and rerun the same command. If the session is closed without feedback, report that the gate was closed and do not treat it as approval.

## Constraints

- Use PFM source, not MDX.
- Do not claim Agent-Native compatibility.
- Do not use React imports, MDX components, or runtime component execution.
- Use only Plannotator's documented visual directives for custom blocks.
- Keep arbitrary HTML out of the packet unless a supported directive explicitly calls for visual markup.

## Example

See `examples/visual-plan-packet.md` for a compact packet that exercises the visual plan path.
