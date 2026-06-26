# Markdown Slides Format Reference

## Frontmatter

Use YAML frontmatter at the top of the file:

```md
---
title: Deck Title
description: Optional deck description
theme: studio
aspectRatio: "16:9"
author: Product Lab
---
```

Supported deck fields:

- `title`: non-empty string.
- `description`: optional string.
- `theme`: `studio`, `paper`, or `midnight`.
- `aspectRatio`: `16:9`, `4:3`, or `1:1`.
- `author`: optional string.

## Slide Separator

Use a line containing only `---` between slides.

## Slide Directives

Put optional slide directives in a leading HTML comment:

```md
<!--
layout: split
accent: "#ffb703"
align: center
-->

## Slide Title
```

Supported slide directive fields:

- `id`: optional stable slide ID.
- `title`: optional title override.
- `layout`: `auto`, `title`, `statement`, `bullets`, `split`, `image`, or `code`.
- `background`: optional CSS color.
- `accent`: optional CSS color.
- `align`: `start`, `center`, or `end`.

## Speaker Notes

Use notes blocks:

```md
:::notes
Say this part out loud, but do not show it on the slide.
:::
```

## Images

Use standard markdown image syntax:

```md
![Alt text](https://example.com/image.png)
```

Self-contained image embeds can use data URLs:

```md
![Alt text](data:image/png;base64,...)
```

## Example Deck

```md
---
title: Markdown Studio Demo
description: A short deck about the markdown slide workflow
theme: studio
aspectRatio: "16:9"
author: Product Lab
---

# Markdown Studio

Draft the story in plain text while the canvas keeps pace.

:::notes
Open by emphasizing that markdown remains the source of truth.
:::

---

<!--
layout: split
accent: "#ffb703"
align: center
-->

## Visual exploration should survive

- Source editor for precise control
- Live canvas for spatial judgment
- Thumbnails for rhythm and pacing
- Notes attached to each slide

---

<!--
layout: statement
accent: "#147d8f"
-->

## The deck is just a file

Version it, edit it, export it, and host it without a backend.
```
