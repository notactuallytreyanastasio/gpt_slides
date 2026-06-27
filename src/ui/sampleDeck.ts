export const sampleDeckMarkdown = `---
title: Layered Markdown Deck
description: A local-first deck map with horizontal chapters and vertical drill-downs.
theme: studio
aspectRatio: "16:9"
transition: slide
author: Product Lab
---

# Markdown Studio

Write one markdown file. Shape it as a slide map.

:::notes
Start with the core promise: markdown stays portable, but the work still feels visual.
:::

--

<!--
layout: split
accent: "#ffb703"
align: center
-->

## Visual exploration should survive

- Horizontal columns carry the main story
- Vertical stacks hold supporting layers
- The active slide snaps source and preview together

:::notes
Use this slide to explain why the board exists: thoughts can branch without becoming a maze.
:::

--

<!--
layout: statement
accent: "#2dd4bf"
align: center
-->

## Read the map, then dive

A column is the path. A stack is the deeper thought under it.

:::notes
This is the mental model for the rest of the default deck.
:::

---

<!--
layout: statement
accent: "#147d8f"
align: center
-->

## Main thread moves right

Each \`---\` creates the next chapter across the board.

:::notes
The top row works like the spine of the talk.
:::

--

<!--
layout: image
background: "#102a43"
accent: "#2dd4bf"
-->

## Make the deck visible

![A team reviewing a presentation](https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1400&q=80)

:::notes
Images work best when they support a single point instead of becoming decoration.
:::

--

<!--
layout: bullets
accent: "#0f766e"
-->

## Layer evidence below

- Notes live with each slide
- Images stay portable
- Embeds can sit on their own slide
- Details stay nearby without crowding the talk

:::notes
Vertical slides are useful for appendix material, proof points, and optional depth.
:::

---

<!--
layout: split
accent: "#8b5cf6"
align: center
-->

## Branch down for context

- Design rationale
- Caveats
- Data
- Appendix moments

:::notes
The board should make it obvious where supporting material belongs.
:::

--

<!--
layout: code
accent: "#8b5cf6"
-->

## Functional core, imperative shell

\`\`\`ts
const result = parseMarkdownDeck(markdown);

if (result.ok) {
  renderSlideBoard(result.deck.columns);
}
\`\`\`

:::notes
The parser stays boring and testable; the React shell handles browser behavior.
:::

--

<!--
layout: statement
background: "#101820"
accent: "#2dd4bf"
align: center
-->

## Keep the source boring

Markdown stays readable enough for Git, chat, export, and static hosting.

:::notes
The file should remain useful even outside the app.
:::

---

<!--
layout: bullets
accent: "#f97316"
-->

## Compose, test, present

- Type in the editor
- Watch the preview change
- Browse the board
- Present when the story is ready

:::notes
This is the day-to-day authoring loop.
:::

--

<!--
layout: split
accent: "#ffb703"
align: center
-->

## Try the directions

- \`---\` adds a slide to the right
- \`--\` adds one below
- Arrow buttons create both
- Arrow keys browse both

:::notes
Invite the user to click around instead of reading docs first.
:::

--

<!--
layout: title
accent: "#147d8f"
align: center
-->

# Your turn

Paste a brief, branch the thinking, and let the deck take shape.
`;
