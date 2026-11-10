/**
 * Four-Stage Canadian Mortgage Agent Orchestration Services
 *
 * Adapts the reusable 4-stage agent card architecture (Intake -> Document Verification ->
 * Qualification & Lender Match -> Underwriting Support & Package Builder) to Canadian residential
 * mortgages while enforcing the Zero-Approval Human-in-the-Loop Guardrail from AGENTS.md.
 */

import {
  calculateDownPaymentAndLtv,
  calculateGdsTds,
  calculateMortgagePayment,
  calculateStressTest,
  CanadianPolicyConfig,
  DEFAULT_CANADIAN_POLICY_CONFIG,
} from "./mortgage-calculators";

export interface FictionalLenderCriteria {
  code: string;
  lenderName: string;
  productName: string;
  lenderCategory: string;
  rateType: "FIXED" | "VARIABLE";
  termYears: number;
  maxAmortization: number;
  illustrativeRatePct: number;
  minCreditScore: number;
  maxGdsPct: number;
  maxTdsPct: number;
  maxLtvPct: number;
  minLoanCad: number;
  maxLoanCad: number;
  acceptsSelfEmployed: boolean;
  requiresInsured: boolean;
  allowsRefinance: boolean;
  stressTestRule: string;
  prepaymentPrivilege: string;
  keyConditions: string[];
  limitationsNote: string;
  policyEffectiveDate: string;
}

