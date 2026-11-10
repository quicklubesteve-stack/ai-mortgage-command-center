"use client";

import {
  getClientFallbackState,
  saveClientFallbackState,
  resetClientFallbackState,
  downloadApplicationPdfClient,
} from "./demo-client-store";
import {
  evaluateApplicationQualificationAndLenders,
  parseConversationalIntakeMessage,
} from "./agent-services";

export async function fetchApplicationsWithFallback() {
  try {
    const res = await fetch("/api/applications");
    if (res.ok) {
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success) return data;
      }
    }
  } catch (e) {}

  const fallback = getClientFallbackState();
  return {
    success: true,
    applications: fallback.applications,
    auditEvents: fallback.auditEvents,
    lenderProducts: fallback.lenders,
    demoRequestsCount: fallback.demoRequestsCount,
  };
}

export async function createOrResetApplicationWithFallback(body: any) {
  try {
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        return await res.json();
      }
    }
  } catch (e) {}

  if (body.action === "RESET_DEMO_DATA") {
    const reset = resetClientFallbackState();
    return { success: true, count: reset.applications.length };
  }

  const state = getClientFallbackState();
  const refCode = `CAN-MORT-2026-${Math.floor(200 + Math.random() * 799)}`;
  const evalRes = evaluateApplicationQualificationAndLenders({
    purpose: body.purpose || "PURCHASE",
    purchasePriceOrValue: Number(body.purchasePriceOrValue) || 780000,
    downPaymentAmount: Number(body.downPaymentAmount) || 78000,
    existingMortgageBalance: Number(body.existingMortgageBalance) || 0,
    requestedMortgageAmount: Number(body.requestedMortgageAmount) || 702000,
    amortizationYears: Number(body.amortizationYears) || 25,
    termYears: Number(body.termYears) || 5,
    ratePreference: body.ratePreference || "FIXED",
    grossAnnualIncome: Number(body.grossAnnualIncome) || 160000,
    coBorrowerIncome: Number(body.coBorrowerIncome) || 0,
    otherMonthlyIncome: Number(body.otherMonthlyIncome) || 0,
    monthlyDebts: Number(body.monthlyDebts) || 500,
    annualPropertyTax: Number(body.annualPropertyTax) || 4000,
    monthlyHeating: Number(body.monthlyHeating) || 150,
    monthlyCondoFees: Number(body.monthlyCondoFees) || 0,
    creditScoreEstimate: Number(body.creditScoreEstimate) || 720,
    employmentType: body.employmentType || "SALARIED_FULL_TIME",
    isFirstTimeBuyer: Boolean(body.isFirstTimeBuyer),
  });

  const newApp = {
    id: `app-${Date.now()}`,
    referenceCode: refCode,
    purpose: body.purpose || "PURCHASE",
    stage: "DOCUMENT_CHECK",
    statusBadge: "PENDING HUMAN REVIEW",
    requestedMortgageAmount: Number(body.requestedMortgageAmount) || 702000,
    downPaymentAmount: Number(body.downPaymentAmount) || 78000,
    downPaymentSource: body.downPaymentSource || "SAVINGS",
    existingMortgageBalance: Number(body.existingMortgageBalance) || 0,
    amortizationYears: Number(body.amortizationYears) || 25,
    termYears: Number(body.termYears) || 5,
    ratePreference: body.ratePreference || "FIXED",
    paymentFrequency: body.paymentFrequency || "MONTHLY",
    calculatedGds: evalRes.gdsTds.gdsPct,
    calculatedTds: evalRes.gdsTds.tdsPct,
    calculatedLtv: evalRes.downLtv.baseLtvPct,
    stressTestRate: evalRes.stressTest.qualifyingRatePct,
    estimatedMonthlyPayment: evalRes.stressTest.contractMonthlyPayment,
    insuranceRequired: evalRes.downLtv.insuranceRequired,
    insurancePremium: evalRes.downLtv.insurancePremiumAmount,
    borrower: {
      firstName: body.firstName || "Applicant",
      lastName: body.lastName || "Demo",
      email: body.email || "applicant@demo-borrower.ca",
      phone: body.phone || "(416) 555-0100",
      province: body.province || "ON",
      city: body.city || "Toronto",
      isFirstTimeBuyer: Boolean(body.isFirstTimeBuyer),
      creditScoreEstimate: Number(body.creditScoreEstimate) || 720,
      coBorrowerName: body.coBorrowerName || null,
      coBorrowerIncome: Number(body.coBorrowerIncome) || 0,
    },
    property: {
      address: body.address || "100 Demo Ave",
      city: body.city || "Toronto",
      province: body.province || "ON",
      postalCode: body.postalCode || "M5V 2T6",
      propertyType: body.propertyType || "DETACHED",
      occupancy: body.occupancy || "OWNER_OCCUPIED",
      purchasePriceOrValue: Number(body.purchasePriceOrValue) || 780000,
      annualPropertyTax: Number(body.annualPropertyTax) || 4000,
      monthlyHeating: Number(body.monthlyHeating) || 150,
      monthlyCondoFees: Number(body.monthlyCondoFees) || 0,
    },
    incomeRecords: [
      {
        employmentType: body.employmentType || "SALARIED_FULL_TIME",
        employerName: body.employerName || "Demo Employer",
        jobTitle: body.jobTitle || "Professional",
        yearsAtEmployer: Number(body.yearsAtEmployer) || 3,
        annualizedAmount: Number(body.grossAnnualIncome) || 160000,
        otherMonthlyAmt: Number(body.otherMonthlyIncome) || 0,
      },
    ],
    liabilities: [
      {
        monthlyPayment: Number(body.monthlyDebts) || 500,
      },
    ],
    documentChecks: [
      {
        id: `dc-${Date.now()}-1`,
        category: "PAY_STUB",
        title: "Recent Pay Stubs (Last 30 Days)",
        status: "PENDING_MANUAL_REVIEW",
        discrepancySeverity: "NONE",
        findingSummary: "Awaiting sample PDF upload or manual broker verification.",
      },
      {
        id: `dc-${Date.now()}-2`,
        category: "BANK_STATEMENT_DOWN_PAYMENT",
        title: "90-Day Down Payment & Source of Funds Evidence",
        status: "PENDING_MANUAL_REVIEW",
        discrepancySeverity: "NONE",
        findingSummary: "Verify down payment history.",
      },
      {
        id: `dc-${Date.now()}-3`,
        category: "GOVT_ID_PLACEHOLDER",
        title: "Government ID Verification Status (Placeholder)",
        status: "PENDING_MANUAL_REVIEW",
        discrepancySeverity: "NONE",
        findingSummary:
          "Demo placeholder only — no live identity verification connected.",
      },
    ],
    lenderMatches: evalRes.matches.map((m, idx) => ({
      id: `lm-${Date.now()}-${idx}`,
      rankOrder: m.rankOrder,
      fitScore: m.fitScore,
      fitStatus: m.fitStatus,
      estimatedMonthlyPayment: m.estimatedMonthlyPayment,
      stressTestMonthlyPayment: m.stressTestMonthlyPayment,
      qualifyingRateUsed: m.qualifyingRateUsed,
      isSelectedForPackage: m.rankOrder === 1,
      lenderProduct: state.lenders.find((l: any) => l.code === m.lender.code),
    })),
    underwritingAssessment: {
      borrowerFinancialSummary: `${body.firstName} ${body.lastName} — Qualifying Income: $${evalRes.totalAnnualIncome.toLocaleString()} CAD/yr.`,
      debtServiceSummary: `GDS: ${evalRes.gdsTds.gdsPct}% | TDS: ${evalRes.gdsTds.tdsPct}% under OSFI B-20 Stress Test (${evalRes.stressTest.qualifyingRatePct}%).`,
      propertyMortgageSummary: `${body.purpose} in ${body.city}, ${body.province}. Base LTV: ${evalRes.downLtv.baseLtvPct}%.`,
      riskFlagsJson: JSON.stringify([
        {
          code: "NEW_INTAKE_FILE",
          severity: "INFO",
          title: "Newly Created Intake File",
          explanation: "Routed to Agent 2 & Steve for human review.",
        },
      ]),
      exceptionsAndMissingJson: JSON.stringify(
        evalRes.matches[0]?.missingConditions || []
      ),
      humanReviewRecommendation:
        "DRAFT ONLY — Routed to Steve (Authorized Broker / Internal Underwriter) for human review.",
    },
    submissionPackages: [
      {
        packageNumber: `PKG-${refCode}`,
        targetLenderName: evalRes.matches[0]?.lender.lenderName,
        targetProductName: evalRes.matches[0]?.lender.productName,
        packageStatus: "DRAFT_INTERNAL_ONLY",
      },
    ],
    reviewDecisions: [],
  };

  state.applications.unshift(newApp);
  state.auditEvents.unshift({
    id: `aud-${Date.now()}`,
    applicationId: newApp.id,
    actorName: "Agent 1 (AI Borrower Intake)",
    eventType: "INTAKE_SAVED",
    summary: `Created structured Canadian mortgage application ${refCode} for ${newApp.borrower.firstName} ${newApp.borrower.lastName}.`,
    createdAt: new Date().toISOString(),
  });
  saveClientFallbackState(state);

  return { success: true, application: newApp };
}

