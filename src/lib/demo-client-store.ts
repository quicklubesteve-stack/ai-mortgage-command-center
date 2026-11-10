"use client";

/**
 * Dual-Mode Data & PDF Persistence Layer (SQLite API + Cloudflare Edge/Static Fallback)
 *
 * - On localhost Node.js server: Communicates with `/api/*` backed by Prisma + SQLite (`dev.db`).
 * - On Cloudflare Pages deployment: Seamlessly falls back to deterministic in-browser state
 *   persisted in `localStorage` + client-side `jsPDF` generation so every feature works 100% live on the edge.
 */

import { jsPDF } from "jspdf";
import {
  DEFAULT_FICTIONAL_LENDERS,
  evaluateApplicationQualificationAndLenders,
  SAMPLE_BORROWER_SCENARIOS,
  identifyMissingIntakeFields,
  parseConversationalIntakeMessage,
} from "./agent-services";

const STORAGE_KEY_APPS = "amcc_cf_applications_v1";
const STORAGE_KEY_LENDERS = "amcc_cf_lenders_v1";
const STORAGE_KEY_AUDITS = "amcc_cf_audits_v1";
const STORAGE_KEY_DEMO_REQS = "amcc_cf_demo_reqs_v1";

function buildDefaultClientState() {
  const lenders = DEFAULT_FICTIONAL_LENDERS.map((l, idx) => ({
    id: `lender-${idx + 1}`,
    ...l,
    keyConditionsJson: JSON.stringify(l.keyConditions),
  }));

  const appTemplates = [
    {
      ref: "CAN-MORT-2026-101",
      scenario: SAMPLE_BORROWER_SCENARIOS[0],
      stage: "HUMAN_REVIEW",
      statusBadge: "READY FOR HUMAN REVIEW",
      hasBlockingDocs: false,
      docChecks: [
        {
          id: "dc-101-1",
          category: "PAY_STUB",
          title: "Recent Pay Stubs (Last 30 Days)",
          status: "VERIFIED_DEMO",
          discrepancySeverity: "NONE",
          findingSummary:
            "Demo pay stubs match declared $178,000 CAD base salary at NorthStar Cloud Technologies Inc.",
        },
        {
          id: "dc-101-2",
          category: "EMPLOYMENT_LETTER",
          title: "Letter of Employment",
          status: "VERIFIED_DEMO",
          discrepancySeverity: "NONE",
          findingSummary:
            "Confirmed full-time permanent tenure (4.5 years) and base salary.",
        },
        {
          id: "dc-101-3",
          category: "TAX_NOA_T1",
          title: "CRA Notice of Assessment (NOA) & T4",
          status: "VERIFIED_DEMO",
          discrepancySeverity: "NONE",
          findingSummary:
            "Line 15000 income consistent with salaried declaration; zero CRA tax arrears.",
        },
        {
          id: "dc-101-4",
          category: "BANK_STATEMENT_DOWN_PAYMENT",
          title: "90-Day Down Payment & FHSA Statements",
          status: "VERIFIED_DEMO",
          discrepancySeverity: "NONE",
          findingSummary:
            "$78,000 CAD down payment verified across FHSA ($40,000) and savings ($38,000).",
        },
        {
          id: "dc-101-5",
          category: "PURCHASE_AGREEMENT",
          title: "Agreement of Purchase and Sale (APS)",
          status: "VERIFIED_DEMO",
          discrepancySeverity: "NONE",
          findingSummary:
            "Signed APS for 420 Wellington St W, Suite 1804 at $780,000 CAD purchase price.",
        },
        {
          id: "dc-101-6",
          category: "GOVT_ID_PLACEHOLDER",
          title: "Government ID Verification Status (Placeholder)",
          status: "PENDING_MANUAL_REVIEW",
          discrepancySeverity: "NONE",
          findingSummary:
            "Demo placeholder only — no live cryptographic identity verification connected. Broker must sight ID.",
        },
      ],
      riskFlags: [
        {
          code: "HIGH_RATIO_INSURED",
          severity: "INFO",
          title: "High-Ratio Mortgage Default Insurance Required (90% Base LTV)",
          explanation:
            "Down payment is 10% ($78,000 CAD). Requires $21,762 CAD illustrative default insurance premium added to loan balance.",
        },
      ],
    },
    {
      ref: "CAN-MORT-2026-102",
      scenario: SAMPLE_BORROWER_SCENARIOS[1],
      stage: "DOCUMENT_CHECK",
      statusBadge: "AWAITING DOCUMENTS — BLOCKING ITEMS",
      hasBlockingDocs: true,
      docChecks: [
        {
          id: "dc-102-1",
          category: "TAX_NOA_T1",
          title: "2-Year CRA T1 Generals & Notices of Assessment",
          status: "MISSING",
          discrepancySeverity: "BLOCKING",
          findingSummary:
            "MISSING: Self-employed (BFS) applicant has not uploaded 2024/2025 CRA T1 General & NOA packages.",
        },
        {
          id: "dc-102-2",
          category: "BANK_STATEMENT_DOWN_PAYMENT",
          title: "6-Month Business Bank Statements & Down Payment Proof",
          status: "INCONSISTENT",
          discrepancySeverity: "WARNING",
          findingSummary:
            "INCONSISTENT: Uploaded savings statement shows $94,000 CAD vs. declared $124,000 CAD down payment ($30,000 transfer source undocumented).",
        },
        {
          id: "dc-102-3",
          category: "EMPLOYMENT_LETTER",
          title: "Articles of Incorporation & Business License",
          status: "VERIFIED_DEMO",
          discrepancySeverity: "NONE",
          findingSummary:
            "Alberta corporate registry confirms MacLeod Precision Contracting Ltd. active for 5 years.",
        },
        {
          id: "dc-102-4",
          category: "PURCHASE_AGREEMENT",
          title: "Agreement of Purchase and Sale (APS)",
          status: "VERIFIED_DEMO",
          discrepancySeverity: "NONE",
          findingSummary:
            "APS matches 88 Aspen Summit Way SW, Calgary at $620,000 CAD.",
        },
        {
          id: "dc-102-5",
          category: "GOVT_ID_PLACEHOLDER",
          title: "Government ID Verification Status (Placeholder)",
          status: "PENDING_MANUAL_REVIEW",
          discrepancySeverity: "NONE",
          findingSummary:
            "Demo placeholder only — manual broker verification required.",
        },
      ],
      riskFlags: [
        {
          code: "BFS_MISSING_TAX_EVIDENCE",
          severity: "HIGH",
          title: "Self-Employed Income Documentation Incomplete",
          explanation:
            "Applicant is Business-for-Self (BFS) with 655 credit score; missing 2-year T1/NOA and 6-month business cash-flow statements.",
        },
        {
          code: "DOWN_PAYMENT_GAP",
          severity: "HIGH",
          title: "$30,000 Down Payment Source Unverified",
          explanation:
            "Bank statements show $94,000 vs $124,000 declared down payment. Anti-money laundering (FINTRAC) 90-day paper trail required.",
        },
      ],
    },
    {
      ref: "CAN-MORT-2026-103",
      scenario: SAMPLE_BORROWER_SCENARIOS[2],
      stage: "DRAFT_PACKAGE",
      statusBadge: "DRAFT PACKAGE ASSEMBLED — PENDING HUMAN REVIEW",
      hasBlockingDocs: false,
      docChecks: [
        {
          id: "dc-103-1",
          category: "EXISTING_MORTGAGE_STATEMENT",
          title: "Current Mortgage Statement & Payout Balance",
          status: "VERIFIED_DEMO",
          discrepancySeverity: "NONE",
          findingSummary:
            "Confirms $520,000 CAD existing balance on 2145 West 14th Avenue, Vancouver.",
        },
        {
          id: "dc-103-2",
          category: "PAY_STUB",
          title: "Recent Pay Stubs & T4",
          status: "VERIFIED_DEMO",
          discrepancySeverity: "NONE",
          findingSummary:
            "Matches $225,000 CAD gross annual salary at Pacific Coastal Health Authority.",
        },
        {
          id: "dc-103-3",
          category: "GOVT_ID_PLACEHOLDER",
          title: "Government ID Verification Status (Placeholder)",
          status: "PENDING_MANUAL_REVIEW",
          discrepancySeverity: "NONE",
          findingSummary:
            "Demo placeholder — requires in-person or verified broker ID sighting prior to external submission.",
        },
      ],
      riskFlags: [
        {
          code: "REFINANCE_APPRAISAL_CONDITION",
          severity: "LOW",
          title: "Full Appraisal Required for $260,000 Equity Take-Out",
          explanation:
            "LTV is conservative at 57.8% (well below 80% refinance limit), but property value of $1.35M requires certified appraisal.",
        },
      ],
    },
    {
      ref: "CAN-MORT-2026-104",
      scenario: SAMPLE_BORROWER_SCENARIOS[3],
      stage: "LENDER_COMPARISON",
      statusBadge: "COMPARING RENEWAL TERMS — PENDING HUMAN REVIEW",
      hasBlockingDocs: false,
      docChecks: [
        {
          id: "dc-104-1",
          category: "EXISTING_MORTGAGE_STATEMENT",
          title: "Maturing Mortgage Renewal Statement",
          status: "VERIFIED_DEMO",
          discrepancySeverity: "NONE",
          findingSummary:
            "Confirms $415,000 CAD balance maturing next month in Montreal, QC.",
        },
        {
          id: "dc-104-2",
          category: "PAY_STUB",
          title: "Applicant & Co-Borrower Pay Stubs",
          status: "VERIFIED_DEMO",
          discrepancySeverity: "NONE",
          findingSummary:
            "Combined household income of $170,000 CAD ($112k + $58k co-borrower) matches pay stubs.",
        },
        {
          id: "dc-104-3",
          category: "GOVT_ID_PLACEHOLDER",
          title: "Government ID Verification Status (Placeholder)",
          status: "PENDING_MANUAL_REVIEW",
          discrepancySeverity: "NONE",
          findingSummary: "Demo placeholder — requires human verification.",
        },
      ],
      riskFlags: [
        {
          code: "VARIABLE_RATE_SENSITIVITY",
          severity: "INFO",
          title: "Borrower Comparing Variable vs. 3-Year Fixed Renewal",
          explanation:
            "Low LTV (64.8%) and strong GDS/TDS ratios allow flexibility between 3-Yr Fixed and 5-Yr Variable.",
        },
      ],
    },
    {
      ref: "CAN-MORT-2026-105",
      scenario: SAMPLE_BORROWER_SCENARIOS[4],
      stage: "HUMAN_REVIEW",
      statusBadge: "ESCALATED FOR MANUAL UNDERWRITER REVIEW",
      hasBlockingDocs: true,
      docChecks: [
        {
          id: "dc-105-1",
          category: "BANK_STATEMENT_DOWN_PAYMENT",
          title: "Gift Letter & 90-Day Donor Account Evidence",
          status: "INCONSISTENT",
          discrepancySeverity: "WARNING",
          findingSummary:
            "WARNING: Signed gift letter states $150,000 CAD non-repayable gift, but wire deposit shows $135,000 CAD ($15,000 variance).",
        },
        {
          id: "dc-105-2",
          category: "PAY_STUB",
          title: "Recent Pay Stubs & Employment Letter",
          status: "VERIFIED_DEMO",
          discrepancySeverity: "NONE",
          findingSummary:
            "Matches $176,000 CAD annual income at Capital Region Advisory Group.",
        },
        {
          id: "dc-105-3",
          category: "PURCHASE_AGREEMENT",
          title: "Agreement of Purchase and Sale (APS)",
          status: "VERIFIED_DEMO",
          discrepancySeverity: "NONE",
          findingSummary:
            "Confirmed $1,180,000 CAD purchase price in Ottawa, ON.",
        },
        {
          id: "dc-105-4",
          category: "GOVT_ID_PLACEHOLDER",
          title: "Government ID Verification Status (Placeholder)",
          status: "PENDING_MANUAL_REVIEW",
          discrepancySeverity: "NONE",
          findingSummary:
            "Demo placeholder — human underwriter must confirm identity verification.",
        },
      ],
      riskFlags: [
        {
          code: "STRETCHED_STRESS_TEST_RATIOS",
          severity: "HIGH",
          title: "Stress-Tested GDS/TDS Exceed Standard 39% / 44% Prime Caps",
          explanation:
            "On a $944,000 mortgage at the OSFI B-20 qualifying stress rate, GDS/TDS exceed standard Prime A-Lender limits, requiring co-signer, debt paydown, or alternative equity lender review.",
        },
        {
          code: "GIFT_AMOUNT_MISMATCH",
          severity: "MEDIUM",
          title: "Down Payment Gift Letter vs Deposit Discrepancy ($15,000)",
          explanation:
            "Agent 2 flagged a $15,000 gap between the gift letter ($150k) and verified bank wire ($135k). Requires manual review by Steve.",
        },
      ],
    },
  ];

  const applications = appTemplates.map((item, idx) => {
    const s = item.scenario.data;
    const evaluation = evaluateApplicationQualificationAndLenders({
      purpose: s.purpose,
      purchasePriceOrValue: s.purchasePriceOrValue,
      downPaymentAmount: s.downPaymentAmount,
      existingMortgageBalance: s.existingMortgageBalance,
      requestedMortgageAmount: s.requestedMortgageAmount,
      amortizationYears: s.amortizationYears,
      termYears: s.termYears,
      ratePreference: s.ratePreference,
      grossAnnualIncome: s.grossAnnualIncome,
      coBorrowerIncome: s.coBorrowerIncome || 0,
      otherMonthlyIncome: s.otherMonthlyIncome || 0,
      monthlyDebts: s.monthlyDebts,
      annualPropertyTax: s.annualPropertyTax,
      monthlyHeating: s.monthlyHeating,
      monthlyCondoFees: s.monthlyCondoFees,
      creditScoreEstimate: s.creditScoreEstimate,
      employmentType: s.employmentType,
      isFirstTimeBuyer: s.isFirstTimeBuyer,
      hasBlockingDocIssues: item.hasBlockingDocs,
    });

    const topMatch = evaluation.matches[0];

    return {
      id: `app-${idx + 1}`,
      referenceCode: item.ref,
      purpose: s.purpose,
      stage: item.stage,
      statusBadge: item.statusBadge,
      requestedMortgageAmount: s.requestedMortgageAmount,
      downPaymentAmount: s.downPaymentAmount,
      downPaymentSource: s.downPaymentSource,
      existingMortgageBalance: s.existingMortgageBalance,
      amortizationYears: s.amortizationYears,
      termYears: s.termYears,
      ratePreference: s.ratePreference,
      paymentFrequency: s.paymentFrequency,
      calculatedGds: evaluation.gdsTds.gdsPct,
      calculatedTds: evaluation.gdsTds.tdsPct,
      calculatedLtv: evaluation.downLtv.baseLtvPct,
      stressTestRate: evaluation.stressTest.qualifyingRatePct,
      estimatedMonthlyPayment: evaluation.stressTest.contractMonthlyPayment,
      insuranceRequired: evaluation.downLtv.insuranceRequired,
      insurancePremium: evaluation.downLtv.insurancePremiumAmount,
      borrower: {
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        phone: s.phone,
        province: s.province,
        city: s.city,
        isFirstTimeBuyer: s.isFirstTimeBuyer,
        creditScoreEstimate: s.creditScoreEstimate,
        coBorrowerName: s.coBorrowerName || null,
        coBorrowerIncome: s.coBorrowerIncome || 0,
      },
      property: {
        address: s.address,
        city: s.city,
        province: s.province,
        postalCode: s.postalCode,
        propertyType: s.propertyType,
        occupancy: s.occupancy,
        purchasePriceOrValue: s.purchasePriceOrValue,
        annualPropertyTax: s.annualPropertyTax,
        monthlyHeating: s.monthlyHeating,
        monthlyCondoFees: s.monthlyCondoFees,
      },
      incomeRecords: [
        {
          employmentType: s.employmentType,
          employerName: s.employerName,
          jobTitle: s.jobTitle,
          yearsAtEmployer: s.yearsAtEmployer,
          annualizedAmount: s.grossAnnualIncome,
          otherMonthlyAmt: s.otherMonthlyIncome,
        },
      ],
      liabilities: [
        {
          monthlyPayment: s.monthlyDebts,
        },
      ],
      documentChecks: item.docChecks,
      lenderMatches: evaluation.matches.map((m, mIdx) => ({
        id: `lm-${idx + 1}-${mIdx + 1}`,
        rankOrder: m.rankOrder,
        fitScore: m.fitScore,
        fitStatus: m.fitStatus,
        estimatedMonthlyPayment: m.estimatedMonthlyPayment,
        stressTestMonthlyPayment: m.stressTestMonthlyPayment,
        qualifyingRateUsed: m.qualifyingRateUsed,
        isSelectedForPackage: m.rankOrder === 1,
        lenderProduct: lenders.find((lp) => lp.code === m.lender.code),
      })),
      underwritingAssessment: {
        borrowerFinancialSummary: `${s.firstName} ${s.lastName} (${s.employmentType.replace(
          /_/g,
          " "
        )} at ${
          s.employerName
        }). Total qualifying household income: $${evaluation.totalAnnualIncome.toLocaleString()} CAD/yr. Voluntarily supplied credit score estimate: ${
          s.creditScoreEstimate
        }.`,
        debtServiceSummary: `GDS: ${evaluation.gdsTds.gdsPct}% (Guideline <= 39.0%) | TDS: ${evaluation.gdsTds.tdsPct}% (Guideline <= 44.0%) evaluated at OSFI B-20 stress-test rate of ${evaluation.stressTest.qualifyingRatePct}%.`,
        propertyMortgageSummary: `${s.purpose} on ${s.propertyType.replace(
          /_/g,
          " "
        )} at ${s.address}, ${s.city}, ${
          s.province
        }. Value: $${s.purchasePriceOrValue.toLocaleString()} CAD. Base LTV: ${
          evaluation.downLtv.baseLtvPct
        }%.`,
        riskFlagsJson: JSON.stringify(item.riskFlags),
        exceptionsAndMissingJson: JSON.stringify(
          topMatch ? topMatch.missingConditions : []
        ),
        humanReviewRecommendation:
          "DRAFT UNDERWRITING PACKAGE ONLY — AI agents cannot approve, pre-approve, or deny any mortgage. File is routed to Steve (Authorized Broker / Internal Underwriter) for human review.",
      },
      submissionPackages: [
        {
          packageNumber: `PKG-${item.ref}`,
          targetLenderName: topMatch?.lender.lenderName,
          targetProductName: topMatch?.lender.productName,
          packageStatus: "DRAFT_INTERNAL_ONLY",
        },
      ],
      reviewDecisions: [],
    };
  });

  const auditEvents = applications.flatMap((a) => [
    {
      id: `aud-${a.id}-1`,
      applicationId: a.id,
      actorName: "Agent 1 (AI Borrower Intake)",
      eventType: "INTAKE_SAVED",
      summary: `Structured Canadian ${a.purpose} application ${a.referenceCode} created for ${a.borrower.firstName} ${a.borrower.lastName} (${a.borrower.city}, ${a.borrower.province}).`,
      createdAt: new Date().toISOString(),
    },
    {
      id: `aud-${a.id}-2`,
      applicationId: a.id,
      actorName: "Agent 3 (Qualification & Lender Matcher)",
      eventType: "QUALIFICATION_CALCULATED",
      summary: `Calculated GDS=${a.calculatedGds}%, TDS=${a.calculatedTds}%, Base LTV=${a.calculatedLtv}% at ${a.stressTestRate}% OSFI stress-test rate.`,
      createdAt: new Date().toISOString(),
    },
  ]);

  return { applications, lenders, auditEvents, demoRequestsCount: 1 };
}

