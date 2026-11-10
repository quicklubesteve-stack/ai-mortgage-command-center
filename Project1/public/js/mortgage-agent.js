/**
 * Canadian AI Mortgage Assistant & Deal Filtration Engine
 * Specializes in Canadian Mortgages (OSFI B-20 Guidelines, CMHC/Sagen Insurance,
 * Big Six Banks, Monolines, & Alternative B-Lenders).
 * Strictly enforces human-in-the-loop authorization guardrail for Steve.
 */

const getDealsModule = () => {
  if (typeof suggestCanadianLendersByCreditScore !== 'undefined') {
    return {
      suggestCanadianLendersByCreditScore,
      calculateStressTestRate: typeof calculateStressTestRate !== 'undefined' ? calculateStressTestRate : (r => r + 2.0),
      calculateCMHCPremum: typeof calculateCMHCPremum !== 'undefined' ? calculateCMHCPremum : null,
      getCanadianCreditTier: typeof getCanadianCreditTier !== 'undefined' ? getCanadianCreditTier : null,
      formatCAD: typeof formatCAD !== 'undefined' ? formatCAD : (v => `$${v} CAD`),
      CANADIAN_LENDERS_CATALOG: typeof CANADIAN_LENDERS_CATALOG !== 'undefined' ? CANADIAN_LENDERS_CATALOG : [],
      CANADIAN_PROVINCES: typeof CANADIAN_PROVINCES !== 'undefined' ? CANADIAN_PROVINCES : {},
      filterMortgageDeals: typeof filterMortgageDeals !== 'undefined' ? filterMortgageDeals : null
    };
  }
  if (typeof require !== 'undefined') {
    try {
      return require('./deals-data.js');
    } catch (e) {
      try {
        return require('./public/js/deals-data.js');
      } catch (err) {}
    }
  }
  return {};
};

class MortgageAgent {
  constructor() {
    this.activeProvince = "ON"; // Default: Ontario 🍁

    this.borrowerProfile = {
      province: "ON",
      city: "Toronto",
      applicantName: "Jordan Campbell",
      borrowerName: "Jordan Campbell",
      documentType: "Driver's License & SIN",
      documentNumber: "DL-C8412-90124",
      email: "jordan.campbell@fintech.ca",
      phone: "(416) 555-0194",
      employmentType: "Permanent Full-Time Salaried",
      employmentYears: 4,
      purchasePrice: 850000,
      downPayment: 170000,        // 20% down (conventional uninsured)
      loanAmount: 680000,
      creditScore: 745,           // Equifax / TransUnion Prime
      monthlyGrossIncome: 14000,  // $168,000 / year
      monthlyDebts: 650,          // Auto lease / student debt
      termYears: 25,
      propertyType: "Condo Apartment",
      propertyStatus: "Existing Home",
      isFirstTimeBuyer: true,
      isVeteran: false
    };

    this.currentEvaluation = null;
    this.currentCanadianRecommendations = null;
    this.conversationHistory = [];
  }

  setProvince(provCode) {
    this.activeProvince = provCode;
    this.borrowerProfile.province = provCode;
    return provCode;
  }

  // Backward compatible alias
  setMarket(code) {
    return this.setProvince(code);
  }

