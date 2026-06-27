import { expect, test } from "@playwright/test";

const walkthroughSeenKey = "markdown-slides.walkthroughSeen";
const walkthroughVersion = "joyride-getting-started-v1";
const customDeck = `---
title: Rapid Test Deck
theme: paper
aspectRatio: "16:9"
---

# First Moment

The canvas should update as soon as the source changes.

---

## Second Moment

- The outline follows the deck
- The slide can be presented
`;

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(({ storageKey, version }) => {
    window.localStorage.clear();
    window.localStorage.setItem(storageKey, version);
  }, { storageKey: walkthroughSeenKey, version: walkthroughVersion });
  await page.reload();
});

test("walks first-time users through the editor", async ({ page }) => {
  await page.evaluate((storageKey) => {
    window.localStorage.removeItem(storageKey);
  }, walkthroughSeenKey);
  await page.reload();

  await expect(page.getByTestId("guided-tour")).toBeVisible();
  const tour = page.getByTestId("guided-tour");
  await expect(
    tour.getByRole("heading", { name: "Start with the whole studio" }),
  ).toBeVisible();
  await expect(tour).toContainText("autosaves locally");

  await tour.getByRole("button", { name: "Next" }).click();

  await expect(
    tour.getByRole("heading", { name: "Tune the deck shell" }),
  ).toBeVisible();
  await expect(tour).toContainText("frontmatter");

  await tour.getByRole("button", { name: "Next" }).click();

  await expect(
    tour.getByRole("heading", { name: "Write the deck as one file" }),
  ).toBeVisible();
  await expect(tour).toContainText("Drop image files here");

  await page.keyboard.press("ArrowRight");

  await expect(
    tour.getByRole("heading", { name: "Use quick markdown tools" }),
  ).toBeVisible();

  await page.keyboard.press("ArrowLeft");

  await expect(
    tour.getByRole("heading", { name: "Write the deck as one file" }),
  ).toBeVisible();

  await tour
    .getByRole("button", {
      name: "Go to step 5: Branch the deck in four directions",
    })
    .click();

  await expect(
    tour.getByRole("heading", { name: "Branch the deck in four directions" }),
  ).toBeVisible();

  await tour.getByRole("button", { name: "Skip" }).click();
  await expect(page.getByTestId("guided-tour")).toBeHidden();

  await page.reload();
  await expect(page.getByTestId("guided-tour")).toBeHidden();

  await page.getByRole("button", { name: "Show walkthrough" }).click();
  await expect(page.getByTestId("guided-tour")).toBeVisible();
});

test("updates the canvas from markdown and persists locally", async ({
  page,
}) => {
  const source = page.getByTestId("markdown-source");

  await source.fill(customDeck);

  await expect(page.getByLabel("Deck title")).toHaveValue("Rapid Test Deck");
  await expect(
    page.getByTestId("canvas-stage").getByRole("heading", {
      name: "First Moment",
    }),
  ).toBeVisible();
  await page.waitForFunction(
    (expectedMarkdown) => {
      const stored = window.localStorage.getItem(
        "markdown-slides.currentDeck",
      );

      return stored
        ? (JSON.parse(stored) as { markdown?: string }).markdown ===
            expectedMarkdown
        : false;
    },
    customDeck,
  );

  await page.reload();

  await expect(page.getByTestId("markdown-source")).toHaveValue(customDeck);
  await expect(
    page.getByTestId("canvas-stage").getByText(
      "The canvas should update as soon as the source changes.",
    ),
  ).toBeVisible();
});

