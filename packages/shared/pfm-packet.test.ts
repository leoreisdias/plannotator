import { describe, expect, test } from "bun:test";
import { detectPfmPacket } from "./pfm-packet";

describe("detectPfmPacket", () => {
	test("detects visual plan packets from simple frontmatter", () => {
		const packet = detectPfmPacket(`---
pfm: visual-plan
title: Checkout plan
---

# Checkout Plan
`);

		expect(packet).toEqual({
			kind: "visual-plan",
			visual: true,
			detectedBy: "frontmatter",
		});
	});

	test("detects visual plan packets from Plannotator visual block syntax", () => {
		const packet = detectPfmPacket(`# Checkout Plan

:::file-map
- src/app.ts
:::
`);

		expect(packet).toEqual({
			kind: "visual-plan",
			visual: true,
			detectedBy: "visual-block",
		});
	});

	test("leaves ordinary markdown unclassified", () => {
		expect(detectPfmPacket("# Plain doc\n\nJust markdown.\n")).toBeNull();
	});
});
