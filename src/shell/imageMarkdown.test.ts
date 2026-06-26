import { describe, expect, it } from "vitest";

import { insertMarkdownAtSelection } from "./imageMarkdown";

describe("insertMarkdownAtSelection", () => {
  it("inserts image markdown at the cursor with readable spacing", () => {
    expect(
      insertMarkdownAtSelection("# Slide", "![Demo](data:image/png;base64,abc)", 7, 7),
    ).toBe("# Slide\n\n![Demo](data:image/png;base64,abc)");
  });

  it("replaces the selected range", () => {
    expect(
      insertMarkdownAtSelection(
        "# Slide\nold image",
        "![New](data:image/png;base64,abc)",
        8,
        17,
      ),
    ).toBe("# Slide\n![New](data:image/png;base64,abc)");
  });
});
