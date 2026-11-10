import { describe, it, expect } from "vitest";
import {
  calculateMortgagePayment,
  calculateAffordability,
  calculateGdsTds,
  calculateRefinanceScenario,
  calculateDownPaymentAndLtv,
  calculateAmortizationComparison,
  calculateStressTest,
} from "@/lib/mortgage-calculators";
import { evaluateApplicationQualificationAndLenders } from "@/lib/agent-services";

describe("Phase 3: 7 Canadian Mortgage Calculators & Fictional Lender Matching", () => {
  it("1. Mortgage Payment Calculator: uses Canadian semi-annual compounding accurately", () => {
    const res = calculateMortgagePayment({
      principal: 500000,
      annualRatePct: 5.0,
      amortizationYears: 25,
      frequency: "MONTHLY",
    });
    // Effective annual rate for 5% compounded semi-annually is (1.025)^2 - 1 = 5.0625%
    expect(res.effectiveAnnualRatePct).toBeCloseTo(5.063, 2);
    // Standard Canadian monthly payment on $500k @ 5.0% semi-annual over 25 yrs is ~$2,908.02
    expect(res.monthlyEquivalentPayment).toBeCloseTo(2908.02, 1);

    const accelBiweekly = calculateMortgagePayment({
      principal: 500000,
      annualRatePct: 5.0,
      amortizationYears: 25,
      frequency: "ACCELERATED_BIWEEKLY",
    });
    expect(accelBiweekly.periodicPayment).toBeCloseTo(2908.02 / 2, 1);
    expect(accelBiweekly.effectiveYearsToPayoff).toBeLessThan(25);
  });

  it("2. Mortgage Affordability Calculator: enforces stress test and down payment rules", () => {
    const aff = calculateAffordability({
      grossAnnualIncome: 150000,
      downPaymentAmount: 80000,
      monthlyOtherDebts: 500,
      contractRatePct: 4.69,
      amortizationYears: 25,
    });
    expect(aff.estimatedMaxPurchasePrice).toBeGreaterThan(500000);
    expect(aff.qualifyingRatePct).toBeCloseTo(6.69, 2);
  });

  it("3. GDS/TDS Calculator: computes GDS and TDS with 50% condo fee inclusion", () => {
    const ratios = calculateGdsTds({
      qualifyingMonthlyPayment: 3200,
      annualPropertyTax: 3600, // $300/mo
      monthlyHeating: 150,
      monthlyCondoFees: 500, // 50% = $250/mo
      monthlyOtherDebts: 600,
      grossAnnualIncome: 144000, // $12,000/mo
    });
    // GDS numerator = 3200 + 300 + 150 + 250 = 3900 -> 3900 / 12000 = 32.5%
    expect(ratios.gdsMonthlyHousingCosts).toBe(3900);
    expect(ratios.gdsPct).toBeCloseTo(32.5, 2);
    // TDS numerator = 3900 + 600 = 4500 -> 4500 / 12000 = 37.5%
    expect(ratios.tdsPct).toBeCloseTo(37.5, 2);
    expect(ratios.passesStandardBoth).toBe(true);
  });

  it("4. Refinance Scenario Calculator: enforces 80% maximum LTV limit", () => {
    const refi = calculateRefinanceScenario({
      estimatedPropertyValue: 1000000,
      existingMortgageBalance: 450000,
      requestedNewMortgageAmount: 750000,
      currentRatePct: 5.5,
      newRatePct: 4.69,
      amortizationYears: 25,
    });
    expect(refi.maxAllowedRefinanceMortgage).toBe(800000);
    expect(refi.maxEquityAvailableToExtract).toBe(350000);
    expect(refi.requestedLtvPct).toBe(75);
    expect(refi.isWithin80LtvLimit).toBe(true);
  });

  it("5. Down Payment & LTV Calculator: calculates Canadian tiered minimums and default insurance", () => {
    // $780,000 purchase: min down = 5% of $500k ($25k) + 10% of $280k ($28k) = $53,000
    const highRatio = calculateDownPaymentAndLtv({
      propertyPrice: 780000,
      downPaymentAmount: 78000, // 10% down -> 90% LTV -> 3.10% insurance rate
      purpose: "PURCHASE",
    });
    expect(highRatio.minimumRequiredDownPayment).toBe(53000);
    expect(highRatio.meetsMinimumDownPayment).toBe(true);
    expect(highRatio.baseLtvPct).toBe(90);
    expect(highRatio.insuranceRequired).toBe(true);
    expect(highRatio.insuranceRatePct).toBe(3.1);
    expect(highRatio.insurancePremiumAmount).toBe(21762);
    expect(highRatio.totalMortgageWithInsurance).toBe(723762);
  });

  it("6. Amortization Comparison Calculator: compares 15, 20, 25, 30 yr options and Fixed vs Variable", () => {
    const comp = calculateAmortizationComparison({
      principal: 600000,
      fixedRatePct: 4.64,
      variableRatePct: 4.45,
      amortizationOptionsYears: [15, 20, 25, 30],
    });
    expect(comp.scenarios).toHaveLength(4);
    expect(comp.yearlySchedule).toHaveLength(25);
    expect(comp.scenarios[0].fixedMonthlyPayment).toBeGreaterThan(
      comp.scenarios[2].fixedMonthlyPayment
    );
  });

  it("7. OSFI B-20 Stress-Test Calculator: uses max(contract + 2.00%, 5.25% floor)", () => {
    const stHigh = calculateStressTest({
      principal: 600000,
      contractRatePct: 4.69,
      amortizationYears: 25,
    });
    expect(stHigh.qualifyingRatePct).toBe(6.69);
    expect(stHigh.usedFloorRate).toBe(false);

    const stFloor = calculateStressTest({
      principal: 600000,
      contractRatePct: 2.99,
      amortizationYears: 25,
    });
    expect(stFloor.qualifyingRatePct).toBe(5.25);
    expect(stFloor.usedFloorRate).toBe(true);
  });

  it("Agent 3 Lender Matching: evaluates 5 fictional lenders with clear fit/miss reasons", () => {
    const evalResult = evaluateApplicationQualificationAndLenders({
      purpose: "PURCHASE",
      purchasePriceOrValue: 780000,
      downPaymentAmount: 78000,
      existingMortgageBalance: 0,
      requestedMortgageAmount: 702000,
      amortizationYears: 25,
      termYears: 5,
      ratePreference: "FIXED",
      grossAnnualIncome: 178000,
      monthlyDebts: 550,
      annualPropertyTax: 4100,
      monthlyHeating: 120,
      monthlyCondoFees: 520,
      creditScoreEstimate: 745,
      employmentType: "SALARIED_FULL_TIME",
    });

    expect(evalResult.matches).toHaveLength(5);
    expect(evalResult.matches[0].fitStatus).toBe("STRONG_FIT");
    expect(evalResult.matches[0].reasonsFit.length).toBeGreaterThan(0);
  });
});
