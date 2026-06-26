const walkthroughSeenKey = "markdown-slides.walkthroughSeen";
const walkthroughVersion = "deck-flow-images-v1";

export function hasSeenWalkthrough(): boolean {
  try {
    return window.localStorage.getItem(walkthroughSeenKey) === walkthroughVersion;
  } catch {
    return false;
  }
}

export function markWalkthroughSeen(): void {
  try {
    window.localStorage.setItem(walkthroughSeenKey, walkthroughVersion);
  } catch {
    // The tour can still close even when storage is unavailable.
  }
}
