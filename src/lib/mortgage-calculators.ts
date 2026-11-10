/**
 * Canadian Mortgage Calculation Services
 *
 * Implements deterministic, transparent Canadian mortgage mathematics:
 * 1. Mortgage Payment Calculator (semi-annual compounding by law under the Interest Act (Canada))
 * 2. Mortgage Affordability Calculator
 * 3. Gross Debt Service (GDS) & Total Debt Service (TDS) Ratio Calculator
 * 4. Refinance Scenario & Equity Calculator (80% LTV cap)
 * 5. Minimum Down Payment, LTV & Default Insurance (CMHC / Sagen / Canada Guaranty) Calculator
 * 6. Amortization Schedule & Comparison Calculator
 * 7. OSFI B-20 Mortgage Stress-Test Calculator
 *
 * IMPORTANT GOVERNANCE NOTE:
 * All policy thresholds are configurable and dated (Default Reference Baseline: 2026-01-01).
 * Calculations are illustrative only and never constitute a mortgage approval or lending commitment.
 */

export interface CanadianPolicyConfig {
  effectiveDate: string;
  benchmarkFloorRatePct: number; // e.g., 5.25%
  stressTestBufferPct: number; // e.g., 2.00%
  maxInsuredPriceCad: number; // e.g., $1,500,000
  firstTierThresholdCad: number; // $500,000 (5% min down up to here, 10% above up to cap)
  maxRefinanceLtvPct: number; // 80.0%
  standardMaxGdsPct: number; // 39.0%
  standardMaxTdsPct: number; // 44.0%
  condoFeeInclusionRatio: number; // 0.50 (50% of monthly condo fees included in GDS/TDS)
}

export const DEFAULT_CANADIAN_POLICY_CONFIG: CanadianPolicyConfig = {
  effectiveDate: process.env.POLICY_EFFECTIVE_DATE || "2026-01-01",
  benchmarkFloorRatePct: Number(process.env.OSFI_BENCHMARK_FLOOR_RATE) || 5.25,
  stressTestBufferPct: Number(process.env.OSFI_STRESS_BUFFER_PCT) || 2.0,
  maxInsuredPriceCad: Number(process.env.INSURED_PRICE_CEILING_CAD) || 1500000,
  firstTierThresholdCad: 500000,
  maxRefinanceLtvPct: 80.0,
  standardMaxGdsPct: Number(process.env.STANDARD_MAX_GDS_PCT) || 39.0,
  standardMaxTdsPct: Number(process.env.STANDARD_MAX_TDS_PCT) || 44.0,
  condoFeeInclusionRatio: 0.5,
};

export type PaymentFrequency =
  | "MONTHLY"
  | "BIWEEKLY"
  | "ACCELERATED_BIWEEKLY"
  | "WEEKLY"
  | "ACCELERATED_WEEKLY";

/**
 * Converts a nominal annual interest rate compounded semi-annually (Canadian fixed-rate standard)
 * into an effective periodic rate for the specified number of payments per year.
 *
 * Formula: i_p = (1 + (r / 100) / 2)^(2 / paymentsPerYear) - 1
 */
export function getCanadianPeriodicRate(
  annualNominalRatePct: number,
  paymentsPerYear: number = 12
): number {
  if (annualNominalRatePct <= 0) return 0;
  const semiAnnualRate = annualNominalRatePct / 100 / 2;
  return Math.pow(1 + semiAnnualRate, 2 / paymentsPerYear) - 1;
}

/**
 * 1. Canadian Mortgage Payment Calculator
 * Calculates periodic payment, monthly-equivalent payment, total interest, and effective annual rate.
 */
