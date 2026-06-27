import { describe, expect, it } from "vitest";

import {
  parseBlueskyUrl,
  parseSocialEmbedUrl,
  tweetId,
} from "./socialEmbeds";

describe("social embed parsing", () => {
  it("recognizes standalone X and Twitter status URLs", () => {
    expect(tweetId("https://x.com/jack/status/20")).toBe("20");
    expect(parseSocialEmbedUrl("x.com/jack/statuses/20?ref=deck")).toEqual({
      kind: "tweet",
      tweetId: "20",
      url: "https://x.com/jack/statuses/20?ref=deck",
    });
    expect(
      parseSocialEmbedUrl("https://twitter.com/example/status/12345"),
    ).toMatchObject({
      kind: "tweet",
      tweetId: "12345",
    });
  });

  it("recognizes standalone Bluesky post URLs", () => {
    expect(
      parseBlueskyUrl(
        "https://bsky.app/profile/example.bsky.social/post/3abcxyz",
      ),
    ).toEqual({
      repo: "example.bsky.social",
      rkey: "3abcxyz",
    });
    expect(
      parseSocialEmbedUrl(
        "bsky.app/profile/did:plc:example123/post/3abcxyz?ref=deck",
      ),
    ).toEqual({
      kind: "bluesky",
      repo: "did:plc:example123",
      rkey: "3abcxyz",
      url: "https://bsky.app/profile/did:plc:example123/post/3abcxyz?ref=deck",
    });
  });

  it("ignores regular prose and unsupported links", () => {
    expect(
      parseSocialEmbedUrl("Read https://x.com/jack/status/20 with context"),
    ).toBeUndefined();
    expect(parseSocialEmbedUrl("https://example.com/post/20")).toBeUndefined();
  });
});
