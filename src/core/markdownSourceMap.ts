import type { Slide } from "./deck";

type SlideWithSourceRange = Pick<Slide, "index" | "sourceRange">;

export function getSlideIndexAtMarkdownOffset(
  slides: readonly SlideWithSourceRange[],
  offset: number,
): number | undefined {
  if (slides.length === 0) {
    return undefined;
  }

  const exactSlide = slides.find(
    (slide) =>
      offset >= slide.sourceRange.start && offset <= slide.sourceRange.end,
  );

  if (exactSlide) {
    return exactSlide.index;
  }

  const nextSlide = slides.find((slide) => offset < slide.sourceRange.start);

  return nextSlide?.index ?? slides[slides.length - 1]?.index;
}