export const DEFAULT_FICTIONAL_LENDERS: FictionalLenderCriteria[] = [
  {
    code: "LEND-MAPLECROWN-5F",
    lenderName: "MapleCrown Bank of Canada (Fictional Prime A-Bank)",
    productName: "MapleCrown 5-Year Fixed Residential Prime",
    lenderCategory: "PRIME_A_BANK",
    rateType: "FIXED",
    termYears: 5,
    maxAmortization: 25,
    illustrativeRatePct: 4.64,
    minCreditScore: 700,
    maxGdsPct: 39.0,
    maxTdsPct: 44.0,
    maxLtvPct: 95.0,
    minLoanCad: 100000,
    maxLoanCad: 1500000,
    acceptsSelfEmployed: false,
    requiresInsured: false,
    allowsRefinance: true,
    stressTestRule: "OSFI_B20_STANDARD",
    prepaymentPrivilege: "15% Annual Lump Sum + 15% Payment Increase",
    keyConditions: [
      "Full T4 + Letter of Employment + recent pay stubs required",
      "90-day down payment history audit required for purchase transactions",
      "Subject to full appraisal or automated valuation model (AVM) review",
    ],
    limitationsNote:
      "Illustrative fictional bank criteria only. Does not accept stated-income self-employed files without 2-year CRA NOA T1 personal tax averages.",
    policyEffectiveDate: "2026-01-01",
  },
  {
    code: "LEND-BOREAL-5V",
    lenderName: "Boreal Monoline Financial (Fictional Broker Channel Lender)",
    productName: "Boreal Wholesale 5-Year Adjustable Variable",
    lenderCategory: "MONOLINE_WHOLESALE",
    rateType: "VARIABLE",
    termYears: 5,
    maxAmortization: 25,
    illustrativeRatePct: 4.55,
    minCreditScore: 680,
    maxGdsPct: 39.0,
    maxTdsPct: 44.0,
    maxLtvPct: 95.0,
    minLoanCad: 125000,
    maxLoanCad: 1250000,
    acceptsSelfEmployed: true,
    requiresInsured: false,
    allowsRefinance: true,
    stressTestRule: "OSFI_B20_STANDARD",
    prepaymentPrivilege: "20% Annual Lump Sum + 20% Payment Increase",
    keyConditions: [
      "Standard 3-month interest early payout calculation on variable terms",
      "2-year CRA Notice of Assessment (NOA) required if self-employed",
      "Owner-occupied residential properties in major Canadian urban centres",
    ],
    limitationsNote:
      "Illustrative monoline product. Payment fluctuates with changes to fictional reference prime rate; subject to OSFI B-20 stress test.",
    policyEffectiveDate: "2026-01-01",
  },
  {
    code: "LEND-LAURENTIAN-3F",
    lenderName: "Laurentian Pacific Credit Union (Fictional Regional Credit Union)",
    productName: "Laurentian 3-Year Smart Fixed Horizon",
    lenderCategory: "CREDIT_UNION",
    rateType: "FIXED",
    termYears: 3,
    maxAmortization: 30,
    illustrativeRatePct: 4.79,
    minCreditScore: 670,
    maxGdsPct: 40.0,
    maxTdsPct: 45.0,
    maxLtvPct: 90.0,
    minLoanCad: 80000,
    maxLoanCad: 1400000,
    acceptsSelfEmployed: true,
    requiresInsured: false,
    allowsRefinance: true,
    stressTestRule: "LENDER_CONTRACT_PLUS_2",
    prepaymentPrivilege: "20% Annual Lump Sum without fee",
    keyConditions: [
      "Credit union membership share deposit ($25 CAD illustrative) required at closing",
      "Allows up to 30-year amortization on conventional uninsured files (LTV <= 80%)",
      "Manual committee review required when GDS > 39% or TDS > 44%",
    ],
    limitationsNote:
      "Illustrative credit union profile. Slightly higher GDS/TDS lender tolerance (40%/45%) requires uninsured 20%+ down payment.",
    policyEffectiveDate: "2026-01-01",
  },
  {
    code: "LEND-PRAIRIEBRIDGE-ALT",
    lenderName: "PrairieBridge Alternative Trust (Fictional Alt-A / B-Lender)",
    productName: "PrairieBridge BFS Stated-Income 2-Year Solution",
    lenderCategory: "ALT_A_NEAR_PRIME",
    rateType: "FIXED",
    termYears: 2,
    maxAmortization: 30,
    illustrativeRatePct: 5.74,
    minCreditScore: 600,
    maxGdsPct: 46.0,
    maxTdsPct: 50.0,
    maxLtvPct: 80.0,
    minLoanCad: 100000,
    maxLoanCad: 1500000,
    acceptsSelfEmployed: true,
    requiresInsured: false,
    allowsRefinance: true,
    stressTestRule: "ALT_FLEXIBLE",
    prepaymentPrivilege: "10% Annual Prepayment Privilege",
    keyConditions: [
      "Minimum 20% down payment / equity required (Max 80% LTV — Uninsured only)",
      "6 to 12 months business bank statements required to verify Business-for-Self (BFS) cash flow",
      "1.00% illustrative lender commitment fee disclosed prior to review",
    ],
    limitationsNote:
      "Illustrative Alt-A / B-Lender profile for self-employed or bruised-credit scenarios. Higher rate and lender fee apply; intended as 1–2 year bridge to prime.",
    policyEffectiveDate: "2026-01-01",
  },
  {
    code: "LEND-TRUENORTH-EQUITY",
    lenderName: "TrueNorth Equity Capital (Fictional High-Value & Refinance Specialist)",
    productName: "TrueNorth Premier Equity & Jumbo 5-Year Fixed",
    lenderCategory: "EQUITY_SPECIALIST",
    rateType: "FIXED",
    termYears: 5,
    maxAmortization: 30,
    illustrativeRatePct: 5.09,
    minCreditScore: 680,
    maxGdsPct: 42.0,
    maxTdsPct: 46.0,
    maxLtvPct: 80.0,
    minLoanCad: 250000,
    maxLoanCad: 3000000,
    acceptsSelfEmployed: true,
    requiresInsured: false,
    allowsRefinance: true,
    stressTestRule: "OSFI_B20_STANDARD",
    prepaymentPrivilege: "15% Annual Lump Sum + Flexible Refinance Porting",
    keyConditions: [
      "Designed for conventional purchases over $1M and equity take-out refinances up to 80% LTV",
      "Full certified physical appraisal required on properties above $1.2M",
      "Liquid net-worth / reserve verification required for loans above $1.0M",
    ],
    limitationsNote:
      "Illustrative conventional high-value & refinance specialist. Strictly capped at 80% LTV (minimum 20% down payment or home equity).",
    policyEffectiveDate: "2026-01-01",
  },
];

export interface SampleBorrowerScenario {
  id: string;
  label: string;
  badge: string;
  description: string;
  data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    province: string;
    city: string;
    address: string;
    postalCode: string;
    purpose: "PURCHASE" | "REFINANCE" | "RENEWAL";
    isFirstTimeBuyer: boolean;
    propertyType: string;
    occupancy: string;
    purchasePriceOrValue: number;
    downPaymentAmount: number;
    downPaymentSource: string;
    existingMortgageBalance: number;
    requestedMortgageAmount: number;
    amortizationYears: number;
    termYears: number;
    ratePreference: "FIXED" | "VARIABLE";
    paymentFrequency: "MONTHLY" | "BIWEEKLY" | "ACCELERATED_BIWEEKLY";
    creditScoreEstimate: number;
    employmentType: string;
    employerName: string;
    jobTitle: string;
    yearsAtEmployer: number;
    grossAnnualIncome: number;
    otherMonthlyIncome: number;
    monthlyDebts: number;
    annualPropertyTax: number;
    monthlyHeating: number;
    monthlyCondoFees: number;
    coBorrowerName?: string;
    coBorrowerIncome?: number;
  };
}

