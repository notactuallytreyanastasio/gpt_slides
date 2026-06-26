import {
  ChevronLeft,
  ChevronRight,
  Download,
  HelpCircle,
  Maximize2,
  Minimize2,
  RotateCcw,
  Save,
} from "lucide-react";
import type { DragEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { parseMarkdownDeck } from "../core";
import { downloadMarkdown } from "../shell/downloadMarkdown";
import {
  clearDeckDraft,
  loadDeckDraft,
  saveDeckDraft,
} from "../shell/localDeckStorage";
import { hasSeenWalkthrough } from "../shell/walkthroughStorage";
import {
  imageFilesToMarkdownEmbeds,
  insertMarkdownAtSelection,
} from "../shell/imageMarkdown";
import { GuidedTour } from "./GuidedTour";
import { sampleDeckMarkdown } from "./sampleDeck";
import { SlideRenderer } from "./SlideRenderer";

export function App() {
  const sourceRef = useRef<HTMLTextAreaElement>(null);
  const initialDraft = useMemo(() => loadDeckDraft(sampleDeckMarkdown), []);
  const [markdown, setMarkdown] = useState(initialDraft.markdown);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
  const [savedAt, setSavedAt] = useState(initialDraft.updatedAt);
  const [isPresenting, setIsPresenting] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(() => !hasSeenWalkthrough());
  const [isDraggingImage, setIsDraggingImage] = useState(false);
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

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setIsPresenting(false);
        return;
      }

      if (event.key === "ArrowRight" || event.key === " ") {
        event.preventDefault();
        moveSlide(1);
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveSlide(-1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deck, isPresenting]);

  function moveSlide(delta: number): void {
    if (!deck) {
      return;
    }

    setSelectedSlideIndex((current) =>
      Math.min(Math.max(current + delta, 0), deck.slides.length - 1),
    );
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
              {selectedSlideIndex + 1} / {deck.slides.length}
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
        <div>
          <p className="eyebrow">Markdown Slides</p>
          <h1>{deck?.metadata.title ?? "Draft has errors"}</h1>
        </div>
        <div className="toolbar" aria-label="Deck actions" data-tour="toolbar">
          <span className="save-state">
            <Save aria-hidden="true" size={16} />
            {formatSavedAt(savedAt)}
          </span>
          <button
            className="icon-button"
            type="button"
            aria-label="Reset sample deck"
            title="Reset sample deck"
            onClick={resetDeck}
          >
            <RotateCcw size={18} />
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label="Download markdown"
            title="Download markdown"
            onClick={() =>
              downloadMarkdown(markdown, deck?.metadata.title ?? "markdown-deck")
            }
          >
            <Download size={18} />
          </button>
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
            className="icon-button"
            type="button"
            aria-label="Start presentation"
            title="Start presentation"
            disabled={!deck}
            onClick={() => setIsPresenting(true)}
          >
            <Maximize2 size={18} />
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
          />
        </section>

        <section className="canvas-panel" aria-labelledby="canvas-title">
          <div className="panel-heading">
            <h2 id="canvas-title">Canvas</h2>
            {deck ? (
              <span>
                {selectedSlideIndex + 1} / {deck.slides.length}
              </span>
            ) : (
              <span>Parse error</span>
            )}
          </div>

          {deck && activeSlide ? (
            <>
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
                        <span>Slide {slide.index + 1}</span>
                        <strong>{slide.title}</strong>
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
              <div className="transport" aria-label="Slide navigation">
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
                <div>
                  <strong>{activeSlide.title}</strong>
                  <span>{activeSlide.layout}</span>
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
              </div>
            </>
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
            <span>{deck?.metadata.theme ?? "studio"}</span>
          </div>

          {deck ? (
            <div className="thumbnail-list">
              {deck.slides.map((slide) => (
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
                  <span>{slide.title}</span>
                </button>
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