  /**
   * Primary entry point for borrower / broker chat messages
   */
  processMessage(userText) {
    const text = userText.trim();
    const lower = text.toLowerCase();

    // 1. Guardrail Check: Direct Approval / Denial Requests
    if (this.isApprovalOrDenialRequest(lower)) {
      return {
        type: "guardrail_violation",
        text: this.generateGuardrailRefusalMessage(text),
        data: null
      };
    }

    // 2. Queue & Authorization Status Queries
    if (lower.includes("queue") || lower.includes("status") || lower.includes("steve") || lower.includes("authorization desk") || lower.includes("pending deals")) {
      return {
        type: "queue_status",
        text: `📋 **Steve's Canadian Underwriting Desk Synchronization**:\nAll mortgage application files and deal packages are routed directly to **Steve's Human Authorization Cockpit**. As an AI agent, I filter institutional lending matrices, compute OSFI B-20 qualifying stress tests, and calculate GDS/TDS ratios. However, under Canadian financial regulations and platform governance, only **Steve (Licensed Canadian Mortgage Broker / Underwriter)** can issue binding mortgage commitments or approval certificates.`,
        action: "OPEN_QUEUE"
      };
    }

    // 3. Application filling trigger
    if (lower.includes("application") || lower.includes("apply") || lower.includes("fill") || lower.includes("form") || lower.includes("solicitud")) {
      return {
        type: "application_prompt",
        text: `### 📝 Canadian Mortgage Application Form\n\nYou can fill out your full Canadian residential mortgage application in the **"📝 Application Form"** tab on the right.\n\n**Parameters we analyze in real time:**\n- 🍁 **Province & City:** Ontario (Toronto), British Columbia (Vancouver), Alberta (Calgary), etc.\n- 💼 **Employment & Income:** Salaried or Self-Employed (BFS Stated Income).\n- 💳 **Credit Score:** Equifax & TransUnion Canada (300 - 900 score).\n- 🏠 **Down Payment & Purchase Price:** CMHC default insurance rules (5% minimum under $500k, 10% up to $1.5M, 20% over $1.5M).\n- ⚖️ **OSFI B-20 Stress Test:** Qualifying rate calculations and GDS / TDS ratios.\n\nOnce submitted, the engine will match you with the **best Canadian Big Six banks, monolines, and alternative B-lenders**.`,
        action: "OPEN_APPLICATION_TAB"
      };
    }

    // 4. Lender suggestion query based on credit score
    if (lower.includes("suggest") || lower.includes("lender") || lower.includes("bank") || lower.includes("credit score") || lower.includes("equifax") || lower.includes("transunion")) {
      return this.generateCreditScoreRecommendationResponse();
    }

    // 5. Canadian Province Presets in Chat
    if (lower.includes("ontario") || lower.includes("toronto") || lower.includes("on")) {
      this.setProvince("ON");
      return this.generateCreditScoreRecommendationResponse("🍁 Ontario Mortgage Profile: Toronto & GTA Matrix");
    }
    if (lower.includes("british columbia") || lower.includes("vancouver") || lower.includes("bc")) {
      this.setProvince("BC");
      return this.generateCreditScoreRecommendationResponse("🏔️ British Columbia Profile: Vancouver & Lower Mainland Matrix");
    }
    if (lower.includes("alberta") || lower.includes("calgary") || lower.includes("ab")) {
      this.setProvince("AB");
      return this.generateCreditScoreRecommendationResponse("🤠 Alberta Profile: Calgary & Edmonton Matrix");
    }
    if (lower.includes("quebec") || lower.includes("montreal") || lower.includes("qc")) {
      this.setProvince("QC");
      return this.generateCreditScoreRecommendationResponse("⚜️ Quebec Profile: Montreal & Greater Montreal Matrix");
    }

    // 6. Quick Presets for First-Time / Jumbo
    if (lower.includes("first-time") || lower.includes("first time")) {
      this.borrowerProfile.isFirstTimeBuyer = true;
      this.borrowerProfile.downPayment = Math.round(this.borrowerProfile.purchasePrice * 0.10);
      this.borrowerProfile.loanAmount = this.borrowerProfile.purchasePrice - this.borrowerProfile.downPayment;
      return this.generateCreditScoreRecommendationResponse("🇨🇦 Canadian First-Time Home Buyer Scenario (10% Down, CMHC Insured)");
    }

    if (lower.includes("b-lender") || lower.includes("self-employed") || lower.includes("bfs") || lower.includes("alternative")) {
      this.borrowerProfile.creditScore = 660;
      this.borrowerProfile.employmentType = "Self-Employed (BFS Incorporated)";
      this.borrowerProfile.termYears = 30;
      return this.generateCreditScoreRecommendationResponse("💼 Canadian Alternative B-Lender Solution (EQ Bank / Home Trust BFS)");
    }

    // 7. Natural language parameter extraction
    const extracted = this.extractParametersFromText(text);
    if (extracted.modified) {
      Object.assign(this.borrowerProfile, extracted.profileUpdates);
      return this.generateCreditScoreRecommendationResponse(`Profile Updated: ${extracted.summary}`);
    }

    // 8. General Help
    if (lower.includes("how does it work") || lower.includes("help") || lower.includes("what can you do")) {
      return {
        type: "help",
        text: `### 🤖 Welcome to the Canadian AI Mortgage Assistant\n\nI evaluate borrower profiles under **OSFI Guideline B-20**, calculate **CMHC default insurance premiums**, compute **GDS/TDS debt service ratios**, and suggest the best Canadian institutional lenders (**RBC, TD, Scotiabank, BMO, First National, Equitable Bank, Home Trust**).\n\n**Core Capabilities:**\n- 📝 **Application Processing:** Diligently analyze down payment tiering, income stability, and credit score.\n- 💳 **Credit Score Matching:** Match Equifax / TransUnion scores (300-900) to A-Lender vs B-Lender requirements.\n- ⚖️ **OSFI B-20 Stress Test Math:** Compute qualifying monthly payments at contract rate + 2.0%.\n- 📤 **Broker Packaging:** Forward complete dossiers to **Steve's Authorization Cockpit**.\n\n**Strict Regulatory Guardrail:**\n- 🚫 I am **STRICTLY PROHIBITED** from approving or denying any mortgage application.\n- 👤 Only **Steve (Licensed Human Underwriter)** can authorize or reject deals.`
      };
    }

    // Default response
    return this.generateCreditScoreRecommendationResponse();
  }

