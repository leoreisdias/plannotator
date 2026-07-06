# Visual Blocks

Visual plan packets are ordinary markdown plus directive blocks. Unknown directives degrade as document content, so choose a supported block when you want Plannotator-native rendering.

## callout

Use for decisions, assumptions, warnings, scope notes, and local-only context.

```markdown
::callout
**Decision**

Use annotate gate as the public approval surface.
::
```

## file-map

Use for the implementation footprint. Prefer paths that exist or are planned exact paths. Include status badges such as `A`, `M`, `D`, or `?` when useful.

```markdown
::file-map
- [A] apps/skills/extra/plannotator-visual-plan/SKILL.md - Skill recipe.
- [M] packages/shared/pfm-packet.ts - Existing packet detection contract.
::
```

## checklist

Use for execution steps or verification steps that the reviewer may comment on. Checklist toggles create Plannotator annotations in annotate mode.

```markdown
::checklist
- [ ] Add packet fixture.
- [ ] Run focused tests.
::
```

## diagram

Use Mermaid or Graphviz for flows and architecture. Put the language after the directive name.

```markdown
::diagram mermaid
flowchart LR
  Skill["visual-plan skill"] --> Packet["PFM packet"]
  Packet --> Gate["plannotator annotate --gate"]
::
```

## open-questions

Use for unresolved decisions. Give each question enough context and a recommended default when possible.

```markdown
::open-questions
- Should the first cut include folder-level summary rendering? Recommended: no, preserve annotate folder browsing.
::
```

## annotated-diff

Use for small before/after snippets where the plan hinges on a concrete code change. Keep hunks short and explanatory.

````markdown
::annotated-diff
```diff
+ plannotator: visual-plan
- rawHtml: true
```
::
````

## code-walkthrough

Use for important files, functions, or data contracts that need review context.

```markdown
::code-walkthrough
- `packages/shared/pfm-packet.ts` decides whether a markdown document is a visual packet.
- `packages/ui/components/BlockRenderer.tsx` routes visual directives to native renderers.
::
```

## Source Rules

- Keep prose useful without the renderer; visual blocks should enhance, not replace, the plan.
- Prefer lists, fenced code, and simple directive attributes over custom syntax.
- Keep examples truthful to the current repository.
- Do not embed MDX imports, React component names, or Agent-Native block names as executable syntax.