test("edits deck metadata and formats markdown through toolbar controls", async ({
  page,
}) => {
  const source = page.getByTestId("markdown-source");

  await page.getByLabel("Deck title").fill("Best Worlds Deck");
  await page.getByLabel("Theme").selectOption("midnight");
  await page.getByLabel("Aspect ratio").selectOption("4:3");
  await page.getByLabel("Transition").selectOption("zoom");

  await expect(source).toHaveValue(/title: Best Worlds Deck/);
  await expect(source).toHaveValue(/theme: midnight/);
  await expect(source).toHaveValue(/aspectRatio: 4:3/);
  await expect(source).toHaveValue(/transition: zoom/);

  await source.fill(`# Toolbar\n\nFocus word`);
  await source.evaluate((element) => {
    const textarea = element as HTMLTextAreaElement;
    const start = textarea.value.indexOf("Focus");
    textarea.selectionStart = start;
    textarea.selectionEnd = start + "Focus".length;
  });

  await page.getByRole("button", { name: "Bold" }).click();

  await expect(source).toHaveValue(/\*\*Focus\*\* word/);

  await page.getByRole("button", { name: "Add slide right" }).first().click();

  await expect(source).toHaveValue(/---\n\n# New slide/);
});

test("adds slides above, below, left, and right through markdown separators", async ({
  page,
}) => {
  const source = page.getByTestId("markdown-source");
  const gridDeck = `# One

--

# One Below

---

# Two`;

  await source.fill(gridDeck);
  await page.getByRole("button", { name: /^Select One Below$/ }).first().click();
  await page.getByRole("button", { name: "Add slide above" }).click();

  await expect(source).toHaveValue(/# One\n\n--\n\n# New slide\n\nWrite Markdown here\.\n\n--\n\n# One Below/);
  await expect(page.getByText("1.2 · statement").first()).toBeVisible();

  await source.fill(gridDeck);
  await page.getByRole("button", { name: /^Select One Below$/ }).first().click();
  await page.getByRole("button", { name: "Add slide below" }).click();

  await expect(source).toHaveValue(/# One Below\n\n--\n\n# New slide\n\nWrite Markdown here\.\n\n---\n\n# Two/);
  await expect(page.getByText("1.3 · statement").first()).toBeVisible();

  await source.fill(gridDeck);
  await page.getByRole("button", { name: /^Select Two$/ }).first().click();
  await page.getByRole("button", { name: "Add slide left" }).click();

  await expect(source).toHaveValue(/# One Below\n\n---\n\n# New slide\n\nWrite Markdown here\.\n\n---\n\n# Two/);
  await expect(page.getByText("2 · statement").first()).toBeVisible();

  await source.fill(gridDeck);
  await page.getByRole("button", { name: /^Select One$/ }).first().click();
  await page.getByRole("button", { name: "Add slide right" }).last().click();

  await expect(source).toHaveValue(/# One Below\n\n---\n\n# New slide\n\nWrite Markdown here\.\n\n---\n\n# Two/);
  await expect(page.getByText("2 · statement").first()).toBeVisible();

  await source.fill(gridDeck);
  await page.getByRole("button", { name: /^Select One$/ }).first().click();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByText("1.2 · title").first()).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText("2 · title").first()).toBeVisible();
});

test("shows typed parse feedback without losing the editor", async ({
  page,
}) => {
  await page.getByTestId("markdown-source").fill(`---
title: Broken Deck
theme: neon
---

# Slide
`);

  await expect(page.getByRole("alert")).toContainText("theme");
  await expect(page.getByRole("alert")).toContainText("Invalid enum value");
  await expect(page.getByTestId("markdown-source")).toBeVisible();
});

test("embeds dropped images into the markdown source", async ({ page }) => {
  const source = page.getByTestId("markdown-source");

  await source.fill(`# Image slide

Drop below:
`);
  await source.evaluate((element) => {
    const textarea = element as HTMLTextAreaElement;
    textarea.selectionStart = textarea.value.length;
    textarea.selectionEnd = textarea.value.length;
  });

  const dataTransfer = await page.evaluateHandle(() => {
    const bytes = Uint8Array.from([
      137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0,
      1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 10, 73, 68,
      65, 84, 120, 156, 99, 248, 15, 0, 1, 1, 1, 0, 24, 221, 141, 176, 0, 0,
      0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
    ]);
    const file = new File([bytes], "tiny-pixel.png", { type: "image/png" });
    const transfer = new DataTransfer();
    transfer.items.add(file);

    return transfer;
  });

  await source.dispatchEvent("drop", { dataTransfer });

  await expect(source).toHaveValue(/!\[tiny pixel]\(data:image\/png;base64,/);
  await expect(
    page.getByTestId("canvas-stage").getByRole("img", {
      name: "tiny pixel",
    }),
  ).toBeVisible();
});

test("enters presentation mode and navigates with the keyboard", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Start presentation" }).click();

  await expect(page.getByTestId("presenter-shell")).toBeVisible();
  await expect(
    page.getByTestId("presenter-stage").getByRole("heading", {
      name: "Markdown Studio",
    }),
  ).toBeVisible();

  await page.keyboard.press("ArrowDown");

  await expect(
    page.getByTestId("presenter-stage").getByRole("heading", {
      name: "Visual exploration should survive",
    }),
  ).toBeVisible();

  await page.keyboard.press("ArrowRight");

  await expect(
    page.getByTestId("presenter-stage").getByRole("heading", {
      name: "Make the deck visible",
    }),
  ).toBeVisible();

  await page.keyboard.press("Escape");

  await expect(page.getByTestId("studio-shell")).toBeVisible();
});