  /**
   * Guardrail detection: Checks if text attempts to command deal approval or rejection
   */
  isApprovalOrDenialRequest(lower) {
    const patterns = [
      /\b(can you|please|you)\s+(approve|deny|reject|grant|decline)\b/,
      /\b(approve|deny|reject)\s+(this|the|my|all)?\s*(deal|loan|application|mortgage)\b/,
      /\bapproval\s+letter\b/,
      /\bare\s+you\s+allowed\s+to\s+approve\b/,
      /\bissue\s+(an\s+)?approval\b/,
      /\bmake\s+a\s+decision\b/,
      /\b(puedes|por favor|debes)\s+(aprobar|rechazar|denegar|autorizar)\b/,
      /\b(aprueba|rechaza|niega|autoriza)\s+(mi|el|este)?\s*(crédito|credito|préstamo|prestamo|solicitud)\b/
    ];
    return patterns.some(pattern => pattern.test(lower));
  }

  /**
   * Strict refusal response message
   */
  generateGuardrailRefusalMessage(input) {
    return `### 🛑 STRICT CANADIAN UNDERWRITING GOVERNANCE NOTICE / AVISO DE GOBERNANZA
**ESTRICTAMENTE PROHIBIDO / STRICTLY PROHIBITED:**
> As an automated AI intake and deal filtration agent, **I AM STRICTLY PROHIBITED FROM APPROVING OR DENYING MORTGAGE APPLICATIONS.** (El Agente de IA tiene **ESTRICTAMENTE PROHIBIDO** aprobar o denegar solicitudes).

- **OSFI B-20 & Provincial Compliance:** Under federal and provincial financial consumer protection frameworks, credit adjudication and binding commitments require authorized human review.
- **Exclusive Authority:** **Steve (Authorized Mortgage Underwriter)** retains 100% exclusive authority to approve, condition, or decline any mortgage deal.
- **Next Step:** Your completed mortgage file, CMHC insurance calculation, and OSFI stress test matrix have been routed to **Steve's Human Authorization Cockpit** for final determination.

*You can view and authorize this dossier in Steve's Authorization Desk at the top right.*`;
  }

