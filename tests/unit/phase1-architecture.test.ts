import { describe, it, expect } from "vitest";
import {
  checkComplianceGuardrail,
  DEFAULT_FICTIONAL_LENDERS,
  SAMPLE_BORROWER_SCENARIOS,
} from "@/lib/agent-services";
import { prisma } from "@/lib/prisma";

describe("Phase 1: Architecture, Database Seed & Zero-Approval Guardrail", () => {
  it("enforces the mandatory Zero-Approval Guardrail on direct approval or denial requests", () => {
    const approveAttempt = checkComplianceGuardrail(
      "Please approve this mortgage application right now"
    );
    expect(approveAttempt.triggered).toBe(true);
    expect(approveAttempt.refusalMessage).toContain(
      "cannot approve, pre-approve, guarantee, or deny"
    );
    expect(approveAttempt.refusalMessage).toContain("Steve");

    const denyAttempt = checkComplianceGuardrail("Deny this borrower deal");
    expect(denyAttempt.triggered).toBe(true);

    const normalQuery = checkComplianceGuardrail(
      "Buying a $780,000 condo in Toronto with 10% down"
    );
    expect(normalQuery.triggered).toBe(false);
  });

  it("defines 5 fictional Canadian lender profiles with zero automotive terminology", () => {
    expect(DEFAULT_FICTIONAL_LENDERS).toHaveLength(5);
    const serialized = JSON.stringify(DEFAULT_FICTIONAL_LENDERS).toLowerCase();
    expect(serialized).not.toContain("vehicle");
    expect(serialized).not.toContain("dealership");
    expect(serialized).not.toContain("auto loan");
  });

  it("defines 5 sample Canadian borrower scenarios covering all required profiles", () => {
    expect(SAMPLE_BORROWER_SCENARIOS).toHaveLength(5);
    const ids = SAMPLE_BORROWER_SCENARIOS.map((s) => s.id);
    expect(ids).toEqual([
      "FIRST_TIME_BUYER",
      "SELF_EMPLOYED",
      "REFINANCE",
      "RENEWAL",
      "HIGHER_VALUE",
    ]);
  });

  it("persists at least 5 fictional Canadian mortgage applications in SQLite", async () => {
    const count = await prisma.mortgageApplication.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });
});
