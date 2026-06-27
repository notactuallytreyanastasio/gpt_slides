---
name: create-markdown-slides
description: Create polished markdown slide decks for the Markdown Slides site/app in its deck format. Use when the user asks to draft, generate, rewrite, outline, convert, or package a presentation, talk, workshop, pitch, review, lesson, or report as a .md deck that can be pasted into or dropped into the markdown slide studio.
---

# Create Markdown Slides

## Workflow

Create a complete `.md` deck that is ready for the Markdown Slides app.

1. Clarify only genuinely missing inputs: audience, purpose, length, tone, or required source material. If enough context exists, proceed with reasonable assumptions.
2. Decide the deck arc before writing slides: opener, context, core argument, evidence/examples, next steps, close.
3. Write markdown using this app's exact deck format. Read `references/markdown-slides-format.md` when details are needed.
4. Use speaker notes for delivery guidance, not visible slide copy.
5. Prefer concise slides with strong titles, concrete language, and visual rhythm. Avoid walls of text.
6. Validate generated files with `scripts/validate_deck.py <deck.md>` when creating an artifact on disk.
7. Deliver either the markdown directly or a saved `.md` file, depending on the user's request.

## Deck Authoring Rules

- Start with YAML frontmatter containing at least `title`, `theme`, and `aspectRatio`.
- Use `---` for a new horizontal slide/column and `--` for a vertical slide below the current column.
- Use `:::notes` blocks for speaker notes.
- Use a leading HTML comment with YAML for slide directives when layout/style control matters.
- Keep each slide focused on one idea.
- Use vertical stacks sparingly for optional detail, drill-downs, examples, or speaker-controlled branches.
- Prefer explicit layouts for important slides: `title`, `statement`, `bullets`, `split`, `image`, or `code`.
- Use `layout: auto` or omit layout for straightforward slides.
- Use `accent` colors sparingly to create pacing and emphasis.
- For images, use normal markdown images. Data URLs are acceptable for self-contained dropped-in decks; external URLs are acceptable when the user wants a lighter markdown file.
- Do not invent unsupported directives.

## Slide Quality Heuristics

- Title slide: one strong title and one short subtitle.
- Statement slide: one memorable claim, usually 8-18 words.
- Bullets slide: 3-5 bullets, parallel structure.
- Split slide: heading or claim on one side, supporting bullets/detail on the other.
- Image slide: short title plus image; avoid crowding.
- Code slide: small, legible snippets; notes explain what to say.
- Notes: include transitions, context, or talk track that should not appear on the slide.

## Output Pattern

When the user asks for a deck file, create a `.md` artifact with a clear filename such as `product-review.md` or `workshop-intro.md`.

When the user asks for content inline, provide one fenced `md` block containing the full deck. Do not surround it with long explanation unless requested.

## Validation

When writing a deck file, run:

```bash
python scripts/validate_deck.py path/to/deck.md
```

Fix any reported errors before handing off. Warnings may be acceptable if they are intentional, but mention them briefly.