  /**
   * Generates Canadian lender recommendations based on borrower credit score
   */
  generateCreditScoreRecommendationResponse(customHeadline = null) {
    const dealsMod = getDealsModule();
    if (dealsMod && dealsMod.suggestCanadianLendersByCreditScore) {
      const result = dealsMod.suggestCanadianLendersByCreditScore(this.borrowerProfile);
      this.currentCanadianRecommendations = result;

      const tier = result.creditTier;
      const top = result.topMatch;
      const fmt = dealsMod.formatCAD || (v => `$${v} CAD`);

      const headline = customHeadline || `Canadian Lender Matching for ${this.borrowerProfile.creditScore} Score (${this.borrowerProfile.province})`;

      let text = `### 🇨🇦 ${headline}\n\n`;
      text += `**Borrower Credit & Underwriting Dossier:**\n`;
      text += `- 💳 **Equifax / TransUnion Score:** **${result.creditScore}** — <span style="color:${tier.color}; font-weight:700;">${tier.tierLabel}</span>\n`;
      text += `- 🎯 **Approval Odds:** **${tier.approvalOdds}**\n`;
      text += `- 🏠 **Purchase Price:** ${fmt(this.borrowerProfile.purchasePrice)} | **Down Payment:** ${fmt(this.borrowerProfile.downPayment)} (${result.profile.cmhcData.isInsured ? '⚠️ CMHC Insured High-Ratio' : '✅ Conventional Uninsured'})\n`;
      text += `- 💼 **Gross Income:** ${fmt(this.borrowerProfile.monthlyGrossIncome)}/mo | **Total Loan:** ${fmt(result.profile.cmhcData.totalLoanWithPremium)}\n\n`;

      if (top) {
        text += `#### 🌟 #1 Recommended Canadian Lender:\n`;
        text += `**${top.lender.lender} — ${top.lender.name}**\n`;
        text += `- 📈 **Rate:** **${top.lender.rateLabel}** | **Monthly Payment:** **${top.calculations.monthlyPaymentFormatted}/mo**\n`;
        text += `- ⚖️ **OSFI Stress Test Qualifying Rate:** **${top.calculations.stressRate}%** (Qualifying P&I: ${top.calculations.qualifyingStressPaymentFormatted}/mo)\n`;
        text += `- 📊 **Ratios:** GDS: **${top.calculations.gdsStress}%** (Cap: ${top.lender.maxGds}%) • TDS: **${top.calculations.tdsStress}%** (Cap: ${top.lender.maxTds}%)\n`;
        text += `- 🎯 **Match Score:** **${top.matchScore}% (${top.matchTag})**\n`;
        text += `- 💡 *${top.personalizedAdvice}*\n\n`;
      }

      text += `Found **${result.totalEligible} Qualified Canadian Lenders** matching your profile. Check the **"Suggested Lenders"** tab for full Big Six vs Monoline vs B-Lender breakdowns.\n\n`;
      text += `> ⚠️ **MANDATORY UNDERWRITING NOTICE:**\n> These filtered products are candidate deals only. **The AI Agent cannot approve or deny any loan.** Final authorization is retained exclusively by **Steve** (Human Underwriter).`;

      return {
        type: "canadian_recommendations",
        text,
        canadianResult: result,
        borrowerProfile: this.borrowerProfile
      };
    }

    return this.evaluateAndPresentDeals(customHeadline);
  }

  /**
   * Process a completed Application Form submission
   */
  processApplicationSubmission(formData) {
    this.borrowerProfile = {
      ...this.borrowerProfile,
      ...formData
    };

    if (formData.province) {
      this.activeProvince = formData.province;
    }

    const dealsMod = getDealsModule();
    let recommendationData = null;
    if (dealsMod && dealsMod.suggestCanadianLendersByCreditScore) {
      recommendationData = dealsMod.suggestCanadianLendersByCreditScore(this.borrowerProfile);
      this.currentCanadianRecommendations = recommendationData;
    }

    const dossier = this.createDossierPayload(
      recommendationData && recommendationData.topMatch ? recommendationData.topMatch.lender : null
    );

    return {
      success: true,
      dossier,
      recommendationData,
      borrowerProfile: this.borrowerProfile
    };
  }