export const SAMPLE_BORROWER_SCENARIOS: SampleBorrowerScenario[] = [
  {
    id: "FIRST_TIME_BUYER",
    label: "1. First-Time Homebuyer (Toronto, ON)",
    badge: "Complete Docs • High-Ratio Insured",
    description:
      "Salaried software engineer purchasing a $780,000 Toronto condo with 10% down ($78,000 from FHSA + savings).",
    data: {
      firstName: "Jordan",
      lastName: "Campbell",
      email: "jordan.campbell@demo-borrower.ca",
      phone: "(416) 555-0194",
      province: "ON",
      city: "Toronto",
      address: "420 Wellington St W, Suite 1804",
      postalCode: "M5V 1E3",
      purpose: "PURCHASE",
      isFirstTimeBuyer: true,
      propertyType: "CONDO_APARTMENT",
      occupancy: "OWNER_OCCUPIED",
      purchasePriceOrValue: 780000,
      downPaymentAmount: 78000,
      downPaymentSource: "FHSA_RRSP_HBP",
      existingMortgageBalance: 0,
      requestedMortgageAmount: 702000,
      amortizationYears: 25,
      termYears: 5,
      ratePreference: "FIXED",
      paymentFrequency: "MONTHLY",
      creditScoreEstimate: 745,
      employmentType: "SALARIED_FULL_TIME",
      employerName: "NorthStar Cloud Technologies Inc.",
      jobTitle: "Senior Platform Engineer",
      yearsAtEmployer: 4.5,
      grossAnnualIncome: 178000,
      otherMonthlyIncome: 0,
      monthlyDebts: 550,
      annualPropertyTax: 4100,
      monthlyHeating: 120,
      monthlyCondoFees: 520,
    },
  },
  {
    id: "SELF_EMPLOYED",
    label: "2. Self-Employed Applicant (Calgary, AB)",
    badge: "Missing Income Evidence • BFS",
    description:
      "Incorporated electrical contractor purchasing a $620,000 detached home in Calgary with 20% down; missing CRA T1/NOA tax documents.",
    data: {
      firstName: "Tyler",
      lastName: "MacLeod",
      email: "tyler@macleodcontracting-demo.ca",
      phone: "(403) 555-0142",
      province: "AB",
      city: "Calgary",
      address: "88 Aspen Summit Way SW",
      postalCode: "T3H 0N6",
      purpose: "PURCHASE",
      isFirstTimeBuyer: false,
      propertyType: "DETACHED",
      occupancy: "OWNER_OCCUPIED",
      purchasePriceOrValue: 620000,
      downPaymentAmount: 124000,
      downPaymentSource: "SAVINGS",
      existingMortgageBalance: 0,
      requestedMortgageAmount: 496000,
      amortizationYears: 30,
      termYears: 2,
      ratePreference: "FIXED",
      paymentFrequency: "MONTHLY",
      creditScoreEstimate: 655,
      employmentType: "SELF_EMPLOYED_BFS",
      employerName: "MacLeod Precision Contracting Ltd.",
      jobTitle: "Owner & Principal Contractor",
      yearsAtEmployer: 5.0,
      grossAnnualIncome: 138000,
      otherMonthlyIncome: 0,
      monthlyDebts: 780,
      annualPropertyTax: 3900,
      monthlyHeating: 165,
      monthlyCondoFees: 0,
    },
  },
  {
    id: "REFINANCE",
    label: "3. Equity Refinance (Vancouver, BC)",
    badge: "57.8% LTV • High Equity",
    description:
      "Homeowner refinancing an existing $520,000 mortgage on a $1,350,000 Vancouver townhouse to $780,000 for laneway suite renovation.",
    data: {
      firstName: "Evelyn",
      lastName: "Zhang",
      email: "evelyn.zhang@demo-borrower.ca",
      phone: "(604) 555-0178",
      province: "BC",
      city: "Vancouver",
      address: "2145 West 14th Avenue",
      postalCode: "V6K 2V8",
      purpose: "REFINANCE",
      isFirstTimeBuyer: false,
      propertyType: "TOWNHOUSE",
      occupancy: "OWNER_OCCUPIED",
      purchasePriceOrValue: 1350000,
      downPaymentAmount: 570000,
      downPaymentSource: "EQUITY",
      existingMortgageBalance: 520000,
      requestedMortgageAmount: 780000,
      amortizationYears: 25,
      termYears: 5,
      ratePreference: "FIXED",
      paymentFrequency: "ACCELERATED_BIWEEKLY",
      creditScoreEstimate: 782,
      employmentType: "SALARIED_FULL_TIME",
      employerName: "Pacific Coastal Health Authority",
      jobTitle: "Clinical Director",
      yearsAtEmployer: 8.0,
      grossAnnualIncome: 225000,
      otherMonthlyIncome: 0,
      monthlyDebts: 650,
      annualPropertyTax: 5400,
      monthlyHeating: 150,
      monthlyCondoFees: 310,
    },
  },
  {
    id: "RENEWAL",
    label: "4. Mortgage Renewal (Montreal, QC)",
    badge: "Comparing Fixed vs Variable",
    description:
      "Co-borrowers renewing a $415,000 maturing balance on a $640,000 Montreal duplex, comparing 3-Yr Fixed, 5-Yr Fixed, and 5-Yr Variable.",
    data: {
      firstName: "Marc-Antoine",
      lastName: "Tremblay",
      email: "ma.tremblay@demo-borrower.ca",
      phone: "(514) 555-0163",
      province: "QC",
      city: "Montreal",
      address: "3890 Rue Saint-Denis",
      postalCode: "H2W 2M2",
      purpose: "RENEWAL",
      isFirstTimeBuyer: false,
      propertyType: "DUPLEX",
      occupancy: "OWNER_OCCUPIED",
      purchasePriceOrValue: 640000,
      downPaymentAmount: 225000,
      downPaymentSource: "EQUITY",
      existingMortgageBalance: 415000,
      requestedMortgageAmount: 415000,
      amortizationYears: 20,
      termYears: 3,
      ratePreference: "VARIABLE",
      paymentFrequency: "BIWEEKLY",
      creditScoreEstimate: 728,
      employmentType: "SALARIED_FULL_TIME",
      employerName: "Studio Créatif Montréal Inc.",
      jobTitle: "Lead Product Designer",
      yearsAtEmployer: 6.0,
      grossAnnualIncome: 112000,
      otherMonthlyIncome: 0,
      monthlyDebts: 420,
      annualPropertyTax: 3800,
      monthlyHeating: 145,
      monthlyCondoFees: 0,
      coBorrowerName: "Chloé Gagnon",
      coBorrowerIncome: 58000,
    },
  },
  {
    id: "HIGHER_VALUE",
    label: "5. Higher-Value Purchase (Ottawa, ON)",
    badge: "Requires Manual Underwriter Review",
    description:
      "Purchase of a $1,180,000 detached home with 20% down ($236,000); borderline stress-test TDS ratio and gift letter discrepancy flagged for human review.",
    data: {
      firstName: "Priya",
      lastName: "Patel",
      email: "priya.patel@demo-borrower.ca",
      phone: "(613) 555-0189",
      province: "ON",
      city: "Ottawa",
      address: "112 Queen Elizabeth Driveway",
      postalCode: "K2P 1E6",
      purpose: "PURCHASE",
      isFirstTimeBuyer: false,
      propertyType: "DETACHED",
      occupancy: "OWNER_OCCUPIED",
      purchasePriceOrValue: 1180000,
      downPaymentAmount: 236000,
      downPaymentSource: "GIFT_IMMEDIATE_FAMILY",
      existingMortgageBalance: 0,
      requestedMortgageAmount: 944000,
      amortizationYears: 25,
      termYears: 5,
      ratePreference: "FIXED",
      paymentFrequency: "MONTHLY",
      creditScoreEstimate: 705,
      employmentType: "SALARIED_FULL_TIME",
      employerName: "Capital Region Advisory Group",
      jobTitle: "Principal Consultant",
      yearsAtEmployer: 2.5,
      grossAnnualIncome: 176000,
      otherMonthlyIncome: 0,
      monthlyDebts: 1150,
      annualPropertyTax: 6800,
      monthlyHeating: 190,
      monthlyCondoFees: 0,
    },
  },
];

