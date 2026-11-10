"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Compass,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Download,
  UserCheck,
  ShieldAlert,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAppContext } from "@/context/AppContext";
import {
  fetchApplicationsWithFallback,
  patchApplicationWithFallback,
  downloadApplicationPdfClient,
} from "@/lib/api-client";

const GUIDED_STEPS = [
  {
    id: 0,
    code: "INTAKE",
    title: "Step 1: New Borrower & AI Intake (Agent 1)",
    agentCardRef: "Adapted from intake-agent.md",
    workspaceHref: "/intake",
    explanation:
      "Agent 1 captures the borrower's Canadian mortgage profile—province, property purchase/refinance/renewal purpose, first-time buyer status, employment, income, liabilities, down payment source, and rate preference—and validates missing fields without ever guessing or making approval decisions.",
  },
  {
    id: 1,
    code: "DOCUMENT_CHECK",
    title: "Step 2: Document Verification Queue (Agent 2)",
    agentCardRef: "Adapted from document-agent.md",
    workspaceHref: "/documents",
    explanation:
      "Agent 2 inspects the required Canadian supporting documents (Pay Stubs, Letter of Employment, CRA T1/NOA, 90-Day Down Payment Bank Statements, Purchase Agreement/Mortgage Statement, and Government ID placeholder) and flags missing or inconsistent items for manual review.",
  },
  {
    id: 2,
    code: "QUALIFICATION",
    title: "Step 3: Canadian Mortgage Qualification Math (Agent 3A)",
    agentCardRef: "Adapted from lender-match-agent.md (Part 1)",
    workspaceHref: "/qualification",
    explanation:
      "Agent 3 calculates Gross Debt Service (GDS), Total Debt Service (TDS), Loan-to-Value (LTV), semi-annually compounded monthly payments, default insurance premiums, and the OSFI B-20 stress test using configurable dated Canadian policy assumptions (2026-01-01 baseline).",
  },
  {
    id: 3,
    code: "LENDER_COMPARISON",
    title: "Step 4: Five Fictional Lender Comparison (Agent 3B)",
    agentCardRef: "Adapted from lender-match-agent.md (Part 2)",
    workspaceHref: "/qualification",
    explanation:
      "Agent 3 compares the borrower's stress-tested ratios and credit profile against 5 fictional Canadian lender products (Prime A-Bank, Monoline, Credit Union, Alt-A B-Lender, and Equity Specialist), explaining why each fits or misses.",
  },
  {
    id: 4,
    code: "DRAFT_PACKAGE",
    title: "Step 5: Underwriting Support & Draft Package (Agent 4)",
    agentCardRef: "Adapted from package-agent.md",
    workspaceHref: "/underwriting",
    explanation:
      "Agent 4 synthesizes the financial summary, GDS/TDS/LTV ratios, document status, explainable risk flags, and selected lender option into a draft internal underwriting package with a downloadable PDF summary—never submitting externally.",
  },
  {
    id: 5,
    code: "HUMAN_REVIEW",
    title: "Step 6: Human Underwriter Review (Steve)",
    agentCardRef: "Human-in-the-Loop Governance (AGENTS.md)",
    workspaceHref: "/review",
    explanation:
      "Authorized Mortgage Broker / Internal Underwriter (Steve) inspects the complete file, records reviewer notes, requests missing info, returns for correction, or marks the draft as internally reviewed (which is explicitly not a final mortgage approval).",
  },
];

