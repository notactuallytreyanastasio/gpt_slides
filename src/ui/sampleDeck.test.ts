import { describe, expect, it } from "vitest";

import { parseMarkdownDeckOrThrow } from "../core";
import { sampleDeckMarkdown } from "./sampleDeck";

describe("sampleDeckMarkdown", () => {
  it("demonstrates horizontal chapters with vertical drill-down layers", () => {
    const deck = parseMarkdownDeckOrThrow(sampleDeckMarkdown);

    expect(deck.columns).toHaveLength(4);
    expect(deck.slides).toHaveLength(12);
    expect(
      deck.columns.map((column) => column.map((slide) => slide.title)),
    ).toEqual([
      [
        "Markdown Studio",
        "Visual exploration should survive",
        "Read the map, then dive",
      ],
      [
        "Main thread moves right",
        "Make the deck visible",
        "Layer evidence below",
      ],
      [
        "Branch down for context",
        "Functional core, imperative shell",
        "Keep the source boring",
      ],
      ["Compose, test, present", "Try the directions", "Your turn"],
    ]);
  });
});
