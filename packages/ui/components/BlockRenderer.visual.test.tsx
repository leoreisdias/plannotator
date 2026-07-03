import { describe, expect, test } from "bun:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BlockRenderer } from "./BlockRenderer";
import { parseMarkdownToBlocks } from "../utils/parser";
import type { Block } from "../types";

function renderDirective(kind: string, body: string): string {
	const block: Block = {
		id: `block-${kind}`,
		type: "directive",
		directiveKind: kind,
		content: body,
		order: 1,
		startLine: 1,
	};
	return renderToStaticMarkup(<BlockRenderer block={block} />);
}

function renderDirectiveWithOptions(
	kind: string,
	body: string,
	options: {
		onToggleCheckbox?: (blockId: string, checked: boolean) => void;
		checkboxOverrides?: Map<string, boolean>;
	} = {},
): string {
	const block: Block = {
		id: `block-${kind}`,
		type: "directive",
		directiveKind: kind,
		content: body,
		order: 1,
		startLine: 1,
	};
	return renderToStaticMarkup(<BlockRenderer block={block} {...options} />);
}

describe("BlockRenderer visual PFM directives", () => {
	test("renders every visual block vocabulary item as a native visual block", () => {
		const samples: Record<string, string> = {
			callout: "Decision: keep annotate gate.",
			"file-map": "- [A] packages/shared/pfm-packet.ts - packet detection",
			checklist: "- [x] Detection\n- [ ] Rendering",
			"open-questions": "- Should visual review reuse this renderer?",
			diagram: "graph TD\n  A[Plan] --> B[Annotate]",
			"annotated-diff": "+ Added detector\n- Removed broad fallback",
			"code-walkthrough": "- packages/server/annotate.ts:322 wires metadata",
		};

		for (const [kind, body] of Object.entries(samples)) {
			const html = renderDirective(kind, body);
			expect(html).toContain(`data-visual-block="${kind}"`);
		}
	});

	test("renders file maps with file rows and status badges", () => {
		const html = renderDirective(
			"file-map",
			"- [A] packages/shared/pfm-packet.ts - Detect visual packets\n- [M] packages/server/annotate.ts - Return metadata",
		);

		expect(html).toContain("data-visual-file-map");
		expect(html).toContain("packages/shared/pfm-packet.ts");
		expect(html).toContain("Detect visual packets");
		expect(html).toContain("A");
		expect(html).toContain("M");
	});

	test("renders visual checklists as toggleable checkbox rows", () => {
		const overrides = new Map([["block-checklist:checklist:1", true]]);
		const html = renderDirectiveWithOptions(
			"checklist",
			"- [x] Detection\n- [ ] Rendering",
			{ onToggleCheckbox: () => {}, checkboxOverrides: overrides },
		);

		expect(html).toContain('role="checkbox"');
		expect(html).toContain('aria-checked="true"');
		expect(html).toContain("<button");
		expect(html).toContain("Rendering");
	});

	test("renders annotated diff lines with light-mode contrast classes", () => {
		const html = renderDirective(
			"annotated-diff",
			"+ Added detector\n- Removed broad fallback\n@@ context",
		);

		expect(html).toContain("text-emerald-300");
		expect(html).toContain("[.light_&amp;]:text-emerald-800");
		expect(html).toContain("text-red-300");
		expect(html).toContain("[.light_&amp;]:text-red-800");
		expect(html).toContain("text-sky-300");
		expect(html).toContain("[.light_&amp;]:text-sky-800");
	});

	test("keeps unknown directives on the existing generic callout path", () => {
		const html = renderDirective("unknown-widget", "Body");

		expect(html).not.toContain("data-visual-block");
		expect(html).toContain('data-block-type="directive"');
		expect(html).toContain('data-directive-kind="unknown-widget"');
	});
});

describe("parseMarkdownToBlocks visual PFM directives", () => {
	test("parses the visual block vocabulary as constrained directive blocks", () => {
		for (const kind of ["callout", "file-map", "checklist", "open-questions", "diagram", "annotated-diff", "code-walkthrough"]) {
			const blocks = parseMarkdownToBlocks(`:::${kind}\nbody\n:::`).filter((block) => block.type !== "paragraph");
			expect(blocks[0].type).toBe("directive");
			expect(blocks[0].directiveKind).toBe(kind);
			expect(blocks[0].content).toBe("body");
		}
	});

	test("does not parse MDX component syntax as a visual block", () => {
		const blocks = parseMarkdownToBlocks("<FileTree files={[]} />");

		expect(blocks).toHaveLength(1);
		expect(blocks[0].type).toBe("paragraph");
		expect(blocks[0].content).toBe("<FileTree files={[]} />");
	});
});