export function calculateMortgagePayment(params: {
  principal: number;
  annualRatePct: number;
  amortizationYears: number;
  frequency?: PaymentFrequency;
}) {
  const principal = Math.max(0, params.principal);
  const annualRatePct = Math.max(0, params.annualRatePct);
  const amortizationYears = Math.max(1, params.amortizationYears);
  const frequency: PaymentFrequency = params.frequency || "MONTHLY";

  if (principal === 0) {
    return {
      periodicPayment: 0,
      monthlyEquivalentPayment: 0,
      annualTotalPayment: 0,
      totalInterestOverAmortization: 0,
      totalPaidOverAmortization: 0,
      effectiveAnnualRatePct: 0,
      effectiveYearsToPayoff: amortizationYears,
      frequency,
    };
  }

  const totalMonths = amortizationYears * 12;
  const monthlyRate = getCanadianPeriodicRate(annualRatePct, 12);

  const baseMonthlyPayment =
    monthlyRate === 0
      ? principal / totalMonths
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1);

  let periodicPayment = baseMonthlyPayment;
  let paymentsPerYear = 12;

  if (frequency === "BIWEEKLY") {
    paymentsPerYear = 26;
    const biweeklyRate = getCanadianPeriodicRate(annualRatePct, 26);
    const totalBiweeklyPeriods = amortizationYears * 26;
    periodicPayment =
      biweeklyRate === 0
        ? principal / totalBiweeklyPeriods
        : (principal * biweeklyRate * Math.pow(1 + biweeklyRate, totalBiweeklyPeriods)) /
          (Math.pow(1 + biweeklyRate, totalBiweeklyPeriods) - 1);
  } else if (frequency === "ACCELERATED_BIWEEKLY") {
    paymentsPerYear = 26;
    periodicPayment = baseMonthlyPayment / 2;
  } else if (frequency === "WEEKLY") {
    paymentsPerYear = 52;
    const weeklyRate = getCanadianPeriodicRate(annualRatePct, 52);
    const totalWeeklyPeriods = amortizationYears * 52;
    periodicPayment =
      weeklyRate === 0
        ? principal / totalWeeklyPeriods
        : (principal * weeklyRate * Math.pow(1 + weeklyRate, totalWeeklyPeriods)) /
          (Math.pow(1 + weeklyRate, totalWeeklyPeriods) - 1);
  } else if (frequency === "ACCELERATED_WEEKLY") {
    paymentsPerYear = 52;
    periodicPayment = baseMonthlyPayment / 4;
  }

  // Simulate payoff to compute exact total interest and effective payoff years (especially for accelerated frequencies)
  const periodicInterestRate = getCanadianPeriodicRate(annualRatePct, paymentsPerYear);
  let balance = principal;
  let periodsElapsed = 0;
  let totalInterest = 0;
  const maxPeriods = amortizationYears * paymentsPerYear + 10;

  while (balance > 0.01 && periodsElapsed < maxPeriods) {
    const interestPortion = balance * periodicInterestRate;
    const actualPayment = Math.min(periodicPayment, balance + interestPortion);
    const principalPortion = actualPayment - interestPortion;
    if (principalPortion <= 0) break;
    balance = Math.max(0, balance - principalPortion);
    totalInterest += interestPortion;
    periodsElapsed++;
  }

  const effectiveAnnualRatePct =
    (Math.pow(1 + annualRatePct / 100 / 2, 2) - 1) * 100;

  return {
    periodicPayment: Number(periodicPayment.toFixed(2)),
    monthlyEquivalentPayment: Number(baseMonthlyPayment.toFixed(2)),
    annualTotalPayment: Number((periodicPayment * paymentsPerYear).toFixed(2)),
    totalInterestOverAmortization: Math.round(totalInterest),
    totalPaidOverAmortization: Math.round(principal + totalInterest),
    effectiveAnnualRatePct: Number(effectiveAnnualRatePct.toFixed(3)),
    effectiveYearsToPayoff: Number((periodsElapsed / paymentsPerYear).toFixed(1)),
    frequency,
  };
}

/**
 * 5. Down Payment, LTV & Default Insurance Calculator (CMHC / Sagen / Canada Guaranty)
 */