export async function patchApplicationWithFallback(
  appId: string,
  body: any,
  role: string
) {
  try {
    const res = await fetch(`/api/applications/${appId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-demo-role": role,
      },
      body: JSON.stringify(body),
    });
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return { ok: res.ok, status: res.status, data: await res.json() };
    }
  } catch (e) {}

  const state = getClientFallbackState();
  const app = state.applications.find((a: any) => a.id === appId);
  if (!app) {
    return {
      ok: false,
      status: 404,
      data: { success: false, error: "Application not found" },
    };
  }

  if (body.action === "UPDATE_STAGE") {
    app.stage = body.stage;
    saveClientFallbackState(state);
    return { ok: true, status: 200, data: { success: true, application: app } };
  }

  if (body.action === "UPLOAD_SAMPLE_DOC") {
    const chk = app.documentChecks?.find((c: any) => c.id === body.checkId);
    if (chk) {
      chk.status = body.newStatus || "PENDING_MANUAL_REVIEW";
      chk.findingSummary = body.findingSummary;
    }
    state.auditEvents.unshift({
      id: `aud-${Date.now()}`,
      applicationId: app.id,
      actorName: "Agent 2 (Document Verification)",
      eventType: "DOC_UPLOADED",
      summary: `Uploaded demo PDF "${body.fileName}" for ${body.category}.`,
      createdAt: new Date().toISOString(),
    });
    saveClientFallbackState(state);
    return { ok: true, status: 200, data: { success: true } };
  }

  if (body.action === "UPDATE_DOC_CHECK") {
    if (role === "BORROWER") {
      return {
        ok: false,
        status: 403,
        data: {
          success: false,
          error:
            "Unauthorized: Borrowers cannot manually override internal document review statuses.",
        },
      };
    }
    const chk = app.documentChecks?.find((c: any) => c.id === body.checkId);
    if (chk) {
      chk.status = body.status;
      chk.reviewerOverrideNote = body.reviewerOverrideNote;
    }
    saveClientFallbackState(state);
    return { ok: true, status: 200, data: { success: true } };
  }

  if (body.action === "SELECT_LENDER_MATCH") {
    app.lenderMatches?.forEach((m: any) => {
      m.isSelectedForPackage = m.id === body.matchId;
    });
    saveClientFallbackState(state);
    return { ok: true, status: 200, data: { success: true } };
  }

  if (body.action === "RECORD_HUMAN_REVIEW") {
    if (
      !["INTERNAL_UNDERWRITER", "MORTGAGE_BROKER", "BROKERAGE_ADMIN"].includes(
        role
      )
    ) {
      return {
        ok: false,
        status: 403,
        data: {
          success: false,
          error:
            "Forbidden (HTTP 403): Current role does not have human underwriter review authority. Switch to Internal Underwriter (Steve) or Mortgage Broker.",
        },
      };
    }

    let newBadge = "INTERNALLY REVIEWED (NOT AN APPROVAL)";
    if (body.reviewAction === "REQUEST_MISSING_INFO") {
      app.stage = "DOCUMENT_CHECK";
      newBadge = "MISSING INFO REQUESTED BY REVIEWER";
    } else if (body.reviewAction === "RETURN_FOR_CORRECTION") {
      app.stage = "RETURNED_FOR_CORRECTION";
      newBadge = "RETURNED FOR CORRECTION";
    } else if (body.reviewAction === "PREPARE_EXTERNAL_SUBMISSION") {
      app.stage = "INTERNALLY_REVIEWED";
      newBadge = "READY FOR FUTURE EXTERNAL SUBMISSION WORKFLOW";
    } else {
      app.stage = "INTERNALLY_REVIEWED";
    }
    app.statusBadge = newBadge;
    app.reviewDecisions = app.reviewDecisions || [];
    app.reviewDecisions.unshift({
      id: `rd-${Date.now()}`,
      action: body.reviewAction,
      reviewerName: body.reviewerName || "Steve",
      notes: body.notes,
    });
    state.auditEvents.unshift({
      id: `aud-${Date.now()}`,
      applicationId: app.id,
      actorName: body.reviewerName || "Steve",
      eventType: "HUMAN_REVIEW_RECORDED",
      summary: `Human Reviewer recorded "${body.reviewAction}" on ${app.referenceCode}.`,
      createdAt: new Date().toISOString(),
    });
    saveClientFallbackState(state);
    return {
      ok: true,
      status: 200,
      data: { success: true, newBadge, newStage: app.stage },
    };
  }

  return { ok: true, status: 200, data: { success: true } };
}

export async function sendIntakeChatWithFallback(body: {
  message: string;
  currentData: any;
  applicationId?: string | null;
}) {
  try {
    const res = await fetch("/api/intake-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        return await res.json();
      }
    }
  } catch (e) {}

  return {
    success: true,
    ...parseConversationalIntakeMessage(body.message, body.currentData || {}),
  };
}

export async function saveDemoRequestWithFallback(body: any) {
  try {
    const res = await fetch("/api/demo-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      return { ok: res.ok, data: await res.json() };
    }
  } catch (e) {}

  const state = getClientFallbackState();
  state.demoRequestsCount = (state.demoRequestsCount || 1) + 1;
  state.auditEvents.unshift({
    id: `aud-demo-${Date.now()}`,
    actorName: body.fullName || "Visitor",
    eventType: "DEMO_BOOKING_SAVED",
    summary: `Local demo booking saved for ${body.organizationName} (${body.province}).`,
    createdAt: new Date().toISOString(),
  });
  saveClientFallbackState(state);
  return { ok: true, data: { success: true } };
}

export async function saveMortgageInquiryWithFallback(body: any) {
  try {
    const res = await fetch("/api/mortgage-inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const data = await res.json();
      if (data.success) return { ok: true, data };
    }
  } catch (e) {}

  const state = getClientFallbackState();
  const refCode = `CAN-INQ-2026-${Math.floor(1000 + Math.random() * 8999)}`;
  const price = Number(body.propertyPriceOrValue) || 750000;
  const down = Number(body.downPaymentOrEquity) || 75000;
  const loanAmt = Math.max(price - down, 50000);
  const income = Number(body.grossAnnualIncome) || 135000;

  const names = (body.fullName || "Inquiry Applicant").trim().split(" ");
  const firstName = names[0] || "Inquiry";
  const lastName = names.slice(1).join(" ") || "Applicant";

  const evalRes = evaluateApplicationQualificationAndLenders({
    purpose: body.purpose || "PURCHASE",
    purchasePriceOrValue: price,
    downPaymentAmount: down,
    existingMortgageBalance: body.purpose === "REFINANCE" ? loanAmt : 0,
    requestedMortgageAmount: loanAmt,
    amortizationYears: 25,
    termYears: 5,
    ratePreference: "FIXED",
    grossAnnualIncome: income,
    coBorrowerIncome: 0,
    otherMonthlyIncome: 0,
    monthlyDebts: 400,
    annualPropertyTax: Math.round(price * 0.0075),
    monthlyHeating: 160,
    monthlyCondoFees: 0,
    creditScoreEstimate: Number(body.creditScoreEstimate) || 720,
    employmentType: body.employmentType || "SALARIED_FULL_TIME",
    isFirstTimeBuyer: Boolean(body.isFirstTimeBuyer),
  });

  const newApp = {
    id: `app-inq-${Date.now()}`,
    referenceCode: refCode,
    purpose: body.purpose || "PURCHASE",
    stage: "INTAKE",
    statusBadge: "NEW BORROWER INQUIRY",
    requestedMortgageAmount: loanAmt,
    downPaymentAmount: down,
    downPaymentSource: body.downPaymentSource || "SAVINGS",
    existingMortgageBalance: body.purpose === "REFINANCE" ? loanAmt : 0,
    amortizationYears: 25,
    termYears: 5,
    ratePreference: "FIXED",
    paymentFrequency: "MONTHLY",
    calculatedGds: evalRes.gdsTds.gdsPct,
    calculatedTds: evalRes.gdsTds.tdsPct,
    calculatedLtv: evalRes.downLtv.baseLtvPct,
    stressTestRate: evalRes.stressTest.qualifyingRatePct,
    estimatedMonthlyPayment: evalRes.stressTest.contractMonthlyPayment,
    insuranceRequired: evalRes.downLtv.insuranceRequired,
    insurancePremium: evalRes.downLtv.insurancePremiumAmount,
    borrower: {
      firstName,
      lastName,
      email: body.email || "borrower@inquiry.ca",
      phone: body.phone || "(416) 555-0199",
      province: body.province || "ON",
      city: body.city || "Toronto",
      isFirstTimeBuyer: Boolean(body.isFirstTimeBuyer),
      creditScoreEstimate: Number(body.creditScoreEstimate) || 720,
      coBorrowerName: null,
      coBorrowerIncome: 0,
    },
    property: {
      address: `${body.city || "Toronto"}, ${body.province || "ON"}`,
      city: body.city || "Toronto",
      province: body.province || "ON",
      postalCode: "M5V 2T6",
      propertyType: "DETACHED",
      occupancy: "OWNER_OCCUPIED",
      purchasePriceOrValue: price,
      annualPropertyTax: Math.round(price * 0.0075),
      monthlyHeating: 160,
      monthlyCondoFees: 0,
    },
    incomeRecords: [
      {
        employmentType: body.employmentType || "SALARIED_FULL_TIME",
        employerName: "Declared in Inquiry",
        jobTitle: "Applicant",
        yearsAtEmployer: 2,
        annualizedAmount: income,
        otherMonthlyAmt: 0,
      },
    ],
    liabilities: [
      {
        monthlyPayment: 400,
      },
    ],
    documentChecks: [
      {
        id: `dc-${Date.now()}-1`,
        category: "PAY_STUB",
        title: "Recent Pay Stubs (Last 30 Days)",
        status: "PENDING_MANUAL_REVIEW",
        discrepancySeverity: "NONE",
        findingSummary: "Awaiting borrower document upload upon file intake.",
      },
    ],
    lenderMatches: evalRes.matches.map((m, idx) => ({
      id: `lm-${Date.now()}-${idx}`,
      rankOrder: m.rankOrder,
      fitScore: m.fitScore,
      fitStatus: m.fitStatus,
      estimatedMonthlyPayment: m.estimatedMonthlyPayment,
      stressTestMonthlyPayment: m.stressTestMonthlyPayment,
      qualifyingRateUsed: m.qualifyingRateUsed,
      isSelectedForPackage: m.rankOrder === 1,
      lenderProduct: state.lenders.find((l: any) => l.code === m.lender.code),
    })),
    underwritingAssessment: {
      borrowerFinancialSummary: `${firstName} ${lastName} — Initial Inquiry: $${price.toLocaleString()} CAD ${body.purpose}. Income: $${income.toLocaleString()} CAD/yr.`,
      debtServiceSummary: `Initial Ratios: GDS ${evalRes.gdsTds.gdsPct}% | TDS ${evalRes.gdsTds.tdsPct}%. Stress Test: ${evalRes.stressTest.qualifyingRatePct}%.`,
      propertyMortgageSummary: `${body.purpose} in ${body.city}, ${body.province}. Timeline: ${body.timeline || "Within 60 days"}. Notes: ${body.notes || "None"}.`,
      riskFlagsJson: JSON.stringify([
        {
          code: "NEW_BORROWER_INQUIRY",
          severity: "INFO",
          title: "New Public Mortgage Inquiry",
          explanation: `Received via Public Contact Form for ${body.purpose} in ${body.city}, ${body.province}. Contact preference: ${body.preferredContact || "Email"}.`,
        },
      ]),
      exceptionsAndMissingJson: JSON.stringify(["Complete full document intake with applicant."]),
      humanReviewRecommendation: "NEW INQUIRY — Steve (Licensed Broker) to contact borrower.",
    },
    submissionPackages: [],
    reviewDecisions: [],
  };

  state.applications.unshift(newApp);
  state.auditEvents.unshift({
    id: `aud-${Date.now()}`,
    applicationId: newApp.id,
    actorName: `${firstName} ${lastName} (Prospective Borrower)`,
    eventType: "NEW_BORROWER_INQUIRY",
    summary: `Submitted base mortgage contact inquiry (${refCode}) for ${body.purpose} in ${body.city}, ${body.province} ($${price.toLocaleString()}).`,
    createdAt: new Date().toISOString(),
  });
  saveClientFallbackState(state);

  return {
    ok: true,
    data: {
      success: true,
      inquiryRef: refCode,
      estimatedPayment: evalRes.stressTest.contractMonthlyPayment,
      qualifyingRatePct: evalRes.stressTest.qualifyingRatePct,
      contractRatePct: 4.79,
      loanAmount: loanAmt,
      downPaymentPct: evalRes.downLtv.actualDownPaymentPct,
      insuranceRequired: evalRes.downLtv.insuranceRequired,
      applicationId: newApp.id,
    },
  };
}

export async function patchLenderWithFallback(body: any, role: string) {
  try {
    const res = await fetch("/api/lenders", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-demo-role": role,
      },
      body: JSON.stringify(body),
    });
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      return { ok: res.ok, data: await res.json() };
    }
  } catch (e) {}

  if (role === "BORROWER") {
    return {
      ok: false,
      data: {
        success: false,
        error: "Unauthorized: Borrowers cannot modify fictional lender rules.",
      },
    };
  }
  const state = getClientFallbackState();
  const found = state.lenders.find((l: any) => l.id === body.id);
  if (found) {
    Object.assign(found, {
      illustrativeRatePct: Number(body.illustrativeRatePct),
      minCreditScore: Number(body.minCreditScore),
      maxGdsPct: Number(body.maxGdsPct),
      maxTdsPct: Number(body.maxTdsPct),
      maxLtvPct: Number(body.maxLtvPct),
    });
    saveClientFallbackState(state);
  }
  return { ok: true, data: { success: true, lender: found } };
}

export { downloadApplicationPdfClient };

