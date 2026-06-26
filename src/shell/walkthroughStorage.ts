const walkthroughSeenKey = "markdown-slides.walkthroughSeen";

export function hasSeenWalkthrough(): boolean {
  try {
    return window.localStorage.getItem(walkthroughSeenKey) === "true";
  } catch {
    return false;
  }
}

export function markWalkthroughSeen(): void {
  try {
    window.localStorage.setItem(walkthroughSeenKey, "true");
  } catch {
    // The tour can still close even when storage is unavailable.
  }
}
