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
  readonly bodyStartLine: number;
  readonly bodyStartOffset: number;
  readonly metadata: DeckMetadata;
  readonly body: string;
};

type SlideDirectiveExtraction = {
  readonly directive: SlideDirective;
  readonly body: string;
};

type SlideMarkdownChunk = {
  readonly columnIndex: number;
  readonly columnLength: number;
  readonly markdown: string;
  readonly rowIndex: number;
  readonly sourceRange: {
    readonly contentEnd: number;
    readonly contentStart: number;
    readonly end: number;
    readonly lineEnd: number;
    readonly lineStart: number;
    readonly start: number;
  };
};

const slideDirectivePattern = /^\s*<!--\s*\n?([\s\S]*?)\n?\s*-->\s*/;
const notesBlockPattern = /(^|\n):::\s*notes\s*\n([\s\S]*?)\n:::\s*(?=\n|$)/g;

export function parseMarkdownDeck(markdown: string): DeckParseResult {
  try {
    const normalized = normalizeMarkdown(markdown);
    const { metadata, body, bodyStartLine, bodyStartOffset } =
      extractFrontmatter(normalized);
    const chunks = splitSlideChunks(body, bodyStartOffset, bodyStartLine);
    const slides = chunks.map((chunk, index) => parseSlide(chunk, index));
    const columns = chunks.reduce<Slide[][]>((deckColumns, chunk, index) => {
      deckColumns[chunk.columnIndex] ??= [];
      deckColumns[chunk.columnIndex][chunk.rowIndex] = slides[index];

      return deckColumns;
    }, []);

    const deck = deckSchema.parse({
      columns,
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
      bodyStartLine: 1,
      bodyStartOffset: 0,
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
  const bodyStartOffset = getLineStartOffset(lines, closingIndex + 1);

  return {
    bodyStartLine: closingIndex + 2,
    bodyStartOffset,
    metadata: deckMetadataSchema.parse(rawMetadata),
    body: lines.slice(closingIndex + 1).join("\n"),
  };
}

function splitSlideChunks(
  markdown: string,
  bodyStartOffset = 0,
  bodyStartLine = 1,
): readonly SlideMarkdownChunk[] {
  const columns: string[][] = [[]];
  const sourceColumns: SlideMarkdownChunk["sourceRange"][][] = [[]];
  const current: string[] = [];
  const lines = markdown.split("\n");
  let currentStartLine = bodyStartLine;
  let currentStartOffset = bodyStartOffset;
  let lineNumber = bodyStartLine;
  let lineStartOffset = bodyStartOffset;

  function pushCurrentSlide(rangeEndOffset: number, rangeEndLine: number): void {
    const rawSlide = current.join("\n");
    const slide = rawSlide.trim();

    if (slide.length > 0) {
      columns[columns.length - 1].push(slide);
      sourceColumns[sourceColumns.length - 1].push(
        createSourceRange(
          rawSlide,
          currentStartOffset,
          rangeEndOffset,
          currentStartLine,
          rangeEndLine,
        ),
      );
    }

    current.length = 0;
  }

  for (const [lineIndex, line] of lines.entries()) {
    const trimmed = line.trim();
    const lineEndOffset = lineStartOffset + line.length;
    const nextLineStartOffset =
      lineEndOffset + (lineIndex < lines.length - 1 ? 1 : 0);

    if (trimmed === "---" || trimmed === "--") {
      pushCurrentSlide(lineStartOffset, Math.max(currentStartLine, lineNumber - 1));

      if (trimmed === "---") {
        columns.push([]);
        sourceColumns.push([]);
      }

      currentStartLine = lineNumber + 1;
      currentStartOffset = nextLineStartOffset;
      lineNumber += 1;
      lineStartOffset = nextLineStartOffset;
      continue;
    }

    current.push(line);
    lineNumber += 1;
    lineStartOffset = nextLineStartOffset;
  }

  pushCurrentSlide(lineStartOffset, Math.max(currentStartLine, lineNumber - 1));

  const populatedColumns = columns
    .map((column, columnIndex) => ({
      slides: column,
      sourceRanges: sourceColumns[columnIndex] ?? [],
    }))
    .filter((column) => column.slides.length > 0);
  const usableColumns =
    populatedColumns.length > 0
      ? populatedColumns
      : [
          {
            slides: [""],
            sourceRanges: [
              {
                contentEnd: bodyStartOffset,
                contentStart: bodyStartOffset,
                end: bodyStartOffset,
                lineEnd: bodyStartLine,
                lineStart: bodyStartLine,
                start: bodyStartOffset,
              },
            ],
          },
        ];

  return usableColumns.flatMap((column, columnIndex) =>
    column.slides.map((slideMarkdown, rowIndex) => ({
      columnIndex,
      columnLength: column.slides.length,
      markdown: slideMarkdown,
      rowIndex,
      sourceRange: column.sourceRanges[rowIndex],
    })),
  );
}

function getLineStartOffset(lines: readonly string[], lineIndex: number): number {
  return lines
    .slice(0, lineIndex)
    .reduce((offset, line) => offset + line.length + 1, 0);
}

function createSourceRange(
  rawSlide: string,
  rangeStartOffset: number,
  rangeEndOffset: number,
  rangeStartLine: number,
  rangeEndLine: number,
): SlideMarkdownChunk["sourceRange"] {
  const leadingWhitespace = rawSlide.match(/^\s*/)?.[0] ?? "";
  const trailingWhitespace = rawSlide.match(/\s*$/)?.[0] ?? "";
  const contentStart = rangeStartOffset + leadingWhitespace.length;
  const contentEnd = Math.max(
    contentStart,
    rangeEndOffset - trailingWhitespace.length,
  );
  const content = rawSlide.slice(
    leadingWhitespace.length,
    rawSlide.length - trailingWhitespace.length,
  );
  const contentLineStart = rangeStartLine + countLineBreaks(leadingWhitespace);

  return {
    contentEnd,
    contentStart,
    end: rangeEndOffset,
    lineEnd:
      content.length > 0
        ? contentLineStart + countLineBreaks(content)
        : Math.max(contentLineStart, rangeEndLine),
    lineStart: contentLineStart,
    start: rangeStartOffset,
  };
}

function countLineBreaks(value: string): number {
  return value.match(/\n/g)?.length ?? 0;
}

function parseSlide(chunk: SlideMarkdownChunk, index: number): Slide {
  const { directive, body } = extractSlideDirective(chunk.markdown);
  const { content, notes } = extractSpeakerNotes(body);
  const stats = analyzeSlide(content);
  const firstHeading = getFirstHeading(content);
  const title = directive.title ?? firstHeading ?? `Slide ${index + 1}`;
  const requestedLayout = directive.layout;
  const layout =
    requestedLayout === "auto" ? inferLayout(content, stats) : requestedLayout;
  const positionLabel =
    chunk.columnLength > 1
      ? `${chunk.columnIndex + 1}.${chunk.rowIndex + 1}`
      : `${chunk.columnIndex + 1}`;

  return {
    columnIndex: chunk.columnIndex,
    id: directive.id ?? createSlideId(index, title),
    index,
    title,
    layout,
    requestedLayout,
    markdown: content,
    notes,
    positionLabel,
    rowIndex: chunk.rowIndex,
    sourceRange: chunk.sourceRange,
    style: {
      background: directive.background,
      accent: directive.accent,
      align: directive.align,
    },
    stats,
  };
}

export function splitMarkdownSlides(markdown: string): readonly string[] {
  const normalized = normalizeMarkdown(markdown);
  const { body, bodyStartLine, bodyStartOffset } = extractFrontmatter(normalized);

  return splitSlideChunks(body, bodyStartOffset, bodyStartLine).map(
    (chunk) => chunk.markdown,
  );
}

export function getMarkdownSlideGrid(
  markdown: string,
): readonly (readonly string[])[] {
  const normalized = normalizeMarkdown(markdown);
  const { body, bodyStartLine, bodyStartOffset } = extractFrontmatter(normalized);
  const chunks = splitSlideChunks(body, bodyStartOffset, bodyStartLine);
  const columns = chunks.reduce<string[][]>((deckColumns, chunk) => {
    deckColumns[chunk.columnIndex] ??= [];
    deckColumns[chunk.columnIndex][chunk.rowIndex] = chunk.markdown;

    return deckColumns;
  }, []);

  return columns;
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