  /**
   * Natural language extractor for loan numbers & Canadian currency denominations
   */
  extractParametersFromText(text) {
    let modified = false;
    const updates = {};
    const lower = text.toLowerCase();
    const summaryParts = [];

    // Credit score (e.g. "credit score 740", "720 credit", "score 780", "equifax 745", "transunion 710", "beacon 680")
    const creditMatch = text.match(/(?:credit(?:\s+score)?|fico|score|equifax|transunion|beacon)[\s:]*(\d{3})/i) ||
                        text.match(/\b([3-9]\d{2})\s*(?:in\s+|with\s+)?(?:credit|fico|score|equifax|transunion|beacon|pts|points)/i) ||
                        text.match(/\b([5-8]\d{2})\s*(?:credit|fico)/i);
    if (creditMatch) {
      const score = parseInt(creditMatch[1], 10);
      if (score >= 300 && score <= 900) {
        updates.creditScore = score;
        summaryParts.push(`Credit Score updated to ${score}`);
        modified = true;
      }
    }

    // Monthly debts (e.g. "debt $600", "monthly debt 700", "$700 debts", "$500 debt", "debts of 400")
    const debtMatch = text.match(/(?:debt|debts|obligations)[\s:]*(?:of\s*)?\$?(\d[\d,]*(?:\.\d+)?)\s*(k|thousand|month|\/mo)?/i) ||
                      text.match(/\$(\d[\d,]*(?:\.\d+)?)\s*(k|thousand)?\s*(?:\/mo)?\s*(?:in\s*)?(?:debt|debts|obligations)/i) ||
                      text.match(/\b(\d[\d,]*(?:\.\d+)?)\s*(k|thousand)?\s*(?:\/mo)?\s*(?:in\s*)?(?:debt|debts|obligations)/i);
    if (debtMatch) {
      let val = parseFloat(debtMatch[1].replace(/,/g, ''));
      const unit = (debtMatch[2] || '').toLowerCase();
      if (unit === 'k' || unit === 'thousand') val *= 1000;
      if (!isNaN(val)) {
        updates.monthlyDebts = Math.round(val);
        summaryParts.push(`Monthly debts set to $${updates.monthlyDebts.toLocaleString()}`);
        modified = true;
      }
    }

    // Income (e.g. "make $14,000", "income $12k", "earning $15k/mo", "salary $160,000")
    const incomeMatch = text.match(/(?:income|make|earn|earning|salary)[\s:]*\$?(\d[\d,]*(?:\.\d+)?)\s*(k|thousand|month|\/mo)?/i);
    if (incomeMatch) {
      let val = parseFloat(incomeMatch[1].replace(/,/g, ''));
      const unit = (incomeMatch[2] || '').toLowerCase();
      if (unit === 'k' || unit === 'thousand') val *= 1000;
      if (val > 35000) val = Math.round(val / 12); // Convert annual salary to monthly
      updates.monthlyGrossIncome = Math.round(val);
      summaryParts.push(`Gross Income set to $${updates.monthlyGrossIncome.toLocaleString()}/mo`);
      modified = true;
    }

    // Purchase Price / Property value (e.g. "$750k house", "$850,000 home", "1.2M property", "condo for 600k")
    const priceMatch = text.match(/(?:price|home|house|property|cost|condo)[\s:]*(?:of|for)?[\s:]*\$?(\d[\d,]*(?:\.\d+)?)\s*(k|thousand|million|m)?/i) ||
                       text.match(/\$?(\d[\d,]*(?:\.\d+)?)\s*(k|thousand|million|m)?\s*(?:home|house|property|condo)/i);
    if (priceMatch) {
      let val = parseFloat(priceMatch[1].replace(/,/g, ''));
      const unit = (priceMatch[2] || '').toLowerCase();
      if (unit === 'k' || unit === 'thousand') val *= 1000;
      if (unit === 'million' || unit === 'm') val *= 1000000;
      if (val >= 50000) {
        updates.purchasePrice = Math.round(val);
        summaryParts.push(`Purchase price set to $${updates.purchasePrice.toLocaleString()}`);
        modified = true;
      }
    }

    // Down payment (e.g. "20% down", "10% down", "$100k down")
    const downPctMatch = text.match(/(\d{1,2}(?:\.\d+)?)\s*%\s*(?:down|downpayment)/i);
    const downCashMatch = text.match(/(?:down|down payment)[\s:]*\$?([\d,]+(?:\.\d+)?)\s*(k|thousand)?/i);

    if (downPctMatch) {
      const pct = parseFloat(downPctMatch[1]);
      const basePrice = updates.purchasePrice || this.borrowerProfile.purchasePrice;
      updates.downPayment = Math.round(basePrice * (pct / 100));
      updates.loanAmount = basePrice - updates.downPayment;
      summaryParts.push(`Down payment set to ${pct}% ($${updates.downPayment.toLocaleString()})`);
      modified = true;
    } else if (downCashMatch) {
      let val = parseFloat(downCashMatch[1].replace(/,/g, ''));
      const unit = (downCashMatch[2] || '').toLowerCase();
      if (unit === 'k' || unit === 'thousand') val *= 1000;
      const basePrice = updates.purchasePrice || this.borrowerProfile.purchasePrice;
      if (val < basePrice) {
        updates.downPayment = Math.round(val);
        updates.loanAmount = basePrice - updates.downPayment;
        summaryParts.push(`Down payment set to $${updates.downPayment.toLocaleString()}`);
        modified = true;
      }
    }

    // Recalculate loan amount if price changed but down payment was unchanged
    if (updates.purchasePrice && !updates.downPayment) {
      const currentDownPct = this.borrowerProfile.downPayment / this.borrowerProfile.purchasePrice;
      updates.downPayment = Math.round(updates.purchasePrice * (currentDownPct || 0.2));
      updates.loanAmount = updates.purchasePrice - updates.downPayment;
    }

    return {
      modified,
      profileUpdates: updates,
      summary: summaryParts.join(" • ")
    };
  }

