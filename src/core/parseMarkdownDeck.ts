import { parse as parseYaml } from "yaml";
import { ZodError } from "zod";

import {
  type Deck,
  type DeckMetadata,
  type DeckParseIssue,
  type DeckParseResult,
  type Slide,
  type SlideDensity,
  type SlideDirective,
  type SlideLayout,
  type SlideStats,
  deckMetadataSchema,
  deckSchema,
  slideDirectiveSchema,
} from "./deck";

type FrontmatterExtraction = {
  readonly metadata: DeckMetadata;
  readonly body: string;
};

type SlideDirectiveExtraction = {
  readonly directive: SlideDirective;
  readonly body: string;
};

const slideDirectivePattern = /^\s*<!--\s*\n?([\s\S]*?)\n?\s*-->\s*/;
const notesBlockPattern = /(^|\n):::\s*notes\s*\n([\s\S]*?)\n:::\s*(?=\n|$)/g;

export function parseMarkdownDeck(markdown: string): DeckParseResult {
  try {
    const normalized = normalizeMarkdown(markdown);
    const { metadata, body } = extractFrontmatter(normalized);
    const slides = splitSlides(body).map((slideMarkdown, index) =>
      parseSlide(slideMarkdown, index),
    );

    const deck = deckSchema.parse({
      metadata,
      slides,
      source: {
        markdown: normalized,
      },
    });

    return { ok: true, deck };
  } catch (error) {
    return { ok: false, issues: toIssues(error) };
  }
}

export function parseMarkdownDeckOrThrow(markdown: string): Deck {
  const result = parseMarkdownDeck(markdown);

  if (!result.ok) {
    const details = result.issues
      .map((issue) => {
        const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
        return `${path}${issue.message}`;
      })
      .join("\n");

    throw new Error(details);
  }

  return result.deck;
}

function normalizeMarkdown(markdown: string): string {
  return markdown.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
}

function extractFrontmatter(markdown: string): FrontmatterExtraction {
  const lines = markdown.split("\n");

  if (lines[0]?.trim() !== "---") {
    return {
      metadata: deckMetadataSchema.parse({}),
      body: markdown,
    };
  }

  const closingIndex = lines.findIndex(
    (line, index) => index > 0 && line.trim() === "---",
  );

  if (closingIndex < 1) {
    throw new Error("Deck frontmatter is missing a closing --- delimiter.");
  }

  const rawMetadata = parseYamlMap(lines.slice(1, closingIndex).join("\n"));

  return {
    metadata: deckMetadataSchema.parse(rawMetadata),
    body: lines.slice(closingIndex + 1).join("\n"),
  };
}

function splitSlides(markdown: string): readonly string[] {
  const slides: string[] = [];
  const current: string[] = [];

  for (const line of markdown.split("\n")) {
    if (line.trim() === "---") {
      const slide = current.join("\n").trim();
      if (slide.length > 0) {
        slides.push(slide);
      }
      current.length = 0;
      continue;
    }

    current.push(line);
  }

  const finalSlide = current.join("\n").trim();
  if (finalSlide.length > 0) {
    slides.push(finalSlide);
  }

  return slides.length > 0 ? slides : [""];
}

function parseSlide(markdown: string, index: number): Slide {
  const { directive, body } = extractSlideDirective(markdown);
  const { content, notes } = extractSpeakerNotes(body);
  const stats = analyzeSlide(content);
  const firstHeading = getFirstHeading(content);
  const title = directive.title ?? firstHeading ?? `Slide ${index + 1}`;
  const requestedLayout = directive.layout;
  const layout =
    requestedLayout === "auto" ? inferLayout(content, stats) : requestedLayout;

  return {
    id: directive.id ?? createSlideId(index, title),
    index,
    title,
    layout,
    requestedLayout,
    markdown: content,
    notes,
    style: {
      background: directive.background,
      accent: directive.accent,
      align: directive.align,
    },
    stats,
  };
}

function extractSlideDirective(markdown: string): SlideDirectiveExtraction {
  const match = markdown.match(slideDirectivePattern);

  if (!match) {
    return {
      directive: slideDirectiveSchema.parse({}),
      body: markdown.trim(),
    };
  }

  const rawDirective = parseYamlMap(match[1] ?? "");

  return {
    directive: slideDirectiveSchema.parse(rawDirective),
    body: markdown.slice(match[0].length).trim(),
  };
}

function extractSpeakerNotes(markdown: string): {
  readonly content: string;
  readonly notes: string;
} {
  const notes: string[] = [];
  const content = markdown
    .replace(notesBlockPattern, (fullMatch, leadingNewline, note) => {
      notes.push(String(note).trim());
      return leadingNewline === "\n" ? "\n" : "";
    })
    .trim();

  return {
    content,
    notes: notes.join("\n\n"),
  };
}

function analyzeSlide(markdown: string): SlideStats {
  const wordCount = countWords(stripCodeBlocks(markdown));
  const bulletCount = markdown
    .split("\n")
    .filter((line) => /^\s*(?:[-*+]|\d+\.)\s+/.test(line)).length;
  const imageCount = [...markdown.matchAll(/!\[[^\]]*]\([^)]+\)/g)].length;
  const codeFenceCount = [...markdown.matchAll(/^```/gm)].length;
  const codeBlockCount = Math.floor(codeFenceCount / 2);
  const density = inferDensity(wordCount, bulletCount);

  return {
    wordCount,
    bulletCount,
    imageCount,
    codeBlockCount,
    density,
  };
}

function inferLayout(markdown: string, stats: SlideStats): SlideLayout {
  const trimmed = markdown.trim();
  const lines = trimmed.split("\n").filter((line) => line.trim().length > 0);

  if (stats.codeBlockCount > 0) {
    return "code";
  }

  if (stats.imageCount > 0 && stats.wordCount < 40) {
    return "image";
  }

  if (stats.bulletCount >= 2) {
    return "bullets";
  }

  if (lines.length === 1 && /^#\s+/.test(lines[0] ?? "")) {
    return "title";
  }

  return "statement";
}

function inferDensity(wordCount: number, bulletCount: number): SlideDensity {
  if (wordCount >= 80 || bulletCount >= 8) {
    return "dense";
  }

  if (wordCount <= 22 && bulletCount <= 3) {
    return "airy";
  }

  return "balanced";
}

function getFirstHeading(markdown: string): string | undefined {
  const match = markdown.match(/^#{1,6}\s+(.+)$/m);
  return match?.[1]?.replace(/[*_`]/g, "").trim();
}

function createSlideId(index: number, title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return slug.length > 0 ? `slide-${index + 1}-${slug}` : `slide-${index + 1}`;
}

function stripCodeBlocks(markdown: string): string {
  return markdown.replace(/```[\s\S]*?```/g, " ");
}

function countWords(markdown: string): number {
  return markdown.match(/\b[\w'-]+\b/g)?.length ?? 0;
}

function parseYamlMap(yaml: string): Record<string, unknown> {
  const parsed = parseYaml(yaml.trim() || "{}") ?? {};

  if (!isRecord(parsed)) {
    throw new Error("YAML metadata must be an object.");
  }

  return parsed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toIssues(error: unknown): readonly DeckParseIssue[] {
  if (error instanceof ZodError) {
    return error.issues.map((issue) => ({
      message: issue.message,
      path: issue.path,
    }));
  }

  if (error instanceof Error) {
    return [
      {
        message: error.message,
        path: [],
      },
    ];
  }

  return [
    {
      message: "Unknown markdown parse failure.",
      path: [],
    },
  ];
}
