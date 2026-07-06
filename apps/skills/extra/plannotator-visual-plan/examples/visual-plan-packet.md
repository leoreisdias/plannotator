---
plannotator: visual-plan
title: Annotate Gate Visual Plan Fixture
---

# Annotate Gate Visual Plan Fixture

This packet describes a small Plannotator-native plan for exercising visual plan rendering through annotate gate.

::callout
**Public Surface**

Use `plannotator annotate --gate <file-or-folder>` for external visual plans. Do not add a new `plannotator plan` command in this slice.
::

## Scope

- Detect a visual plan packet from frontmatter.
- Render supported PFM directives as native Plannotator blocks.
- Preserve approve, feedback, close, folder browsing, and source-save behavior from annotate mode.

::file-map
- [M] packages/shared/pfm-packet.ts - Detects visual plan packet metadata.
- [M] packages/ui/components/blocks/VisualDirectiveBlock.tsx - Renders native visual blocks.
- [A] apps/skills/extra/plannotator-visual-plan/SKILL.md - Teaches agents how to author the packet.
::

## Flow

::diagram mermaid
flowchart LR
  Skill["plannotator-visual-plan skill"] --> Packet["PFM plan packet"]
  Packet --> Gate["plannotator annotate --gate"]
  Gate --> Review["Reviewer annotations"]
  Review --> Agent["Agent revises or proceeds"]
::

::checklist
- [ ] Write the visual packet skill.
- [ ] Add a packet fixture.
- [ ] Validate packet detection and skill instructions.
- [ ] Run focused install and skill tests.
::

::open-questions
- Should visual review reuse the same directive vocabulary later? Recommended: yes, with review-specific blocks added through the same constrained contract.
- Should user-authored custom PFM execute arbitrary components? Recommended: no, use a future extension registry with schemas and renderer adapters.
::

::code-walkthrough
- `packages/shared/pfm-packet.ts` is the shared packet detection contract.
- `packages/server/annotate.ts` preserves gate semantics for visual packets.
- `apps/pi-extension/server/serverAnnotate.ts` mirrors visual packet metadata for Pi.
::

::annotated-diff
```diff
+ plannotator: visual-plan
+ title: Annotate Gate Visual Plan Fixture
- rawHtml: true
```
::
