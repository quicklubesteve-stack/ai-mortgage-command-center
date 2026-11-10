/**
 * Canadian Mortgage Product Catalog, OSFI Stress Test & Credit Score Lender Recommender
 * Supports Canadian Mortgage Ecosystem: OSFI B-20 Guidelines, CMHC/Sagen Insurance,
 * Big Six Banks (RBC, TD, Scotiabank, BMO, CIBC, National Bank), Monolines, & Alternative B-Lenders.
 */

const CONFORMING_LOAN_LIMIT_2026 = 766550; // Reference for US/cross-border compatibility

// =========================================================================
// CANADIAN MORTGAGE REGIONS & PROVINCIAL CONFIGURATION
// =========================================================================

const CANADIAN_PROVINCES = {
  ON: {
    code: "ON",
    name: "Ontario",
    flag: "🍁",
    majorCities: ["Toronto", "Ottawa", "Mississauga", "Hamilton", "London"],
    defaultPropertyPrice: 850000,
    benchmarkTaxRatePct: 0.85,
    landTransferTax: "Provincial LTT + Toronto Municipal LTT (if in Toronto)",
    firstTimeBuyerRebateMax: 4000
  },
  BC: {
    code: "BC",
    name: "British Columbia",
    flag: "🏔️",
    majorCities: ["Vancouver", "Victoria", "Surrey", "Burnaby", "Kelowna"],
    defaultPropertyPrice: 950000,
    benchmarkTaxRatePct: 0.55,
    landTransferTax: "BC Property Transfer Tax (PTT)",
    firstTimeBuyerRebateMax: 8000
  },
  AB: {
    code: "AB",
    name: "Alberta",
    flag: "🤠",
    majorCities: ["Calgary", "Edmonton", "Red Deer", "Lethbridge"],
    defaultPropertyPrice: 520000,
    benchmarkTaxRatePct: 0.75,
    landTransferTax: "No Land Transfer Tax (Land Titles Transfer Fee only)",
    firstTimeBuyerRebateMax: 0
  },
  QC: {
    code: "QC",
    name: "Quebec",
    flag: "⚜️",
    majorCities: ["Montreal", "Quebec City", "Laval", "Gatineau"],
    defaultPropertyPrice: 510000,
    benchmarkTaxRatePct: 1.05,
    landTransferTax: "Taxe de Bienvenue (Welcome Tax)",
    firstTimeBuyerRebateMax: 0
  },
  PRAIRIES_ATLANTIC: {
    code: "PRAIRIES_ATLANTIC",
    name: "Prairies & Atlantic Canada",
    flag: "🌊",
    majorCities: ["Halifax", "Winnipeg", "Saskatoon", "Regina", "St. John's", "Moncton"],
    defaultPropertyPrice: 380000,
    benchmarkTaxRatePct: 1.15,
    landTransferTax: "Provincial Deed Transfer Tax",
    firstTimeBuyerRebateMax: 0
  }
};

// =========================================================================
// CANADIAN INSTITUTIONAL LENDERS CATALOG
// =========================================================================