  /**
   * Run filtration engine for wholesale products (backwards compatibility)
   */
  evaluateAndPresentDeals(customHeadline = null) {
    const dealsMod = getDealsModule();
    const filterFn = (dealsMod && dealsMod.filterMortgageDeals) ? dealsMod.filterMortgageDeals : () => ({ profile: this.borrowerProfile, eligibleDeals: [], ineligibleDeals: [] });
    const evaluation = filterFn(this.borrowerProfile);
    this.currentEvaluation = evaluation;

    const { profile, eligibleDeals } = evaluation;
    const headline = customHeadline || `Deal Filtration Analysis for $${profile.loanAmount.toLocaleString()} Loan`;

    let responseText = `### 📊 ${headline}\n\n`;
    responseText += `**Borrower Financial Dossier:**\n`;
    responseText += `- 🏠 **Purchase Price:** $${profile.purchasePrice.toLocaleString()} | **Loan Amount:** $${profile.loanAmount.toLocaleString()}\n`;
    responseText += `- 🎯 **LTV Ratio:** **${profile.ltv}%** ${profile.ltv > 80 ? '(⚠️ CMHC/Default Insurance required)' : '(✅ <=80%, Conventional)'}\n`;
    responseText += `- 💳 **Credit Score:** **${profile.creditScore}** | **Monthly Income:** $${profile.monthlyGrossIncome.toLocaleString()}\n`;
    responseText += `- ⚖️ **Type:** ${profile.isConforming ? 'Standard Qualifying' : 'Jumbo / Portfolio'}\n\n`;

    responseText += `Found **${eligibleDeals.length} Qualified Mortgage Options** matching initial parameters.\n\n`;
    responseText += `> ⚠️ **MANDATORY UNDERWRITING NOTICE:**\n> These filtered products are candidate deals only. **The AI Agent cannot approve or deny any loan.** Final authorization is retained exclusively by **Steve** (Human Underwriter).`;

    return {
      type: "deals_filtered",
      text: responseText,
      evaluation: evaluation,
      borrowerProfile: this.borrowerProfile
    };
  }