/**
 * HARD LEGAL & PROCEDURAL GUARDRAIL (preserved from AGENTS.md)
 * Strictly prohibits AI agents from approving, pre-approving, committing to, or denying any mortgage.
 */
export function checkComplianceGuardrail(userMessage: string): {
  triggered: boolean;
  refusalMessage?: string;
} {
  const lower = userMessage.toLowerCase();
  const forbiddenPatterns = [
    /\b(can you|please|you|agent)\s+(approve|deny|reject|grant|decline|authorize)\b/,
    /\b(approve|deny|reject|decline)\s+(this|the|my|all)?\s*(deal|loan|application|mortgage|file|borrower)\b/,
    /\bissue\s+(an\s+)?(approval|commitment)\s*(letter)?\b/,
    /\bguarantee\s+(my\s+)?(mortgage|approval|loan)\b/,
  ];

  if (forbiddenPatterns.some((p) => p.test(lower))) {
    return {
      triggered: true,
      refusalMessage:
        "Under statutory lending regulations and AI Mortgage Command Center governance protocols, this AI assistant operates solely as an intake, calculation, and underwriting-support tool. I do not possess underwriting authority and cannot approve, pre-approve, guarantee, or deny any mortgage application. All files are labeled PENDING HUMAN REVIEW and routed to the Human Review Workspace for review by an authorized mortgage broker or internal underwriter (Steve).",
    };
  }

  return { triggered: false };
}

