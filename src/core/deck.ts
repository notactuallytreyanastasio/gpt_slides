import { z } from "zod";

export const deckThemeSchema = z.enum(["studio", "paper", "midnight"]);
export type DeckTheme = z.infer<typeof deckThemeSchema>;

export const aspectRatioSchema = z.enum(["16:9", "4:3", "1:1"]);
export type AspectRatio = z.infer<typeof aspectRatioSchema>;

export const slideLayoutSchema = z.enum([
  "title",
  "statement",
  "bullets",
  "split",
  "image",
  "code",
]);
export type SlideLayout = z.infer<typeof slideLayoutSchema>;

export const requestedSlideLayoutSchema = z.union([
  slideLayoutSchema,
  z.literal("auto"),
]);
export type RequestedSlideLayout = z.infer<typeof requestedSlideLayoutSchema>;

export const slideAlignmentSchema = z.enum(["start", "center", "end"]);
export type SlideAlignment = z.infer<typeof slideAlignmentSchema>;

export const slideDensitySchema = z.enum(["airy", "balanced", "dense"]);
export type SlideDensity = z.infer<typeof slideDensitySchema>;

export const deckMetadataSchema = z
  .object({
    title: z.string().trim().min(1).default("Untitled deck"),
    description: z.string().trim().optional(),
    theme: deckThemeSchema.default("studio"),
    aspectRatio: aspectRatioSchema.default("16:9"),
    author: z.string().trim().optional(),
  })
  .strict();
export type DeckMetadata = z.infer<typeof deckMetadataSchema>;

export const slideDirectiveSchema = z
  .object({
    id: z.string().trim().min(1).optional(),
    title: z.string().trim().min(1).optional(),
    layout: requestedSlideLayoutSchema.default("auto"),
    background: z.string().trim().min(1).optional(),
    accent: z.string().trim().min(1).optional(),
    align: slideAlignmentSchema.default("start"),
  })
  .strict();
export type SlideDirective = z.infer<typeof slideDirectiveSchema>;

export const slideStyleSchema = z.object({
  background: z.string().optional(),
  accent: z.string().optional(),
  align: slideAlignmentSchema,
});
export type SlideStyle = z.infer<typeof slideStyleSchema>;

export const slideStatsSchema = z.object({
  wordCount: z.number().int().nonnegative(),
  bulletCount: z.number().int().nonnegative(),
  imageCount: z.number().int().nonnegative(),
  codeBlockCount: z.number().int().nonnegative(),
  density: slideDensitySchema,
});
export type SlideStats = z.infer<typeof slideStatsSchema>;

export const slideSchema = z.object({
  id: z.string(),
  index: z.number().int().nonnegative(),
  title: z.string(),
  layout: slideLayoutSchema,
  requestedLayout: requestedSlideLayoutSchema,
  markdown: z.string(),
  notes: z.string(),
  style: slideStyleSchema,
  stats: slideStatsSchema,
});
export type Slide = z.infer<typeof slideSchema>;

export const deckSchema = z.object({
  metadata: deckMetadataSchema,
  slides: z.array(slideSchema).min(1),
  source: z.object({
    markdown: z.string(),
  }),
});
export type Deck = z.infer<typeof deckSchema>;

export type DeckParseIssue = {
  readonly message: string;
  readonly path: readonly (string | number)[];
};

export type DeckParseResult =
  | {
      readonly ok: true;
      readonly deck: Deck;
    }
  | {
      readonly ok: false;
      readonly issues: readonly DeckParseIssue[];
    };