const CANADIAN_LENDERS_CATALOG = [
  // --- BIG SIX BANKS (A-LENDERS / PRIME) ---
  {
    id: "CAN-RBC-PRIME",
    lender: "RBC Royal Bank",
    name: "RBC Royal Bank 5-Year Fixed Prime",
    category: "Big Six Bank (A-Lender)",
    termYears: 25,
    rate: 4.69,
    rateLabel: "4.69% 5-Yr Fixed",
    minCreditScore: 720,
    creditTier: "tier1_prime",
    maxLtv: 95.0, // With CMHC insurance
    maxGds: 39.0,
    maxTds: 44.0,
    type: "a_lender",
    badge: "🇨🇦 #1 Canadian Mortgage Lender",
    features: [
      "Canada's largest bank with RBC Homeline Plan (Revolving HELOC + Fixed Term)",
      "Double-Up payment option & 10% annual lump-sum prepayment without penalty",
      "90-day rate guarantee with automatic float-down"
    ],
    creditScoreRationale: "Top recommendation for Equifax/TransUnion scores 720+. Unlocks RBC's prime residential mortgage rate with fast approval across all provinces.",
    closingCostsPct: 1.25
  },
  {
    id: "CAN-TD-FLEX",
    lender: "TD Canada Trust",
    name: "TD Flexible 5-Year Variable Prime",
    category: "Big Six Bank (A-Lender)",
    termYears: 25,
    rate: 4.85,
    rateLabel: "4.85% Variable (Prime - 1.10%)",
    minCreditScore: 700,
    creditTier: "tier1_prime",
    maxLtv: 95.0,
    maxGds: 39.0,
    maxTds: 44.0,
    type: "a_lender",
    badge: "⚡ 15%+15% Prepayment Privileges",
    features: [
      "Industry-leading prepayment privileges: increase payment by 15% and prepay up to 15% lump sum annually",
      "Collateral charge registration allows future equity borrowing without legal refi fees",
      "Payment pause option during parental leave or career transitions"
    ],
    creditScoreRationale: "Recommended for credit scores 700+. Exceptional flexibility for borrowers seeking variable rate upside with rate-cut protection.",
    closingCostsPct: 1.30
  },
  {
    id: "CAN-SCOTIA-STEP",
    lender: "Scotiabank",
    name: "Scotia STEP 3-Year Fixed",
    category: "Big Six Bank (A-Lender)",
    termYears: 25,
    rate: 4.79,
    rateLabel: "4.79% 3-Yr Fixed",
    minCreditScore: 690,
    creditTier: "tier1_prime",
    maxLtv: 95.0,
    maxGds: 39.0,
    maxTds: 44.0,
    type: "a_lender",
    badge: "🏠 Scotia Total Equity Plan (STEP)",
    features: [
      "Scotia STEP allows splitting mortgage into fixed, variable, and line of credit portions",
      "Shorter 3-year term protects against locking in for 5 years during rate-cut cycles",
      "Scene+ rewards points on mortgage balance"
    ],
    creditScoreRationale: "Ideal for scores from 690+. The 3-year term is Canada's most sought-after structure in current economic cycles.",
    closingCostsPct: 1.20
  },
  {
    id: "CAN-BMO-SMART",
    lender: "BMO Bank of Montreal",
    name: "BMO Smart Fixed Mortgage",
    category: "Big Six Bank (A-Lender)",
    termYears: 25,
    rate: 4.64,
    rateLabel: "4.64% 5-Yr Smart Fixed",
    minCreditScore: 710,
    creditTier: "tier1_prime",
    maxLtv: 95.0,
    maxGds: 39.0,
    maxTds: 44.0,
    type: "a_lender",
    badge: "🛡️ 130-Day Rate Guarantee",
    features: [
      "Longest rate guarantee among Big Six banks: 130 days locked in",
      "Competitive rate discount for high-ratio CMHC-insured buyers",
      "Cashback incentives for first-time Canadian buyers (up to $2,500 CAD)"
    ],
    creditScoreRationale: "Outstanding match for scores of 710+. Offers the lowest posted Big Six fixed rate with full rate lock peace of mind.",
    closingCostsPct: 1.15
  },

  // --- MONOLINE WHOLESALE LENDERS (BROKER CHANNEL / PRIME A-LENDERS) ---
  {
    id: "CAN-FIRSTNAT-WHOLESALE",
    lender: "First National Financial",
    name: "First National Prime Wholesale 5-Year",
    category: "Monoline Prime (A-Lender)",
    termYears: 25,
    rate: 4.59,
    rateLabel: "4.59% Wholesale Fixed",
    minCreditScore: 680,
    creditTier: "tier2_good",
    maxLtv: 95.0,
    maxGds: 39.0,
    maxTds: 44.0,
    type: "monoline",
    badge: "📉 Ultra-Low Wholesale Rate",
    features: [
      "Canada's largest non-bank mortgage lender: lower overhead translates to lower rates",
      "Fair penalty calculation: standard 3-month interest penalty rather than punitive bank IRD",
      "Available exclusively through licensed mortgage brokers"
    ],
    creditScoreRationale: "Top recommendation for scores between 680 and 740. Bypasses Big Six retail markup with fair mortgage break penalty calculations.",
    closingCostsPct: 1.10
  },
  {
    id: "CAN-MCAP-FUSION",
    lender: "MCAP",
    name: "MCAP Value-Flex 5-Year Fixed",
    category: "Monoline Prime (A-Lender)",
    termYears: 25,
    rate: 4.62,
    rateLabel: "4.62% 5-Yr Fixed",
    minCreditScore: 680,
    creditTier: "tier2_good",
    maxLtv: 95.0,
    maxGds: 39.0,
    maxTds: 44.0,
    type: "monoline",
    badge: "💼 Premier Broker Monoline",
    features: [
      "20% annual lump sum prepayment + 20% monthly payment increase",
      "Over $140 Billion in Canadian assets under administration",
      "Dedicated portal with real-time equity tracking"
    ],
    creditScoreRationale: "Excellent for borrowers with good credit (680+) wanting market-leading wholesale pricing without retail banking cross-selling.",
    closingCostsPct: 1.15
  },

  // --- ALTERNATIVE / B-LENDERS (NEAR-PRIME & SELF-EMPLOYED) ---
  {
    id: "CAN-EQUITABLE-ALT",
    lender: "Equitable Bank (EQ Bank)",
    name: "Equitable Bank Alternative BFS Solution",
    category: "Alternative Bank (B-Lender)",
    termYears: 30,
    rate: 5.79,
    rateLabel: "5.79% 2-Yr / 3-Yr Alt",
    minCreditScore: 600,
    creditTier: "tier3_moderate",
    maxLtv: 80.0,
    maxGds: 45.0, // More flexible debt ratios
    maxTds: 50.0,
    type: "b_lender",
    badge: "💼 Self-Employed & Stated Income Specialist",
    features: [
      "Stated income program for Canadian Business-For-Self (BFS) and incorporated contractors",
      "Does not require strict notice of assessment (NOA) line 15000 if bank deposits demonstrate cash flow",
      "Available with 30-year amortization to reduce monthly qualifying payments"
    ],
    creditScoreRationale: "Top recommendation for scores 600–679 or self-employed borrowers who cannot qualify under rigid Big Six stress tests.",
    closingCostsPct: 1.75
  },
  {
    id: "CAN-HOMETRUST-CLASSIC",
    lender: "Home Trust Company",
    name: "Home Trust Classic Alternative Mortgage",
    category: "Alternative Specialist (B-Lender)",
    termYears: 30,
    rate: 6.09,
    rateLabel: "6.09% 1-Yr / 2-Yr Classic",
    minCreditScore: 580,
    creditTier: "tier3_moderate",
    maxLtv: 80.0,
    maxGds: 48.0,
    maxTds: 50.0,
    type: "b_lender",
    badge: "🛡️ Credit Rebuilding & Bruised Credit",
    features: [
      "Forgiving credit criteria for discharged bankruptcies, consumer proposals, or late collections",
      "Short 1-2 year terms designed to rehabilitate credit score before transitioning back to A-Lenders",
      "Non-traditional income verification (rental income, commission, tipped workers accepted)"
    ],
    creditScoreRationale: "Recommended for credit scores 580–639. The bridge solution that provides immediate financing while rehabilitating your Beacon score.",
    closingCostsPct: 1.90
  },

  // --- PRIVATE / MIC (MORTGAGE INVESTMENT CORPORATIONS) ---
  {
    id: "CAN-PRIVATE-MIC",
    lender: "Trez Capital / Olympia Private MIC",
    name: "Private Equity Short-Term Bridge Mortgage",
    category: "Private / MIC Lender",
    termYears: 25,
    rate: 7.99,
    rateLabel: "7.99% Interest-Only 1-Yr",
    minCreditScore: 500,
    creditTier: "tier4_rebuilding",
    maxLtv: 75.0,
    maxGds: 60.0,
    maxTds: 60.0,
    type: "private",
    badge: "⚡ Pure Equity Lending (No Stress Test)",
    features: [
      "Underwritten 100% on property equity and appraisal value, not credit score or tax returns",
      "Exempt from federal OSFI B-20 stress test regulations",
      "Fast 48-hour commitment and funding for urgent closing deadlines"
    ],
    creditScoreRationale: "For credit scores below 580 or unconventional borrowers requiring rapid private equity funding with interest-only payments.",
    closingCostsPct: 2.50
  }
];

