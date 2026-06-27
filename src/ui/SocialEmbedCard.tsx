import { useEffect, useRef } from "react";

import type { DeckTheme } from "../core";
import {
  type SocialEmbed,
  loadBluesky,
  loadTwitter,
  resolveBlueskyDid,
} from "../shell/socialEmbeds";

type SocialEmbedCardProps = {
  readonly embed: SocialEmbed;
  readonly isThumbnail: boolean;
  readonly theme: DeckTheme;
};

export function SocialEmbedCard({
  embed,
  isThumbnail,
  theme,
}: SocialEmbedCardProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const label = embed.kind === "tweet" ? "X post" : "Bluesky post";

  useEffect(() => {
    const host = hostRef.current;

    if (!host || isThumbnail) {
      return;
    }

    let cancelled = false;
    host.textContent = `Loading ${label}...`;

    if (embed.kind === "tweet") {
      void loadTwitter()
        .then((twitter) => {
          if (cancelled) {
            return;
          }

          if (!twitter) {
            host.textContent = `Could not load ${label}.`;
            return;
          }

          host.replaceChildren();
          void twitter.widgets.createTweet(embed.tweetId, host, {
            align: "center",
            conversation: "none",
            dnt: true,
            theme: socialColorMode(theme),
          });
        })
        .catch(() => {
          if (!cancelled) {
            host.textContent = `Could not load ${label}.`;
          }
        });
    } else {
      void resolveBlueskyDid(embed.repo)
        .then((did) => {
          if (cancelled) {
            return;
          }

          if (!did) {
            host.textContent = `Could not load ${label}.`;
            return;
          }

          const placeholder = document.createElement("div");
          placeholder.setAttribute(
            "data-bluesky-uri",
            `at://${did}/app.bsky.feed.post/${embed.rkey}`,
          );
          placeholder.dataset.blueskyEmbedColorMode = socialColorMode(theme);
          host.replaceChildren(placeholder);

          return loadBluesky();
        })
        .then((bluesky) => {
          if (cancelled) {
            return;
          }

          if (!bluesky) {
            host.textContent = `Could not load ${label}.`;
            return;
          }

          bluesky.scan(host);
        })
        .catch(() => {
          if (!cancelled) {
            host.textContent = `Could not load ${label}.`;
          }
        });
    }

    return () => {
      cancelled = true;
    };
  }, [embed, isThumbnail, label, theme]);

  if (isThumbnail) {
    return (
      <span
        className={`social-embed social-embed-${embed.kind} social-embed-thumbnail`}
        data-testid={`social-embed-${embed.kind}`}
      >
        {label}
      </span>
    );
  }

  return (
    <div
      className={`social-embed social-embed-${embed.kind}`}
      data-testid={`social-embed-${embed.kind}`}
    >
      <div
        ref={hostRef}
        className="social-embed-host"
        aria-label={label}
        aria-live="polite"
      />
      <a
        className="social-embed-link"
        href={embed.url}
        rel="noreferrer"
        target="_blank"
      >
        Open original
      </a>
    </div>
  );
}

function socialColorMode(theme: DeckTheme): "dark" | "light" {
  return theme === "midnight" ? "dark" : "light";
}
