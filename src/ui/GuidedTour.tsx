import { useEffect, useMemo, useState } from "react";

import { markWalkthroughSeen } from "../shell/walkthroughStorage";

type TourStep = {
  readonly title: string;
  readonly body: string;
  readonly target: string;
};

type GuidedTourProps = {
  readonly onClose: () => void;
};

const tourSteps: readonly TourStep[] = [
  {
    title: "Tune the deck shell",
    body: "Title, theme, ratio, and transition controls rewrite the frontmatter so the markdown remains portable.",
    target: "[data-tour='deck-controls']",
  },
  {
    title: "Shape markdown quickly",
    body: "Use the formatting row for headings, emphasis, links, lists, code, and a quick slide to the right.",
    target: "[data-tour='markdown-tools']",
  },
  {
    title: "Write markdown here",
    body: "The source stays canonical: frontmatter controls the deck, --- starts a slide, notes stay in notes blocks, and dropped image files become markdown embeds.",
    target: "[data-tour='source']",
  },
  {
    title: "Scroll the deck as it takes shape",
    body: "The preview recompiles as you type and keeps the whole deck visible, so you can judge layout, emphasis, image scale, and rhythm without leaving the editor.",
    target: "[data-tour='canvas']",
  },
  {
    title: "Branch the deck in four directions",
    body: "Use the arrow controls to add slides above, below, left, or right of the selected slide. The source uses --- for right and -- for down.",
    target: "[data-tour='slide-add']",
  },
  {
    title: "Skim the deck rhythm",
    body: "The outline groups slides by column so vertical stacks and horizontal branches stay visible while you edit.",
    target: "[data-tour='outline']",
  },
  {
    title: "Check notes and density",
    body: "The inspector keeps speaker notes and simple slide stats close by while you tune the story.",
    target: "[data-tour='inspector']",
  },
  {
    title: "Present or export quickly",
    body: "Use File for markdown import/export, copy a static share link, replay this walkthrough, or jump into presentation mode.",
    target: "[data-tour='toolbar']",
  },
];

export function GuidedTour({ onClose }: GuidedTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
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

  useEffect(() => {
    function updateTargetRect(): void {
      const target = document.querySelector(currentStep.target);
      setTargetRect(target?.getBoundingClientRect());
    }

    updateTargetRect();
    window.addEventListener("resize", updateTargetRect);

    return () => window.removeEventListener("resize", updateTargetRect);
  }, [currentStep]);

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
    <div className="tour-layer" role="presentation" data-testid="guided-tour">
      <div className="tour-scrim" />
      {highlightStyle ? (
        <div className="tour-highlight" style={highlightStyle} />
      ) : null}
      <section
        className="tour-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
      >
        <p className="tour-progress">
          Step {currentStepIndex + 1} of {tourSteps.length}
        </p>
        <h2 id="tour-title">{currentStep.title}</h2>
        <p id="tour-body">{currentStep.body}</p>
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
          <button className="primary-button" type="button" onClick={showNextStep}>
            {isLastStep ? "Done" : "Next"}
          </button>
        </div>
      </section>
    </div>
  );
}