export function getClientFallbackState() {
  if (typeof window === "undefined") {
    return buildDefaultClientState();
  }
  try {
    const rawApps = localStorage.getItem(STORAGE_KEY_APPS);
    const rawLenders = localStorage.getItem(STORAGE_KEY_LENDERS);
    const rawAudits = localStorage.getItem(STORAGE_KEY_AUDITS);
    const rawReqs = localStorage.getItem(STORAGE_KEY_DEMO_REQS);

    if (rawApps && rawLenders && rawAudits) {
      return {
        applications: JSON.parse(rawApps),
        lenders: JSON.parse(rawLenders),
        auditEvents: JSON.parse(rawAudits),
        demoRequestsCount: Number(rawReqs || "1"),
      };
    }
  } catch (e) {}

  const initial = buildDefaultClientState();
  saveClientFallbackState(initial);
  return initial;
}

export function saveClientFallbackState(state: {
  applications: any[];
  lenders: any[];
  auditEvents: any[];
  demoRequestsCount?: number;
}) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_APPS, JSON.stringify(state.applications));
    localStorage.setItem(STORAGE_KEY_LENDERS, JSON.stringify(state.lenders));
    localStorage.setItem(STORAGE_KEY_AUDITS, JSON.stringify(state.auditEvents));
    if (state.demoRequestsCount !== undefined) {
      localStorage.setItem(
        STORAGE_KEY_DEMO_REQS,
        String(state.demoRequestsCount)
      );
    }
  } catch (e) {}
}

