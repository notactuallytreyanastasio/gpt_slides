import { describe, expect, it } from "vitest";

import { getSlideIndexAtMarkdownOffset } from "./markdownSourceMap";
import { parseMarkdownDeck, parseMarkdownDeckOrThrow } from "./parseMarkdownDeck";

describe("parseMarkdownDeck", () => {
  it("parses deck metadata, slides, notes, and slide directives", () => {
    const deck = parseMarkdownDeckOrThrow(`---
title: Visual Exploration
theme: paper
aspectRatio: "16:9"
author: Product Lab
---

# Start with the story

:::notes
Open with the user problem, not the feature list.
:::

---

<!--
layout: split
background: "#17202a"
accent: "#ffc857"
align: center
-->

## Shape the deck visually

- Draft in markdown
- See the canvas update
- Keep presenter notes nearby
`);

    expect(deck.metadata).toEqual({
      title: "Visual Exploration",
      theme: "paper",
      aspectRatio: "16:9",
      transition: "slide",
      author: "Product Lab",
    });
    expect(deck.slides).toHaveLength(2);
    expect(deck.slides[0]).toMatchObject({
      id: "slide-1-start-with-the-story",
      title: "Start with the story",
      layout: "title",
      notes: "Open with the user problem, not the feature list.",
    });
    expect(deck.slides[1]).toMatchObject({
      title: "Shape the deck visually",
      layout: "split",
      requestedLayout: "split",
      style: {
        background: "#17202a",
        accent: "#ffc857",
        align: "center",
      },
      stats: {
        bulletCount: 3,
        density: "airy",
      },
    });
  });

  it("infers useful default layouts from markdown content", () => {
    const deck = parseMarkdownDeckOrThrow(`# Title Only

---

## Plan

- Parse markdown
- Render slides

---

\`\`\`ts
const deck = parseMarkdownDeck(source);
\`\`\`
`);

    expect(deck.metadata.title).toBe("Untitled deck");
    expect(deck.slides.map((slide) => slide.layout)).toEqual([
      "title",
      "bullets",
      "code",
    ]);
  });

  it("parses vertical slides with -- separators inside horizontal columns", () => {
    const deck = parseMarkdownDeckOrThrow(`# One

--

## One Below

---

# Two
`);

    expect(deck.columns).toHaveLength(2);
    expect(deck.columns.map((column) => column.map((slide) => slide.title))).toEqual([
      ["One", "One Below"],
      ["Two"],
    ]);
    expect(deck.slides.map((slide) => slide.positionLabel)).toEqual([
      "1.1",
      "1.2",
      "2",
    ]);
    expect(deck.slides[1]).toMatchObject({
      columnIndex: 0,
      rowIndex: 1,
      title: "One Below",
    });
  });

  it("preserves markdown source ranges for each slide definition", () => {
    const source = `---
title: Source Map
---

# First

---

## Second

--

### Third
`;
    const deck = parseMarkdownDeckOrThrow(source);

    expect(deck.slides.map((slide) => slide.sourceRange.contentStart)).toEqual([
      source.indexOf("# First"),
      source.indexOf("## Second"),
      source.indexOf("### Third"),
    ]);
    expect(deck.slides.map((slide) => slide.sourceRange.lineStart)).toEqual([
      5, 9, 13,
    ]);
    expect(
      getSlideIndexAtMarkdownOffset(deck.slides, source.indexOf("Second")),
    ).toBe(1);
    expect(
      getSlideIndexAtMarkdownOffset(deck.slides, source.indexOf("Third")),
    ).toBe(2);
  });

  it("returns typed parse issues for invalid metadata", () => {
    const result = parseMarkdownDeck(`---
title: Demo
theme: neon
---

# Slide
`);

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.issues[0]).toMatchObject({
        path: ["theme"],
      });
    }
  });
});
