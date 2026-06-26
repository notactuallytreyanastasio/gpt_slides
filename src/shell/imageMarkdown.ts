export type ImageMarkdownEmbed = {
  readonly altText: string;
  readonly markdown: string;
};

export async function imageFilesToMarkdownEmbeds(
  files: readonly File[],
): Promise<readonly ImageMarkdownEmbed[]> {
  const imageFiles = files.filter((file) => file.type.startsWith("image/"));

  return Promise.all(
    imageFiles.map(async (file) => {
      const dataUrl = await readFileAsDataUrl(file);
      const altText = toAltText(file.name);

      return {
        altText,
        markdown: `![${altText}](${dataUrl})`,
      };
    }),
  );
}

export function insertMarkdownAtSelection(
  markdown: string,
  insertion: string,
  selectionStart: number,
  selectionEnd: number,
): string {
  const prefix = markdown.slice(0, selectionStart);
  const suffix = markdown.slice(selectionEnd);
  const leadingBreak = prefix.length > 0 && !prefix.endsWith("\n") ? "\n\n" : "";
  const trailingBreak = suffix.length > 0 && !suffix.startsWith("\n") ? "\n\n" : "";

  return `${prefix}${leadingBreak}${insertion}${trailingBreak}${suffix}`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error(`Could not read ${file.name} as a data URL.`));
    });
    reader.addEventListener("error", () => {
      reject(reader.error ?? new Error(`Could not read ${file.name}.`));
    });
    reader.readAsDataURL(file);
  });
}

function toAltText(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  const words = withoutExtension
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return words.length > 0 ? words : "Dropped image";
}
