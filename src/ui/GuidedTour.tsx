import {
  type CSSProperties,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { markWalkthroughSeen } from "../shell/walkthroughStorage";

type TourPlacement = "bottom" | "center" | "left" | "right" | "top";

type TourStep = {
  readonly title: string;
  readonly body: string;
  readonly cta?: string;
  readonly placement: TourPlacement;
  readonly target: string;
};

type GuidedTourProps = {
  readonly onClose: () => void;
};

const tourSteps: readonly TourStep[] = [
  {
    title: "Start with the whole studio",
    body: "This first screen is the product: a tile board for structure, markdown as the source of truth, and a focused preview for the selected slide.",
    cta: "Everything autosaves locally while you work.",
    placement: "center",
    target: "[data-testid='studio-shell']",
  },
  {
    title: "Tune the deck shell",
    body: "Use the title, theme, ratio, and transition controls to shape the deck without leaving markdown.",
    cta: "Every change rewrites frontmatter, so the file stays portable.",
    placement: "bottom",
    target: "[data-tour='deck-controls']",
  },
  {
    title: "Write the deck as one file",
    body: "This editor is the source of truth. Use --- for a slide to the right, -- for a slide below, and notes blocks for speaker-only guidance.",
    cta: "Drop image files here to embed them directly in the markdown.",
    placement: "right",
    target: "[data-tour='source']",
  },
  {
    title: "Use quick markdown tools",
    body: "The formatting row handles headings, emphasis, lists, links, code, and quick slide creation when you want to move fast.",
    cta: "Keyboard shortcuts still work inside the editor.",
    placement: "bottom",
    target: "[data-tour='markdown-tools']",
  },
  {
    title: "Branch the deck in four directions",
    body: "Use the arrow controls to add slides above, below, left, or right of the selected slide. The source uses --- for right and -- for down.",
    cta: "Arrow keys navigate the same grid when focus is outside the editor.",
    placement: "bottom",
    target: "[data-tour='slide-add']",
  },
  {
    title: "Browse the slide board",
    body: "The board lays horizontal columns and vertical stacks into compact tiles, so you can scan the shape of the whole deck while you think.",
    cta: "Click any tile to sync the markdown editor and preview.",
    placement: "left",
    target: "[data-tour='canvas']",
  },
  {
    title: "Preview the active slide",
    body: "The preview shows the selected slide at readable size while the board stays available for navigation.",
    cta: "Use the board, arrow keys, or editor cursor to change the active slide.",
    placement: "left",
    target: "[data-tour='outline']",
  },
  {
    title: "Check the active slide",
    body: "The inspector keeps speaker notes, layout stats, column, and row close by while you tune the selected slide.",
    cta: "Notes never render on the slide itself.",
    placement: "left",
    target: "[data-tour='inspector']",
  },
  {
    title: "Ship or present",
    body: "Use File for markdown import/export, copy a static share link, replay this tour, or jump into presentation mode.",
    cta: "The app is static-hostable and uses local storage, so there is no backend to set up.",
    placement: "bottom",
    target: "[data-tour='toolbar']",
  },
];

export function GuidedTour({ onClose }: GuidedTourProps) {
  const cardRef = useRef<HTMLElement>(null);
  const primaryActionRef = useRef<HTMLButtonElement>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [cardSize, setCardSize] = useState({ height: 0, width: 0 });
  const [targetRect, setTargetRect] = useState<DOMRect | undefined>();
  const currentStep = tourSteps[currentStepIndex];
  const isLastStep = currentStepIndex === tourSteps.length - 1;
  const highlightStyle = useMemo(
    () =>
      targetRect
        ? {
            height: `${targetRect.height + 12}px`,
            left: `${targetRect.left - 6}px`,
            top: `${targetRect.top - 6}px`,
            width: `${targetRect.width + 12}px`,
          }
        : undefined,
    [targetRect],
  );
  const cardStyle = useMemo(
    () => getTourCardStyle(currentStep.placement, targetRect, cardSize),
    [cardSize, currentStep.placement, targetRect],
  );

  useLayoutEffect(() => {
    const card = cardRef.current;

    if (!card) {
      return;
    }

    const updateCardSize = () => {
      const rect = card.getBoundingClientRect();
      setCardSize({ height: rect.height, width: rect.width });
    };

    updateCardSize();
    const resizeObserver = new ResizeObserver(updateCardSize);
    resizeObserver.observe(card);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    function readTargetRect(): void {
      const target = document.querySelector(currentStep.target);

      if (!target) {
        setTargetRect(undefined);
        return;
      }

      setTargetRect(target.getBoundingClientRect());
    }

    function scrollToTarget(): void {
      const target = document.querySelector(currentStep.target);

      if (!target) {
        setTargetRect(undefined);
        return;
      }

      target.scrollIntoView({
        block: "center",
        inline: "center",
        behavior: "smooth",
      });

      readTargetRect();
      window.setTimeout(readTargetRect, 180);
    }

    scrollToTarget();
    window.addEventListener("scroll", readTargetRect, true);
    window.addEventListener("resize", readTargetRect);

    return () => {
      window.removeEventListener("scroll", readTargetRect, true);
      window.removeEventListener("resize", readTargetRect);
    };
  }, [currentStep]);

  useEffect(() => {
    function closeWithKeyboard(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeTour();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        event.stopPropagation();
        showNextStep();
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        event.stopPropagation();

        if (currentStepIndex > 0) {
          setCurrentStepIndex((stepIndex) => stepIndex - 1);
        }
      }
    }

    window.addEventListener("keydown", closeWithKeyboard, true);

    return () => window.removeEventListener("keydown", closeWithKeyboard, true);
  });

  useEffect(() => {
    primaryActionRef.current?.focus();
  }, [currentStepIndex]);

  function closeTour(): void {
    markWalkthroughSeen();
    onClose();
  }

  function showNextStep(): void {
    if (isLastStep) {
      closeTour();
      return;
    }

    setCurrentStepIndex((stepIndex) => stepIndex + 1);
  }

  return (
    <div
      className="tour-layer"
      role="presentation"
      data-testid="guided-tour"
      data-step={currentStepIndex + 1}
    >
      <div className="tour-scrim" />
      {highlightStyle ? (
        <div className="tour-highlight" style={highlightStyle} />
      ) : null}
      <section
        ref={cardRef}
        className="tour-card"
        style={cardStyle}
        role="dialog"
        aria-live="polite"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
      >
        <p className="tour-progress">
          Step {currentStepIndex + 1} of {tourSteps.length}
        </p>
        <h2 id="tour-title">{currentStep.title}</h2>
        <p id="tour-body">{currentStep.body}</p>
        {currentStep.cta ? <p className="tour-cta">{currentStep.cta}</p> : null}
        <div className="tour-dots" aria-label="Tour progress">
          {tourSteps.map((step, stepIndex) => (
            <button
              aria-label={`Go to step ${stepIndex + 1}: ${step.title}`}
              className={stepIndex === currentStepIndex ? "active" : ""}
              key={step.title}
              type="button"
              onClick={() => setCurrentStepIndex(stepIndex)}
            />
          ))}
        </div>
        <div className="tour-actions">
          <button className="text-button" type="button" onClick={closeTour}>
            Skip
          </button>
          <button
            className="text-button"
            type="button"
            disabled={currentStepIndex === 0}
            onClick={() => setCurrentStepIndex((stepIndex) => stepIndex - 1)}
          >
            Back
          </button>
          <button
            ref={primaryActionRef}
            className="primary-button"
            type="button"
            onClick={showNextStep}
          >
            {isLastStep ? "Done" : "Next"}
          </button>
        </div>
      </section>
    </div>
  );
}