/**
 * Conversational NLP extractor for Agent 1 (Intake Assistant)
 */
export function parseConversationalIntakeMessage(
  message: string,
  currentData: Record<string, any>
) {
  const guard = checkComplianceGuardrail(message);
  if (guard.triggered) {
    return {
      guardrailTriggered: true,
      reply: guard.refusalMessage!,
      updates: {},
      extractedFields: [] as string[],
    };
  }

  const updates: Record<string, any> = {};
  const extractedFields: string[] = [];

  // Purpose detection
  if (/\brefinanc/i.test(message)) {
    updates.purpose = "REFINANCE";
    extractedFields.push("Purpose: Refinance");
  } else if (/\brenew/i.test(message)) {
    updates.purpose = "RENEWAL";
    extractedFields.push("Purpose: Renewal");
  } else if (/\b(purchas|buy|buying|first-time|first time)\b/i.test(message)) {
    updates.purpose = "PURCHASE";
    extractedFields.push("Purpose: Purchase");
  }

  if (/\b(first-time|first time)\b/i.test(message)) {
    updates.isFirstTimeBuyer = true;
    extractedFields.push("First-Time Homebuyer: Yes");
  }

  // Province detection
  if (/\b(ontario|toronto|ottawa|mississauga)\b/i.test(message)) {
    updates.province = "ON";
    if (/ottawa/i.test(message)) updates.city = "Ottawa";
    else updates.city = "Toronto";
    extractedFields.push(`Location: ${updates.city}, ON`);
  } else if (/\b(british columbia|vancouver|victoria)\b/i.test(message)) {
    updates.province = "BC";
    updates.city = "Vancouver";
    extractedFields.push("Location: Vancouver, BC");
  } else if (/\b(alberta|calgary|edmonton)\b/i.test(message)) {
    updates.province = "AB";
    updates.city = "Calgary";
    extractedFields.push("Location: Calgary, AB");
  } else if (/\b(quebec|montreal|montréal)\b/i.test(message)) {
    updates.province = "QC";
    updates.city = "Montreal";
    extractedFields.push("Location: Montreal, QC");
  }

  // Self-employed detection
  if (/\b(self-employed|self employed|bfs|incorporated|contractor)\b/i.test(message)) {
    updates.employmentType = "SELF_EMPLOYED_BFS";
    extractedFields.push("Employment: Self-Employed (BFS)");
  }

  // Rate preference
  if (/\bvariable\b/i.test(message)) {
    updates.ratePreference = "VARIABLE";
    extractedFields.push("Rate Preference: Variable");
  } else if (/\bfixed\b/i.test(message)) {
    updates.ratePreference = "FIXED";
    extractedFields.push("Rate Preference: Fixed");
  }

  // Property price extraction (e.g. "$780,000", "$850k", "1.2M")
  const priceMatch =
    message.match(
      /(?:price|value|home|house|condo|property|worth|for)\s*(?:of|is|at)?\s*\$?(\d[\d,]*(?:\.\d+)?)\s*(k|thousand|m|million)?/i
    ) ||
    message.match(/\$(\d[\d,]*(?:\.\d+)?)\s*(k|thousand|m|million)?\s*(?:home|condo|house|property|purchase)/i);

  if (priceMatch) {
    let val = parseFloat(priceMatch[1].replace(/,/g, ""));
    const unit = (priceMatch[2] || "").toLowerCase();
    if (unit === "k" || unit === "thousand") val *= 1000;
    if (unit === "m" || unit === "million") val *= 1000000;
    if (val >= 80000 && val <= 20000000) {
      updates.purchasePriceOrValue = Math.round(val);
      extractedFields.push(`Property Value: $${updates.purchasePriceOrValue.toLocaleString()} CAD`);
    }
  }

  // Down payment extraction
  const downPctMatch = message.match(/(\d{1,2}(?:\.\d+)?)\s*%\s*(?:down|down\s*payment)/i);
  const downCashMatch = message.match(
    /(?:down\s*payment|down)\s*(?:of|is)?\s*\$?(\d[\d,]*(?:\.\d+)?)\s*(k|thousand)?/i
  );
  const basePrice = updates.purchasePriceOrValue || currentData.purchasePriceOrValue || 780000;

  if (downPctMatch) {
    const pct = parseFloat(downPctMatch[1]);
    if (pct > 0 && pct < 100) {
      updates.downPaymentAmount = Math.round(basePrice * (pct / 100));
      updates.requestedMortgageAmount = basePrice - updates.downPaymentAmount;
      extractedFields.push(
        `Down Payment: ${pct}% ($${updates.downPaymentAmount.toLocaleString()} CAD)`
      );
    }
  } else if (downCashMatch) {
    let val = parseFloat(downCashMatch[1].replace(/,/g, ""));
    const unit = (downCashMatch[2] || "").toLowerCase();
    if (unit === "k" || unit === "thousand") val *= 1000;
    if (val >= 5000 && val < basePrice) {
      updates.downPaymentAmount = Math.round(val);
      updates.requestedMortgageAmount = basePrice - updates.downPaymentAmount;
      extractedFields.push(
        `Down Payment: $${updates.downPaymentAmount.toLocaleString()} CAD`
      );
    }
  }

  // Income extraction
  const incomeMatch =
    message.match(
      /(?:income|salary|earning|earn|making|make)\s*(?:of|is)?\s*\$?(\d[\d,]*(?:\.\d+)?)\s*(k|thousand)?/i
    ) ||
    message.match(
      /\$?(\d[\d,]*(?:\.\d+)?)\s*(k|thousand)?\s*(?:annual\s+)?(?:income|salary)/i
    );
  if (incomeMatch) {
    let val = parseFloat(incomeMatch[1].replace(/,/g, ""));
    const unit = (incomeMatch[2] || "").toLowerCase();
    if (unit === "k" || unit === "thousand") val *= 1000;
    if (val > 0 && val < 25000) {
      val = val * 12; // monthly to annual
    }
    if (val >= 25000 && val <= 5000000) {
      updates.grossAnnualIncome = Math.round(val);
      extractedFields.push(
        `Gross Annual Income: $${updates.grossAnnualIncome.toLocaleString()} CAD`
      );
    }
  }

  // Credit score extraction
  const creditMatch = message.match(
    /(?:credit|score|equifax|transunion|beacon)\s*(?:is|of)?\s*([3-8]\d{2})/i
  );
  if (creditMatch) {
    const score = parseInt(creditMatch[1], 10);
    if (score >= 300 && score <= 900) {
      updates.creditScoreEstimate = score;
      extractedFields.push(`Estimated Credit Score: ${score}`);
    }
  }

  const merged = { ...currentData, ...updates };
  const missingFields = identifyMissingIntakeFields(merged);

  const reply =
    extractedFields.length > 0
      ? `Agent 1 (Intake Assistant) captured ${extractedFields.length} field update(s): ${extractedFields.join(
          " • "
        )}. ${
          missingFields.length > 0
            ? `Remaining fields to verify: ${missingFields.join(", ")}.`
            : "All core intake fields are present and ready for Agent 2 (Document Verification)."
        }`
      : `I can help structure your Canadian mortgage intake profile. Try telling me your target property price, down payment, gross income, province, or mortgage purpose (purchase, refinance, or renewal)—or load one of the 5 sample Canadian borrower scenarios above.`;

  return {
    guardrailTriggered: false,
    reply,
    updates,
    extractedFields,
    missingFields,
  };
}

