import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { detectPfmPacket } from "../../../../packages/shared/pfm-packet";
import { parseMarkdownToBlocks } from "../../../../packages/ui/utils/parser";

const skillDir = import.meta.dir;
const skill = readFileSync(join(skillDir, "SKILL.md"), "utf-8");
const visualBlocks = readFileSync(join(skillDir, "references", "visual-blocks.md"), "utf-8");
const examplePacket = readFileSync(join(skillDir, "examples", "visual-plan-packet.md"), "utf-8");

describe("plannotator-visual-plan skill", () => {
  test("routes visual plans through annotate gate", () => {
    expect(skill).toContain("plannotator annotate --gate <file-or-folder>");
    expect(skill).toContain("Run Plannotator yourself and wait for the browser session to finish");
    expect(skill).toContain("If approved, continue with the approved plan");
    expect(skill).toContain("If feedback or annotations return, revise the source packet");
  });

  test("documents constrained PFM instead of MDX or runtime components", () => {
    expect(skill).toContain("Use PFM source, not MDX");
    expect(skill).toContain("Do not claim Agent-Native compatibility");
    expect(skill).toContain("Do not use React imports, MDX components, or runtime component execution");
    expect(skill).toContain("plannotator: visual-plan");
  });

  test("lists the supported visual block vocabulary", () => {
    for (const directive of [
      "callout",
      "file-map",
      "checklist",
      "diagram",
      "open-questions",
      "annotated-diff",
      "code-walkthrough",
    ]) {
      expect(visualBlocks).toContain(`## ${directive}`);
      expect(examplePacket).toContain(`::${directive}`);
    }
  });

  test("example packet parses every visual directive as a directive block", () => {
    const directiveKinds = parseMarkdownToBlocks(examplePacket)
      .filter((block) => block.type === "directive")
      .map((block) => block.directiveKind);

    expect(directiveKinds).toEqual([
      "callout",
      "file-map",
      "diagram",
      "checklist",
      "open-questions",
      "code-walkthrough",
      "annotated-diff",
    ]);
  });

  test("example packet is detected as a visual plan packet", () => {
    expect(detectPfmPacket(examplePacket)).toEqual({
      kind: "visual-plan",
      visual: true,
      detectedBy: "frontmatter",
    });
  });
});
