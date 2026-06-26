import { expect, test } from "@playwright/test";

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
  await page.evaluate(() => {
    window.localStorage.clear();
  });
  await page.reload();
});

test("updates the canvas from markdown and persists locally", async ({
  page,
}) => {
  const source = page.getByTestId("markdown-source");

  await source.fill(customDeck);

  await expect(
    page.getByRole("heading", { name: "Rapid Test Deck" }),
  ).toBeVisible();
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

  await page.keyboard.press("ArrowRight");

  await expect(
    page.getByTestId("presenter-stage").getByRole("heading", {
      name: "Visual exploration should survive",
    }),
  ).toBeVisible();

  await page.keyboard.press("Escape");

  await expect(page.getByTestId("studio-shell")).toBeVisible();
});
