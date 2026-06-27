export type {
  AspectRatio,
  Deck,
  DeckMetadata,
  DeckParseIssue,
  DeckParseResult,
  DeckTheme,
  DeckTransition,
  MarkdownSourceRange,
  RequestedSlideLayout,
  Slide,
  SlideAlignment,
  SlideDensity,
  SlideDirective,
  SlideLayout,
  SlideStats,
  SlideStyle,
} from "./deck";
export {
  aspectRatioSchema,
  deckMetadataSchema,
  deckSchema,
  deckThemeSchema,
  deckTransitionSchema,
  markdownSourceRangeSchema,
  requestedSlideLayoutSchema,
  slideAlignmentSchema,
  slideDensitySchema,
  slideDirectiveSchema,
  slideLayoutSchema,
  slideSchema,
  slideStatsSchema,
  slideStyleSchema,
} from "./deck";
export { insertMarkdownSlideSource } from "./insertMarkdownSlide";
export type {
  InsertMarkdownSlideResult,
  SlideInsertDirection,
} from "./insertMarkdownSlide";
export { getSlideIndexAtMarkdownOffset } from "./markdownSourceMap";
export { parseMarkdownDeck, parseMarkdownDeckOrThrow } from "./parseMarkdownDeck";
export { updateMarkdownDeckMetadataSource } from "./updateMarkdownDeckMetadata";
export type { DeckMetadataPatch } from "./updateMarkdownDeckMetadata";
