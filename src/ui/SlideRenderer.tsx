import {
  Children,
  isValidElement,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";

import type { AspectRatio, DeckTheme, Slide } from "../core";
import {
  type SocialEmbed,
  parseSocialEmbedUrl,
} from "../shell/socialEmbeds";
import { SocialEmbedCard } from "./SocialEmbedCard";

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
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          urlTransform={urlTransform}
          components={{
            p({ children }) {
              const embed = getStandaloneSocialEmbed(children);

              if (embed) {
                return (
                  <SocialEmbedCard
                    embed={embed}
                    isThumbnail={isThumbnail}
                    theme={theme}
                  />
                );
              }

              return <p>{children}</p>;
            },
          }}
        >
          {slide.markdown}
        </ReactMarkdown>
      </div>
    </article>
  );
}

function toCssAspectRatio(aspectRatio: AspectRatio): string {
  return aspectRatio.replace(":", " / ");
}

function urlTransform(url: string, key: string): string {
  if (key === "src" && url.startsWith("data:image/")) {
    return url;
  }

  return defaultUrlTransform(url);
}

function getStandaloneSocialEmbed(children: ReactNode): SocialEmbed | undefined {
  const meaningfulChildren = Children.toArray(children).filter(
    (child) => !(typeof child === "string" && child.trim().length === 0),
  );

  if (meaningfulChildren.length !== 1) {
    return undefined;
  }

  const onlyChild = meaningfulChildren[0];

  if (typeof onlyChild === "string") {
    return parseSocialEmbedUrl(onlyChild);
  }

  if (!isValidElement(onlyChild)) {
    return undefined;
  }

  const element = onlyChild as ReactElement<{
    readonly children?: ReactNode;
    readonly href?: unknown;
  }>;

  if (typeof element.props.href === "string") {
    return parseSocialEmbedUrl(element.props.href);
  }

  return parseSocialEmbedUrl(getTextContent(element.props.children));
}

function getTextContent(value: ReactNode): string {
  return Children.toArray(value)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }

      if (isValidElement(child)) {
        return getTextContent(
          (child as ReactElement<{ readonly children?: ReactNode }>).props
            .children,
        );
      }

      return "";
    })
    .join("");
}