export function calculateDownPaymentAndLtv(
  params: {
    propertyPrice: number;
    downPaymentAmount: number;
    purpose?: "PURCHASE" | "REFINANCE" | "RENEWAL";
    amortizationYears?: number;
    isFirstTimeBuyer?: boolean;
  },
  config: CanadianPolicyConfig = DEFAULT_CANADIAN_POLICY_CONFIG
) {
  const price = Math.max(0, params.propertyPrice);
  const down = Math.max(0, params.downPaymentAmount);
  const purpose = params.purpose || "PURCHASE";

  if (price === 0) {
    return {
      minimumRequiredDownPayment: 0,
      minimumDownPaymentPct: 0,
      actualDownPaymentPct: 0,
      meetsMinimumDownPayment: false,
      baseLoanAmount: 0,
      baseLtvPct: 0,
      insuranceRequired: false,
      insuranceEligible: false,
      insuranceRatePct: 0,
      insurancePremiumAmount: 0,
      totalMortgageWithInsurance: 0,
      effectiveLtvPct: 0,
      policyExplanation: "Enter a positive property value to calculate down payment and LTV.",
    };
  }

  // Minimum down payment calculation
  let minimumRequiredDownPayment = 0;
  if (purpose === "REFINANCE") {
    minimumRequiredDownPayment = price * (1 - config.maxRefinanceLtvPct / 100);
  } else if (price >= config.maxInsuredPriceCad) {
    minimumRequiredDownPayment = price * 0.2;
  } else if (price <= config.firstTierThresholdCad) {
    minimumRequiredDownPayment = price * 0.05;
  } else {
    minimumRequiredDownPayment =
      config.firstTierThresholdCad * 0.05 +
      (price - config.firstTierThresholdCad) * 0.1;
  }

  const minimumDownPaymentPct = (minimumRequiredDownPayment / price) * 100;
  const actualDownPaymentPct = (down / price) * 100;
  const meetsMinimumDownPayment = down + 0.01 >= minimumRequiredDownPayment;

  const baseLoanAmount = Math.max(0, price - down);
  const baseLtvPct = (baseLoanAmount / price) * 100;

  // High-ratio mortgage default insurance rules
  const insuranceRequired = purpose === "PURCHASE" && baseLtvPct > 80.0;
  const insuranceEligible =
    insuranceRequired &&
    price < config.maxInsuredPriceCad &&
    meetsMinimumDownPayment &&
    baseLtvPct <= 95.0;

  let insuranceRatePct = 0;
  if (insuranceRequired && insuranceEligible) {
    if (baseLtvPct <= 85.0) {
      insuranceRatePct = 2.8;
    } else if (baseLtvPct <= 90.0) {
      insuranceRatePct = 3.1;
    } else {
      insuranceRatePct = 4.0;
    }
    // 30-year insured amortization surcharge (+0.20%) for eligible first-time buyers
    if ((params.amortizationYears || 25) > 25) {
      insuranceRatePct += 0.2;
    }
  }

  const insurancePremiumAmount = Math.round(baseLoanAmount * (insuranceRatePct / 100));
  const totalMortgageWithInsurance = baseLoanAmount + insurancePremiumAmount;
  const effectiveLtvPct = (totalMortgageWithInsurance / price) * 100;

  let policyExplanation = "";
  if (!meetsMinimumDownPayment) {
    policyExplanation = `Down payment ($${down.toLocaleString()}) is below the Canadian regulatory minimum of $${Math.round(
      minimumRequiredDownPayment
    ).toLocaleString()} (${minimumDownPaymentPct.toFixed(1)}%) for a $${price.toLocaleString()} property.`;
  } else if (insuranceRequired && !insuranceEligible) {
    policyExplanation = `Properties priced at or above $${config.maxInsuredPriceCad.toLocaleString()} require a minimum 20% down payment and are ineligible for high-ratio default insurance.`;
  } else if (insuranceRequired) {
    policyExplanation = `High-ratio mortgage (LTV ${baseLtvPct.toFixed(
      1
    )}% > 80%): Mortgage default insurance (${insuranceRatePct.toFixed(
      2
    )}% = $${insurancePremiumAmount.toLocaleString()}) is added to the loan balance.`;
  } else {
    policyExplanation = `Conventional low-ratio mortgage (LTV ${baseLtvPct.toFixed(
      1
    )}% <= 80%): No mortgage default insurance premium required.`;
  }

  return {
    minimumRequiredDownPayment: Math.round(minimumRequiredDownPayment),
    minimumDownPaymentPct: Number(minimumDownPaymentPct.toFixed(2)),
    actualDownPaymentPct: Number(actualDownPaymentPct.toFixed(2)),
    meetsMinimumDownPayment,
    baseLoanAmount: Math.round(baseLoanAmount),
    baseLtvPct: Number(baseLtvPct.toFixed(2)),
    insuranceRequired,
    insuranceEligible,
    insuranceRatePct: Number(insuranceRatePct.toFixed(2)),
    insurancePremiumAmount,
    totalMortgageWithInsurance: Math.round(totalMortgageWithInsurance),
    effectiveLtvPct: Number(effectiveLtvPct.toFixed(2)),
    policyExplanation,
  };
}