export function resetClientFallbackState() {
  const fresh = buildDefaultClientState();
  saveClientFallbackState(fresh);
  return fresh;
}

/**
 * Generates and downloads the Draft Underwriting PDF Summary directly in the browser
 * (Works identically on both localhost and Cloudflare Pages static hosting)
 */
export function downloadApplicationPdfClient(app: any) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  doc.setFillColor(10, 17, 34);
  doc.rect(0, 0, 210, 34, "F");
  doc.setTextColor(20, 184, 166);
  doc.setFontSize(10);
  doc.text(
    "AI MORTGAGE COMMAND CENTER — DEMO MODE (FICTIONAL DATA ONLY)",
    14,
    11
  );
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text(`DRAFT UNDERWRITING & LENDER PACKAGE: ${app.referenceCode}`, 14, 21);
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Status: ${app.statusBadge} | Generated: ${new Date()
      .toISOString()
      .slice(0, 10)} | Human-Controlled Decisions`,
    14,
    29
  );

  let y = 44;
  const addSectionTitle = (title: string) => {
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y - 5, 182, 8, "F");
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text(title, 17, y);
    y += 8;
  };

  const addLine = (label: string, value: string) => {
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`${label}:`, 16, y);
    doc.setTextColor(15, 23, 42);
    const wrapped = doc.splitTextToSize(value, 125);
    doc.text(wrapped, 68, y);
    y += Math.max(6, wrapped.length * 5);
  };

  addSectionTitle("1. BORROWER & PROPERTY SUMMARY (FICTIONAL DEMO RECORD)");
  addLine(
    "Applicant Name",
    `${app.borrower?.firstName} ${app.borrower?.lastName} (${app.borrower?.email})`
  );
  addLine(
    "Property Location",
    `${app.property?.address || ""}, ${app.borrower?.city}, ${
      app.borrower?.province
    }`
  );
  addLine(
    "Mortgage Purpose & Type",
    `${app.purpose} | ${
      app.property?.propertyType || "RESIDENTIAL"
    } | First-Time Buyer: ${app.borrower?.isFirstTimeBuyer ? "Yes" : "No"}`
  );
  addLine(
    "Property Price / Value",
    `$${Number(app.property?.purchasePriceOrValue || 0).toLocaleString()} CAD`
  );
  addLine(
    "Requested Mortgage & Down Payment",
    `Mortgage: $${Number(
      app.requestedMortgageAmount
    ).toLocaleString()} CAD | Down Payment / Equity: $${Number(
      app.downPaymentAmount
    ).toLocaleString()} CAD (${app.downPaymentSource})`
  );

  y += 3;
  addSectionTitle("2. CANADIAN QUALIFICATION & STRESS-TEST RATIOS (AGENT 3)");
  addLine(
    "Debt Service Ratios",
    `GDS: ${app.calculatedGds?.toFixed(2)}% (Guideline <= 39.0%) | TDS: ${app.calculatedTds?.toFixed(
      2
    )}% (Guideline <= 44.0%)`
  );
  addLine(
    "Loan-to-Value (LTV) & Insurance",
    `Base LTV: ${app.calculatedLtv?.toFixed(
      2
    )}% | Default Insurance Required: ${
      app.insuranceRequired
        ? `Yes ($${Number(app.insurancePremium).toLocaleString()} CAD illustrative premium)`
        : "No (Conventional Uninsured)"
    }`
  );
  addLine(
    "OSFI B-20 Stress Test & Payment",
    `Qualifying Stress Rate: ${app.stressTestRate?.toFixed(
      2
    )}% | Est. Contract Monthly P&I: $${Number(
      app.estimatedMonthlyPayment || 0
    ).toLocaleString()} CAD/mo`
  );

  y += 3;
  addSectionTitle("3. DOCUMENT VERIFICATION SUMMARY (AGENT 2)");
  for (const check of (app.documentChecks || []).slice(0, 6)) {
    addLine(check.title, `[${check.status}] ${check.findingSummary}`);
  }

  // Footer Disclaimer
  doc.setFillColor(254, 242, 242);
  doc.rect(14, 262, 182, 22, "F");
  doc.setTextColor(153, 27, 27);
  doc.setFontSize(8.5);
  doc.text(
    "MANDATORY COMPLIANCE & HUMAN-IN-THE-LOOP NOTICE: Fictional demonstration summary generated by AI Mortgage Command Center.",
    17,
    268
  );
  doc.text(
    "AI agents never approve, pre-approve, guarantee, or deny mortgages or submit files externally. Internal review is NOT a mortgage approval.",
    17,
    274
  );

  doc.save(`${app.referenceCode}-Draft-Underwriting-Package.pdf`);
}

