const sharePrefix = "#/deck/";

export function buildMarkdownShareUrl(markdown: string): string {
  const encoded = encodeMarkdown(markdown);

  return `${window.location.origin}${window.location.pathname}${sharePrefix}${encoded}`;
}

export function readMarkdownShareHash(hash = window.location.hash): string | undefined {
  if (!hash.startsWith(sharePrefix)) {
    return undefined;
  }

  const payload = hash.slice(sharePrefix.length);

  if (!payload) {
    return undefined;
  }

  try {
    return decodeMarkdown(payload);
  } catch {
    return undefined;
  }
}

function encodeMarkdown(markdown: string): string {
  const bytes = new TextEncoder().encode(markdown);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return window
    .btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeMarkdown(payload: string): string {
  const base64 = payload
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(payload.length / 4) * 4, "=");
  const binary = window.atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}