  /**
   * Create and submit Canadian dossier to Steve's queue
   */
  createDossierPayload(selectedDealItem = null) {
    const dealsMod = getDealsModule();
    const fmt = (dealsMod && dealsMod.formatCAD) ? dealsMod.formatCAD : (v => `$${v} CAD`);

    const purchaseVal = this.borrowerProfile.purchasePrice || 850000;
    const downPaymentVal = this.borrowerProfile.downPayment || 170000;
    const baseLoan = Math.max(0, purchaseVal - downPaymentVal);
    const cmhc = (dealsMod && dealsMod.calculateCMHCPremum) ? dealsMod.calculateCMHCPremum(purchaseVal, downPaymentVal) : { isInsured: false, premiumAmount: 0, totalLoanWithPremium: baseLoan, ltv: (baseLoan / purchaseVal) * 100 };
    const loanToFinance = cmhc.totalLoanWithPremium || baseLoan;

    const rate = selectedDealItem ? selectedDealItem.rate : 4.69;
    const termYears = this.borrowerProfile.termYears || 25;
    const monthlyPayment = (dealsMod && dealsMod.calculateAmortizedPayment)
      ? dealsMod.calculateAmortizedPayment(loanToFinance, rate, termYears)
      : Math.round((loanToFinance * (rate / 100 / 12)) / (1 - Math.pow(1 + (rate / 100 / 12), -termYears * 12)));

    const stressRate = (dealsMod && dealsMod.calculateStressTestRate) ? dealsMod.calculateStressTestRate(rate) : rate + 2.0;
    const qualifyingPayment = (dealsMod && dealsMod.calculateAmortizedPayment) ? dealsMod.calculateAmortizedPayment(loanToFinance, stressRate, termYears) : monthlyPayment * 1.25;

    const grossInc = this.borrowerProfile.monthlyGrossIncome || 14000;
    const debts = this.borrowerProfile.monthlyDebts || 650;
    const monthlyPropTax = Math.round((purchaseVal * 0.0085) / 12);
    const monthlyHeating = 150;

    const gds = grossInc > 0 ? parseFloat((((qualifyingPayment + monthlyPropTax + monthlyHeating) / grossInc) * 100).toFixed(1)) : 28.5;
    const tds = grossInc > 0 ? parseFloat((((qualifyingPayment + monthlyPropTax + monthlyHeating + debts) / grossInc) * 100).toFixed(1)) : 33.2;

    const lenderName = selectedDealItem ? selectedDealItem.lender : "RBC Royal Bank";
    const productName = selectedDealItem ? (selectedDealItem.name || selectedDealItem.product) : "RBC 5-Year Fixed Prime";

    return {
      id: `MORT-CAN-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      country: "Canada",
      province: this.borrowerProfile.province || "ON",
      market: this.borrowerProfile.province || this.borrowerProfile.market || "ON",
      marketFlag: "🍁",
      marketName: "Canada",
      city: this.borrowerProfile.city || "Toronto",
      currency: "CAD",
      borrowerName: this.borrowerProfile.applicantName || this.borrowerProfile.borrowerName || "Jordan Campbell",
      documentType: this.borrowerProfile.documentType || "Driver's License & SIN",
      documentNumber: this.borrowerProfile.documentNumber || "DL-C8412-90124",
      creditScore: this.borrowerProfile.creditScore,
      creditBureau: "Equifax & TransUnion Canada",
      grossMonthlyIncome: grossInc,
      grossMonthlyIncomeFormatted: fmt(grossInc),
      monthlyDebts: debts,
      monthlyDebtsFormatted: fmt(debts),
      purchasePrice: purchaseVal,
      purchasePriceFormatted: fmt(purchaseVal),
      downPayment: downPaymentVal,
      downPaymentFormatted: fmt(downPaymentVal),
      loanAmount: loanToFinance,
      loanAmountFormatted: fmt(loanToFinance),
      isInsured: cmhc.isInsured,
      cmhcPremium: cmhc.premiumAmount,
      propertyType: this.borrowerProfile.propertyType || "Condo Apartment",
      ltv: cmhc.ltv,
      frontDti: gds,
      backDti: tds,
      gds: gds,
      tds: tds,
      stressTestRate: stressRate,
      termYears: termYears,
      dealSelected: {
        id: selectedDealItem ? selectedDealItem.id : "CAN-RBC-PRIME",
        lender: lenderName,
        product: productName,
        rate: rate,
        rateLabel: selectedDealItem && selectedDealItem.rateLabel ? selectedDealItem.rateLabel : `${rate}% 5-Yr Fixed`,
        monthlyPayment: monthlyPayment,
        monthlyPaymentFormatted: `${fmt(monthlyPayment)} / mo`,
        stressRate: stressRate
      },
      status: "PENDING_OFFICER_AUTHORIZATION",
      agentNote: `Canadian dossier under OSFI B-20. Score: ${this.borrowerProfile.creditScore} (Equifax/TransUnion). LTV: ${cmhc.ltv}% (${cmhc.isInsured ? 'CMHC Insured' : 'Conventional'}). GDS: ${gds}%, TDS: ${tds}%. Forwarded to Steve for final underwriting decision.`,
      humanOfficer: "Steve",
      decision: null,
      decisionTimestamp: null,
      officerNotes: null
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MortgageAgent };
}