/**
 * 7. OSFI B-20 Mortgage Stress-Test Calculator
 * Qualifying rate = max(contractRate + buffer (2.00%), benchmarkFloor (5.25%))
 */
export function calculateStressTest(
  params: {
    principal: number;
    contractRatePct: number;
    amortizationYears: number;
  },
  config: CanadianPolicyConfig = DEFAULT_CANADIAN_POLICY_CONFIG
) {
  const qualifyingRatePct = Math.max(
    params.contractRatePct + config.stressTestBufferPct,
    config.benchmarkFloorRatePct
  );

  const contractPayment = calculateMortgagePayment({
    principal: params.principal,
    annualRatePct: params.contractRatePct,
    amortizationYears: params.amortizationYears,
    frequency: "MONTHLY",
  });

  const stressPayment = calculateMortgagePayment({
    principal: params.principal,
    annualRatePct: qualifyingRatePct,
    amortizationYears: params.amortizationYears,
    frequency: "MONTHLY",
  });

  const monthlyBufferRequired =
    stressPayment.monthlyEquivalentPayment - contractPayment.monthlyEquivalentPayment;

  return {
    contractRatePct: Number(params.contractRatePct.toFixed(2)),
    qualifyingRatePct: Number(qualifyingRatePct.toFixed(2)),
    benchmarkFloorPct: config.benchmarkFloorRatePct,
    bufferPct: config.stressTestBufferPct,
    usedFloorRate:
      config.benchmarkFloorRatePct > params.contractRatePct + config.stressTestBufferPct,
    contractMonthlyPayment: contractPayment.monthlyEquivalentPayment,
    stressTestMonthlyPayment: stressPayment.monthlyEquivalentPayment,
    monthlyPaymentIncrease: Number(monthlyBufferRequired.toFixed(2)),
    percentagePaymentIncrease:
      contractPayment.monthlyEquivalentPayment > 0
        ? Number(
            (
              (monthlyBufferRequired / contractPayment.monthlyEquivalentPayment) *
              100
            ).toFixed(1)
          )
        : 0,
    policyEffectiveDate: config.effectiveDate,
  };
}

/**
 * 3. Gross Debt Service (GDS) & Total Debt Service (TDS) Calculator
 */