export function identifyMissingIntakeFields(data: Record<string, any>): string[] {
  const missing: string[] = [];
  if (!data.firstName || !data.lastName) missing.push("Borrower full name");
  if (!data.email) missing.push("Borrower email address");
  if (!data.province || !data.city) missing.push("Property province & city");
  if (!data.purchasePriceOrValue || Number(data.purchasePriceOrValue) <= 0)
    missing.push("Property purchase price or estimated value");
  if (
    data.purpose === "PURCHASE" &&
    (data.downPaymentAmount === undefined || Number(data.downPaymentAmount) <= 0)
  ) {
    missing.push("Down payment amount & source of funds");
  }
  if (!data.grossAnnualIncome || Number(data.grossAnnualIncome) <= 0)
    missing.push("Gross income & employment history");
  if (!data.employerName) missing.push("Employer or business name");
  return missing;
}

/**
 * Agent 3: Deterministic Qualification & Fictional Lender Matching Service
 */
export function evaluateApplicationQualificationAndLenders(
  appData: {
    purpose: "PURCHASE" | "REFINANCE" | "RENEWAL";
    purchasePriceOrValue: number;
    downPaymentAmount: number;
    existingMortgageBalance: number;
    requestedMortgageAmount: number;
    amortizationYears: number;
    termYears: number;
    ratePreference: "FIXED" | "VARIABLE";
    grossAnnualIncome: number;
    coBorrowerIncome?: number;
    otherMonthlyIncome?: number;
    monthlyDebts: number;
    annualPropertyTax: number;
    monthlyHeating: number;
    monthlyCondoFees: number;
    creditScoreEstimate?: number | null;
    employmentType: string;
    isFirstTimeBuyer?: boolean;
    hasBlockingDocIssues?: boolean;
  },
  lenderCatalog: FictionalLenderCriteria[] = DEFAULT_FICTIONAL_LENDERS,
  policyConfig: CanadianPolicyConfig = DEFAULT_CANADIAN_POLICY_CONFIG
) {
  const totalAnnualIncome =
    appData.grossAnnualIncome +
    (appData.coBorrowerIncome || 0) +
    (appData.otherMonthlyIncome || 0) * 12;

  const downLtv = calculateDownPaymentAndLtv(
    {
      propertyPrice: appData.purchasePriceOrValue,
      downPaymentAmount:
        appData.purpose === "PURCHASE"
          ? appData.downPaymentAmount
          : Math.max(0, appData.purchasePriceOrValue - appData.requestedMortgageAmount),
      purpose: appData.purpose,
      amortizationYears: appData.amortizationYears,
      isFirstTimeBuyer: appData.isFirstTimeBuyer,
    },
    policyConfig
  );

  const totalFinancedMortgage =
    appData.purpose === "PURCHASE"
      ? downLtv.totalMortgageWithInsurance
      : appData.requestedMortgageAmount;

  // Baseline reference rate for general application summary (4.69% Fixed / 4.55% Variable)
  const referenceContractRate = appData.ratePreference === "VARIABLE" ? 4.55 : 4.69;

  const stressTest = calculateStressTest(
    {
      principal: totalFinancedMortgage,
      contractRatePct: referenceContractRate,
      amortizationYears: appData.amortizationYears,
    },
    policyConfig
  );

  const gdsTds = calculateGdsTds(
    {
      qualifyingMonthlyPayment: stressTest.stressTestMonthlyPayment,
      annualPropertyTax: appData.annualPropertyTax,
      monthlyHeating: appData.monthlyHeating,
      monthlyCondoFees: appData.monthlyCondoFees,
      monthlyOtherDebts: appData.monthlyDebts,
      grossAnnualIncome: totalAnnualIncome,
    },
    policyConfig
  );

  const creditScore = appData.creditScoreEstimate || 700;
  const isSelfEmployed = appData.employmentType === "SELF_EMPLOYED_BFS";

  // Evaluate each of the 5 fictional lenders
  const matches = lenderCatalog.map((lender) => {
    const lenderStress = calculateStressTest(
      {
        principal: totalFinancedMortgage,
        contractRatePct: lender.illustrativeRatePct,
        amortizationYears: Math.min(appData.amortizationYears, lender.maxAmortization),
      },
      policyConfig
    );

    const lenderRatios = calculateGdsTds(
      {
        qualifyingMonthlyPayment: lenderStress.stressTestMonthlyPayment,
        annualPropertyTax: appData.annualPropertyTax,
        monthlyHeating: appData.monthlyHeating,
        monthlyCondoFees: appData.monthlyCondoFees,
        monthlyOtherDebts: appData.monthlyDebts,
        grossAnnualIncome: totalAnnualIncome,
      },
      policyConfig
    );

    const reasonsFit: string[] = [];
    const reasonsRiskOrMiss: string[] = [];
    const missingConditions: string[] = [...lender.keyConditions];

    // Check Credit Score
    const creditOk = creditScore >= lender.minCreditScore;
    if (creditOk) {
      reasonsFit.push(
        `Estimated credit score (${creditScore}) meets lender minimum (${lender.minCreditScore}).`
      );
    } else {
      reasonsRiskOrMiss.push(
        `Estimated credit score (${creditScore}) is below lender minimum of ${lender.minCreditScore}.`
      );
    }

    // Check LTV
    const ltvToCompare = downLtv.baseLtvPct;
    const ltvOk =
      ltvToCompare <= lender.maxLtvPct &&
      (appData.purpose !== "PURCHASE" || downLtv.meetsMinimumDownPayment);
    if (ltvOk) {
      reasonsFit.push(
        `Base LTV (${ltvToCompare.toFixed(1)}%) is within lender maximum (${lender.maxLtvPct}%).`
      );
    } else {
      reasonsRiskOrMiss.push(
        `Base LTV (${ltvToCompare.toFixed(1)}%) exceeds lender maximum (${lender.maxLtvPct}%) or minimum down payment rule.`
      );
    }

    // Check GDS / TDS
    const gdsOk = lenderRatios.gdsPct <= lender.maxGdsPct;
    const tdsOk = lenderRatios.tdsPct <= lender.maxTdsPct;
    if (gdsOk && tdsOk) {
      reasonsFit.push(
        `Stress-tested GDS (${lenderRatios.gdsPct.toFixed(1)}%) & TDS (${lenderRatios.tdsPct.toFixed(
          1
        )}%) are within ${lender.lenderName} caps (${lender.maxGdsPct}% / ${lender.maxTdsPct}%).`
      );
    } else {
      if (!gdsOk) {
        reasonsRiskOrMiss.push(
          `Stress-tested GDS (${lenderRatios.gdsPct.toFixed(1)}%) exceeds lender cap of ${lender.maxGdsPct}%.`
        );
      }
      if (!tdsOk) {
        reasonsRiskOrMiss.push(
          `Stress-tested TDS (${lenderRatios.tdsPct.toFixed(1)}%) exceeds lender cap of ${lender.maxTdsPct}%.`
        );
      }
    }

    // Check Self-Employed compatibility
    const employmentOk = !isSelfEmployed || lender.acceptsSelfEmployed;
    if (!employmentOk) {
      reasonsRiskOrMiss.push(
        `${lender.lenderName} requires salaried T4 income or full 2-year CRA NOA tax averages and does not offer stated-income BFS programs.`
      );
    } else if (isSelfEmployed && lender.acceptsSelfEmployed) {
      reasonsFit.push(
        `Accepts Business-for-Self (BFS) applicants subject to income verification checklist.`
      );
    }

    // Check Loan Size
    const loanSizeOk =
      totalFinancedMortgage >= lender.minLoanCad &&
      totalFinancedMortgage <= lender.maxLoanCad;
    if (!loanSizeOk) {
      reasonsRiskOrMiss.push(
        `Requested mortgage ($${totalFinancedMortgage.toLocaleString()}) is outside product loan range ($${lender.minLoanCad.toLocaleString()} – $${lender.maxLoanCad.toLocaleString()}).`
      );
    } else {
      reasonsFit.push(
        `Loan amount ($${totalFinancedMortgage.toLocaleString()} CAD) is within product limits.`
      );
    }

    // Check Rate Preference alignment
    if (lender.rateType === appData.ratePreference) {
      reasonsFit.push(`Matches borrower's ${appData.ratePreference.toLowerCase()} rate preference.`);
    }

    // Compute Fit Score (0-100)
    let fitScore = 25;
    if (creditOk) fitScore += 20;
    if (ltvOk) fitScore += 20;
    if (gdsOk && tdsOk) fitScore += 20;
    else if (lenderRatios.tdsPct <= lender.maxTdsPct + 2.5) fitScore += 10;
    if (employmentOk) fitScore += 10;
    if (loanSizeOk) fitScore += 5;
    if (lender.rateType === appData.ratePreference) fitScore += 4;
    if (!creditOk || !ltvOk || !employmentOk || !loanSizeOk) {
      fitScore = Math.min(fitScore, 58);
    }

    let fitStatus: "STRONG_FIT" | "CONDITIONAL_FIT" | "OUTSIDE_CRITERIA" =
      "OUTSIDE_CRITERIA";
    if (creditOk && ltvOk && gdsOk && tdsOk && employmentOk && loanSizeOk) {
      fitStatus = appData.hasBlockingDocIssues ? "CONDITIONAL_FIT" : "STRONG_FIT";
    } else if (
      creditOk &&
      ltvOk &&
      employmentOk &&
      loanSizeOk &&
      lenderRatios.tdsPct <= lender.maxTdsPct + 3.0
    ) {
      fitStatus = "CONDITIONAL_FIT";
    }

    if (appData.hasBlockingDocIssues) {
      missingConditions.unshift(
        "Resolve missing or inconsistent document checklist warnings before underwriting submission"
      );
    }

    return {
      lender,
      fitScore,
      fitStatus,
      estimatedMonthlyPayment: lenderStress.contractMonthlyPayment,
      stressTestMonthlyPayment: lenderStress.stressTestMonthlyPayment,
      qualifyingRateUsed: lenderStress.qualifyingRatePct,
      gdsAtLenderRate: lenderRatios.gdsPct,
      tdsAtLenderRate: lenderRatios.tdsPct,
      reasonsFit,
      reasonsRiskOrMiss,
      missingConditions,
      humanReviewRequirement:
        fitStatus === "STRONG_FIT"
          ? "Requires human broker/underwriter review (Steve) to confirm document authenticity and select final submission product."
          : fitStatus === "CONDITIONAL_FIT"
          ? "Requires manual human underwriter review (Steve) to evaluate exceptions, compensating factors, or outstanding documents."
          : "Outside standard automated criteria for this fictional product; human broker may review for exception rationale or select an alternative tier.",
    };
  });

  matches.sort(
    (a, b) =>
      b.fitScore - a.fitScore ||
      a.lender.illustrativeRatePct - b.lender.illustrativeRatePct
  );

  return {
    policyConfig,
    totalAnnualIncome,
    totalFinancedMortgage,
    downLtv,
    stressTest,
    gdsTds,
    matches: matches.map((m, idx) => ({ ...m, rankOrder: idx + 1 })),
  };
}
