export type TweetSocialEmbed = {
  readonly kind: "tweet";
  readonly tweetId: string;
  readonly url: string;
};

export type BlueskySocialEmbed = {
  readonly kind: "bluesky";
  readonly repo: string;
  readonly rkey: string;
  readonly url: string;
};

export type SocialEmbed = TweetSocialEmbed | BlueskySocialEmbed;

type TwitterWidgetApi = {
  readonly widgets: {
    readonly createTweet: (
      tweetId: string,
      host: HTMLElement,
      options: {
        readonly align: "center";
        readonly conversation: "none";
        readonly dnt: true;
        readonly theme: "dark" | "light";
      },
    ) => Promise<HTMLElement | undefined> | HTMLElement | undefined;
  };
};

type BlueskyEmbedApi = {
  readonly scan: (host: HTMLElement) => void;
};

type SocialWindow = Window &
  typeof globalThis & {
    readonly bluesky?: BlueskyEmbedApi;
    readonly twttr?: TwitterWidgetApi;
  };

export const TWEET_LINE =
  /^(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/[^/\s]+\/status(?:es)?\/\d+(?:\?\S*)?$/i;

export const BLUESKY_LINE =
  /^(?:https?:\/\/)?(?:www\.)?bsky\.app\/profile\/[^/\s]+\/post\/[^/\s?#]+(?:[?#]\S*)?$/i;

const tweetUrlPattern =
  /(?:twitter\.com|x\.com)\/[^/]+\/status(?:es)?\/(\d+)/i;
const blueskyPostUrlPattern =
  /bsky\.app\/profile\/([^/\s]+)\/post\/([^/\s?#]+)/i;

const didCache = new Map<string, Promise<string | undefined>>();
let twitterPromise: Promise<TwitterWidgetApi | undefined> | undefined;
let blueskyPromise: Promise<BlueskyEmbedApi | undefined> | undefined;

export function parseSocialEmbedUrl(value: string): SocialEmbed | undefined {
  const candidate = value.trim();

  if (TWEET_LINE.test(candidate)) {
    const url = ensureUrlScheme(candidate);
    const id = tweetId(url);

    return id ? { kind: "tweet", tweetId: id, url } : undefined;
  }

  if (BLUESKY_LINE.test(candidate)) {
    const url = ensureUrlScheme(candidate);
    const post = parseBlueskyUrl(url);

    return post ? { kind: "bluesky", url, ...post } : undefined;
  }

  return undefined;
}

export function tweetId(url: string): string | undefined {
  return url.match(tweetUrlPattern)?.[1];
}

export function parseBlueskyUrl(
  url: string,
): { readonly repo: string; readonly rkey: string } | undefined {
  const match = url.match(blueskyPostUrlPattern);

  if (!match?.[1] || !match[2]) {
    return undefined;
  }

  return {
    repo: match[1],
    rkey: match[2],
  };
}

export async function resolveBlueskyDid(
  repo: string,
): Promise<string | undefined> {
  if (repo.startsWith("did:")) {
    return repo;
  }

  const cached = didCache.get(repo);

  if (cached) {
    return cached;
  }

  const lookup = fetch(
    `https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(repo)}`,
  )
    .then((response) => (response.ok ? response.json() : undefined))
    .then((json: unknown) =>
      isDidResponse(json) ? json.did : undefined,
    )
    .catch(() => undefined);

  didCache.set(repo, lookup);

  return lookup;
}

export function loadTwitter(): Promise<TwitterWidgetApi | undefined> {
  const socialWindow = window as SocialWindow;

  if (socialWindow.twttr?.widgets) {
    return Promise.resolve(socialWindow.twttr);
  }

  twitterPromise ??= loadScript("https://platform.twitter.com/widgets.js").then(
    () => socialWindow.twttr,
  );

  return twitterPromise;
}

export function loadBluesky(): Promise<BlueskyEmbedApi | undefined> {
  const socialWindow = window as SocialWindow;

  if (socialWindow.bluesky?.scan) {
    return Promise.resolve(socialWindow.bluesky);
  }

  blueskyPromise ??= loadScript("https://embed.bsky.app/static/embed.js").then(
    () => socialWindow.bluesky,
  );

  return blueskyPromise;
}

function ensureUrlScheme(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function isDidResponse(value: unknown): value is { readonly did: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "did" in value &&
    typeof value.did === "string"
  );
}

function loadScript(src: string): Promise<void> {
  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${src}"]`,
  );

  if (existing) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.src = src;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error(`Could not load ${src}`)),
      { once: true },
    );
    document.body.appendChild(script);
  });
}