function getTourCardStyle(
  placement: TourPlacement,
  targetRect: DOMRect | undefined,
  cardSize: { readonly height: number; readonly width: number },
): CSSProperties {
  const margin = 18;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const fallbackWidth = Math.min(430, viewportWidth - margin * 2);
  const width = cardSize.width || fallbackWidth;
  const height = cardSize.height || 230;

  if (!targetRect || placement === "center") {
    return {
      left: clamp((viewportWidth - width) / 2, margin, viewportWidth - width - margin),
      top: clamp((viewportHeight - height) / 2, margin, viewportHeight - height - margin),
    };
  }

  const centerX = targetRect.left + targetRect.width / 2;
  const centerY = targetRect.top + targetRect.height / 2;
  const candidates: Record<TourPlacement, { left: number; top: number }> = {
    bottom: {
      left: centerX - width / 2,
      top: targetRect.bottom + margin,
    },
    center: {
      left: (viewportWidth - width) / 2,
      top: (viewportHeight - height) / 2,
    },
    left: {
      left: targetRect.left - width - margin,
      top: centerY - height / 2,
    },
    right: {
      left: targetRect.right + margin,
      top: centerY - height / 2,
    },
    top: {
      left: centerX - width / 2,
      top: targetRect.top - height - margin,
    },
  };
  const preferred = candidates[placement];
  const fitsPreferred =
    preferred.left >= margin &&
    preferred.top >= margin &&
    preferred.left + width <= viewportWidth - margin &&
    preferred.top + height <= viewportHeight - margin;
  const next = fitsPreferred ? preferred : candidates.bottom;

  return {
    left: clamp(next.left, margin, viewportWidth - width - margin),
    top: clamp(next.top, margin, viewportHeight - height - margin),
  };
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}
