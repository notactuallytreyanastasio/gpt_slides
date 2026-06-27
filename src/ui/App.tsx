import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bold,
  ChevronLeft,
  ChevronRight,
  Code2,
  FileDown,
  FileUp,
  HelpCircle,
  Heading1,
  Heading2,
  Italic,
  Link2,
  List,
  Minimize2,
  Plus,
  Presentation,
  Quote,
  RotateCcw,
  Save,
  Share2,
} from "lucide-react";
import type { ChangeEvent, DragEvent, KeyboardEvent, MouseEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  type AspectRatio,
  type DeckTheme,
  type DeckTransition,
  type SlideInsertDirection,
  insertMarkdownSlideSource,
  parseMarkdownDeck,
  updateMarkdownDeckMetadataSource,
} from "../core";
import { downloadMarkdown } from "../shell/downloadMarkdown";
import {
  clearDeckDraft,
  loadDeckDraft,
  saveDeckDraft,
} from "../shell/localDeckStorage";
import {
  buildMarkdownShareUrl,
  readMarkdownShareHash,
} from "../shell/shareMarkdownDeck";
import { hasSeenWalkthrough } from "../shell/walkthroughStorage";
import {
  imageFilesToMarkdownEmbeds,
  insertMarkdownAtSelection,
} from "../shell/imageMarkdown";
import { GuidedTour } from "./GuidedTour";
import { sampleDeckMarkdown } from "./sampleDeck";
import { SlideRenderer } from "./SlideRenderer";

const themeOptions: readonly DeckTheme[] = ["studio", "paper", "midnight"];
const aspectRatioOptions: readonly AspectRatio[] = ["16:9", "4:3", "1:1"];
const transitionOptions: readonly DeckTransition[] = [
  "none",
  "fade",
  "slide",
  "convex",
  "concave",
  "zoom",
];

type MarkdownEdit = {
  readonly selectionEnd: number;
  readonly selectionStart: number;
  readonly value: string;
};

type MarkdownTransform = (
  value: string,
  selectionStart: number,
  selectionEnd: number,
) => MarkdownEdit;

