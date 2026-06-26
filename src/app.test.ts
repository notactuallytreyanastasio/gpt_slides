import { describe, expect, it } from "vitest";

describe("application scaffold", () => {
  it("runs the test harness", () => {
    expect("markdown slides").toContain("slides");
  });
});
