import type { CSSProperties } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { AspectRatio, DeckTheme, Slide } from "../core";

type SlideRendererProps = {
  readonly aspectRatio: AspectRatio;
  readonly isThumbnail?: boolean;
  readonly slide: Slide;
  readonly theme: DeckTheme;
};

const themeDefaults: Record<
  DeckTheme,
  { readonly background: string; readonly foreground: string; readonly accent: string }
> = {
  studio: {
    background: "#fdfcf8",
    foreground: "#16202a",
    accent: "#147d8f",
  },
  paper: {
    background: "#fffdf5",
    foreground: "#1f2933",
    accent: "#c2410c",
  },
  midnight: {
    background: "#101820",
    foreground: "#f8fafc",
    accent: "#2dd4bf",
  },
};

export function SlideRenderer({
  aspectRatio,
  isThumbnail = false,
  slide,
  theme,
}: SlideRendererProps) {
  const defaults = themeDefaults[theme];
  const style = {
    "--slide-bg": slide.style.background ?? defaults.background,
    "--slide-fg": defaults.foreground,
    "--slide-accent": slide.style.accent ?? defaults.accent,
    aspectRatio: toCssAspectRatio(aspectRatio),
  } as CSSProperties;

  return (
    <article
      className={[
        "slide-frame",
        `slide-theme-${theme}`,
        `slide-layout-${slide.layout}`,
        `slide-align-${slide.style.align}`,
        isThumbnail ? "slide-thumbnail-frame" : "",
      ].join(" ")}
      style={style}
      data-testid={isThumbnail ? "slide-thumbnail" : "slide-frame"}
      aria-label={slide.title}
    >
      <div className="slide-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{slide.markdown}</ReactMarkdown>
      </div>
    </article>
  );
}

function toCssAspectRatio(aspectRatio: AspectRatio): string {
  return aspectRatio.replace(":", " / ");
}