// Presets for quick Canadian scenarios
const CANADIAN_SAMPLE_PRESETS = [
  {
    id: "toronto-prime",
    name: "🍁 Toronto First-Time Buyer (745 Equifax, $780k)",
    profile: {
      province: "ON",
      city: "Toronto",
      applicantName: "Jordan Campbell",
      documentType: "Driver's License & SIN",
      documentNumber: "DL-C8412-90124",
      email: "jordan.campbell@fintech.ca",
      phone: "(416) 555-0194",
      employmentType: "Permanent Full-Time Salaried",
      employmentYears: 4,
      monthlyGrossIncome: 13500,  // $162k/yr
      monthlyDebts: 650,          // Student loan + car lease
      creditScore: 745,           // Equifax Prime
      purchasePrice: 780000,
      downPayment: 78000,         // 10% down -> Insured Mortgage
      loanAmount: 702000,
      termYears: 25,
      propertyType: "Condo Apartment",
      propertyStatus: "Existing Home",
      isFirstTimeBuyer: true
    }
  },
  {
    id: "vancouver-luxury",
    name: "🏔️ Vancouver Prime Conventional (780 Equifax, $1.25M)",
    profile: {
      province: "BC",
      city: "Vancouver",
      applicantName: "Dr. Evelyn Zhang",
      documentType: "Canadian Passport & SIN",
      documentNumber: "PASS-ZA891240",
      email: "evelyn.zhang@healthbc.ca",
      phone: "(604) 555-0178",
      employmentType: "Medical Professional / Salaried",
      employmentYears: 7,
      monthlyGrossIncome: 24000,  // $288k/yr
      monthlyDebts: 1100,
      creditScore: 780,
      purchasePrice: 1250000,
      downPayment: 250000,        // 20% down -> Uninsured Conventional
      loanAmount: 1000000,
      termYears: 25,
      propertyType: "Townhouse",
      propertyStatus: "New Construction",
      isFirstTimeBuyer: false
    }
  },
  {
    id: "calgary-bfs",
    name: "🤠 Calgary Self-Employed (660 Score, $540k / EQ Bank)",
    profile: {
      province: "AB",
      city: "Calgary",
      applicantName: "Tyler MacLeod",
      documentType: "Driver's License & SIN",
      documentNumber: "DL-M4819-20914",
      email: "tyler@macleodcontracting.ab.ca",
      phone: "(403) 555-0142",
      employmentType: "Self-Employed (BFS Incorporated)",
      employmentYears: 5,
      monthlyGrossIncome: 11500,
      monthlyDebts: 850,
      creditScore: 660,           // Near-Prime Alt-A
      purchasePrice: 540000,
      downPayment: 108000,        // 20% down
      loanAmount: 432000,
      termYears: 30,             // 30-yr amort on B-Lender
      propertyType: "Single Family Detached",
      propertyStatus: "Existing Home",
      isFirstTimeBuyer: true
    }
  },
  {
    id: "montreal-firsttime",
    name: "⚜️ Montreal Smart Fixed (710 Score, $480k / BMO)",
    profile: {
      province: "QC",
      city: "Montreal",
      applicantName: "Marc-Antoine Tremblay",
      documentType: "Permis de Conduire & NAS",
      documentNumber: "QC-T1984-28104",
      email: "matremblay@creatif.qc.ca",
      phone: "(514) 555-0163",
      employmentType: "Permanent Full-Time Salaried",
      employmentYears: 3,
      monthlyGrossIncome: 9200,
      monthlyDebts: 400,
      creditScore: 710,
      purchasePrice: 480000,
      downPayment: 48000,         // 10% down -> CMHC Insured
      loanAmount: 432000,
      termYears: 25,
      propertyType: "Condo / Duplex",
      propertyStatus: "Existing Home",
      isFirstTimeBuyer: true
    }
  }
];

