---
title: Markdown Slides
description: A complete overview of the local-first markdown slide studio
theme: studio
aspectRatio: "16:9"
author: Product Lab
---

# Markdown Slides

A local-first slide studio where the deck is just markdown.

:::notes
Open with the simplest promise: this app makes slide creation feel visual without giving up the precision and portability of markdown.
:::

---

<!--
layout: statement
accent: "#147d8f"
-->

## Write like a document. Shape it like a deck.

:::notes
Position the app between a text editor and a visual slide builder. The point is not to clone every presentation feature. The point is to make the core creative loop fast, transparent, and hostable.
:::

---

<!--
layout: split
accent: "#ffb703"
align: center
-->

## Why this exists

- Slides.com-style exploration
- Markdown as source of truth
- No paid platform dependency
- Static hosting by default

:::notes
The motivation is practical: we want the exploratory feeling of a slide tool, but with an open file format that can live in Git and run from GitHub Pages.
:::

---

<!--
layout: bullets
accent: "#2dd4bf"
-->

## The authoring loop

- Type markdown in the source editor
- Watch the full deck render live
- Scroll the deck flow for pacing
- Select slides for notes and stats
- Present when the story is ready

:::notes
The important detail is that the user never loses the relationship between source text and visual output.
:::

---

<!--
layout: split
accent: "#8b5cf6"
-->

## The workspace

- **Source:** canonical markdown file
- **Canvas:** scrolling rendered deck
- **Slides:** thumbnails, notes, and density

:::notes
Call out that the app now avoids a giant empty single-slide stage. It favors a continuous flow so authors can understand rhythm and sequence.
:::

---

<!--
layout: code
accent: "#147d8f"
-->

## A deck starts with frontmatter

```md
---
title: Launch Review
theme: studio
aspectRatio: "16:9"
author: Product Lab
---
```

:::notes
Frontmatter makes the deck portable and explicit. It gives the renderer enough metadata to choose theme, aspect ratio, and title without hidden state.
:::

---

<!--
layout: code
accent: "#ffb703"
-->

## Slides are markdown sections

```md
# Opening Slide

One idea per slide.

---

## Next Slide

- Support the idea
- Keep it scannable
```

:::notes
The file remains readable even outside the app. The slide separator is deliberately plain.
:::

---

<!--
layout: code
accent: "#2dd4bf"
-->

## Directives add visual control

```md
<!--
layout: split
accent: "#ffb703"
align: center
-->

## Visual exploration should survive
```

:::notes
Directives give authors enough control for layout and emphasis without turning the markdown into a private document model.
:::

---

<!--
layout: split
accent: "#147d8f"
align: center
-->

## Supported layouts

- `title`
- `statement`
- `bullets`
- `split`
- `image`
- `code`

:::notes
Layout inference can handle simple slides, but explicit layouts are helpful when the slide is doing structural work in the story.
:::

---

<!--
layout: code
accent: "#8b5cf6"
-->

## Speaker notes stay nearby

```md
:::notes
Say the deeper context here.
Keep the slide itself clean.
:::
```

:::notes
Notes are not a side channel in a database. They live in the same markdown file, attached to the slide where they belong.
:::

---

<!--
layout: image
background: "#102a43"
accent: "#2dd4bf"
-->

## Images can be dropped in

![A team reviewing slides together](https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1400&q=80)

:::notes
Image drag and drop converts local files into markdown image embeds. For a quick static prototype, this keeps decks portable and previewable without an upload service.
:::

---

<!--
layout: statement
accent: "#ffb703"
-->

## LocalStorage is the first backend.

:::notes
This is intentionally humble. The first version needs to be useful without accounts, servers, or databases.
:::

---

<!--
layout: split
accent: "#147d8f"
-->

## Static by design

- Vite production build
- Relative asset paths
- GitHub Pages workflow
- Browser-local persistence
- Markdown export

:::notes
The app can be hosted for free because it does not require a server-side application layer.
:::

---

<!--
layout: code
accent: "#2dd4bf"
-->

## Functional core, imperative shell

```ts
const result = parseMarkdownDeck(markdown);

if (result.ok) {
  renderDeckFlow(result.deck.slides);
}
```

:::notes
This is the engineering center of gravity: pure deck parsing and validation inside the core, browser behavior around it.
:::

---

<!--
layout: split
accent: "#8b5cf6"
-->

## Core responsibilities

- Validate deck metadata
- Split markdown into slides
- Parse slide directives
- Extract speaker notes
- Infer useful layouts
- Calculate slide density

:::notes
The core has no React, DOM, storage, or network dependencies. That keeps it easy to test and reason about.
:::

---

<!--
layout: split
accent: "#ffb703"
-->

## Shell responsibilities

- React workspace
- LocalStorage draft saving
- Markdown download
- Image drag and drop
- Presentation mode
- Guided walkthrough

:::notes
The shell is where browser reality lives. It can change without rewriting the contract for what a deck is.
:::

---

<!--
layout: bullets
accent: "#147d8f"
-->

## Tested like a product

- Unit tests for pure parsing
- Utility tests for markdown insertion
- Playwright tests for real flows
- Build validation before deploy
- GitHub Pages deployment checks

:::notes
The project deliberately tests behavior users care about: editing, persistence, image drops, onboarding, parse errors, and presentation navigation.
:::

---

<!--
layout: code
accent: "#8b5cf6"
-->

## The validation loop

```sh
npm run validate
```

```txt
typecheck -> unit tests -> Playwright flows
```

:::notes
This is the confidence loop. It catches parser regressions and browser workflow regressions before the app is pushed.
:::

---

<!--
layout: split
accent: "#2dd4bf"
align: center
-->

## A skill now creates decks

- `$create-markdown-slides`
- App-specific markdown format
- Slide quality heuristics
- Validator for generated decks
- Ready-to-paste `.md` output

:::notes
This deck itself is the first practical demonstration of the skill: prompt Codex, get a complete markdown deck, paste it into the hosted site.
:::

---

<!--
layout: statement
accent: "#147d8f"
-->

## The deck is the artifact.

:::notes
This is the main philosophical point. The tool helps shape the deck, but the durable artifact is a readable markdown file.
:::

---

<!--
layout: split
accent: "#ffb703"
-->

## What comes next

- Theme authoring
- HTML and PDF export
- Richer layout directives
- Better asset management
- Deck import/export polish
- Collaboration experiments

:::notes
Frame the roadmap as incremental. The current prototype already proves the core loop, so next steps can deepen quality rather than rescue the foundation.
:::

---

<!--
layout: statement
background: "#101820"
accent: "#2dd4bf"
align: center
-->

## A slide tool you can understand, host, and remix.

:::notes
Close on ownership and clarity. The app is useful because it makes presentation work visible, testable, and portable.
:::