export function App() {
  const sourceRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialDraft = useMemo(() => {
    const sharedMarkdown = readMarkdownShareHash();

    if (sharedMarkdown) {
      return {
        markdown: sharedMarkdown,
        updatedAt: new Date().toISOString(),
      };
    }

    return loadDeckDraft(sampleDeckMarkdown);
  }, []);
  const [markdown, setMarkdown] = useState(initialDraft.markdown);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
  const [savedAt, setSavedAt] = useState(initialDraft.updatedAt);
  const [isPresenting, setIsPresenting] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(() => !hasSeenWalkthrough());
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  const parseResult = useMemo(() => parseMarkdownDeck(markdown), [markdown]);
  const deck = parseResult.ok ? parseResult.deck : undefined;
  const activeSlide = deck?.slides[selectedSlideIndex] ?? deck?.slides[0];

  useEffect(() => {
    const nextDraft = saveDeckDraft(markdown);
    setSavedAt(nextDraft.updatedAt);
  }, [markdown]);

  useEffect(() => {
    if (!deck) {
      return;
    }

    if (selectedSlideIndex > deck.slides.length - 1) {
      setSelectedSlideIndex(deck.slides.length - 1);
    }
  }, [deck, selectedSlideIndex]);

  useEffect(() => {
    if (isPresenting) {
      return;
    }

    document
      .querySelector(`[data-flow-slide="${selectedSlideIndex}"]`)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [isPresenting, selectedSlideIndex]);

  useEffect(() => {
    if (!isPresenting || !deck) {
      return;
    }

    function handleKeyDown(event: globalThis.KeyboardEvent): void {
      if (event.key === "Escape") {
        setIsPresenting(false);
        return;
      }

      if (event.key === " ") {
        event.preventDefault();
        moveSlide(1);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        moveSlideHorizontally(1);
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveSlideHorizontally(-1);
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveSlideVertically(1);
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        moveSlideVertically(-1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSlide, deck, isPresenting]);

  useEffect(() => {
    if (isPresenting || !deck || !activeSlide) {
      return;
    }

    function handleKeyDown(event: globalThis.KeyboardEvent): void {
      if (isEditableTarget(event.target)) {
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        moveSlideHorizontally(1);
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveSlideHorizontally(-1);
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveSlideVertically(1);
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        moveSlideVertically(-1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSlide, deck, isPresenting]);

  useEffect(() => {
    if (!isFileMenuOpen) {
      return;
    }

    function closeMenu(): void {
      setIsFileMenuOpen(false);
    }

    function closeMenuWithKeyboard(event: globalThis.KeyboardEvent): void {
      if (event.key === "Escape") {
        setIsFileMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", closeMenu);
    window.addEventListener("keydown", closeMenuWithKeyboard);

    return () => {
      window.removeEventListener("mousedown", closeMenu);
      window.removeEventListener("keydown", closeMenuWithKeyboard);
    };
  }, [isFileMenuOpen]);

  function moveSlide(delta: number): void {
    if (!deck) {
      return;
    }

    setSelectedSlideIndex((current) =>
      Math.min(Math.max(current + delta, 0), deck.slides.length - 1),
    );
  }

  function moveSlideVertically(delta: number): void {
    if (!deck || !activeSlide) {
      return;
    }

    const target = deck.columns[activeSlide.columnIndex]?.[
      activeSlide.rowIndex + delta
    ];

    if (target) {
      setSelectedSlideIndex(target.index);
    }
  }

  function moveSlideHorizontally(delta: number): void {
    if (!deck || !activeSlide) {
      return;
    }

    const targetColumn = deck.columns[activeSlide.columnIndex + delta];

    if (!targetColumn) {
      return;
    }

    const targetRowIndex = Math.min(activeSlide.rowIndex, targetColumn.length - 1);
    setSelectedSlideIndex(targetColumn[targetRowIndex].index);
  }

  function updateDeckMetadata(
    patch: Parameters<typeof updateMarkdownDeckMetadataSource>[1],
  ): void {
    setMarkdown((currentMarkdown) =>
      updateMarkdownDeckMetadataSource(currentMarkdown, patch),
    );
  }

  function updateDeckTitle(value: string): void {
    updateDeckMetadata({
      title: value.trim().length > 0 ? value : "Untitled deck",
    });
  }

  function applyMarkdownTransform(transform: MarkdownTransform): void {
    const textarea = sourceRef.current;

    if (!textarea) {
      return;
    }

    const edit = transform(
      markdown,
      textarea.selectionStart,
      textarea.selectionEnd,
    );

    setMarkdown(edit.value);
    window.requestAnimationFrame(() => {
      sourceRef.current?.focus();
      sourceRef.current?.setSelectionRange(
        edit.selectionStart,
        edit.selectionEnd,
      );
    });
  }

  function handleMarkdownShortcut(
    event: KeyboardEvent<HTMLTextAreaElement>,
  ): void {
    if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) {
      return;
    }

    const key = event.key.toLowerCase();

    if (key === "b") {
      event.preventDefault();
      applyMarkdownTransform(wrapSelection("**", "**", "bold text"));
    }

    if (key === "i") {
      event.preventDefault();
      applyMarkdownTransform(wrapSelection("*", "*", "italic text"));
    }

    if (key === "k") {
      event.preventDefault();
      applyMarkdownTransform(insertLink);
    }
  }

  function keepEditorFocus(event: MouseEvent<HTMLButtonElement>): void {
    event.preventDefault();
  }

  async function importMarkdownFile(file: File): Promise<void> {
    let importedMarkdown: string;

    try {
      importedMarkdown = await file.text();
    } catch {
      window.alert(`Could not read ${file.name}.`);
      return;
    }

    const imported = parseMarkdownDeck(importedMarkdown);

    if (!imported.ok) {
      const message = imported.issues
        .map((issue) => {
          const path =
            issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";

          return `${path}${issue.message}`;
        })
        .join("\n");

      window.alert(`That markdown deck has parse issues:\n${message}`);
      return;
    }

    setMarkdown(importedMarkdown);
    setSelectedSlideIndex(0);
  }

  function handleFileImport(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];

    if (file) {
      void importMarkdownFile(file);
    }

    event.target.value = "";
  }

  async function copyShareLink(): Promise<void> {
    const url = buildMarkdownShareUrl(markdown);

    try {
      await navigator.clipboard.writeText(url);
      setShareState("copied");
      window.setTimeout(() => setShareState("idle"), 1600);
    } catch {
      window.prompt("Copy this deck link", url);
    }
  }

  function addSlide(direction: SlideInsertDirection): void {
    const result = insertMarkdownSlideSource(
      markdown,
      selectedSlideIndex,
      direction,
    );

    setMarkdown(result.markdown);
    setSelectedSlideIndex(result.insertedSlideIndex);
    window.requestAnimationFrame(() => sourceRef.current?.focus());
  }

  function resetDeck(): void {
    clearDeckDraft();
    setMarkdown(sampleDeckMarkdown);
    setSelectedSlideIndex(0);
  }

  async function insertDroppedImages(files: readonly File[]): Promise<void> {
    const embeds = await imageFilesToMarkdownEmbeds(files);

    if (embeds.length === 0) {
      return;
    }

    const textarea = sourceRef.current;
    const selectionStart = textarea?.selectionStart ?? markdown.length;
    const selectionEnd = textarea?.selectionEnd ?? selectionStart;
    const insertion = embeds.map((embed) => embed.markdown).join("\n\n");
    const leadingBreakLength =
      selectionStart > 0 && !markdown.slice(0, selectionStart).endsWith("\n")
        ? 2
        : 0;
    const nextMarkdown = insertMarkdownAtSelection(
      markdown,
      insertion,
      selectionStart,
      selectionEnd,
    );
    const nextCursorPosition =
      selectionStart + leadingBreakLength + insertion.length;

    setMarkdown(nextMarkdown);
    window.requestAnimationFrame(() => {
      sourceRef.current?.focus();
      sourceRef.current?.setSelectionRange(nextCursorPosition, nextCursorPosition);
    });
  }

  function handleSourceDragOver(event: DragEvent<HTMLTextAreaElement>): void {
    if (hasImageFiles(event.dataTransfer)) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      setIsDraggingImage(true);
    }
  }

  async function handleSourceDrop(
    event: DragEvent<HTMLTextAreaElement>,
  ): Promise<void> {
    if (!hasImageFiles(event.dataTransfer)) {
      return;
    }

    event.preventDefault();
    setIsDraggingImage(false);
    await insertDroppedImages(Array.from(event.dataTransfer.files));
  }

  if (isPresenting && deck && activeSlide) {
    return (
      <main
        className="presenter-shell"
        aria-label="Presentation mode"
        data-testid="presenter-shell"
      >
        <div className="presenter-stage" data-testid="presenter-stage">
          <SlideRenderer
            aspectRatio={deck.metadata.aspectRatio}
            slide={activeSlide}
            theme={deck.metadata.theme}
          />
        </div>
        <footer className="presenter-bar">
          <button
            className="icon-button"
            type="button"
            aria-label="Previous slide"
            title="Previous slide"
            disabled={selectedSlideIndex === 0}
            onClick={() => moveSlide(-1)}
          >
            <ChevronLeft size={18} />
          </button>
          <div className="presenter-meta">
            <strong>{activeSlide.title}</strong>
            <span>
              {activeSlide.positionLabel} / {deck.slides.length}
            </span>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="Next slide"
            title="Next slide"
            disabled={selectedSlideIndex === deck.slides.length - 1}
            onClick={() => moveSlide(1)}
          >
            <ChevronRight size={18} />
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label="Exit presentation"
            title="Exit presentation"
            onClick={() => setIsPresenting(false)}
          >
            <Minimize2 size={18} />
          </button>
        </footer>
      </main>
    );
  }

  return (
    <main className="studio-shell" data-testid="studio-shell">
      <header className="topbar">
        <div className="deck-identity">
          <span className="brand-mark" aria-hidden="true">
            ◆
          </span>
          <label className="deck-title-control">
            <span className="eyebrow">Markdown Slides</span>
            <input
              className="deck-title-input"
              aria-label="Deck title"
              value={deck?.metadata.title ?? "Draft has errors"}
              disabled={!deck}
              onChange={(event) => updateDeckTitle(event.target.value)}
            />
          </label>
          <span className="save-state">
            <Save aria-hidden="true" size={15} />
            {formatSavedAt(savedAt)}
          </span>
        </div>

        <div
          className="deck-controls"
          aria-label="Deck metadata controls"
          data-tour="deck-controls"
        >
          <label>
            <span>Theme</span>
            <select
              aria-label="Theme"
              value={deck?.metadata.theme ?? "studio"}
              disabled={!deck}
              onChange={(event) =>
                updateDeckMetadata({
                  theme: event.target.value as DeckTheme,
                })
              }
            >
              {themeOptions.map((theme) => (
                <option key={theme} value={theme}>
                  {theme}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Ratio</span>
            <select
              aria-label="Aspect ratio"
              value={deck?.metadata.aspectRatio ?? "16:9"}
              disabled={!deck}
              onChange={(event) =>
                updateDeckMetadata({
                  aspectRatio: event.target.value as AspectRatio,
                })
              }
            >
              {aspectRatioOptions.map((aspectRatio) => (
                <option key={aspectRatio} value={aspectRatio}>
                  {aspectRatio}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Move</span>
            <select
              aria-label="Transition"
              value={deck?.metadata.transition ?? "slide"}
              disabled={!deck}
              onChange={(event) =>
                updateDeckMetadata({
                  transition: event.target.value as DeckTransition,
                })
              }
            >
              {transitionOptions.map((transition) => (
                <option key={transition} value={transition}>
                  {transition}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="toolbar" aria-label="Deck actions" data-tour="toolbar">
          <div
            className="file-menu"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="text-button compact-button"
              type="button"
              aria-expanded={isFileMenuOpen}
              aria-haspopup="menu"
              onClick={() => setIsFileMenuOpen((isOpen) => !isOpen)}
            >
              File ▾
            </button>
            {isFileMenuOpen ? (
              <div className="menu-popover" role="menu">
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    downloadMarkdown(
                      markdown,
                      deck?.metadata.title ?? "markdown-deck",
                    );
                    setIsFileMenuOpen(false);
                  }}
                >
                  <FileDown size={15} />
                  Download markdown
                </button>
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                    setIsFileMenuOpen(false);
                  }}
                >
                  <FileUp size={15} />
                  Import markdown
                </button>
                <div className="menu-divider" />
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    resetDeck();
                    setIsFileMenuOpen(false);
                  }}
                >
                  <RotateCcw size={15} />
                  Reset sample
                </button>
              </div>
            ) : null}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,text/markdown,text/plain"
            hidden
            onChange={handleFileImport}
          />
          <button
            className="icon-button"
            type="button"
            aria-label="Copy share link"
            title="Copy share link"
            onClick={() => void copyShareLink()}
          >
            <Share2 size={18} />
          </button>
          {shareState === "copied" ? (
            <span className="share-state" role="status">
              Copied
            </span>
          ) : null}
          <button
            className="icon-button"
            type="button"
            aria-label="Show walkthrough"
            title="Show walkthrough"
            onClick={() => setIsTourOpen(true)}
          >
            <HelpCircle size={18} />
          </button>
          <button
            className="primary-button present-action"
            type="button"
            aria-label="Start presentation"
            title="Start presentation"
            disabled={!deck}
            onClick={() => setIsPresenting(true)}
          >
            <Presentation size={17} />
            Present
          </button>
        </div>
      </header>

      <section className="workspace" aria-label="Deck workspace">
        <section
          className={
            isDraggingImage ? "source-panel dragging-image" : "source-panel"
          }
          aria-labelledby="source-title"
          data-tour="source"
        >
          <div className="panel-heading">
            <h2 id="source-title">Source</h2>
            <span>{markdown.length.toLocaleString()} chars</span>
          </div>
          <div
            className="markdown-toolbar"
            aria-label="Markdown formatting tools"
            data-tour="markdown-tools"
          >
            <button
              className="editor-tool"
              type="button"
              aria-label="Heading 1"
              title="Heading 1"
              onMouseDown={keepEditorFocus}
              onClick={() => applyMarkdownTransform(linePrefix("# "))}
            >
              <Heading1 size={16} />
            </button>
            <button
              className="editor-tool"
              type="button"
              aria-label="Heading 2"
              title="Heading 2"
              onMouseDown={keepEditorFocus}
              onClick={() => applyMarkdownTransform(linePrefix("## "))}
            >
              <Heading2 size={16} />
            </button>
            <button
              className="editor-tool"
              type="button"
              aria-label="Bold"
              title="Bold"
              onMouseDown={keepEditorFocus}
              onClick={() =>
                applyMarkdownTransform(wrapSelection("**", "**", "bold text"))
              }
            >
              <Bold size={16} />
            </button>
            <button
              className="editor-tool"
              type="button"
              aria-label="Italic"
              title="Italic"
              onMouseDown={keepEditorFocus}
              onClick={() =>
                applyMarkdownTransform(wrapSelection("*", "*", "italic text"))
              }
            >
              <Italic size={16} />
            </button>
            <button
              className="editor-tool"
              type="button"
              aria-label="Bullet list"
              title="Bullet list"
              onMouseDown={keepEditorFocus}
              onClick={() => applyMarkdownTransform(linePrefix("- "))}
            >
              <List size={16} />
            </button>
            <button
              className="editor-tool"
              type="button"
              aria-label="Quote"
              title="Quote"
              onMouseDown={keepEditorFocus}
              onClick={() => applyMarkdownTransform(linePrefix("> "))}
            >
              <Quote size={16} />
            </button>
            <button
              className="editor-tool"
              type="button"
              aria-label="Link"
              title="Link"
              onMouseDown={keepEditorFocus}
              onClick={() => applyMarkdownTransform(insertLink)}
            >
              <Link2 size={16} />
            </button>
            <button
              className="editor-tool"
              type="button"
              aria-label="Inline code"
              title="Inline code"
              onMouseDown={keepEditorFocus}
              onClick={() =>
                applyMarkdownTransform(wrapSelection("`", "`", "code"))
              }
            >
              <Code2 size={16} />
            </button>
            <button
              className="editor-tool"
              type="button"
              aria-label="Add slide right"
              title="Add slide right"
              onMouseDown={keepEditorFocus}
              onClick={() => addSlide("right")}
            >
              <Plus size={16} />
            </button>
            <details className="syntax-help">
              <summary aria-label="Markdown syntax tips" title="Markdown syntax tips">
                <HelpCircle size={15} />
              </summary>
              <div className="syntax-help-pop">
                <dl>
                  <div>
                    <dt>Slides</dt>
                    <dd>
                      <code>--- right, -- down</code>
                    </dd>
                  </div>
                  <div>
                    <dt>Options</dt>
                    <dd>
                      <code>&lt;!-- layout: split --&gt;</code>
                    </dd>
                  </div>
                  <div>
                    <dt>Notes</dt>
                    <dd>
                      <code>:::notes</code>
                    </dd>
                  </div>
                  <div>
                    <dt>Images</dt>
                    <dd>Drop files here</dd>
                  </div>
                </dl>
              </div>
            </details>
          </div>
          <textarea
            aria-label="Markdown source"
            data-testid="markdown-source"
            ref={sourceRef}
            spellCheck={false}
            value={markdown}
            onChange={(event) => setMarkdown(event.target.value)}
            onDragLeave={() => setIsDraggingImage(false)}
            onDragOver={handleSourceDragOver}
            onDrop={handleSourceDrop}
            onKeyDown={handleMarkdownShortcut}
          />
        </section>

        <section className="canvas-panel" aria-labelledby="canvas-title">
          <div className="panel-heading canvas-heading">
            <div>
              <h2 id="canvas-title">Canvas</h2>
              {deck ? (
                <span>
                  {activeSlide?.positionLabel ?? selectedSlideIndex + 1} /{" "}
                  {deck.slides.length} · {deck.columns.length} columns ·{" "}
                  {deck.metadata.transition}
                </span>
              ) : (
                <span>Parse error</span>
              )}
            </div>
            {deck && activeSlide ? (
              <div className="canvas-actions">
                <div
                  className="slide-add-controls"
                  aria-label="Add slides around selected slide"
                  data-tour="slide-add"
                >
                  <button
                    className="icon-button"
                    type="button"
                    aria-label="Add slide above"
                    title="Add slide above"
                    onClick={() => addSlide("up")}
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    className="icon-button"
                    type="button"
                    aria-label="Add slide left"
                    title="Add slide left"
                    onClick={() => addSlide("left")}
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <button
                    className="icon-button"
                    type="button"
                    aria-label="Add slide right"
                    title="Add slide right"
                    onClick={() => addSlide("right")}
                  >
                    <ArrowRight size={16} />
                  </button>
                  <button
                    className="icon-button"
                    type="button"
                    aria-label="Add slide below"
                    title="Add slide below"
                    onClick={() => addSlide("down")}
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>
                <div className="transport compact-transport" aria-label="Slide navigation">
                  <button
                    className="icon-button"
                    type="button"
                    aria-label="Previous slide"
                    title="Previous slide"
                    disabled={selectedSlideIndex === 0}
                    onClick={() => moveSlide(-1)}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    className="icon-button"
                    type="button"
                    aria-label="Previous column"
                    title="Previous column"
                    disabled={activeSlide.columnIndex === 0}
                    onClick={() => moveSlideHorizontally(-1)}
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div>
                    <strong>{activeSlide.title}</strong>
                    <span>
                      {activeSlide.positionLabel} · {activeSlide.layout}
                    </span>
                  </div>
                  <button
                    className="icon-button"
                    type="button"
                    aria-label="Next column"
                    title="Next column"
                    disabled={activeSlide.columnIndex === deck.columns.length - 1}
                    onClick={() => moveSlideHorizontally(1)}
                  >
                    <ArrowRight size={16} />
                  </button>
                  <button
                    className="icon-button"
                    type="button"
                    aria-label="Next slide"
                    title="Next slide"
                    disabled={selectedSlideIndex === deck.slides.length - 1}
                    onClick={() => moveSlide(1)}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {deck && activeSlide ? (
            <div className="canvas-stage" data-testid="canvas-stage">
              <div className="deck-flow" data-tour="canvas">
                {deck.slides.map((slide) => (
                  <article
                    className={
                      slide.index === selectedSlideIndex
                        ? "flow-slide active"
                        : "flow-slide"
                    }
                    data-flow-slide={slide.index}
                    key={slide.id}
                    onClick={() => setSelectedSlideIndex(slide.index)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedSlideIndex(slide.index);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Select ${slide.title}`}
                  >
                    <div className="flow-slide-heading">
                      <span>Slide {slide.positionLabel}</span>
                      <strong>{slide.title}</strong>
                      <em>{slide.layout}</em>
                    </div>
                    <SlideRenderer
                      aspectRatio={deck.metadata.aspectRatio}
                      slide={slide}
                      theme={deck.metadata.theme}
                    />
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="error-panel" role="alert">
              <h2>Markdown issue</h2>
              <ul>
                {!parseResult.ok
                  ? parseResult.issues.map((issue) => (
                      <li key={`${issue.path.join(".")}-${issue.message}`}>
                        {issue.path.length > 0 ? `${issue.path.join(".")}: ` : ""}
                        {issue.message}
                      </li>
                    ))
                  : null}
              </ul>
            </div>
          )}
        </section>

        <aside
          className="outline-panel"
          aria-labelledby="outline-title"
          data-tour="outline"
        >
          <div className="panel-heading">
            <h2 id="outline-title">Slides</h2>
            <span>
              {deck
                ? `${deck.columns.length} columns · ${deck.slides.length} total`
                : "studio"}
            </span>
          </div>

          {deck ? (
            <div className="thumbnail-list">
              {deck.columns.map((column, columnIndex) => (
                <section className="thumbnail-column" key={columnIndex}>
                  <div className="thumbnail-column-heading">
                    <span>Column {columnIndex + 1}</span>
                    <small>{column.length} deep</small>
                  </div>
                  {column.map((slide) => (
                    <button
                      className={
                        slide.index === selectedSlideIndex
                          ? "thumbnail-button active"
                          : "thumbnail-button"
                      }
                      type="button"
                      key={slide.id}
                      aria-label={`Select ${slide.title}`}
                      onClick={() => setSelectedSlideIndex(slide.index)}
                    >
                      <SlideRenderer
                        aspectRatio={deck.metadata.aspectRatio}
                        isThumbnail
                        slide={slide}
                        theme={deck.metadata.theme}
                      />
                      <span className="thumbnail-meta">
                        <span>{slide.positionLabel}</span>
                        <strong>{slide.title}</strong>
                        <em>{slide.layout}</em>
                      </span>
                    </button>
                  ))}
                </section>
              ))}
            </div>
          ) : (
            <p className="muted">Resolve the parse issue to restore the outline.</p>
          )}

          {activeSlide ? (
            <section
              className="inspector"
              aria-label="Selected slide details"
              data-tour="inspector"
            >
              <dl>
                <div>
                  <dt>Density</dt>
                  <dd>{activeSlide.stats.density}</dd>
                </div>
                <div>
                  <dt>Words</dt>
                  <dd>{activeSlide.stats.wordCount}</dd>
                </div>
                <div>
                  <dt>Bullets</dt>
                  <dd>{activeSlide.stats.bulletCount}</dd>
                </div>
                <div>
                  <dt>Images</dt>
                  <dd>{activeSlide.stats.imageCount}</dd>
                </div>
                <div>
                  <dt>Code</dt>
                  <dd>{activeSlide.stats.codeBlockCount}</dd>
                </div>
                <div>
                  <dt>Align</dt>
                  <dd>{activeSlide.style.align}</dd>
                </div>
                <div>
                  <dt>Column</dt>
                  <dd>{activeSlide.columnIndex + 1}</dd>
                </div>
                <div>
                  <dt>Row</dt>
                  <dd>{activeSlide.rowIndex + 1}</dd>
                </div>
              </dl>
              <h2>Notes</h2>
              <p>{activeSlide.notes || "No notes"}</p>
            </section>
          ) : null}
        </aside>
      </section>
      {isTourOpen ? <GuidedTour onClose={() => setIsTourOpen(false)} /> : null}
    </main>
  );
}

function hasImageFiles(dataTransfer: DataTransfer): boolean {
  return Array.from(dataTransfer.items).some(
    (item) => item.kind === "file" && item.type.startsWith("image/"),
  );
}

function isEditableTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;

  return (
    !!element &&
    (element.tagName === "TEXTAREA" ||
      element.tagName === "INPUT" ||
      element.tagName === "SELECT" ||
      element.isContentEditable)
  );
}

function wrapSelection(
  before: string,
  after = before,
  placeholder = "",
): MarkdownTransform {
  return (value, selectionStart, selectionEnd) => {
    const selected = value.slice(selectionStart, selectionEnd) || placeholder;
    const nextSelectionStart = selectionStart + before.length;
    const nextSelectionEnd = nextSelectionStart + selected.length;

    return {
      selectionEnd: nextSelectionEnd,
      selectionStart: nextSelectionStart,
      value:
        value.slice(0, selectionStart) +
        before +
        selected +
        after +
        value.slice(selectionEnd),
    };
  };
}

function linePrefix(prefix: string): MarkdownTransform {
  return (value, selectionStart) => {
    const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;

    return {
      selectionEnd: selectionStart + prefix.length,
      selectionStart: selectionStart + prefix.length,
      value: value.slice(0, lineStart) + prefix + value.slice(lineStart),
    };
  };
}

function insertLink(
  value: string,
  selectionStart: number,
  selectionEnd: number,
): MarkdownEdit {
  const selected = value.slice(selectionStart, selectionEnd) || "link text";
  const insertion = `[${selected}](https://example.com)`;
  const urlStart = selectionStart + selected.length + 3;

  return {
    selectionEnd: urlStart + "https://example.com".length,
    selectionStart: urlStart,
    value:
      value.slice(0, selectionStart) +
      insertion +
      value.slice(selectionEnd),
  };
}

function formatSavedAt(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Saved";
  }

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}