export default function GuidedDemoPage() {
  const { activeRole, selectedApplicationId, setSelectedApplicationId } =
    useAppContext();
  const [applications, setApplications] = useState<any[]>([]);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [savingState, setSavingState] = useState<boolean>(false);
  const [stepBanner, setStepBanner] = useState<string | null>(null);

  const fetchApplications = async () => {
    const data = await fetchApplicationsWithFallback();
    if (data.success) {
      const list = data.applications || [];
      setApplications(list);
      if (!selectedApplicationId && list.length > 0) {
        setSelectedApplicationId(list[0].id);
      }
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const currentApp =
    applications.find((a) => a.id === selectedApplicationId) || applications[0];

  const currentStepDef = GUIDED_STEPS[activeStep];

  const handleStepChangeAndSave = async (nextIndex: number) => {
    const clamped = Math.max(0, Math.min(GUIDED_STEPS.length - 1, nextIndex));
    setActiveStep(clamped);
    setStepBanner(null);

    if (currentApp) {
      setSavingState(true);
      try {
        const targetStage = GUIDED_STEPS[clamped].code;
        await patchApplicationWithFallback(
          currentApp.id,
          {
            action: "UPDATE_STAGE",
            stage: targetStage,
          },
          activeRole
        );
        setStepBanner(
          `Saved workflow state "${targetStage}" for ${currentApp.referenceCode}.`
        );
        await fetchApplications();
      } finally {
        setSavingState(false);
      }
    }
  };

  return (
    <AppShell
      title="Interactive 6-Step Guided Demo Walkthrough"
      subtitle="New Borrower -> Intake -> Document Check -> Qualification -> Lender Comparison -> Draft Package -> Human Review"
      applications={applications}
      activeAppId={currentApp?.id}
      onSelectAppId={setSelectedApplicationId}
    >
      {/* Scenario Switcher Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" />
            <span>
              Choose Any of the 5 Fictional Canadian Applications to Walk Through:
            </span>
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Progress is persisted in SQLite at each step
          </span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {applications.map((app) => {
            const isSelected = app.id === currentApp?.id;
            return (
              <button
                key={app.id}
                type="button"
                onClick={() => setSelectedApplicationId(app.id)}
                className={`text-left p-3 rounded-xl border transition ${
                  isSelected
                    ? "bg-teal-500/15 border-teal-400 font-semibold"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:border-teal-500/40"
                }`}
              >
                <div className="font-mono text-[11px] text-teal-400 font-bold">
                  {app.referenceCode}
                </div>
                <div className="text-xs font-bold truncate mt-0.5">
                  {app.borrower?.firstName} {app.borrower?.lastName}
                </div>
                <div className="text-[10px] text-slate-400">
                  {app.purpose} • {app.borrower?.city}, {app.borrower?.province}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive 6-Step Progress Stepper */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {GUIDED_STEPS.map((step, idx) => {
          const isCurrent = idx === activeStep;
          const isCompleted = idx < activeStep;
          return (
            <button
              key={step.code}
              type="button"
              onClick={() => handleStepChangeAndSave(idx)}
              className={`text-left p-3 rounded-xl border transition flex flex-col justify-between ${
                isCurrent
                  ? "bg-gradient-to-br from-teal-500/25 to-sky-500/15 border-teal-400 shadow-md"
                  : isCompleted
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : "bg-white dark:bg-[#0c1426] border-slate-200 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span
                  className={
                    isCurrent
                      ? "text-teal-300 font-bold"
                      : isCompleted
                      ? "text-emerald-400"
                      : "text-slate-400"
                  }
                >
                  STEP {idx + 1} OF 6
                </span>
                {isCompleted && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                )}
              </div>
              <div className="text-xs font-bold mt-1 leading-snug">
                {step.title.replace(/^Step \d:\s*/, "")}
              </div>
            </button>
          );
        })}
      </div>

      {stepBanner && (
        <div
          role="status"
          className="rounded-xl border border-teal-500/40 bg-teal-500/15 px-4 py-2.5 text-xs text-teal-300"
        >
          {stepBanner}
        </div>
      )}

      {/* Active Step Walkthrough Content */}
      {currentApp && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-6 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="space-y-1 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-teal-500/20 text-teal-300">
                  {currentStepDef.agentCardRef}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Active File: {currentApp.referenceCode} (Saved Stage:{" "}
                  {currentApp.stage})
                </span>
              </div>
              <h2 className="text-xl font-bold pt-1">{currentStepDef.title}</h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {currentStepDef.explanation}
              </p>
            </div>

            <Link
              href={currentStepDef.workspaceHref}
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 px-4 py-2.5 text-xs font-semibold transition shrink-0"
            >
              <span>Open Full Stage Workspace</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Step-Specific Live Data Snapshot */}
          {activeStep === 0 && (
            <div className="grid sm:grid-cols-3 gap-4 text-xs">
              <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 border border-slate-800 space-y-1">
                <div className="text-slate-400">Borrower & Location</div>
                <div className="text-base font-bold">
                  {currentApp.borrower?.firstName}{" "}
                  {currentApp.borrower?.lastName}
                </div>
                <div className="text-slate-400">
                  {currentApp.property?.address}, {currentApp.borrower?.city},{" "}
                  {currentApp.borrower?.province}
                </div>
              </div>
              <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 border border-slate-800 space-y-1">
                <div className="text-slate-400">Purpose & Property Value</div>
                <div className="text-base font-bold font-mono text-teal-400">
                  {currentApp.purpose} • $
                  {Number(
                    currentApp.property?.purchasePriceOrValue
                  ).toLocaleString()}{" "}
                  CAD
                </div>
                <div className="text-slate-400">
                  Down Payment / Equity: $
                  {Number(currentApp.downPaymentAmount).toLocaleString()} (
                  {currentApp.downPaymentSource})
                </div>
              </div>
              <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 border border-slate-800 space-y-1">
                <div className="text-slate-400">Employment & Income</div>
                <div className="text-base font-bold font-mono text-sky-400">
                  $
                  {Number(
                    currentApp.incomeRecords?.[0]?.annualizedAmount
                  ).toLocaleString()}{" "}
                  CAD/yr
                </div>
                <div className="text-slate-400">
                  {currentApp.incomeRecords?.[0]?.employerName} (
                  {currentApp.incomeRecords?.[0]?.employmentType})
                </div>
              </div>
            </div>
          )}

          {activeStep === 1 && (
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              {currentApp.documentChecks?.map((dc: any) => (
                <div
                  key={dc.id}
                  className="rounded-xl bg-slate-100 dark:bg-slate-900 p-3.5 border border-slate-800 space-y-1"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>{dc.title}</span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-teal-500/20 text-teal-300">
                      {dc.status}
                    </span>
                  </div>
                  <p className="text-slate-400">{dc.findingSummary}</p>
                </div>
              ))}
            </div>
          )}

          {activeStep === 2 && (
            <div className="grid sm:grid-cols-4 gap-4 text-xs">
              <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 border border-slate-800">
                <div className="text-slate-400">Stress-Tested GDS</div>
                <div className="text-2xl font-extrabold font-mono text-teal-400 mt-1">
                  {currentApp.calculatedGds?.toFixed(1)}%
                </div>
                <div className="text-[11px] text-slate-400">
                  Regulatory Cap: &le; 39.0%
                </div>
              </div>
              <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 border border-slate-800">
                <div className="text-slate-400">Stress-Tested TDS</div>
                <div className="text-2xl font-extrabold font-mono text-sky-400 mt-1">
                  {currentApp.calculatedTds?.toFixed(1)}%
                </div>
                <div className="text-[11px] text-slate-400">
                  Regulatory Cap: &le; 44.0%
                </div>
              </div>
              <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 border border-slate-800">
                <div className="text-slate-400">Base LTV & Insurance</div>
                <div className="text-2xl font-extrabold font-mono text-violet-400 mt-1">
                  {currentApp.calculatedLtv?.toFixed(1)}%
                </div>
                <div className="text-[11px] text-slate-400">
                  {currentApp.insuranceRequired
                    ? `Insured (+$${Number(
                        currentApp.insurancePremium
                      ).toLocaleString()})`
                    : "Uninsured Conventional"}
                </div>
              </div>
              <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 border border-slate-800">
                <div className="text-slate-400">OSFI B-20 Qualifying Rate</div>
                <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-1">
                  {currentApp.stressTestRate?.toFixed(2)}%
                </div>
                <div className="text-[11px] text-slate-400">
                  Est. Contract P&I: $
                  {Number(currentApp.estimatedMonthlyPayment).toLocaleString()}
                  /mo
                </div>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="space-y-2.5 text-xs">
              {currentApp.lenderMatches?.map((m: any) => (
                <div
                  key={m.id}
                  className="rounded-xl bg-slate-100 dark:bg-slate-900 p-3.5 border border-slate-800 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-bold text-sm">
                      Rank #{m.rankOrder}: {m.lenderProduct?.lenderName} —{" "}
                      {m.lenderProduct?.productName}
                    </div>
                    <div className="text-slate-400">
                      Illustrative Rate: {m.lenderProduct?.illustrativeRatePct}%
                      • Fit Score: {m.fitScore}/100 ({m.fitStatus})
                    </div>
                  </div>
                  <div className="font-mono font-bold text-teal-400">
                    ${Number(m.estimatedMonthlyPayment).toLocaleString()} CAD/mo
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeStep === 4 && (
            <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 border border-slate-800 space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-bold text-sm text-teal-400">
                  Draft Underwriting Package:{" "}
                  {currentApp.submissionPackages?.[0]?.packageNumber ||
                    `PKG-${currentApp.referenceCode}`}
                </div>
                <button
                  type="button"
                  onClick={() => downloadApplicationPdfClient(currentApp)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500 text-slate-950 font-bold px-3.5 py-1.5 text-xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Draft PDF Summary</span>
                </button>
              </div>
              <p className="text-slate-300">
                {currentApp.underwritingAssessment?.borrowerFinancialSummary}
              </p>
              <p className="text-amber-300 font-medium">
                {currentApp.underwritingAssessment?.humanReviewRecommendation}
              </p>
            </div>
          )}

          {activeStep === 5 && (
            <div className="rounded-xl bg-teal-500/10 border border-teal-500/40 p-4 space-y-3 text-xs">
              <div className="font-bold text-sm text-teal-300 flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                <span>
                  Human Review & Authorization Desk (Steve — Sole Human Reviewer)
                </span>
              </div>
              <p className="text-slate-300">
                Current Status Badge: <strong>{currentApp.statusBadge}</strong>.
                In the Human Review Workspace, Steve can mark this draft as internally reviewed, request missing documentation, return the file for correction, or prepare it for a future external submission workflow. Internal review completion is explicitly not a final mortgage approval.
              </p>
              <div>
                <Link
                  href="/review"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-500 text-slate-950 font-bold px-4 py-2 text-xs"
                >
                  <span>Open Steve&apos;s Human Review Workspace →</span>
                </Link>
              </div>
            </div>
          )}

          {/* Step Navigation Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              disabled={activeStep === 0 || savingState}
              onClick={() => handleStepChangeAndSave(activeStep - 1)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-xs font-semibold disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous Step</span>
            </button>

            <span className="text-xs font-mono text-slate-400">
              Step {activeStep + 1} of {GUIDED_STEPS.length}
            </span>

            <button
              type="button"
              disabled={activeStep === GUIDED_STEPS.length - 1 || savingState}
              onClick={() => handleStepChangeAndSave(activeStep + 1)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-sky-500 text-slate-950 font-bold px-5 py-2.5 text-xs shadow disabled:opacity-40"
            >
              <span>Save & Advance to Next Step</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