export function calculateGdsTds(
  params: {
    qualifyingMonthlyPayment: number;
    annualPropertyTax: number;
    monthlyHeating: number;
    monthlyCondoFees?: number;
    monthlyOtherDebts: number;
    grossAnnualIncome: number;
  },
  config: CanadianPolicyConfig = DEFAULT_CANADIAN_POLICY_CONFIG
) {
  const grossMonthlyIncome = Math.max(0, params.grossAnnualIncome / 12);
  const monthlyPropertyTax = Math.max(0, params.annualPropertyTax / 12);
  const monthlyHeating = Math.max(0, params.monthlyHeating);
  const countedCondoFees =
    Math.max(0, params.monthlyCondoFees || 0) * config.condoFeeInclusionRatio;
  const monthlyOtherDebts = Math.max(0, params.monthlyOtherDebts);

  const gdsMonthlyHousingCosts =
    params.qualifyingMonthlyPayment +
    monthlyPropertyTax +
    monthlyHeating +
    countedCondoFees;

  const tdsMonthlyTotalObligations = gdsMonthlyHousingCosts + monthlyOtherDebts;

  const gdsPct =
    grossMonthlyIncome > 0 ? (gdsMonthlyHousingCosts / grossMonthlyIncome) * 100 : 0;
  const tdsPct =
    grossMonthlyIncome > 0
      ? (tdsMonthlyTotalObligations / grossMonthlyIncome) * 100
      : 0;

  return {
    grossMonthlyIncome: Number(grossMonthlyIncome.toFixed(2)),
    monthlyPropertyTax: Number(monthlyPropertyTax.toFixed(2)),
    monthlyHeating: Number(monthlyHeating.toFixed(2)),
    countedCondoFees: Number(countedCondoFees.toFixed(2)),
    gdsMonthlyHousingCosts: Number(gdsMonthlyHousingCosts.toFixed(2)),
    tdsMonthlyTotalObligations: Number(tdsMonthlyTotalObligations.toFixed(2)),
    gdsPct: Number(gdsPct.toFixed(2)),
    tdsPct: Number(tdsPct.toFixed(2)),
    maxStandardGdsPct: config.standardMaxGdsPct,
    maxStandardTdsPct: config.standardMaxTdsPct,
    passesStandardGds: gdsPct <= config.standardMaxGdsPct,
    passesStandardTds: tdsPct <= config.standardMaxTdsPct,
    passesStandardBoth:
      gdsPct <= config.standardMaxGdsPct && tdsPct <= config.standardMaxTdsPct,
  };
}

/**
 * 2. Canadian Mortgage Affordability Calculator
 * Estimates the maximum purchase price and mortgage amount a borrower can support under stress-test GDS/TDS caps.
 */
export function calculateAffordability(
  params: {
    grossAnnualIncome: number;
    downPaymentAmount: number;
    monthlyOtherDebts: number;
    contractRatePct: number;
    amortizationYears: number;
    annualPropertyTaxEstimate?: number;
    monthlyHeatingEstimate?: number;
    monthlyCondoFees?: number;
  },
  config: CanadianPolicyConfig = DEFAULT_CANADIAN_POLICY_CONFIG
) {
  const grossMonthlyIncome = Math.max(0, params.grossAnnualIncome / 12);
  const monthlyTax = (params.annualPropertyTaxEstimate ?? 4200) / 12;
  const monthlyHeat = params.monthlyHeatingEstimate ?? 150;
  const countedCondo = (params.monthlyCondoFees ?? 0) * config.condoFeeInclusionRatio;
  const nonPrincipalHousingCosts = monthlyTax + monthlyHeat + countedCondo;

  const maxAllowedGdsHousing = grossMonthlyIncome * (config.standardMaxGdsPct / 100);
  const maxAllowedTdsHousing =
    grossMonthlyIncome * (config.standardMaxTdsPct / 100) - params.monthlyOtherDebts;

  const maxQualifyingPayment = Math.max(
    0,
    Math.min(maxAllowedGdsHousing, maxAllowedTdsHousing) - nonPrincipalHousingCosts
  );

  const qualifyingRatePct = Math.max(
    params.contractRatePct + config.stressTestBufferPct,
    config.benchmarkFloorRatePct
  );
  const monthlyStressRate = getCanadianPeriodicRate(qualifyingRatePct, 12);
  const totalMonths = params.amortizationYears * 12;

  const maxTotalMortgageSupported =
    monthlyStressRate > 0
      ? (maxQualifyingPayment * (Math.pow(1 + monthlyStressRate, totalMonths) - 1)) /
        (monthlyStressRate * Math.pow(1 + monthlyStressRate, totalMonths))
      : maxQualifyingPayment * totalMonths;

  // Also check down-payment constraint
  const maxPurchaseFromIncome = Math.round(
    maxTotalMortgageSupported + params.downPaymentAmount
  );

  // Maximum purchase price allowed by the down payment amount under Canadian minimum down payment rules
  let maxPurchaseFromDownPayment = 0;
  if (params.downPaymentAmount <= 25000) {
    maxPurchaseFromDownPayment = params.downPaymentAmount / 0.05;
  } else if (params.downPaymentAmount < 125000) {
    maxPurchaseFromDownPayment = 500000 + (params.downPaymentAmount - 25000) / 0.1;
  } else {
    // At $125,000+, if >= 20% of price, can exceed $1.5M; otherwise capped below $1.5M
    const highRatioCap = Math.min(
      config.maxInsuredPriceCad - 1,
      500000 + (params.downPaymentAmount - 25000) / 0.1
    );
    const conventionalMax = params.downPaymentAmount / 0.2;
    maxPurchaseFromDownPayment = Math.max(highRatioCap, conventionalMax);
  }

  const estimatedMaxPurchasePrice = Math.round(
    Math.min(maxPurchaseFromIncome, maxPurchaseFromDownPayment)
  );
  const estimatedMortgageBase = Math.max(
    0,
    estimatedMaxPurchasePrice - params.downPaymentAmount
  );

  const contractPayment = calculateMortgagePayment({
    principal: estimatedMortgageBase,
    annualRatePct: params.contractRatePct,
    amortizationYears: params.amortizationYears,
  });

  return {
    estimatedMaxPurchasePrice,
    estimatedMaxMortgage: Math.round(estimatedMortgageBase),
    maxQualifyingMonthlyPayment: Math.round(maxQualifyingPayment),
    estimatedContractMonthlyPayment: Math.round(
      contractPayment.monthlyEquivalentPayment
    ),
    qualifyingRatePct: Number(qualifyingRatePct.toFixed(2)),
    limitingFactor:
      maxPurchaseFromDownPayment < maxPurchaseFromIncome
        ? "DOWN_PAYMENT_RULE"
        : maxAllowedTdsHousing < maxAllowedGdsHousing
        ? "TDS_DEBT_RATIO"
        : "GDS_HOUSING_RATIO",
  };
}

