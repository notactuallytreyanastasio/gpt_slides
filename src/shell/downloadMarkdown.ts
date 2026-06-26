export function downloadMarkdown(markdown: string, deckTitle: string): void {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${toFileSlug(deckTitle)}.md`;
  link.click();

  URL.revokeObjectURL(url);
}

function toFileSlug(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return slug.length > 0 ? slug : "markdown-deck";
}
