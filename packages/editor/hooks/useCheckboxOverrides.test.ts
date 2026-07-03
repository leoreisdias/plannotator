import { describe, expect, test } from "bun:test";
import type { Annotation, Block } from "@plannotator/ui/types";
import {
	collectCheckboxOverrideIds,
	isCheckboxAnnotationForOverride,
	resolveCheckboxToggleTarget,
} from "./useCheckboxOverrides";

const blocks: Block[] = [
	{
		id: "heading-1",
		type: "heading",
		content: "Execution Checklist",
		level: 2,
		order: 1,
		startLine: 10,
	},
	{
		id: "block-checklist",
		type: "directive",
		directiveKind: "checklist",
		content: "- [x] Existing item\n- [ ] Visual checklist item",
		order: 2,
		startLine: 12,
	},
];

describe("useCheckboxOverrides visual checklist helpers", () => {
	test("collects synthetic override ids for visual checklist items", () => {
		const ids = collectCheckboxOverrideIds(blocks);

		expect(ids.has("block-checklist:checklist:0")).toBe(true);
		expect(ids.has("block-checklist:checklist:1")).toBe(true);
	});

	test("resolves a visual checklist item to the parent block and item text", () => {
		const target = resolveCheckboxToggleTarget(blocks, "block-checklist:checklist:1");

		expect(target).not.toBeNull();
		expect(target?.overrideId).toBe("block-checklist:checklist:1");
		expect(target?.annotationBlockId).toBe("block-checklist");
		expect(target?.originalChecked).toBe(false);
		expect(target?.content).toBe("Visual checklist item");
		expect(target?.startLine).toBe(13);
	});

	test("matches checkbox annotations by stored override id", () => {
		const annotation = {
			id: "ann-checkbox-block-checklist:checklist:1-123",
			blockId: "block-checklist",
			checkboxOverrideId: "block-checklist:checklist:1",
		} as Annotation;

		expect(isCheckboxAnnotationForOverride(annotation, "block-checklist:checklist:1")).toBe(true);
		expect(isCheckboxAnnotationForOverride(annotation, "block-checklist:checklist:0")).toBe(false);
	});
});