/**
 * 4. Refinance Scenario Calculator
 * Calculates maximum 80% LTV equity access, new payment vs existing payment, and net cash available.
 */
export function calculateRefinanceScenario(
  params: {
    estimatedPropertyValue: number;
    existingMortgageBalance: number;
    requestedNewMortgageAmount: number;
    currentRatePct: number;
    newRatePct: number;
    amortizationYears: number;
    estimatedPenaltyAndLegalFees?: number;
  },
  config: CanadianPolicyConfig = DEFAULT_CANADIAN_POLICY_CONFIG
) {
  const maxAllowedRefinanceMortgage = Math.round(
    params.estimatedPropertyValue * (config.maxRefinanceLtvPct / 100)
  );
  const maxEquityAvailableToExtract = Math.max(
    0,
    maxAllowedRefinanceMortgage - params.existingMortgageBalance
  );
  const requestedLtvPct =
    params.estimatedPropertyValue > 0
      ? (params.requestedNewMortgageAmount / params.estimatedPropertyValue) * 100
      : 0;
  const isWithin80LtvLimit = requestedLtvPct <= config.maxRefinanceLtvPct;

  const existingPayment = calculateMortgagePayment({
    principal: params.existingMortgageBalance,
    annualRatePct: params.currentRatePct,
    amortizationYears: params.amortizationYears,
  });

  const proposedPayment = calculateMortgagePayment({
    principal: params.requestedNewMortgageAmount,
    annualRatePct: params.newRatePct,
    amortizationYears: params.amortizationYears,
  });

  const fees = params.estimatedPenaltyAndLegalFees ?? 3500;
  const grossEquityReleased = Math.max(
    0,
    params.requestedNewMortgageAmount - params.existingMortgageBalance
  );
  const netCashProceeds = Math.max(0, grossEquityReleased - fees);

  return {
    maxAllowedRefinanceMortgage,
    maxEquityAvailableToExtract,
    requestedLtvPct: Number(requestedLtvPct.toFixed(2)),
    isWithin80LtvLimit,
    existingMonthlyPayment: existingPayment.monthlyEquivalentPayment,
    proposedMonthlyPayment: proposedPayment.monthlyEquivalentPayment,
    monthlyPaymentDifference: Number(
      (
        proposedPayment.monthlyEquivalentPayment -
        existingPayment.monthlyEquivalentPayment
      ).toFixed(2)
    ),
    grossEquityReleased: Math.round(grossEquityReleased),
    estimatedFees: fees,
    netCashProceeds: Math.round(netCashProceeds),
  };
}

