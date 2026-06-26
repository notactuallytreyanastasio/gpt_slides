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
    title: "Write markdown here",
    body: "This editor is the source of truth. Frontmatter controls the deck, --- starts a new slide, and notes stay inside notes blocks.",
    target: "[data-tour='source']",
  },
  {
    title: "Watch the slide take shape",
    body: "The canvas recompiles as you type, so you can judge layout, emphasis, image scale, and rhythm without leaving the editor.",
    target: "[data-tour='canvas']",
  },
  {
    title: "Skim the deck rhythm",
    body: "The outline gives you quick slide selection and a visual sense of pacing across the whole deck.",
    target: "[data-tour='outline']",
  },
  {
    title: "Check notes and density",
    body: "The inspector keeps speaker notes and simple slide stats close by while you tune the story.",
    target: "[data-tour='inspector']",
  },
  {
    title: "Present or export quickly",
    body: "Use the toolbar to reset the sample, download markdown, replay this walkthrough, or jump into presentation mode.",
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
