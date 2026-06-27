export const sampleDeckMarkdown = `---
title: Markdown Studio Prototype
description: A local-first deck about making the editor feel visual.
theme: studio
aspectRatio: "16:9"
transition: slide
author: Product Lab
---

# Markdown Studio

Draft the story in plain text while the canvas keeps pace.

:::notes
Set the expectation that markdown remains the source of truth.
:::

--

<!--
layout: split
accent: "#ffb703"
align: center
-->

## Visual exploration should survive

- A source editor for precise control
- A live canvas for spatial judgment
- Thumbnails for rhythm and pacing
- Notes that stay attached to each slide

:::notes
The product should feel like composing a deck, not filling out a form.
:::

---

<!--
layout: image
background: "#102a43"
accent: "#2dd4bf"
-->

## Make the deck visible

![A team reviewing a presentation](https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1400&q=80)

---

<!--
layout: code
accent: "#8b5cf6"
-->

## Functional core, imperative shell

\`\`\`ts
const result = parseMarkdownDeck(markdown);

if (result.ok) {
  renderSlideCanvas(result.deck.slides);
}
\`\`\`
`;
