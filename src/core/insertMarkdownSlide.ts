export type SlideInsertDirection = "down" | "left" | "right" | "up";

export type InsertMarkdownSlideResult = {
  readonly insertedSlideIndex: number;
  readonly markdown: string;
};

const defaultSlideMarkdown = "# New slide\n\nWrite Markdown here.";

export function insertMarkdownSlideSource(
  markdown: string,
  activeSlideIndex: number,
  direction: SlideInsertDirection,
  slideMarkdown = defaultSlideMarkdown,
): InsertMarkdownSlideResult {
  const normalized = normalizeMarkdown(markdown);
  const { body, frontmatter } = extractFrontmatter(normalized);
  const columns = splitBodyIntoColumns(body);
  const active = getPositionForIndex(columns, activeSlideIndex);

  if (direction === "left" || direction === "right") {
    const nextColumnIndex =
      direction === "left" ? active.columnIndex : active.columnIndex + 1;
    columns.splice(nextColumnIndex, 0, [slideMarkdown]);

    return {
      insertedSlideIndex: countSlidesBeforeColumn(columns, nextColumnIndex),
      markdown: joinMarkdown(frontmatter, columns),
    };
  }

  const targetColumn = columns[active.columnIndex];
  const nextRowIndex = direction === "up" ? active.rowIndex : active.rowIndex + 1;
  targetColumn.splice(nextRowIndex, 0, slideMarkdown);

  return {
    insertedSlideIndex:
      countSlidesBeforeColumn(columns, active.columnIndex) + nextRowIndex,
    markdown: joinMarkdown(frontmatter, columns),
  };
}

function normalizeMarkdown(markdown: string): string {
  return markdown.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").trimEnd();
}

function extractFrontmatter(markdown: string): {
  readonly body: string;
  readonly frontmatter: string;
} {
  const lines = markdown.split("\n");

  if (lines[0]?.trim() !== "---") {
    return {
      body: markdown,
      frontmatter: "",
    };
  }

  const closingIndex = lines.findIndex(
    (line, index) => index > 0 && line.trim() === "---",
  );

  if (closingIndex < 1) {
    return {
      body: markdown,
      frontmatter: "",
    };
  }

  return {
    body: lines.slice(closingIndex + 1).join("\n"),
    frontmatter: lines.slice(0, closingIndex + 1).join("\n"),
  };
}

function splitBodyIntoColumns(markdown: string): string[][] {
  const columns: string[][] = [[]];
  const current: string[] = [];

  function pushCurrentSlide(): void {
    const slide = current.join("\n").trim();

    if (slide.length > 0) {
      columns[columns.length - 1].push(slide);
    }

    current.length = 0;
  }

  for (const line of markdown.split("\n")) {
    const trimmed = line.trim();

    if (trimmed === "---" || trimmed === "--") {
      pushCurrentSlide();

      if (trimmed === "---") {
        columns.push([]);
      }

      continue;
    }

    current.push(line);
  }

  pushCurrentSlide();

  const populated = columns.filter((column) => column.length > 0);

  return populated.length > 0 ? populated : [[defaultSlideMarkdown]];
}

function getPositionForIndex(
  columns: readonly (readonly string[])[],
  activeSlideIndex: number,
): {
  readonly columnIndex: number;
  readonly rowIndex: number;
} {
  const clampedIndex = Math.min(
    Math.max(activeSlideIndex, 0),
    columns.reduce((total, column) => total + column.length, 0) - 1,
  );
  let seen = 0;

  for (const [columnIndex, column] of columns.entries()) {
    if (clampedIndex < seen + column.length) {
      return {
        columnIndex,
        rowIndex: clampedIndex - seen,
      };
    }

    seen += column.length;
  }

  return { columnIndex: 0, rowIndex: 0 };
}

function countSlidesBeforeColumn(
  columns: readonly (readonly string[])[],
  columnIndex: number,
): number {
  return columns
    .slice(0, columnIndex)
    .reduce((total, column) => total + column.length, 0);
}

function joinMarkdown(frontmatter: string, columns: readonly string[][]): string {
  const body = columns
    .map((column) => column.join("\n\n--\n\n"))
    .join("\n\n---\n\n");

  return frontmatter ? `${frontmatter}\n\n${body}\n` : `${body}\n`;
}
