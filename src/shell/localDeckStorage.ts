const storageKey = "markdown-slides.currentDeck";

export type StoredDeckDraft = {
  readonly markdown: string;
  readonly updatedAt: string;
};

export function loadDeckDraft(fallbackMarkdown: string): StoredDeckDraft {
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) {
      return createDraft(fallbackMarkdown);
    }

    const parsed = JSON.parse(stored) as Partial<StoredDeckDraft>;

    if (typeof parsed.markdown !== "string") {
      return createDraft(fallbackMarkdown);
    }

    return {
      markdown: parsed.markdown,
      updatedAt:
        typeof parsed.updatedAt === "string"
          ? parsed.updatedAt
          : new Date().toISOString(),
    };
  } catch {
    return createDraft(fallbackMarkdown);
  }
}

export function saveDeckDraft(markdown: string): StoredDeckDraft {
  const draft = createDraft(markdown);

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(draft));
  } catch {
    // Storage failures should not interrupt editing in a static-only build.
  }

  return draft;
}

export function clearDeckDraft(): void {
  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    // Ignore storage failures; the caller can still reset in memory.
  }
}

function createDraft(markdown: string): StoredDeckDraft {
  return {
    markdown,
    updatedAt: new Date().toISOString(),
  };
}
