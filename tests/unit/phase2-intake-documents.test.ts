import { describe, it, expect } from "vitest";
import {
  identifyMissingIntakeFields,
  parseConversationalIntakeMessage,
} from "@/lib/agent-services";
import { prisma } from "@/lib/prisma";

describe("Phase 2: Borrower Intake, Validation, Persistence & Document Checklist", () => {
  it("extracts Canadian mortgage parameters from conversational intake text", () => {
    const res = parseConversationalIntakeMessage(
      "We are first-time buyers purchasing a house for $820,000 in Vancouver with 15% down, earning $175k income and credit score 740",
      {}
    );
    const updates = res.updates as Record<string, any>;
    expect(res.guardrailTriggered).toBe(false);
    expect(updates.purpose).toBe("PURCHASE");
    expect(updates.isFirstTimeBuyer).toBe(true);
    expect(updates.province).toBe("BC");
    expect(updates.city).toBe("Vancouver");
    expect(updates.purchasePriceOrValue).toBe(820000);
    expect(updates.downPaymentAmount).toBe(123000);
    expect(updates.grossAnnualIncome).toBe(175000);
    expect(updates.creditScoreEstimate).toBe(740);
  });

  it("identifies missing intake fields accurately without guessing", () => {
    const missing = identifyMissingIntakeFields({
      firstName: "Jordan",
      lastName: "",
      purpose: "PURCHASE",
      purchasePriceOrValue: 0,
    });
    expect(missing).toContain("Borrower full name");
    expect(missing).toContain("Borrower email address");
    expect(missing).toContain("Property purchase price or estimated value");
  });

  it("verifies seeded document checklists include missing/inconsistent warnings and explicit manual review states", async () => {
    const bfsApp = await prisma.mortgageApplication.findUnique({
      where: { referenceCode: "CAN-MORT-2026-102" },
      include: { documentChecks: true, borrower: true },
    });

    expect(bfsApp).not.toBeNull();
    expect(bfsApp?.borrower.firstName).toBe("Tyler");

    const statuses = bfsApp?.documentChecks.map((d) => d.status) || [];
    expect(statuses).toContain("MISSING");
    expect(statuses).toContain("INCONSISTENT");
    expect(statuses).toContain("PENDING_MANUAL_REVIEW");

    const idPlaceholder = bfsApp?.documentChecks.find(
      (d) => d.category === "GOVT_ID_PLACEHOLDER"
    );
    expect(idPlaceholder?.status).toBe("PENDING_MANUAL_REVIEW");
    expect(idPlaceholder?.findingSummary).toContain("manual");
  });
});
