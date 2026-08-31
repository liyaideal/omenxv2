import { describe, it, expect } from "vitest";
import { resolveLegSide } from "@/lib/liteSideName";

describe("resolveLegSide", () => {
  it("1. short on Yes is a No leg", () => {
    expect(resolveLegSide({ option: "Yes", type: "short" }, null)).toEqual({
      side: "no",
      sideWord: "No",
      optionName: null,
    });
  });

  it("2. long on No is a No leg", () => {
    expect(resolveLegSide({ option: "No", type: "long" }, null).side).toBe("no");
  });

  it("3. 'Not Up' alias renders Down", () => {
    const r = resolveLegSide(
      { option: "Not Up", type: "long" },
      { side_labels: { yes: "Up", no: "Not Up" } },
    );
    expect(r.side).toBe("no");
    expect(r.sideWord).toBe("Down");
  });

  it("4. team alias on the yes side", () => {
    const r = resolveLegSide(
      { option: "Dodgers", type: "long" },
      { side_labels: { yes: "Dodgers", no: "Yankees" } },
    );
    expect(r.side).toBe("yes");
    expect(r.sideWord).toBe("Dodgers");
  });

  it("5. short on a generic multi option is a No leg", () => {
    expect(resolveLegSide({ option: "Charles Leclerc", type: "short" }, null)).toEqual({
      side: "no",
      sideWord: "No",
      optionName: "Charles Leclerc",
    });
  });

  it("6. legacy 'No: ' prefix matches the short form", () => {
    expect(resolveLegSide({ option: "No: Charles Leclerc", type: "long" }, null)).toEqual({
      side: "no",
      sideWord: "No",
      optionName: "Charles Leclerc",
    });
  });

  it("7. long on a generic multi option is a Yes leg", () => {
    const r = resolveLegSide({ option: "Charles Leclerc", type: "long" }, null);
    expect(r.side).toBe("yes");
    expect(r.optionName).toBe("Charles Leclerc");
  });
});
