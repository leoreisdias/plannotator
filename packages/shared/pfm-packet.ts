export type PfmPacketKind = "visual-plan";

export type PfmPacketDetectionSource = "frontmatter" | "visual-block";

export interface PfmPacket {
	kind: PfmPacketKind;
	visual: true;
	detectedBy: PfmPacketDetectionSource;
}

const VISUAL_PLAN_VALUES = new Set([
	"visual-plan",
	"plannotator-visual-plan",
	"visual_plan",
]);

const FRONTMATTER_VISUAL_KEYS = new Set([
	"pfm",
	"plannotator",
	"plannotator-packet",
	"packet",
]);

const VISUAL_BLOCK_KINDS = new Set([
	"visual-plan",
	"file-map",
	"diagram",
	"annotated-diff",
	"code-walkthrough",
	"checklist",
	"open-questions",
]);

export function detectPfmPacket(markdown: string): PfmPacket | null {
	const frontmatter = extractSimpleFrontmatter(markdown);
	if (frontmatter && isVisualPlanFrontmatter(frontmatter)) {
		return { kind: "visual-plan", visual: true, detectedBy: "frontmatter" };
	}

	if (hasVisualPlanBlock(markdown)) {
		return { kind: "visual-plan", visual: true, detectedBy: "visual-block" };
	}

	return null;
}

function isVisualPlanFrontmatter(frontmatter: Record<string, string>): boolean {
	for (const [rawKey, rawValue] of Object.entries(frontmatter)) {
		const key = normalizeToken(rawKey);
		const value = normalizeToken(rawValue);
		if (FRONTMATTER_VISUAL_KEYS.has(key) && VISUAL_PLAN_VALUES.has(value)) {
			return true;
		}
		if (key === "visual" && value === "plan") {
			return true;
		}
	}
	return false;
}

function hasVisualPlanBlock(markdown: string): boolean {
	for (const line of markdown.split(/\r?\n/)) {
		const directive = line.trim().match(/^:::\s*([a-zA-Z][a-zA-Z0-9-]*)\b/);
		if (directive && VISUAL_BLOCK_KINDS.has(normalizeToken(directive[1]))) {
			return true;
		}
	}
	return false;
}

function extractSimpleFrontmatter(markdown: string): Record<string, string> | null {
	const trimmed = markdown.trimStart();
	if (!trimmed.startsWith("---")) return null;
	const endIndex = trimmed.indexOf("\n---", 3);
	if (endIndex === -1) return null;

	const frontmatterRaw = trimmed.slice(4, endIndex).trim();
	const entries: Record<string, string> = {};
	for (const line of frontmatterRaw.split(/\r?\n/)) {
		const trimmedLine = line.trim();
		if (!trimmedLine || trimmedLine.startsWith("#") || trimmedLine.startsWith("- ")) {
			continue;
		}
		const colonIndex = trimmedLine.indexOf(":");
		if (colonIndex <= 0) continue;
		const key = trimmedLine.slice(0, colonIndex).trim();
		const value = trimmedLine.slice(colonIndex + 1).trim();
		if (key && value) entries[key] = value;
	}
	return entries;
}

function normalizeToken(value: string): string {
	return value.trim().replace(/^['"]|['"]$/g, "").toLowerCase();
}
