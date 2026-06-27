import { describe, expect, it } from "vitest";

import { parseMarkdownDeckOrThrow } from "./parseMarkdownDeck";
import { insertMarkdownSlideSource } from "./insertMarkdownSlide";

const source = `---
title: Grid Deck
---

# One

--

# One Below

---

# Two
`;

describe("insertMarkdownSlideSource", () => {
  it("inserts a slide above or below within the active vertical stack", () => {
    const below = insertMarkdownSlideSource(source, 0, "down", "# New Down");
    const belowDeck = parseMarkdownDeckOrThrow(below.markdown);

    expect(below.insertedSlideIndex).toBe(1);
    expect(below.markdown).toContain("# One\n\n--\n\n# New Down\n\n--\n\n# One Below");
    expect(belowDeck.columns[0].map((slide) => slide.title)).toEqual([
      "One",
      "New Down",
      "One Below",
    ]);

    const above = insertMarkdownSlideSource(source, 1, "up", "# New Up");
    const aboveDeck = parseMarkdownDeckOrThrow(above.markdown);

    expect(above.insertedSlideIndex).toBe(1);
    expect(aboveDeck.columns[0].map((slide) => slide.title)).toEqual([
      "One",
      "New Up",
      "One Below",
    ]);
  });

  it("inserts a new horizontal column left or right of the active stack", () => {
    const left = insertMarkdownSlideSource(source, 2, "left", "# New Left");
    const leftDeck = parseMarkdownDeckOrThrow(left.markdown);

    expect(left.insertedSlideIndex).toBe(2);
    expect(leftDeck.columns.map((column) => column[0].title)).toEqual([
      "One",
      "New Left",
      "Two",
    ]);

    const right = insertMarkdownSlideSource(source, 0, "right", "# New Right");
    const rightDeck = parseMarkdownDeckOrThrow(right.markdown);

    expect(right.insertedSlideIndex).toBe(2);
    expect(rightDeck.columns.map((column) => column[0].title)).toEqual([
      "One",
      "New Right",
      "Two",
    ]);
  });
});