/**
 * 6. Amortization Schedule & Comparison Calculator + Fixed vs Variable Comparison
 */
export function calculateAmortizationComparison(params: {
  principal: number;
  fixedRatePct: number;
  variableRatePct: number;
  amortizationOptionsYears?: number[];
  termYears?: number;
}) {
  const options = params.amortizationOptionsYears || [15, 20, 25, 30];
  const termYears = params.termYears || 5;

  const scenarios = options.map((years) => {
    const fixed = calculateMortgagePayment({
      principal: params.principal,
      annualRatePct: params.fixedRatePct,
      amortizationYears: years,
    });
    const variable = calculateMortgagePayment({
      principal: params.principal,
      annualRatePct: params.variableRatePct,
      amortizationYears: years,
    });

    // Compute balance at end of term (e.g., 5 years = 60 months) for fixed rate
    const monthlyRate = getCanadianPeriodicRate(params.fixedRatePct, 12);
    let balance = params.principal;
    let termInterest = 0;
    let termPrincipal = 0;
    const monthsInTerm = Math.min(termYears * 12, years * 12);

    for (let m = 1; m <= monthsInTerm; m++) {
      const interest = balance * monthlyRate;
      const principalPaid = Math.min(
        balance,
        fixed.monthlyEquivalentPayment - interest
      );
      balance = Math.max(0, balance - principalPaid);
      termInterest += interest;
      termPrincipal += principalPaid;
    }

    return {
      amortizationYears: years,
      fixedMonthlyPayment: fixed.monthlyEquivalentPayment,
      variableMonthlyPayment: variable.monthlyEquivalentPayment,
      monthlyFixedVsVariableDiff: Number(
        (fixed.monthlyEquivalentPayment - variable.monthlyEquivalentPayment).toFixed(2)
      ),
      totalInterestFixed: fixed.totalInterestOverAmortization,
      totalInterestVariable: variable.totalInterestOverAmortization,
      balanceEndOfTermFixed: Math.round(balance),
      principalPaidInTermFixed: Math.round(termPrincipal),
      interestPaidInTermFixed: Math.round(termInterest),
    };
  });

  // Generate yearly schedule for 25-year (or first option) for Recharts visualization
  const chartYears = 25;
  const chartPayment = calculateMortgagePayment({
    principal: params.principal,
    annualRatePct: params.fixedRatePct,
    amortizationYears: chartYears,
  });
  const chartMonthlyRate = getCanadianPeriodicRate(params.fixedRatePct, 12);
  let runningBalance = params.principal;
  let cumulativeInterest = 0;
  let cumulativePrincipal = 0;
  const yearlySchedule: Array<{
    year: number;
    remainingBalance: number;
    cumulativePrincipal: number;
    cumulativeInterest: number;
  }> = [];

  for (let y = 1; y <= chartYears; y++) {
    for (let m = 1; m <= 12; m++) {
      if (runningBalance <= 0) break;
      const interest = runningBalance * chartMonthlyRate;
      const principalPaid = Math.min(
        runningBalance,
        chartPayment.monthlyEquivalentPayment - interest
      );
      runningBalance = Math.max(0, runningBalance - principalPaid);
      cumulativeInterest += interest;
      cumulativePrincipal += principalPaid;
    }
    yearlySchedule.push({
      year: y,
      remainingBalance: Math.round(runningBalance),
      cumulativePrincipal: Math.round(cumulativePrincipal),
      cumulativeInterest: Math.round(cumulativeInterest),
    });
  }

  return {
    termYears,
    fixedRatePct: params.fixedRatePct,
    variableRatePct: params.variableRatePct,
    scenarios,
    yearlySchedule,
  };
}
