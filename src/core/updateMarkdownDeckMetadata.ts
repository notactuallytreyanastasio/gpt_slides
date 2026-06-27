import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

import type { DeckMetadata } from "./deck";

export type DeckMetadataPatch = Partial<DeckMetadata>;

const frontmatterDelimiter = "---";
const metadataOrder: readonly (keyof DeckMetadata)[] = [
  "title",
  "description",
  "theme",
  "aspectRatio",
  "transition",
  "author",
];

export function updateMarkdownDeckMetadataSource(
  markdown: string,
  patch: DeckMetadataPatch,
): string {
  const normalized = normalizeMarkdown(markdown);
  const { body, metadata } = extractFrontmatter(normalized);
  const nextMetadata = orderMetadata({
    ...metadata,
    ...withoutUndefined(patch),
  });
  const frontmatter = stringifyYaml(nextMetadata).trimEnd();

  return [
    frontmatterDelimiter,
    frontmatter,
    frontmatterDelimiter,
    body,
  ].join("\n");
}

function normalizeMarkdown(markdown: string): string {
  return markdown.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
}

function extractFrontmatter(markdown: string): {
  readonly body: string;
  readonly metadata: Record<string, unknown>;
} {
  const lines = markdown.split("\n");

  if (lines[0]?.trim() !== frontmatterDelimiter) {
    return {
      body: markdown,
      metadata: {},
    };
  }

  const closingIndex = lines.findIndex(
    (line, index) => index > 0 && line.trim() === frontmatterDelimiter,
  );

  if (closingIndex < 1) {
    return {
      body: markdown,
      metadata: {},
    };
  }

  const parsed = parseYaml(lines.slice(1, closingIndex).join("\n").trim() || "{}");

  return {
    body: lines.slice(closingIndex + 1).join("\n").replace(/^\n/, ""),
    metadata: isRecord(parsed) ? parsed : {},
  };
}

function orderMetadata(
  metadata: Record<string, unknown>,
): Record<string, unknown> {
  const ordered: Record<string, unknown> = {};

  for (const key of metadataOrder) {
    if (metadata[key] !== undefined) {
      ordered[key] = metadata[key];
    }
  }

  for (const [key, value] of Object.entries(metadata)) {
    if (!(key in ordered) && value !== undefined) {
      ordered[key] = value;
    }
  }

  return ordered;
}

function withoutUndefined(
  metadata: DeckMetadataPatch,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => value !== undefined),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
