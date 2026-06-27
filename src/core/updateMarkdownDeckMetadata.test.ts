import { describe, expect, it } from "vitest";

import { parseMarkdownDeckOrThrow } from "./parseMarkdownDeck";
import { updateMarkdownDeckMetadataSource } from "./updateMarkdownDeckMetadata";

describe("updateMarkdownDeckMetadataSource", () => {
  it("updates existing frontmatter without touching the slide body", () => {
    const source = `---
title: Original
theme: studio
aspectRatio: "16:9"
author: Product Lab
---

# First slide

---

# Second slide
`;

    const next = updateMarkdownDeckMetadataSource(source, {
      theme: "midnight",
      title: "Updated",
      transition: "zoom",
    });
    const deck = parseMarkdownDeckOrThrow(next);

    expect(deck.metadata).toMatchObject({
      title: "Updated",
      theme: "midnight",
      aspectRatio: "16:9",
      transition: "zoom",
      author: "Product Lab",
    });
    expect(next).toContain("# First slide\n\n---\n\n# Second slide");
  });

  it("adds frontmatter when a deck starts as plain markdown", () => {
    const next = updateMarkdownDeckMetadataSource("# Plain deck", {
      title: "Plain Deck",
      aspectRatio: "4:3",
      theme: "paper",
    });

    expect(next).toMatch(/^---\ntitle: Plain Deck\n/);
    expect(parseMarkdownDeckOrThrow(next).metadata).toMatchObject({
      title: "Plain Deck",
      aspectRatio: "4:3",
      theme: "paper",
      transition: "slide",
    });
    expect(next.endsWith("# Plain deck")).toBe(true);
  });
});
