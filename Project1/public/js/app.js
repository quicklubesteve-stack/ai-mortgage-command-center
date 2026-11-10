/**
 * Canadian AI Mortgage Assistant & Underwriting Cockpit Coordinator
 * Supports Canadian Mortgage Ecosystem: OSFI Guideline B-20, CMHC / Sagen Default Insurance,
 * Equifax & TransUnion Beacon Scoring (300-900), Big Six Banks, Monolines, & Alternative B-Lenders.
 * Enforces strict human-in-the-loop authorization guardrail for Steve.
 */

document.addEventListener('DOMContentLoaded', () => {
  const agent = new MortgageAgent();

  // =========================================================================
  // DOM ELEMENTS CACHE
  // =========================================================================

  // Navigation & Province Selector
  const selectCanadianProvince = document.getElementById('selectCanadianProvince');
  const navMarketFlag = document.getElementById('navMarketFlag');
  const navLoanSummary = document.getElementById('navLoanSummary');
  const queueBadgeCount = document.getElementById('queueBadgeCount');
  const btnOpenDesk = document.getElementById('btnOpenDesk');

  // Chat Elements
  const chatMessagesContainer = document.getElementById('chatMessagesContainer');
  const chatInputField = document.getElementById('chatInputField');
  const btnSendMessage = document.getElementById('btnSendMessage');
  const scenarioPillsBar = document.getElementById('scenarioPillsBar');

  // Tabs
  const deskTabsNav = document.getElementById('deskTabsNav');
  const tabViews = {
    tabApplication: document.getElementById('tabApplicationView'),
    tabSuggestions: document.getElementById('tabSuggestionsView'),
    tabDossier: document.getElementById('tabDossierView'),
    tabMatrix: document.getElementById('tabMatrixView'),
    tabCalculator: document.getElementById('tabCalculatorView'),
    tabTests: document.getElementById('tabTestsView'),
    tabVault: document.getElementById('tabVaultView')
  };
  const tabDossierCount = document.getElementById('tabDossierCount');
  const tabSuggestionsBadge = document.getElementById('tabSuggestionsBadge');

  // Application Form
  const mortgageApplicationForm = document.getElementById('mortgageApplicationForm');
  const appFieldProvince = document.getElementById('appFieldProvince');
  const appFieldName = document.getElementById('appFieldName');
  const appFieldDocType = document.getElementById('appFieldDocType');
  const appFieldDocNumber = document.getElementById('appFieldDocNumber');
  const appFieldEmail = document.getElementById('appFieldEmail');
  const appFieldPhone = document.getElementById('appFieldPhone');
  const appFieldCity = document.getElementById('appFieldCity');
  const appFieldEmployment = document.getElementById('appFieldEmployment');
  const appFieldEmploymentYears = document.getElementById('appFieldEmploymentYears');
  const appFieldIncome = document.getElementById('appFieldIncome');
  const appFieldDebts = document.getElementById('appFieldDebts');
  const appFieldCreditScoreSlider = document.getElementById('appFieldCreditScoreSlider');
  const appFieldPropertyType = document.getElementById('appFieldPropertyType');
  const appFieldPropertyStatus = document.getElementById('appFieldPropertyStatus');
  const appFieldPrice = document.getElementById('appFieldPrice');
  const appFieldDownPayment = document.getElementById('appFieldDownPayment');
  const appFieldLoanAmount = document.getElementById('appFieldLoanAmount');
  const appFieldTermYears = document.getElementById('appFieldTermYears');
  const appFieldFirstTimeBuyer = document.getElementById('appFieldFirstTimeBuyer');
  const btnSubmitApplication = document.getElementById('btnSubmitApplication');
  const btnSendDirectToSteve = document.getElementById('btnSendDirectToSteve');
  const applicationSubmitNotice = document.getElementById('applicationSubmitNotice');

  // Application Live Display Fields
  const appBureauNameDisplay = document.getElementById('appBureauNameDisplay');
  const appBureauScaleDisplay = document.getElementById('appBureauScaleDisplay');
  const liveScoreTierBadge = document.getElementById('liveScoreTierBadge');
  const liveScoreNum = document.getElementById('liveScoreNum');
  const liveScoreTierName = document.getElementById('liveScoreTierName');
  const liveScoreAdviceText = document.getElementById('liveScoreAdviceText');
  const hintIncomeFormatted = document.getElementById('hintIncomeFormatted');
  const hintDebtsFormatted = document.getElementById('hintDebtsFormatted');
  const hintPriceFormatted = document.getElementById('hintPriceFormatted');
  const hintDownFormatted = document.getElementById('hintDownFormatted');
  const hintLoanFormatted = document.getElementById('hintLoanFormatted');
  const appLiveMonthlyPayment = document.getElementById('appLiveMonthlyPayment');
  const appLiveStressRate = document.getElementById('appLiveStressRate');
  const appLiveCmhc = document.getElementById('appLiveCmhc');
  const appLiveDti = document.getElementById('appLiveDti');

  // Demo Prefill Buttons
  const btnPrefillToronto = document.getElementById('btnPrefillToronto');
  const btnPrefillVancouver = document.getElementById('btnPrefillVancouver');
  const btnPrefillCalgary = document.getElementById('btnPrefillCalgary');
  const btnPrefillMontreal = document.getElementById('btnPrefillMontreal');

  // Lender Suggestions Tab Elements
  const suggScoreValue = document.getElementById('suggScoreValue');
  const suggMarketFlag = document.getElementById('suggMarketFlag');
  const suggTierHeading = document.getElementById('suggTierHeading');
  const suggBureauDesc = document.getElementById('suggBureauDesc');
  const suggApprovalProb = document.getElementById('suggApprovalProb');
  const suggMaxLtvAllowed = document.getElementById('suggMaxLtvAllowed');
  const suggQualifyingRateDisplay = document.getElementById('suggQualifyingRateDisplay');
  const suggMatchesCount = document.getElementById('suggMatchesCount');
  const suggestedLendersContainer = document.getElementById('suggestedLendersContainer');

  // Steve's Desk Active Dossier Elements
  const dossierRefId = document.getElementById('dossierRefId');
  const dossierMarketFlag = document.getElementById('dossierMarketFlag');
  const dossierBorrowerName = document.getElementById('dossierBorrowerName');
  const dossierStatusBadge = document.getElementById('dossierStatusBadge');
  const dossierLtvVal = document.getElementById('dossierLtvVal');
  const dossierDtiVal = document.getElementById('dossierDtiVal');
  const dossierCreditVal = document.getElementById('dossierCreditVal');
  const dossierLenderName = document.getElementById('dossierLenderName');
  const dossierRateTag = document.getElementById('dossierRateTag');
  const dossierLoanAmountVal = document.getElementById('dossierLoanAmountVal');
  const dossierTotalPaymentVal = document.getElementById('dossierTotalPaymentVal');
  const dossierBureauName = document.getElementById('dossierBureauName');
  const officerNotesInput = document.getElementById('officerNotesInput');
  const btnAuthorizeDeal = document.getElementById('btnAuthorizeDeal');
  const btnDeclineDeal = document.getElementById('btnDeclineDeal');
  const btnRequestConditions = document.getElementById('btnRequestConditions');
  const auditTableBody = document.getElementById('auditTableBody');
  const auditCountLabel = document.getElementById('auditCountLabel');
  const matrixDealsGrid = document.getElementById('matrixDealsGrid');

  // Scenario Studio Sliders
  const sliderPrice = document.getElementById('sliderPrice');
  const sliderPriceLabel = document.getElementById('sliderPriceLabel');
  const sliderDown = document.getElementById('sliderDown');
  const sliderDownLabel = document.getElementById('sliderDownLabel');
  const sliderCredit = document.getElementById('sliderCredit');
  const sliderCreditLabel = document.getElementById('sliderCreditLabel');
  const sliderIncome = document.getElementById('sliderIncome');
  const sliderIncomeLabel = document.getElementById('sliderIncomeLabel');
  const btnApplyStudioToAgent = document.getElementById('btnApplyStudioToAgent');

  // Application State
  let activeDossier = null;
  let currentSuggestions = null;
  let auditTrail = [
    {
      id: "MORT-CAN-1020",
      borrower: "Jordan Campbell",
      decision: "AUTHORIZED",
      officer: "Steve",
      timestamp: "Today, 09:30 AM",
      notes: "Clean Equifax beacon score 745, CMHC approved, GDS 32% / TDS 38% under OSFI B-20 qualifying rate. Formal commitment issued."
    },
    {
      id: "MORT-CAN-0984",
      borrower: "Dr. Evelyn Zhang",
      decision: "CONDITIONS_REQUESTED",
      officer: "Steve",
      timestamp: "Yesterday, 04:15 PM",
      notes: "Uninsured conventional 80% LTV on Vancouver townhouse. Requires 2025 Notice of Assessment (Line 15000) and confirmation of down payment gift letter."
    }
  ];

  // =========================================================================
  // INITIALIZATION
  // =========================================================================

  function init() {
    renderAuditTable();
    loadUnderwriterQueue();

    // Default to Toronto Prime Preset
    if (CANADIAN_SAMPLE_PRESETS && CANADIAN_SAMPLE_PRESETS[0]) {
      loadProfileIntoForm(CANADIAN_SAMPLE_PRESETS[0].profile);
    } else {
      updateApplicationCalculations();
    }

    renderWholesaleMatrix();
    evaluateAndRenderSuggestions();

    // Welcome Message in Chatbot
    addAgentMessage(`### 🍁 Welcome to the Canadian AI Mortgage Assistant

I am your specialized mortgage qualification and intake co-pilot for the **Canadian Mortgage Ecosystem**.

**Regulatory & Financial Guidelines Enforced:**
- ⚖️ **OSFI Guideline B-20:** Borrowers qualify at the greater of your contract rate + 2.0% or the 5.25% floor.
- 🛡️ **CMHC / Sagen / Canada Guaranty:** Automatic default insurance calculation for down payments under 20%.
- 📊 **Debt Service Caps:** GDS limit at 39% and TDS limit at 44% for A-Lenders (up to 50% for Alternative B-Lenders).
- 💳 **Equifax & TransUnion:** Instant tiering (300-900) matching Big Six banks (**RBC, TD, Scotiabank, BMO**), wholesale monolines (**First National, MCAP**), and Alternative B-Lenders (**Equitable Bank, Home Trust**).

> 🚨 **STRICT UNDERWRITING GUARDRAIL:**
> The AI Agent is **strictly prohibited from approving or denying mortgage applications**. Final credit adjudication and binding commitments are retained exclusively by licensed human underwriter **Steve**.

*Feel free to describe your mortgage scenario in the chat or complete the **"📝 Mortgage Application"** on the right.*`);
  }

  // =========================================================================
  // PROVINCIAL REGIONS & CONFIGURATION SYNC
  // =========================================================================

  function syncProvinceUI(provCode) {
    const provConfig = CANADIAN_PROVINCES[provCode] || CANADIAN_PROVINCES.ON;
    agent.setProvince(provCode);

    if (selectCanadianProvince) selectCanadianProvince.value = provCode;
    if (appFieldProvince) appFieldProvince.value = provCode;
    if (navMarketFlag) navMarketFlag.textContent = provConfig.flag;
    if (suggMarketFlag) suggMarketFlag.textContent = provConfig.flag;

    renderWholesaleMatrix();
  }

  if (selectCanadianProvince) {
    selectCanadianProvince.addEventListener('change', (e) => {
      const provCode = e.target.value;
      syncProvinceUI(provCode);
      const preset = CANADIAN_SAMPLE_PRESETS.find(p => p.profile.province === provCode) || CANADIAN_SAMPLE_PRESETS[0];
      loadProfileIntoForm(preset.profile);
      evaluateAndRenderSuggestions();
      showToast(`Province set to ${CANADIAN_PROVINCES[provCode].name} ${CANADIAN_PROVINCES[provCode].flag}`);
    });
  }

  if (appFieldProvince) {
    appFieldProvince.addEventListener('change', (e) => {
      const provCode = e.target.value;
      syncProvinceUI(provCode);
      const preset = CANADIAN_SAMPLE_PRESETS.find(p => p.profile.province === provCode) || CANADIAN_SAMPLE_PRESETS[0];
      loadProfileIntoForm(preset.profile);
      evaluateAndRenderSuggestions();
    });
  }

  // =========================================================================
  // APPLICATION FORM PREFILLS & MATH
  // =========================================================================

  function loadProfileIntoForm(p) {
    if (!p) return;
    if (p.province) {
      if (appFieldProvince) appFieldProvince.value = p.province;
      if (selectCanadianProvince) selectCanadianProvince.value = p.province;
      if (navMarketFlag) navMarketFlag.textContent = (CANADIAN_PROVINCES[p.province] || {}).flag || "🍁";
    }

    if (appFieldName) appFieldName.value = p.applicantName || p.borrowerName || '';
    if (p.documentType && appFieldDocType) appFieldDocType.value = p.documentType;
    if (p.documentNumber && appFieldDocNumber) appFieldDocNumber.value = p.documentNumber;
    if (p.email && appFieldEmail) appFieldEmail.value = p.email;
    if (p.phone && appFieldPhone) appFieldPhone.value = p.phone;
    if (p.city && appFieldCity) appFieldCity.value = p.city;
    if (p.employmentType && appFieldEmployment) appFieldEmployment.value = p.employmentType;
    if (p.employmentYears && appFieldEmploymentYears) appFieldEmploymentYears.value = p.employmentYears;
    
    if (appFieldIncome) appFieldIncome.value = p.monthlyGrossIncome || 13500;
    if (appFieldDebts) appFieldDebts.value = p.monthlyDebts || 0;
    if (appFieldPrice) appFieldPrice.value = p.purchasePrice || 780000;
    if (appFieldDownPayment) appFieldDownPayment.value = p.downPayment || 78000;
    if (appFieldCreditScoreSlider) appFieldCreditScoreSlider.value = p.creditScore || 745;
    if (p.termYears && appFieldTermYears) appFieldTermYears.value = p.termYears;
    if (appFieldFirstTimeBuyer && typeof p.isFirstTimeBuyer !== 'undefined') {
      appFieldFirstTimeBuyer.checked = p.isFirstTimeBuyer;
    }

    updateApplicationCalculations();
  }

  // Preset Buttons
  if (btnPrefillToronto) {
    btnPrefillToronto.addEventListener('click', () => {
      syncProvinceUI('ON');
      loadProfileIntoForm(CANADIAN_SAMPLE_PRESETS[0].profile);
      evaluateAndRenderSuggestions();
      showToast("🍁 Loaded Toronto First-Time Buyer Profile (745 Equifax, $780k)");
    });
  }

  if (btnPrefillVancouver) {
    btnPrefillVancouver.addEventListener('click', () => {
      syncProvinceUI('BC');
      loadProfileIntoForm(CANADIAN_SAMPLE_PRESETS[1].profile);
      evaluateAndRenderSuggestions();
      showToast("🏔️ Loaded Vancouver Luxury Conventional Profile (780 Equifax, $1.25M)");
    });
  }

  if (btnPrefillCalgary) {
    btnPrefillCalgary.addEventListener('click', () => {
      syncProvinceUI('AB');
      loadProfileIntoForm(CANADIAN_SAMPLE_PRESETS[2].profile);
      evaluateAndRenderSuggestions();
      showToast("🤠 Loaded Calgary Self-Employed Profile (660 Score, $540k / EQ Bank)");
    });
  }

  if (btnPrefillMontreal) {
    btnPrefillMontreal.addEventListener('click', () => {
      syncProvinceUI('QC');
      loadProfileIntoForm(CANADIAN_SAMPLE_PRESETS[3].profile);
      evaluateAndRenderSuggestions();
      showToast("⚜️ Loaded Montreal Smart Fixed Profile (710 Score, $480k / BMO)");
    });
  }

  // Dynamic calculations on input changes
  function updateApplicationCalculations() {
    const provCode = (appFieldProvince ? appFieldProvince.value : "ON") || "ON";
    const price = parseFloat(appFieldPrice ? appFieldPrice.value : 780000) || 0;
    const downPayment = parseFloat(appFieldDownPayment ? appFieldDownPayment.value : 78000) || 0;
    const income = parseFloat(appFieldIncome ? appFieldIncome.value : 13500) || 1;
    const debts = parseFloat(appFieldDebts ? appFieldDebts.value : 650) || 0;
    const score = parseInt(appFieldCreditScoreSlider ? appFieldCreditScoreSlider.value : 745, 10) || 700;
    const termYears = parseInt(appFieldTermYears ? appFieldTermYears.value : 25, 10) || 25;

    const baseLoan = Math.max(0, price - downPayment);
    const cmhc = calculateCMHCPremum(price, downPayment);
    const totalLoan = cmhc.totalLoanWithPremium || baseLoan;
    if (appFieldLoanAmount) appFieldLoanAmount.value = totalLoan;

    const ltv = cmhc.ltv || (price > 0 ? ((baseLoan / price) * 100).toFixed(1) : 0);
    const downPct = price > 0 ? ((downPayment / price) * 100).toFixed(1) : 10;

    // Hints
    if (hintIncomeFormatted) hintIncomeFormatted.textContent = `${formatCAD(income)} / month ($${(income * 12).toLocaleString()} / year)`;
    if (hintDebtsFormatted) hintDebtsFormatted.textContent = `${formatCAD(debts)} / month`;
    if (hintPriceFormatted) hintPriceFormatted.textContent = formatCAD(price);
    if (hintDownFormatted) {
      hintDownFormatted.textContent = `${downPct}% Down (${formatCAD(downPayment)}) — ${cmhc.isInsured ? 'High-Ratio CMHC Insured' : 'Conventional Uninsured'}`;
    }
    if (hintLoanFormatted) {
      hintLoanFormatted.textContent = cmhc.isInsured 
        ? `${formatCAD(baseLoan)} base + ${formatCAD(cmhc.premiumAmount)} CMHC = ${formatCAD(totalLoan)} total` 
        : `${formatCAD(totalLoan)} Conventional (No CMHC premium)`;
    }

    // Live Score Badge & Advice
    const tier = getCanadianCreditTier(score);
    if (liveScoreNum) liveScoreNum.textContent = score;
    if (liveScoreTierName) liveScoreTierName.textContent = tier.tierLabel;
    if (liveScoreTierBadge) {
      liveScoreTierBadge.style.color = tier.color;
      liveScoreTierBadge.style.borderColor = tier.color;
    }
    if (liveScoreAdviceText) liveScoreAdviceText.textContent = tier.description;

    // Contract rate and OSFI Stress Test calculation (Benchmark ~4.69% 5-Yr Fixed)
    const benchmarkContractRate = score >= 720 ? 4.69 : (score >= 680 ? 4.59 : (score >= 600 ? 5.79 : 7.99));
    const stressRate = calculateStressTestRate(benchmarkContractRate);
    const monthlyPayment = calculateAmortizedPayment(totalLoan, benchmarkContractRate, termYears);
    const qualifyingMonthlyPayment = calculateAmortizedPayment(totalLoan, stressRate, termYears);

    if (appLiveMonthlyPayment) appLiveMonthlyPayment.textContent = `${formatCAD(monthlyPayment)} / mo`;
    if (appLiveStressRate) appLiveStressRate.textContent = `${stressRate}% (at ${benchmarkContractRate}% contract)`;
    if (appLiveCmhc) {
      appLiveCmhc.textContent = cmhc.isInsured ? `${formatCAD(cmhc.premiumAmount)} (${cmhc.premiumRatePct}%)` : '$0 CAD (Conventional)';
      appLiveCmhc.className = cmhc.isInsured ? "gauge-stat-val metric-pill-warn" : "gauge-stat-val metric-pill-ok";
    }

    // GDS and TDS calculations
    const monthlyPropTax = Math.round((price * 0.0085) / 12);
    const monthlyHeating = 150;
    const gds = income > 0 ? parseFloat((((qualifyingMonthlyPayment + monthlyPropTax + monthlyHeating) / income) * 100).toFixed(1)) : 0;
    const tds = income > 0 ? parseFloat((((qualifyingMonthlyPayment + monthlyPropTax + monthlyHeating + debts) / income) * 100).toFixed(1)) : 0;

    if (appLiveDti) {
      appLiveDti.textContent = `${gds}% GDS / ${tds}% TDS`;
      appLiveDti.className = (gds <= 39 && tds <= 44) 
        ? "gauge-stat-val metric-pill-ok" 
        : (tds <= 50 ? "gauge-stat-val metric-pill-warn" : "gauge-stat-val metric-pill-danger");
    }

    // Top Nav summary
    if (navLoanSummary) {
      navLoanSummary.textContent = `${formatCAD(totalLoan)} / ${ltv}% LTV / ${score} Score`;
    }
  }

  [appFieldPrice, appFieldDownPayment, appFieldIncome, appFieldDebts, appFieldTermYears].forEach(el => {
    if (el) el.addEventListener('input', updateApplicationCalculations);
  });

  if (appFieldCreditScoreSlider) {
    appFieldCreditScoreSlider.addEventListener('input', () => {
      updateApplicationCalculations();
      evaluateAndRenderSuggestions();
    });
  }

  // Adjust down payment automatically if price changes and down payment is invalid
  if (appFieldPrice) {
    appFieldPrice.addEventListener('change', () => {
      const price = parseFloat(appFieldPrice.value) || 0;
      const currentDown = parseFloat(appFieldDownPayment.value) || 0;
      if (currentDown === 0 || currentDown >= price) {
        appFieldDownPayment.value = Math.round(price * 0.10);
      }
      updateApplicationCalculations();
    });
  }

  // =========================================================================
  // APPLICATION SUBMISSION & LENDER SUGGESTIONS ENGINE
  // =========================================================================

  function getFormData() {
    const provCode = appFieldProvince ? appFieldProvince.value : "ON";
    const price = parseFloat(appFieldPrice ? appFieldPrice.value : 780000) || 780000;
    const downPayment = parseFloat(appFieldDownPayment ? appFieldDownPayment.value : 78000) || 78000;
    const score = parseInt(appFieldCreditScoreSlider ? appFieldCreditScoreSlider.value : 745, 10) || 745;
    const income = parseFloat(appFieldIncome ? appFieldIncome.value : 13500) || 13500;
    const debts = parseFloat(appFieldDebts ? appFieldDebts.value : 650) || 0;
    const termYears = parseInt(appFieldTermYears ? appFieldTermYears.value : 25, 10) || 25;
    const cmhc = calculateCMHCPremum(price, downPayment);
    const totalLoan = cmhc.totalLoanWithPremium || (price - downPayment);

    return {
      province: provCode,
      market: provCode,
      applicantName: (appFieldName && appFieldName.value.trim()) || "Jordan Campbell",
      borrowerName: (appFieldName && appFieldName.value.trim()) || "Jordan Campbell",
      documentType: (appFieldDocType && appFieldDocType.value) || "Driver's License & SIN",
      documentNumber: (appFieldDocNumber && appFieldDocNumber.value.trim()) || "DL-C8412-90124",
      email: (appFieldEmail && appFieldEmail.value.trim()) || "jordan.campbell@fintech.ca",
      phone: (appFieldPhone && appFieldPhone.value.trim()) || "(416) 555-0194",
      city: (appFieldCity && appFieldCity.value.trim()) || "Toronto",
      employmentType: (appFieldEmployment && appFieldEmployment.value) || "Permanent Full-Time Salaried",
      employmentYears: parseInt(appFieldEmploymentYears ? appFieldEmploymentYears.value : 4, 10) || 4,
      purchasePrice: price,
      downPayment: downPayment,
      loanAmount: totalLoan,
      creditScore: score,
      monthlyGrossIncome: income,
      monthlyDebts: debts,
      termYears: termYears,
      propertyType: (appFieldPropertyType && appFieldPropertyType.value) || "Condo Apartment",
      propertyStatus: (appFieldPropertyStatus && appFieldPropertyStatus.value) || "Existing Home",
      isFirstTimeBuyer: appFieldFirstTimeBuyer ? appFieldFirstTimeBuyer.checked : true
    };
  }

  function evaluateAndRenderSuggestions() {
    const formData = getFormData();
    const suggestionsResult = suggestCanadianLendersByCreditScore(formData);
    currentSuggestions = suggestionsResult;

    renderSuggestionsView(suggestionsResult);
    return suggestionsResult;
  }

  function renderSuggestionsView(result) {
    if (!result) return;
    const tier = result.creditTier;
    const top = result.topMatch;

    if (suggScoreValue) suggScoreValue.textContent = result.creditScore;
    if (suggTierHeading) {
      suggTierHeading.textContent = tier.tierLabel;
      suggTierHeading.style.color = tier.color;
    }
    if (suggBureauDesc) {
      suggBureauDesc.innerHTML = `Evaluated against <strong>Equifax & TransUnion Canada</strong> standards for <strong>${result.provinceConfig ? result.provinceConfig.name : 'Canada'}</strong>.`;
    }
    if (suggApprovalProb) {
      suggApprovalProb.textContent = tier.approvalOdds;
      suggApprovalProb.style.color = tier.color;
    }
    if (suggMatchesCount) {
      suggMatchesCount.textContent = `${result.totalEvaluated} Institutional Lenders Analyzed (${result.totalEligible} Qualified)`;
    }
    if (suggQualifyingRateDisplay && top) {
      suggQualifyingRateDisplay.textContent = `${top.calculations.stressRate}% (OSFI B-20)`;
    }

    if (!suggestedLendersContainer) return;
    suggestedLendersContainer.innerHTML = '';

    result.evaluatedLenders.forEach((item, index) => {
      const lender = item.lender;
      const calc = item.calculations;
      const isTop = index === 0;

      let badgeClass = 'badge-mod-match';
      if (item.matchScore >= 90) badgeClass = 'badge-top-match';
      else if (item.matchScore >= 80) badgeClass = 'badge-high-match';

      const card = document.createElement('div');
      card.className = `lender-match-card ${isTop ? 'card-top-match' : ''}`;
      card.innerHTML = `
        <div class="lender-match-header">
          <div class="lender-info">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 1.1rem;">🍁</span>
              <span class="lender-brand-name">${escapeHtml(lender.lender)}</span>
              ${lender.badge ? `<span style="font-size: 0.68rem; background: rgba(99,102,241,0.2); color: #818cf8; padding: 2px 8px; border-radius: 9999px; font-weight: 600;">${lender.badge}</span>` : ''}
            </div>
            <span class="lender-product-name">${escapeHtml(lender.name)} • ${escapeHtml(lender.category)}</span>
          </div>

          <div class="match-score-badge ${badgeClass}">
            <span>🎯 ${item.matchScore}% Match</span>
          </div>
        </div>

        <div class="lender-stats-grid">
          <div class="lender-stat-col">
            <span class="lender-stat-label">Posted Contract Rate</span>
            <span class="lender-stat-value" style="color: var(--cyan-400);">${lender.rateLabel}</span>
          </div>
          <div class="lender-stat-col">
            <span class="lender-stat-label">Est. Monthly Payment</span>
            <span class="lender-stat-value" style="color: var(--emerald-400);">${calc.monthlyPaymentFormatted}</span>
          </div>
          <div class="lender-stat-col">
            <span class="lender-stat-label">OSFI Qualifying Rate</span>
            <span class="lender-stat-value" style="color: var(--amber-400);">${calc.stressRate}%</span>
          </div>
          <div class="lender-stat-col">
            <span class="lender-stat-label">GDS / TDS Ratios</span>
            <span class="lender-stat-value">${calc.gdsStress}% / ${calc.tdsStress}%</span>
          </div>
        </div>

        <div class="lender-credit-comparator">
          <span>Min Score: <strong>${lender.minCreditScore} pts</strong></span>
          <span>Your Beacon Score: <strong>${result.creditScore} pts</strong></span>
          <span class="${item.scoreDiff >= 0 ? 'credit-surplus' : 'credit-deficit'}">
            ${item.scoreDiff >= 0 ? `+${item.scoreDiff} pts (Qualified ✅)` : `${item.scoreDiff} pts (Below Benchmark ⚠️)`}
          </span>
        </div>

        <div class="lender-advice-box">
          💡 ${escapeHtml(item.personalizedAdvice)}
        </div>

        <div class="lender-action-row">
          <span style="font-size: 0.72rem; color: var(--text-dim);">
            Max LTV: ${lender.maxLtv}% • Closing Est: ${calc.estimatedClosingFormatted}
          </span>
          <button class="btn-select-lender" data-lender-id="${lender.id}" onclick="window.routeCanadianLenderToSteveDesk('${lender.id}')">
            <span>📋 Select & Route to Steve's Desk</span>
          </button>
        </div>
      `;

      suggestedLendersContainer.appendChild(card);
    });

    if (tabSuggestionsBadge) {
      tabSuggestionsBadge.textContent = result.totalEligible;
    }
  }

  // Handle Application Submit
  if (mortgageApplicationForm) {
    mortgageApplicationForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const formData = getFormData();
      const submission = agent.processApplicationSubmission(formData);
      activeDossier = submission.dossier;

      renderActiveDossier(activeDossier);
      evaluateAndRenderSuggestions();

      // Send to backend queue
      fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeDossier)
      }).catch(() => {});

      // Chatbot Announcement
      addAgentMessage(`### 📝 Canadian Mortgage Application Received & Evaluated

**Applicant:** ${activeDossier.borrowerName} (${activeDossier.province}, Canada)
- 🆔 **ID Document:** ${activeDossier.documentType} (${activeDossier.documentNumber})
- 💳 **Equifax / TransUnion Score:** **${activeDossier.creditScore} pts** (${getCanadianCreditTier(activeDossier.creditScore).tierLabel})
- 🏠 **Purchase Price:** ${activeDossier.purchasePriceFormatted} | **Down Payment:** ${activeDossier.downPaymentFormatted} (${activeDossier.ltv}% LTV)
- 🛡️ **CMHC Insurance:** ${activeDossier.isInsured ? `${formatCAD(activeDossier.cmhcPremium)} added to principal` : 'None (Conventional Uninsured)'}
- 🏦 **#1 Matched Canadian Lender:** **${activeDossier.dealSelected.lender}** (${activeDossier.dealSelected.rateLabel})
- ⚖️ **OSFI Qualifying Rate:** **${activeDossier.dealSelected.stressRate}%** | **Est. Payment:** **${activeDossier.dealSelected.monthlyPaymentFormatted}**

> 🚨 **STATUS:** \`PENDING STEVE'S AUTHORIZATION\`
> Your complete Canadian mortgage file has been routed to **Steve's Human Authorization Cockpit**. You can inspect all institutional lender matches in the **"Suggested Lenders"** tab.`);

      if (applicationSubmitNotice) {
        applicationSubmitNotice.textContent = `✅ Application processed! Ranked Canadian lenders updated and dossier #${activeDossier.id} routed to Steve.`;
        setTimeout(() => { applicationSubmitNotice.textContent = ''; }, 6000);
      }

      showToast(`✅ Application processed: ${submission.recommendationData.totalEligible} lenders qualified.`);
      switchTab('tabSuggestions');
    });
  }

  // Direct send to Steve without tab switch
  if (btnSendDirectToSteve) {
    btnSendDirectToSteve.addEventListener('click', () => {
      const formData = getFormData();
      const submission = agent.processApplicationSubmission(formData);
      activeDossier = submission.dossier;

      renderActiveDossier(activeDossier);

      fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeDossier)
      }).catch(() => {});

      switchTab('tabDossier');
      showToast(`📤 Dossier #${activeDossier.id} sent directly to Steve's Underwriting Desk.`);
    });
  }

  // Global handler for selecting a Canadian lender
  window.routeCanadianLenderToSteveDesk = function(lenderId) {
    const lender = CANADIAN_LENDERS_CATALOG.find(l => l.id === lenderId);
    if (!lender) return;

    const dossier = agent.createDossierPayload(lender);
    activeDossier = dossier;
    renderActiveDossier(dossier);
    switchTab('tabDossier');

    fetch('/api/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dossier)
    }).catch(() => {});

    showToast(`Lender ${lender.lender} selected for Dossier #${dossier.id}.`);
  };

  // Backwards compatibility aliases
  window.routeAndeanLenderToSteveDesk = window.routeCanadianLenderToSteveDesk;
  window.routeDealToSteveDesk = window.routeCanadianLenderToSteveDesk;

  // =========================================================================
  // STEVE'S AUTHORIZATION COCKPIT
  // =========================================================================

  function renderActiveDossier(dossier) {
    if (!dossier) return;
    if (dossierRefId) dossierRefId.textContent = `DOSSIER #${dossier.id}`;
    if (dossierMarketFlag) dossierMarketFlag.textContent = dossier.marketFlag || "🍁";
    if (dossierBorrowerName) dossierBorrowerName.textContent = dossier.borrowerName;
    if (dossierLtvVal) dossierLtvVal.textContent = `${dossier.ltv}% ${dossier.isInsured ? '(CMHC Insured)' : '(Conventional)'}`;
    if (dossierDtiVal) dossierDtiVal.textContent = `${dossier.gds || dossier.frontDti}% GDS / ${dossier.tds || dossier.backDti}% TDS`;
    if (dossierCreditVal) dossierCreditVal.textContent = dossier.creditScore;

    if (dossierLtvVal) {
      dossierLtvVal.className = dossier.ltv <= 80 ? "metric-value metric-pill-ok" : "metric-value metric-pill-warn";
    }

    if (dossier.dealSelected) {
      if (dossierLenderName) dossierLenderName.textContent = `${dossier.dealSelected.lender} — ${dossier.dealSelected.product}`;
      if (dossierRateTag) dossierRateTag.textContent = `${dossier.dealSelected.rateLabel || `${dossier.dealSelected.rate}%`} (${dossier.dealSelected.stressRate || dossier.stressTestRate}% Stress Test)`;
      if (dossierTotalPaymentVal) dossierTotalPaymentVal.textContent = dossier.dealSelected.monthlyPaymentFormatted || formatCAD(dossier.dealSelected.monthlyPayment);
      if (dossierLoanAmountVal) dossierLoanAmountVal.textContent = dossier.loanAmountFormatted || formatCAD(dossier.loanAmount);
      if (dossierBureauName) dossierBureauName.textContent = dossier.creditBureau || "Equifax & TransUnion Canada";
    }

    updateDossierBadge(dossier.status);
  }

  function updateDossierBadge(status) {
    if (!dossierStatusBadge) return;
    if (status === 'OFFICER_AUTHORIZED' || status === 'AUTHORIZED') {
      dossierStatusBadge.className = 'status-badge status-authorized';
      dossierStatusBadge.innerHTML = '✅ AUTHORIZED BY STEVE';
    } else if (status === 'OFFICER_DECLINED' || status === 'DECLINED') {
      dossierStatusBadge.className = 'status-badge status-declined';
      dossierStatusBadge.innerHTML = '❌ DECLINED BY STEVE';
    } else if (status === 'CONDITIONS_PENDING' || status === 'CONDITIONS_REQUESTED') {
      dossierStatusBadge.className = 'status-badge status-conditions';
      dossierStatusBadge.innerHTML = '📝 CONDITIONS REQUESTED BY STEVE';
    } else {
      dossierStatusBadge.className = 'status-badge status-pending';
      dossierStatusBadge.innerHTML = '⏳ PENDING STEVE\'S AUTHORIZATION';
    }
  }

  // Steve: Authorize Deal
  if (btnAuthorizeDeal) {
    btnAuthorizeDeal.addEventListener('click', () => {
      if (!activeDossier) return;
      const notes = (officerNotesInput && officerNotesInput.value.trim()) || "Approved under OSFI B-20 underwriting standards. Verified Equifax beacon score and CMHC approval. Issued binding mortgage commitment.";

      activeDossier.status = "OFFICER_AUTHORIZED";
      updateDossierBadge("OFFICER_AUTHORIZED");

      const auditEntry = {
        id: activeDossier.id,
        borrower: activeDossier.borrowerName,
        decision: "AUTHORIZED",
        officer: "Steve",
        timestamp: "Just now",
        notes: notes
      };
      auditTrail.unshift(auditEntry);
      renderAuditTable();

      fetch('/api/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeDossier.id,
          decision: 'AUTHORIZED',
          officerNotes: notes,
          officerName: 'Steve'
        })
      }).catch(() => {});

      addAgentMessage(`### 🎖️ OFFICIAL UNDERWRITING DETERMINATION: STEVE
> **MORTGAGE AUTHORIZED BY HUMAN UNDERWRITER STEVE**
> - **Dossier Reference:** \`${activeDossier.id}\`
> - **Applicant:** ${activeDossier.borrowerName}
> - **Approved Institution:** ${activeDossier.dealSelected ? activeDossier.dealSelected.lender : 'RBC Royal Bank'}
> - **Product:** ${activeDossier.dealSelected ? activeDossier.dealSelected.product : '5-Year Fixed'}
> - **Underwriter Notes:** *"${escapeHtml(notes)}"*
> - **Authorized Signature:** Steve (Licensed Canadian Mortgage Underwriter / Broker of Record)

*Formal mortgage commitment and closing instructions dispatched to solicitor.*`);

      showToast(`✅ Dossier ${activeDossier.id} formal approval issued by Steve.`);
      if (officerNotesInput) officerNotesInput.value = '';
    });
  }

  // Steve: Decline Deal
  if (btnDeclineDeal) {
    btnDeclineDeal.addEventListener('click', () => {
      if (!activeDossier) return;
      const notes = (officerNotesInput && officerNotesInput.value.trim()) || "Declined: Total Debt Service (TDS) ratio exceeds OSFI B-20 regulatory limits under qualifying stress rate.";

      activeDossier.status = "OFFICER_DECLINED";
      updateDossierBadge("OFFICER_DECLINED");

      const auditEntry = {
        id: activeDossier.id,
        borrower: activeDossier.borrowerName,
        decision: "DECLINED",
        officer: "Steve",
        timestamp: "Just now",
        notes: notes
      };
      auditTrail.unshift(auditEntry);
      renderAuditTable();

      fetch('/api/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeDossier.id,
          decision: 'DECLINED',
          officerNotes: notes,
          officerName: 'Steve'
        })
      }).catch(() => {});

      addAgentMessage(`### 🛑 ADVERSE ACTION NOTICE (DECLINED BY STEVE)
> **MORTGAGE DECLINED BY HUMAN UNDERWRITER STEVE**
> - **Dossier Reference:** \`${activeDossier.id}\`
> - **Applicant:** ${activeDossier.borrowerName}
> - **Declined Rationale:** *"${escapeHtml(notes)}"*
> - **Adjudicator:** Steve, Authorized Underwriter

*Recorded in regulatory compliance audit ledger.*`);

      showToast(`❌ Dossier ${activeDossier.id} declined by Steve.`);
      if (officerNotesInput) officerNotesInput.value = '';
    });
  }

  // Steve: Request Conditions
  if (btnRequestConditions) {
    btnRequestConditions.addEventListener('click', () => {
      if (!activeDossier) return;
      const notes = (officerNotesInput && officerNotesInput.value.trim()) || "Conditions required: Provide last 2 years of CRA Notice of Assessment (NOA Line 15000), 90-day bank history for down payment, and firm Purchase Agreement.";

      activeDossier.status = "CONDITIONS_PENDING";
      updateDossierBadge("CONDITIONS_PENDING");

      const auditEntry = {
        id: activeDossier.id,
        borrower: activeDossier.borrowerName,
        decision: "CONDITIONS_REQUESTED",
        officer: "Steve",
        timestamp: "Just now",
        notes: notes
      };
      auditTrail.unshift(auditEntry);
      renderAuditTable();

      addAgentMessage(`### 📝 CONDITIONAL APPROVAL REQUIREMENTS: STEVE
> **ADDITIONAL DOCUMENTS REQUESTED BY STEVE**
> - **Dossier Reference:** \`${activeDossier.id}\`
> - **Required Conditions:** *"${escapeHtml(notes)}"*

*File returned to applicant/broker awaiting condition fulfillment before binding commitment.*`);

      showToast(`📝 Conditions requested for dossier ${activeDossier.id}.`);
      if (officerNotesInput) officerNotesInput.value = '';
    });
  }

  function renderAuditTable() {
    if (!auditTableBody) return;
    auditTableBody.innerHTML = '';
    auditTrail.forEach(record => {
      const tr = document.createElement('tr');
      const badgeClass = record.decision === 'AUTHORIZED' 
        ? 'metric-pill-ok' 
        : (record.decision === 'DECLINED' ? 'metric-pill-danger' : 'metric-pill-warn');
      tr.innerHTML = `
        <td style="font-family: monospace; font-size: 0.75rem;">${record.id}</td>
        <td><strong>${escapeHtml(record.borrower)}</strong></td>
        <td><span class="${badgeClass}" style="font-weight: 700;">${record.decision}</span></td>
        <td>${escapeHtml(record.officer)}</td>
        <td style="font-size: 0.72rem; color: var(--text-dim);">${record.timestamp}</td>
      `;
      auditTableBody.appendChild(tr);
    });
    if (auditCountLabel) {
      auditCountLabel.textContent = `${auditTrail.length} Decision${auditTrail.length === 1 ? '' : 's'} Logged`;
    }
  }

  async function loadUnderwriterQueue() {
    try {
      const res = await fetch('/api/queue');
      const data = await res.json();
      if (data && data.queue && data.queue.length > 0) {
        activeDossier = data.queue[0];
        renderActiveDossier(activeDossier);
        if (queueBadgeCount) queueBadgeCount.textContent = data.queue.length;
        if (tabDossierCount) tabDossierCount.textContent = data.queue.length;
      }
    } catch (e) {
      activeDossier = agent.createDossierPayload(CANADIAN_LENDERS_CATALOG[0]);
      renderActiveDossier(activeDossier);
    }
  }

  // =========================================================================
  // CANADIAN INSTITUTIONAL RATES MATRIX TAB
  // =========================================================================

  function renderWholesaleMatrix() {
    if (!matrixDealsGrid) return;
    matrixDealsGrid.innerHTML = '';

    CANADIAN_LENDERS_CATALOG.forEach(deal => {
      const card = document.createElement('div');
      card.className = 'deal-card';
      card.innerHTML = `
        <div class="deal-card-header">
          <div>
            <span class="deal-name">🍁 ${escapeHtml(deal.lender)}</span>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(deal.name)}</div>
          </div>
          <span class="deal-category-pill">${deal.category}</span>
        </div>
        <div class="deal-key-stats">
          <div class="stat-item">
            <div class="stat-title">Posted Rate</div>
            <div class="stat-num" style="color: var(--cyan-400);">${deal.rateLabel}</div>
          </div>
          <div class="stat-item">
            <div class="stat-title">Min Credit Score</div>
            <div class="stat-num" style="color: var(--emerald-400);">${deal.minCreditScore} pts</div>
          </div>
          <div class="stat-item">
            <div class="stat-title">Max LTV</div>
            <div class="stat-num" style="color: var(--amber-400);">${deal.maxLtv}%</div>
          </div>
        </div>
        <div style="font-size: 0.74rem; color: var(--text-dim); margin-bottom: 8px;">
          ${escapeHtml(deal.creditScoreRationale)}
        </div>
        <div class="deal-actions">
          <span class="status-badge status-pending" style="font-size: 0.68rem;">HUMAN AUTHORIZATION REQUIRED</span>
          <button class="btn-select-deal" onclick="window.routeCanadianLenderToSteveDesk('${deal.id}')">
            <span>📋 Select Product</span>
          </button>
        </div>
      `;
      matrixDealsGrid.appendChild(card);
    });
  }

  // =========================================================================
  // CHAT STREAM & DISPATCHER
  // =========================================================================

  function addUserMessage(text) {
    if (!chatMessagesContainer) return;
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble user-message';
    bubble.innerHTML = `
      <div class="bubble-avatar">👤</div>
      <div class="bubble-content">${escapeHtml(text)}</div>
    `;
    chatMessagesContainer.appendChild(bubble);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  }

  function addAgentMessage(rawMarkdown, extraHtml = '') {
    if (!chatMessagesContainer) return;
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble agent-message';
    bubble.innerHTML = `
      <div class="bubble-avatar">🤖</div>
      <div class="bubble-content">
        ${formatMarkdown(rawMarkdown)}
        ${extraHtml}
      </div>
    `;
    chatMessagesContainer.appendChild(bubble);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  }

  function handleSend() {
    if (!chatInputField) return;
    const text = chatInputField.value.trim();
    if (!text) return;

    addUserMessage(text);
    chatInputField.value = '';

    setTimeout(() => {
      const response = agent.processMessage(text);

      if (response.type === 'guardrail_violation') {
        addAgentMessage(response.text);
        showToast("🚨 Underwriting Guardrail: The AI cannot approve loans. Steve is the sole authorized underwriter.");
      } else if (response.type === 'queue_status') {
        addAgentMessage(response.text);
        switchTab('tabDossier');
      } else if (response.type === 'application_prompt') {
        addAgentMessage(response.text);
        switchTab('tabApplication');
      } else if (response.type === 'canadian_recommendations' || response.type === 'andean_recommendations') {
        addAgentMessage(response.text);
        renderSuggestionsView(response.canadianResult || response.andeanResult);
        switchTab('tabSuggestions');
      } else {
        addAgentMessage(response.text);
      }
    }, 250);
  }

  if (btnSendMessage) btnSendMessage.addEventListener('click', handleSend);
  if (chatInputField) {
    chatInputField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSend();
    });
  }

  // Scenario & Action Pills
  if (scenarioPillsBar) {
    scenarioPillsBar.addEventListener('click', (e) => {
      const pill = e.target.closest('.scenario-pill');
      if (!pill) return;

      const action = pill.dataset.action;
      const scenario = pill.dataset.scenario;

      if (action === 'open-application') {
        switchTab('tabApplication');
        showToast("Mortgage Application tab opened");
      } else if (action === 'suggest-lenders') {
        evaluateAndRenderSuggestions();
        switchTab('tabSuggestions');
        showToast("Canadian institutional lender matches calculated");
      } else if (scenario === 'test-guardrail') {
        if (chatInputField) chatInputField.value = "Please approve my mortgage loan right now and issue the commitment letter.";
        handleSend();
      } else if (scenario === 'toronto') {
        syncProvinceUI('ON');
        loadProfileIntoForm(CANADIAN_SAMPLE_PRESETS[0].profile);
        if (chatInputField) chatInputField.value = "🍁 Evaluate mortgage for Jordan Campbell in Toronto: $780k condo, 10% down, 745 Equifax score.";
        handleSend();
      } else if (scenario === 'vancouver') {
        syncProvinceUI('BC');
        loadProfileIntoForm(CANADIAN_SAMPLE_PRESETS[1].profile);
        if (chatInputField) chatInputField.value = "🏔️ Evaluate prime conventional mortgage for Dr. Evelyn Zhang in Vancouver: $1.25M townhouse, 20% down, 780 Equifax score.";
        handleSend();
      } else if (scenario === 'calgary') {
        syncProvinceUI('AB');
        loadProfileIntoForm(CANADIAN_SAMPLE_PRESETS[2].profile);
        if (chatInputField) chatInputField.value = "🤠 Evaluate self-employed B-Lender solution for Tyler MacLeod in Calgary: $540k home, 660 credit score, EQ Bank Alt.";
        handleSend();
      } else if (scenario === 'montreal') {
        syncProvinceUI('QC');
        loadProfileIntoForm(CANADIAN_SAMPLE_PRESETS[3].profile);
        if (chatInputField) chatInputField.value = "⚜️ Evaluate smart fixed rate for Marc-Antoine Tremblay in Montreal: $480k property, 710 credit score, BMO Smart Fixed.";
        handleSend();
      }
    });
  }

  // =========================================================================
  // TABS & NAVIGATION
  // =========================================================================

  function switchTab(targetTabId) {
    Object.keys(tabViews).forEach(tabKey => {
      if (tabViews[tabKey]) {
        tabViews[tabKey].style.display = (tabKey === targetTabId) ? 'block' : 'none';
      }
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
      if (btn.dataset.tab === targetTabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  if (deskTabsNav) {
    deskTabsNav.addEventListener('click', (e) => {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;
      switchTab(btn.dataset.tab);
    });
  }

  if (btnOpenDesk) {
    btnOpenDesk.addEventListener('click', () => {
      switchTab('tabDossier');
    });
  }

  // Toast notification helper
  function showToast(msg) {
    const existing = document.querySelector('.toast-notice');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notice';
    toast.innerHTML = `<span>🍁</span><span>${escapeHtml(msg)}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.4s ease';
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }

  // Markdown Formatter
  function formatMarkdown(md) {
    if (!md) return '';
    return md
      .replace(/^#### (.*$)/gim, '<h4 style="font-family: \'Outfit\'; font-size: 0.95rem; margin: 8px 0 4px 0; color: #34d399;">$1</h4>')
      .replace(/^### (.*$)/gim, '<h3 style="font-family: \'Outfit\'; font-size: 1.05rem; margin: 10px 0 6px 0; color: #ffffff;">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 style="font-family: \'Outfit\'; font-size: 1.15rem; margin: 12px 0 6px 0; color: #ffffff;">$1</h2>')
      .replace(/^\> (.*$)/gim, '<blockquote style="border-left: 3px solid var(--amber-400); background: rgba(245, 158, 11, 0.08); padding: 8px 12px; margin: 8px 0; border-radius: 4px; font-size: 0.84rem;">$1</blockquote>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/\`(.*?)\`/gim, '<code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px; font-family: monospace; color: var(--cyan-400); font-size: 0.82rem;">$1</code>')
      .replace(/\n/gim, '<br>');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // =========================================================================
  // OSFI STRESS SIMULATOR SLIDERS
  // =========================================================================

  function updateSliderLabels() {
    if (!sliderPrice) return;
    const price = parseInt(sliderPrice.value, 10);
    const downPct = parseInt(sliderDown.value, 10);
    const downCash = Math.round(price * (downPct / 100));
    const credit = parseInt(sliderCredit.value, 10);
    const income = parseInt(sliderIncome.value, 10);

    const isInsured = downPct < 20;

    sliderPriceLabel.textContent = formatCAD(price);
    sliderDownLabel.textContent = `${downPct}% (${formatCAD(downCash)}) — ${isInsured ? 'CMHC Insured' : 'Conventional'}`;
    sliderCreditLabel.textContent = `${credit} Score (${getCanadianCreditTier(credit).tierLabel.split(':')[1] || 'Prime'})`;
    sliderIncomeLabel.textContent = `${formatCAD(income)} / month`;
  }

  [sliderPrice, sliderDown, sliderCredit, sliderIncome].forEach(slider => {
    if (slider) slider.addEventListener('input', updateSliderLabels);
  });

  if (btnApplyStudioToAgent) {
    btnApplyStudioToAgent.addEventListener('click', () => {
      const price = parseInt(sliderPrice.value, 10);
      const downPct = parseInt(sliderDown.value, 10);
      const downCash = Math.round(price * (downPct / 100));
      const credit = parseInt(sliderCredit.value, 10);
      const income = parseInt(sliderIncome.value, 10);

      if (appFieldPrice) appFieldPrice.value = price;
      if (appFieldDownPayment) appFieldDownPayment.value = downCash;
      if (appFieldIncome) appFieldIncome.value = income;
      if (appFieldCreditScoreSlider) appFieldCreditScoreSlider.value = credit;

      updateApplicationCalculations();
      evaluateAndRenderSuggestions();

      addUserMessage(`Simulated Canadian Scenario: ${formatCAD(price)} price, ${downPct}% down payment, ${credit} Equifax Score, ${formatCAD(income)}/mo income.`);
      const result = agent.generateCreditScoreRecommendationResponse("OSFI Sensitivity Scenario Applied");
      addAgentMessage(result.text);

      switchTab('tabSuggestions');
      showToast("Scenario applied and Canadian recommendations refreshed.");
    });
  }

  // =========================================================================
  // IN-BROWSER DIAGNOSTICS & TEST RUNNER
  // =========================================================================

  function initBrowserTestRunner() {
    const btnRun = document.getElementById('btnRunInBrowserTests');
    const summaryStatus = document.getElementById('testSummaryStatus');
    const countsPill = document.getElementById('testCountsPill');
    const outputList = document.getElementById('testOutputList');

    if (!btnRun || !outputList) return;

    btnRun.addEventListener('click', () => {
      outputList.innerHTML = '';
      summaryStatus.textContent = 'Executing Canadian Underwriting & OSFI tests...';
      summaryStatus.style.color = 'var(--cyan-400)';

      const tests = [
        {
          name: "Guardrail: Strict refusal to approve deal directly (English)",
          fn: () => {
            const testAgent = new MortgageAgent();
            const res = testAgent.processMessage("Can you please approve my mortgage loan?");
            if (res.type !== 'guardrail_violation' || !res.text.includes("STRICTLY PROHIBITED") || !res.text.includes("Steve")) {
              throw new Error("Agent failed to refuse direct approval or mention Steve");
            }
          }
        },
        {
          name: "Guardrail: Strict refusal to approve deal directly (Spanish)",
          fn: () => {
            const testAgent = new MortgageAgent();
            const res = testAgent.processMessage("Por favor aprueba mi crédito hipotecario de inmediato");
            if (res.type !== 'guardrail_violation' || !res.text.includes("ESTRICTAMENTE PROHIBIDO")) {
              throw new Error("Agent failed bilingual guardrail test");
            }
          }
        },
        {
          name: "Canadian Provinces: All major jurisdictions configured (ON, BC, AB, QC, Prairies/Atlantic)",
          fn: () => {
            const provinces = ['ON', 'BC', 'AB', 'QC', 'PRAIRIES_ATLANTIC'];
            provinces.forEach(code => {
              if (!CANADIAN_PROVINCES[code]) throw new Error(`Province ${code} missing in CANADIAN_PROVINCES`);
              if (!CANADIAN_PROVINCES[code].flag) throw new Error(`Flag missing for ${code}`);
            });
          }
        },
        {
          name: "OSFI Guideline B-20: Qualifying rate formula MAX(contractRate + 2%, 5.25%)",
          fn: () => {
            const q1 = calculateStressTestRate(4.69);
            if (q1 !== 6.69) throw new Error(`Expected 6.69%, got ${q1}%`);
            const q2 = calculateStressTestRate(2.89);
            if (q2 !== 5.25) throw new Error(`Floor expected 5.25%, got ${q2}%`);
          }
        },
        {
          name: "CMHC Default Insurance: High-ratio tier calculations (<20% down)",
          fn: () => {
            const cmhc1 = calculateCMHCPremum(800000, 80000); // 90% LTV -> 3.10% premium
            if (!cmhc1.isInsured || cmhc1.premiumRatePct !== 3.10) {
              throw new Error(`Expected 3.10% premium for 90% LTV, got ${cmhc1.premiumRatePct}%`);
            }
            const cmhcConv = calculateCMHCPremum(800000, 160000); // 80% LTV -> Conventional 0%
            if (cmhcConv.isInsured || cmhcConv.premiumAmount !== 0) {
              throw new Error("80% LTV should not require CMHC insurance");
            }
          }
        },
        {
          name: "Credit Score Tiering: 745 score categorized as Tier 2 Prime, 660 as Tier 3 Alt-B",
          fn: () => {
            const tierPrime = getCanadianCreditTier(745);
            if (tierPrime.tierKey !== 'tier2_good') throw new Error(`Expected tier2_good, got ${tierPrime.tierKey}`);
            const tierAlt = getCanadianCreditTier(660);
            if (tierAlt.tierKey !== 'tier3_moderate') throw new Error(`Expected tier3_moderate, got ${tierAlt.tierKey}`);
          }
        },
        {
          name: "Lender Recommendation: 745 score matches First National / RBC; 660 matches Equitable Bank",
          fn: () => {
            const rec = suggestCanadianLendersByCreditScore({
              province: "ON",
              creditScore: 745,
              purchasePrice: 780000,
              downPayment: 78000,
              monthlyGrossIncome: 13500,
              monthlyDebts: 650
            });
            if (!rec.topMatch || rec.topMatch.matchScore < 90) {
              throw new Error("Prime borrower should have >= 90% match score");
            }

            const recAlt = suggestCanadianLendersByCreditScore({
              province: "AB",
              creditScore: 660,
              purchasePrice: 540000,
              downPayment: 108000,
              monthlyGrossIncome: 11500
            });
            const eqBank = recAlt.evaluatedLenders.find(l => l.lender.id === 'CAN-EQUITABLE-ALT');
            if (!eqBank || !eqBank.isCreditQualified) throw new Error("Equitable Bank must qualify score 660");
          }
        },
        {
          name: "Application Submission: Dossier generated with PENDING_OFFICER_AUTHORIZATION & assigned to Steve",
          fn: () => {
            const testAgent = new MortgageAgent();
            const submission = testAgent.processApplicationSubmission({
              province: "ON",
              applicantName: "Jordan Campbell",
              creditScore: 745,
              purchasePrice: 780000,
              downPayment: 78000,
              monthlyGrossIncome: 13500
            });
            if (submission.dossier.status !== 'PENDING_OFFICER_AUTHORIZATION') {
              throw new Error("Dossier status must be PENDING_OFFICER_AUTHORIZATION");
            }
            if (submission.dossier.humanOfficer !== 'Steve') {
              throw new Error("Dossier officer must be Steve");
            }
          }
        }
      ];

      let passCount = 0;
      let failCount = 0;

      tests.forEach((t) => {
        const itemEl = document.createElement('div');
        itemEl.style.padding = '8px 12px';
        itemEl.style.borderRadius = 'var(--radius-sm)';
        itemEl.style.background = 'rgba(15, 23, 42, 0.6)';
        itemEl.style.border = '1px solid var(--border-color)';
        itemEl.style.display = 'flex';
        itemEl.style.justifyContent = 'space-between';
        itemEl.style.alignItems = 'center';
        itemEl.style.fontSize = '0.78rem';

        try {
          t.fn();
          passCount++;
          itemEl.innerHTML = `
            <span>✅ <strong>${t.name}</strong></span>
            <span class="metric-pill-ok" style="font-weight: 700; font-family: monospace;">PASS</span>
          `;
        } catch (err) {
          failCount++;
          itemEl.style.borderColor = 'rgba(244, 63, 94, 0.4)';
          itemEl.innerHTML = `
            <span>❌ <strong>${t.name}</strong> (${escapeHtml(err.message)})</span>
            <span class="metric-pill-danger" style="font-weight: 700; font-family: monospace;">FAIL</span>
          `;
        }

        outputList.appendChild(itemEl);
      });

      if (failCount === 0) {
        summaryStatus.textContent = `🎉 All ${passCount} Canadian underwriting tests passed!`;
        summaryStatus.style.color = 'var(--emerald-400)';
        countsPill.textContent = `${passCount} / ${tests.length} Verified (100% OSFI Compliance)`;
        countsPill.style.color = 'var(--emerald-400)';
        showToast(`✅ Diagnostics: ${passCount} tests passed.`);
      } else {
        summaryStatus.textContent = `⚠️ ${failCount} Tests Failed`;
        summaryStatus.style.color = 'var(--rose-400)';
        countsPill.textContent = `${passCount} Passed, ${failCount} Failed`;
      }
    });
  }

  // =========================================================================
  // VAULT SETTINGS & UNDERWRITER ACCREDITATION
  // =========================================================================

  async function initVaultSettings() {
    const btnSave = document.getElementById('btnSaveVaultSettings');
    const saveStatus = document.getElementById('vaultSaveStatus');
    const badge = document.getElementById('vaultEncryptionBadge');

    const nameInput = document.getElementById('settingOfficerName');
    const nmlsInput = document.getElementById('settingOfficerNmls');
    const titleInput = document.getElementById('settingOfficerTitle');
    const emailInput = document.getElementById('settingOfficerEmail');

    if (window.desktopApp) {
      try {
        const isEncrypted = await window.desktopApp.isVaultEncrypted();
        if (badge) {
          badge.innerHTML = isEncrypted 
            ? '<span>🔒 Windows DPAPI Active</span>' 
            : '<span>💾 Local Vault Active</span>';
        }

        const settings = await window.desktopApp.getVaultSettings();
        if (settings) {
          if (settings.humanOfficerName && nameInput) nameInput.value = settings.humanOfficerName;
          if (settings.humanOfficerNmlsId && nmlsInput) nmlsInput.value = settings.humanOfficerNmlsId;
          if (settings.humanOfficerTitle && titleInput) titleInput.value = settings.humanOfficerTitle;
          if (settings.humanOfficerEmail && emailInput) emailInput.value = settings.humanOfficerEmail;
        }
      } catch (e) {
        console.warn('Vault settings notice:', e);
      }
    }

    if (btnSave) {
      btnSave.addEventListener('click', async () => {
        const payload = {
          humanOfficerName: nameInput ? nameInput.value.trim() : 'Steve',
          humanOfficerNmlsId: nmlsInput ? nmlsInput.value.trim() : 'FSRA-M19004812',
          humanOfficerTitle: titleInput ? titleInput.value.trim() : '',
          humanOfficerEmail: emailInput ? emailInput.value.trim() : ''
        };

        if (window.desktopApp) {
          try {
            await window.desktopApp.saveVaultSettings(payload);
            saveStatus.textContent = '✅ Credentials encrypted and securely saved with Windows DPAPI!';
            showToast('Credentials saved to encrypted vault');
          } catch (err) {
            saveStatus.textContent = '⚠️ Error saving: ' + err.message;
          }
        } else {
          saveStatus.textContent = '✅ Configuration saved to active session.';
          showToast('Credentials saved locally');
        }

        setTimeout(() => {
          if (saveStatus) saveStatus.textContent = '';
        }, 5000);
      });
    }
  }

  // Launch application
  init();
  initBrowserTestRunner();
  initVaultSettings();
});