// =========================================================================
// CANADIAN FINANCIAL FORMULAS (OSFI B-20, CMHC, GDS/TDS)
// =========================================================================

/**
 * Standard Canadian amortized mortgage monthly payment
 */
function calculateAmortizedPayment(principal, annualRatePct, termYears) {
  if (!principal || principal <= 0 || !termYears || termYears <= 0) return 0;
  if (!annualRatePct || annualRatePct <= 0) return Math.round(principal / (termYears * 12));

  // In Canada, fixed rate mortgages compound semi-annually by law
  // Effective monthly rate = (1 + r/2)^(2/12) - 1
  const semiAnnualRate = (annualRatePct / 100) / 2;
  const monthlyRate = Math.pow(1 + semiAnnualRate, 2 / 12) - 1;
  const numPayments = termYears * 12;

  const payment = (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                  (Math.pow(1 + monthlyRate, numPayments) - 1);
  return Math.round(payment);
}

/**
 * OSFI Guideline B-20 Qualifying Stress Test Rate
 * Qualifying rate = MAX(contractRate + 2.00%, 5.25% Benchmark Floor)
 */
function calculateStressTestRate(contractRate) {
  const rate = parseFloat(contractRate) || 4.69;
  return parseFloat(Math.max(rate + 2.00, 5.25).toFixed(2));
}

/**
 * CMHC / Sagen / Canada Guaranty Mortgage Default Insurance Premium
 * Mandatory in Canada when Down Payment < 20% (LTV > 80%)
 */
function calculateCMHCPremum(purchasePrice, downPayment) {
  if (purchasePrice <= 0) return { isInsured: false, premiumRatePct: 0, premiumAmount: 0, baseLoan: 0, totalLoanWithPremium: 0, ltv: 0 };

  const baseLoan = Math.max(0, purchasePrice - downPayment);
  const ltv = (baseLoan / purchasePrice) * 100;

  if (ltv <= 80.0) {
    // Conventional uninsured mortgage (no CMHC premium)
    return {
      isInsured: false,
      premiumRatePct: 0,
      premiumAmount: 0,
      baseLoan: Math.round(baseLoan),
      totalLoanWithPremium: Math.round(baseLoan),
      ltv: parseFloat(ltv.toFixed(1))
    };
  }

  // CMHC Premium Schedule
  let premiumRatePct = 0;
  if (ltv <= 85.0) {
    premiumRatePct = 2.80;
  } else if (ltv <= 90.0) {
    premiumRatePct = 3.10;
  } else {
    premiumRatePct = 4.00; // 90.01% - 95.0% LTV
  }

  const premiumAmount = Math.round(baseLoan * (premiumRatePct / 100));
  const totalLoanWithPremium = baseLoan + premiumAmount;

  return {
    isInsured: true,
    premiumRatePct,
    premiumAmount,
    baseLoan: Math.round(baseLoan),
    totalLoanWithPremium: Math.round(totalLoanWithPremium),
    ltv: parseFloat(ltv.toFixed(1))
  };
}

/**
 * Format Canadian Dollar currency
 */
function formatCAD(amount) {
  const num = Math.round(Number(amount) || 0);
  return `$${num.toLocaleString('en-CA')} CAD`;
}

/**
 * Equifax / TransUnion Canada Credit Score Tiering
 */
function getCanadianCreditTier(score) {
  const numScore = parseInt(score, 10) || 720;

  if (numScore >= 750) {
    return {
      tierKey: "tier1_prime",
      tierLabel: "Tier 1: Prime Superior / A-Lender (750 - 900)",
      badgeClass: "tier-prime",
      color: "#34d399",
      description: "Qualifies for Canada's lowest posted prime rates with RBC, TD, Scotiabank, and BMO with instant digital pre-approval.",
      approvalOdds: "Excellent (>95%)",
      bureauScale: "300 - 900",
      bureauName: "Equifax & TransUnion Canada"
    };
  } else if (numScore >= 680) {
    return {
      tierKey: "tier2_good",
      tierLabel: "Tier 2: Good Credit / Monoline A-Lender (680 - 749)",
      badgeClass: "tier-good",
      color: "#22d3ee",
      description: "Qualifies for Big Six standard products and wholesale monoline broker lenders (First National, MCAP).",
      approvalOdds: "Strong (85% - 94%)",
      bureauScale: "300 - 900",
      bureauName: "Equifax & TransUnion Canada"
    };
  } else if (numScore >= 600) {
    return {
      tierKey: "tier3_moderate",
      tierLabel: "Tier 3: Near-Prime / Alternative B-Lender (600 - 679)",
      badgeClass: "tier-moderate",
      color: "#fbbf24",
      description: "Best suited for Alternative B-Lenders (Equitable Bank, Home Trust) with flexible income and extended 30-year amortizations.",
      approvalOdds: "Favorable with B-Lender (75% - 84%)",
      bureauScale: "300 - 900",
      bureauName: "Equifax & TransUnion Canada"
    };
  } else {
    return {
      tierKey: "tier4_rebuilding",
      tierLabel: "Tier 4: Credit Rebuilding / Private MIC (< 600)",
      badgeClass: "tier-rebuilding",
      color: "#f43f5e",
      description: "Requires private equity or Mortgage Investment Corporation (MIC) bridge funding based on home equity.",
      approvalOdds: "Equity-Based Private (55% - 70%)",
      bureauScale: "300 - 900",
      bureauName: "Equifax & TransUnion Canada"
    };
  }
}

// =========================================================================
// INTELLIGENT CANADIAN LENDER RECOMMENDATION ENGINE
// =========================================================================

/**
 * Suggests and ranks Canadian lenders based on credit score, down payment (CMHC),
 * GDS / TDS ratios, and OSFI B-20 stress test qualification.
 */
function suggestCanadianLendersByCreditScore(profile) {
  const province = profile.province || "ON";
  const creditScore = parseInt(profile.creditScore, 10) || 720;
  const purchasePrice = parseFloat(profile.purchasePrice) || 850000;
  const downPayment = parseFloat(profile.downPayment) || 170000;
  const monthlyGrossIncome = parseFloat(profile.monthlyGrossIncome) || 14000;
  const monthlyDebts = parseFloat(profile.monthlyDebts) || 600;
  const termYears = parseInt(profile.termYears, 10) || 25;

  const cmhcData = calculateCMHCPremum(purchasePrice, downPayment);
  const loanToFinance = cmhcData.totalLoanWithPremium;
  const creditTier = getCanadianCreditTier(creditScore);

  // Property tax estimate (approx 0.85% / year) & heating ($150/mo benchmark)
  const monthlyPropertyTax = Math.round((purchasePrice * 0.0085) / 12);
  const monthlyHeating = 150;

  const evaluatedLenders = CANADIAN_LENDERS_CATALOG.map(lender => {
    const isCreditQualified = creditScore >= lender.minCreditScore;
    const scoreDiff = creditScore - lender.minCreditScore;
    const isLtvQualified = cmhcData.ltv <= lender.maxLtv;

    // Monthly payments
    const monthlyPayment = calculateAmortizedPayment(loanToFinance, lender.rate, termYears);
    const stressRate = calculateStressTestRate(lender.rate);
    const qualifyingStressPayment = calculateAmortizedPayment(loanToFinance, stressRate, termYears);

    // Canadian Debt Service Ratios:
    // GDS = (Mortgage Payment + Property Taxes + Heating) / Gross Monthly Income * 100
    // TDS = (Mortgage Payment + Property Taxes + Heating + Other Debts) / Gross Monthly Income * 100
    const gdsStress = monthlyGrossIncome > 0 
      ? parseFloat((((qualifyingStressPayment + monthlyPropertyTax + monthlyHeating) / monthlyGrossIncome) * 100).toFixed(1)) 
      : 0;
    const tdsStress = monthlyGrossIncome > 0 
      ? parseFloat((((qualifyingStressPayment + monthlyPropertyTax + monthlyHeating + monthlyDebts) / monthlyGrossIncome) * 100).toFixed(1)) 
      : 0;

    const isGdsQualified = gdsStress <= lender.maxGds;
    const isTdsQualified = tdsStress <= lender.maxTds;
    const isStressTestQualified = isGdsQualified && isTdsQualified;

    // Match Algorithm (0 - 100%)
    let matchScore = 0;

    // 1. Credit Qualification & Tier Alignment (up to 55 pts)
    if (isCreditQualified) {
      matchScore += 35;
      if (creditTier.tierKey === lender.creditTier) {
        matchScore += 20; // Direct tier match (Prime borrower with Prime Big 6 bank)
      } else if (creditTier.tierKey === 'tier1_prime' && lender.creditTier === 'tier2_good') {
        matchScore += 12;
      } else if (creditTier.tierKey === 'tier2_good' && lender.creditTier === 'tier3_moderate') {
        matchScore += 10;
      } else {
        matchScore += 4;
      }
    } else if (scoreDiff >= -30) {
      matchScore += 12; // Borderline credit
    } else {
      matchScore += 3;
    }

    // 2. Rate Competitiveness (up to 20 pts)
    // Canadian rates range from ~4.59% (wholesale prime) to ~8% (private)
    const rateScore = Math.max(0, Math.min(20, Math.round((7.50 - lender.rate) * 6)));
    matchScore += rateScore;

    // 3. LTV & CMHC Alignment (up to 15 pts)
    if (isLtvQualified) {
      matchScore += 15;
    } else {
      matchScore += 2;
    }

    // 4. Stress Test GDS/TDS Alignment (up to 10 pts)
    if (isStressTestQualified) {
      matchScore += 10;
    } else if (tdsStress <= lender.maxTds + 4) {
      matchScore += 5; // Close to passing
    }

    matchScore = Math.min(99, Math.max(20, matchScore));

    // Recommendation Label
    let recommendationLevel = "ELIGIBLE";
    let matchTag = "Viable Option";
    if (matchScore >= 88) {
      recommendationLevel = "TOP RECOMMENDATION";
      matchTag = "🌟 #1 Recommended Match";
    } else if (matchScore >= 78) {
      recommendationLevel = "STRONG CANDIDATE";
      matchTag = "✅ Strong Alternative";
    } else if (matchScore >= 68) {
      recommendationLevel = "QUALIFIED";
      matchTag = "⚖️ Qualified Solution";
    }

    return {
      lender,
      matchScore,
      recommendationLevel,
      matchTag,
      isCreditQualified,
      isLtvQualified,
      isStressTestQualified,
      isOverallEligible: isCreditQualified && isLtvQualified && isStressTestQualified,
      scoreDiff,
      calculations: {
        purchasePrice,
        purchasePriceFormatted: formatCAD(purchasePrice),
        downPayment,
        downPaymentFormatted: formatCAD(downPayment),
        loanToFinance,
        loanToFinanceFormatted: formatCAD(loanToFinance),
        ltv: cmhcData.ltv,
        isInsured: cmhcData.isInsured,
        cmhcPremiumAmount: cmhcData.premiumAmount,
        cmhcPremiumFormatted: formatCAD(cmhcData.premiumAmount),
        contractRate: lender.rate,
        stressRate,
        monthlyPayment,
        monthlyPaymentFormatted: formatCAD(monthlyPayment),
        qualifyingStressPayment,
        qualifyingStressPaymentFormatted: formatCAD(qualifyingStressPayment),
        monthlyPropertyTax,
        monthlyHeating,
        gdsStress,
        tdsStress,
        termYears
      },
      personalizedAdvice: isCreditQualified
        ? `Your score of ${creditScore} meets ${lender.lender}'s minimum requirement of ${lender.minCreditScore} (+${scoreDiff} pts), qualifying you for their ${lender.rateLabel} rate.`
        : `Your score (${creditScore}) is below ${lender.lender}'s standard minimum of ${lender.minCreditScore}. Consider a co-signer or exploring alternative B-Lender options.`
    };
  });

  // Sort by match score descending, then by lower interest rate
  evaluatedLenders.sort((a, b) => b.matchScore - a.matchScore || a.lender.rate - b.lender.rate);

  const topMatch = evaluatedLenders[0] || null;
  const eligibleLenders = evaluatedLenders.filter(l => l.isOverallEligible);

  return {
    province,
    creditScore,
    creditTier,
    profile: {
      ...profile,
      ltv: cmhcData.ltv,
      cmhcData
    },
    topMatch,
    evaluatedLenders,
    eligibleLenders,
    totalEvaluated: evaluatedLenders.length,
    totalEligible: eligibleLenders.length
  };
}

// Backwards compatibility for existing test suite
const MORTGAGE_DEALS_CATALOG = [
  {
    id: "DEAL-CONV-30-APEX",
    lender: "Apex Home Lending",
    category: "Conventional",
    name: "Apex Prime 30-Year Fixed",
    termYears: 30,
    rate: 6.250,
    apr: 6.385,
    points: 0.125,
    minCreditScore: 680,
    maxLtv: 95.0,
    maxDti: 43.0,
    minLoan: 100000,
    maxLoan: CONFORMING_LOAN_LIMIT_2026,
    loanType: "conventional",
    propertyTypes: ["Single Family", "Townhouse", "Condo"],
    features: ["No prepayment penalties", "Fast 18-day close guarantee"],
    bestFor: "Borrowers seeking stable fixed payments",
    closingCostsPct: 0.95
  },
  {
    id: "DEAL-CONV-30-CITADEL",
    lender: "Citadel Capital",
    category: "Conventional",
    name: "Citadel Super-Prime 30-Year Fixed",
    termYears: 30,
    rate: 6.125,
    apr: 6.240,
    points: 0.250,
    minCreditScore: 740,
    maxLtv: 80.0,
    maxDti: 40.0,
    minLoan: 150000,
    maxLoan: CONFORMING_LOAN_LIMIT_2026,
    loanType: "conventional",
    propertyTypes: ["Single Family", "Townhouse"],
    features: ["Lowest fixed rate", "Zero processing fees"],
    bestFor: "High-credit borrowers with at least 20% equity",
    closingCostsPct: 0.80
  },
  {
    id: "DEAL-FHA-30-BLUEPEAK",
    lender: "BluePeak Direct",
    category: "FHA Government",
    name: "BluePeak Advantage FHA 30-Year",
    termYears: 30,
    rate: 5.875,
    apr: 6.720,
    points: 0.375,
    minCreditScore: 580,
    maxLtv: 96.5,
    maxDti: 50.0,
    minLoan: 60000,
    maxLoan: CONFORMING_LOAN_LIMIT_2026,
    loanType: "fha",
    propertyTypes: ["Single Family", "Townhouse"],
    features: ["Low 3.5% down payment", "Forgiving credit"],
    bestFor: "First-time buyers recovering credit",
    closingCostsPct: 1.10
  },
  {
    id: "DEAL-VA-30-FREEDOM",
    lender: "Freedom Veterans Trust",
    category: "VA Military",
    name: "Freedom Patriot VA 30-Year",
    termYears: 30,
    rate: 5.750,
    apr: 5.920,
    points: 0.000,
    minCreditScore: 580,
    maxLtv: 100.0,
    maxDti: 50.0,
    minLoan: 100000,
    maxLoan: 1500000,
    loanType: "va",
    propertyTypes: ["Single Family"],
    features: ["0% Down Payment", "No monthly PMI"],
    bestFor: "Active duty and veterans",
    closingCostsPct: 0.70
  },
  {
    id: "DEAL-JUMBO-30-PACIFIC",
    lender: "Pacific Crest Private Wealth",
    category: "Jumbo Luxury",
    name: "Pacific Elite Jumbo 30-Year Fixed",
    termYears: 30,
    rate: 6.625,
    apr: 6.745,
    points: 0.500,
    minCreditScore: 720,
    maxLtv: 80.0,
    maxDti: 40.0,
    minLoan: CONFORMING_LOAN_LIMIT_2026 + 1,
    maxLoan: 3500000,
    loanType: "jumbo",
    propertyTypes: ["Single Family"],
    features: ["High loan balances", "Concierge underwriting"],
    bestFor: "Luxury purchases exceeding county conforming limits",
    closingCostsPct: 1.05
  }
];

function filterMortgageDeals(profile) {
  const {
    loanAmount,
    purchasePrice,
    creditScore,
    monthlyGrossIncome,
    monthlyDebts = 0,
    propertyType = "Single Family",
    isVeteran = false
  } = profile;

  const ltv = (loanAmount / purchasePrice) * 100;
  const isConforming = loanAmount <= CONFORMING_LOAN_LIMIT_2026;

  const results = MORTGAGE_DEALS_CATALOG.map(deal => {
    const checks = {
      creditOk: creditScore >= deal.minCreditScore,
      ltvOk: ltv <= deal.maxLtv,
      loanAmountOk: loanAmount >= deal.minLoan && loanAmount <= deal.maxLoan,
      propertyOk: deal.propertyTypes.includes(propertyType) || deal.propertyTypes.includes("Single Family"),
      veteranOk: deal.loanType !== "va" || isVeteran
    };

    const monthlyRate = deal.rate / 100 / 12;
    const numPayments = deal.termYears * 12;
    const pi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
               (Math.pow(1 + monthlyRate, numPayments) - 1);

    const monthlyTax = (purchasePrice * 0.012) / 12;
    const monthlyInsurance = 110;
    
    let monthlyPmi = 0;
    if (deal.loanType === 'conventional' || deal.loanType === 'conventional-15' || deal.loanType === 'arm') {
      if (ltv > 80) monthlyPmi = (loanAmount * 0.0075) / 12;
    } else if (deal.loanType === 'fha') {
      monthlyPmi = (loanAmount * 0.0055) / 12;
    }

    const totalMonthlyPayment = Math.round(pi + monthlyTax + monthlyInsurance + monthlyPmi);
    const frontDti = monthlyGrossIncome > 0 ? ((totalMonthlyPayment / monthlyGrossIncome) * 100) : 0;
    const backDti = monthlyGrossIncome > 0 ? (((totalMonthlyPayment + monthlyDebts) / monthlyGrossIncome) * 100) : 0;

    checks.dtiOk = backDti <= deal.maxDti;
    const isEligible = checks.creditOk && checks.ltvOk && checks.loanAmountOk && checks.dtiOk && checks.veteranOk;

    return {
      deal,
      isEligible,
      checks,
      reasons: [],
      calculations: {
        ltv: parseFloat(ltv.toFixed(1)),
        frontDti: parseFloat(frontDti.toFixed(1)),
        backDti: parseFloat(backDti.toFixed(1)),
        pi: Math.round(pi),
        monthlyPmi: Math.round(monthlyPmi),
        totalMonthlyPayment
      }
    };
  });

  return {
    profile: {
      ...profile,
      ltv: parseFloat(ltv.toFixed(1)),
      isConforming
    },
    eligibleDeals: results.filter(r => r.isEligible),
    ineligibleDeals: results.filter(r => !r.isEligible),
    allEvaluated: results
  };
}

// Aliases for compatibility
const ANDEAN_MARKETS = {
  CA: {
    code: "CA",
    name: "Canada",
    flag: "🇨🇦",
    currency: "CAD",
    currencySymbol: "$",
    rateTypeLabel: "Posted / Contract Rate",
    creditBureau: "Equifax & TransUnion Canada",
    bureauScale: "300 - 900",
    idTypes: ["Driver's License & SIN", "Canadian Passport", "PR Card"],
    propertyTypes: ["Single Family Detached", "Semi-Detached", "Townhouse", "Condo Apartment"],
    defaultProfile: CANADIAN_SAMPLE_PRESETS[0].profile,
    samplePresets: CANADIAN_SAMPLE_PRESETS
  }
};
const ANDEAN_LENDERS_CATALOG = CANADIAN_LENDERS_CATALOG;
const suggestLendersByCreditScore = suggestCanadianLendersByCreditScore;
const formatAndeanCurrency = formatCAD;
const getCreditTierInfo = getCanadianCreditTier;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CONFORMING_LOAN_LIMIT_2026,
    CANADIAN_PROVINCES,
    CANADIAN_LENDERS_CATALOG,
    CANADIAN_SAMPLE_PRESETS,
    suggestCanadianLendersByCreditScore,
    calculateStressTestRate,
    calculateCMHCPremum,
    calculateAmortizedPayment,
    getCanadianCreditTier,
    formatCAD,
    // Backwards compatibility
    MORTGAGE_DEALS_CATALOG,
    filterMortgageDeals,
    ANDEAN_MARKETS,
    ANDEAN_LENDERS_CATALOG,
    suggestLendersByCreditScore,
    formatAndeanCurrency,
    getCreditTierInfo
  };
}
