"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  ArrowRight,
  Edit3,
  Save,
  ShieldAlert,
  Building2,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAppContext } from "@/context/AppContext";
import {
  DEFAULT_CANADIAN_POLICY_CONFIG,
  CanadianPolicyConfig,
  calculateAffordability,
  calculateAmortizationComparison,
} from "@/lib/mortgage-calculators";
import {
  evaluateApplicationQualificationAndLenders,
  FictionalLenderCriteria,
} from "@/lib/agent-services";
import {
  fetchApplicationsWithFallback,
  patchApplicationWithFallback,
  patchLenderWithFallback,
} from "@/lib/api-client";

export default function QualificationPage() {
  const router = useRouter();
  const { activeRole, selectedApplicationId, setSelectedApplicationId } =
    useAppContext();
  const [applications, setApplications] = useState<any[]>([]);
  const [lenderProducts, setLenderProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Configurable Dated Canadian Policy Assumptions state
  const [policyConfig, setPolicyConfig] = useState<CanadianPolicyConfig>(
    DEFAULT_CANADIAN_POLICY_CONFIG
  );

  // Editable Lender Criteria modal/inline state
  const [editingLenderId, setEditingLenderId] = useState<string | null>(null);
  const [editLenderForm, setEditLenderForm] = useState<{
    illustrativeRatePct: number;
    minCreditScore: number;
    maxGdsPct: number;
    maxTdsPct: number;
    maxLtvPct: number;
    acceptsSelfEmployed: boolean;
  }>({
    illustrativeRatePct: 4.64,
    minCreditScore: 700,
    maxGdsPct: 39,
    maxTdsPct: 44,
    maxLtvPct: 95,
    acceptsSelfEmployed: true,
  });
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await fetchApplicationsWithFallback();
      if (data.success) {
        setApplications(data.applications || []);
        setLenderProducts(data.lenderProducts || []);
        if (!selectedApplicationId && data.applications?.length > 0) {
          setSelectedApplicationId(data.applications[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const currentApp =
    applications.find((a) => a.id === selectedApplicationId) || applications[0];

  const mappedLenders: FictionalLenderCriteria[] = lenderProducts.map((l) => ({
    code: l.code,
    lenderName: l.lenderName,
    productName: l.productName,
    lenderCategory: l.lenderCategory,
    rateType: l.rateType as "FIXED" | "VARIABLE",
    termYears: l.termYears,
    maxAmortization: l.maxAmortization,
    illustrativeRatePct: l.illustrativeRatePct,
    minCreditScore: l.minCreditScore,
    maxGdsPct: l.maxGdsPct,
    maxTdsPct: l.maxTdsPct,
    maxLtvPct: l.maxLtvPct,
    minLoanCad: l.minLoanCad,
    maxLoanCad: l.maxLoanCad,
    acceptsSelfEmployed: l.acceptsSelfEmployed,
    requiresInsured: l.requiresInsured,
    allowsRefinance: l.allowsRefinance,
    stressTestRule: l.stressTestRule,
    prepaymentPrivilege: l.prepaymentPrivilege,
    keyConditions: JSON.parse(l.keyConditionsJson || "[]"),
    limitationsNote: l.limitationsNote,
    policyEffectiveDate: l.policyEffectiveDate,
  }));

  const hasBlockingDocIssues = Boolean(
    currentApp?.documentChecks?.some(
      (d: any) => d.status === "MISSING" || d.status === "INCONSISTENT"
    )
  );

  const qualificationResult = currentApp
    ? evaluateApplicationQualificationAndLenders(
        {
          purpose: currentApp.purpose || "PURCHASE",
          purchasePriceOrValue:
            Number(currentApp.property?.purchasePriceOrValue) || 780000,
          downPaymentAmount: Number(currentApp.downPaymentAmount) || 78000,
          existingMortgageBalance:
            Number(currentApp.existingMortgageBalance) || 0,
          requestedMortgageAmount:
            Number(currentApp.requestedMortgageAmount) || 702000,
          amortizationYears: Number(currentApp.amortizationYears) || 25,
          termYears: Number(currentApp.termYears) || 5,
          ratePreference: currentApp.ratePreference || "FIXED",
          grossAnnualIncome:
            Number(currentApp.incomeRecords?.[0]?.annualizedAmount) || 140000,
          coBorrowerIncome: Number(currentApp.borrower?.coBorrowerIncome) || 0,
          otherMonthlyIncome:
            Number(currentApp.incomeRecords?.[0]?.otherMonthlyAmt) || 0,
          monthlyDebts:
            Number(currentApp.liabilities?.[0]?.monthlyPayment) || 500,
          annualPropertyTax:
            Number(currentApp.property?.annualPropertyTax) || 4000,
          monthlyHeating: Number(currentApp.property?.monthlyHeating) || 150,
          monthlyCondoFees: Number(currentApp.property?.monthlyCondoFees) || 0,
          creditScoreEstimate: currentApp.borrower?.creditScoreEstimate || 720,
          employmentType:
            currentApp.incomeRecords?.[0]?.employmentType ||
            "SALARIED_FULL_TIME",
          isFirstTimeBuyer: Boolean(currentApp.borrower?.isFirstTimeBuyer),
          hasBlockingDocIssues,
        },
        mappedLenders.length > 0 ? mappedLenders : undefined,
        policyConfig
      )
    : null;

  const affordabilityEst =
    currentApp && qualificationResult
      ? calculateAffordability(
          {
            grossAnnualIncome: qualificationResult.totalAnnualIncome,
            downPaymentAmount: Number(currentApp.downPaymentAmount) || 78000,
            monthlyOtherDebts:
              Number(currentApp.liabilities?.[0]?.monthlyPayment) || 500,
            contractRatePct: 4.64,
            amortizationYears: Number(currentApp.amortizationYears) || 25,
            annualPropertyTaxEstimate:
              Number(currentApp.property?.annualPropertyTax) || 4000,
            monthlyHeatingEstimate:
              Number(currentApp.property?.monthlyHeating) || 150,
            monthlyCondoFees:
              Number(currentApp.property?.monthlyCondoFees) || 0,
          },
          policyConfig
        )
      : null;

  const amortComparison =
    currentApp && qualificationResult
      ? calculateAmortizationComparison({
          principal: qualificationResult.totalFinancedMortgage,
          fixedRatePct: 4.64,
          variableRatePct: 4.55,
          amortizationOptionsYears: [15, 20, 25, 30],
          termYears: Number(currentApp.termYears) || 5,
        })
      : null;

  const startEditingLender = (dbLender: any) => {
    setEditingLenderId(dbLender.id);
    setEditLenderForm({
      illustrativeRatePct: dbLender.illustrativeRatePct,
      minCreditScore: dbLender.minCreditScore,
      maxGdsPct: dbLender.maxGdsPct,
      maxTdsPct: dbLender.maxTdsPct,
      maxLtvPct: dbLender.maxLtvPct,
      acceptsSelfEmployed: dbLender.acceptsSelfEmployed,
    });
  };

  const handleSaveLenderCriteria = async (lenderId: string) => {
    setStatusMsg(null);
    const { ok, data } = await patchLenderWithFallback(
      {
        id: lenderId,
        ...editLenderForm,
      },
      activeRole
    );
    if (!ok) {
      setStatusMsg(data.error || "Failed to update lender criteria");
      return;
    }
    setEditingLenderId(null);
    setStatusMsg(
      `Saved updated example criteria for ${data.lender.lenderName} and recalculated matches!`
    );
    await fetchData();
  };

  const handleSelectForPackage = async (match: any) => {
    if (!currentApp) return;
    const dbMatch = currentApp.lenderMatches?.find(
      (m: any) => m.lenderProduct?.code === match.lender.code
    );
    if (!dbMatch) return;
    await patchApplicationWithFallback(
      currentApp.id,
      {
        action: "SELECT_LENDER_MATCH",
        matchId: dbMatch.id,
        targetLenderName: match.lender.lenderName,
        targetProductName: match.lender.productName,
      },
      activeRole
    );
    setStatusMsg(
      `Selected "${match.lender.lenderName} — ${match.lender.productName}" for Agent 4 Draft Package.`
    );
    await fetchData();
  };

  return (
    <AppShell
      title="Agent 3: Canadian Mortgage Qualification & Fictional Lender Matching"
      subtitle="GDS / TDS / LTV • OSFI B-20 Stress Test • Default Insurance • 5 Editable Fictional Lender Profiles"
      applications={applications}
      activeAppId={currentApp?.id}
      onSelectAppId={setSelectedApplicationId}
    >
      {/* Governance & Policy vs Lender Separation Notice */}
      <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4 text-xs flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1 max-w-3xl">
          <div className="font-bold text-sky-400 flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>
              Regulatory Guidelines vs. Fictional Lender Overlays (Adapted from lender-match-agent.md)
            </span>
          </div>
          <p className="text-slate-700 dark:text-slate-300">
            Agent 3 separates{" "}
            <strong>
              configurable dated Canadian regulatory assumptions (Effective Date:{" "}
              {policyConfig.effectiveDate})
            </strong>{" "}
            from individual fictional lender product rules. No live rates, actual lender eligibility decisions, or guarantees of financing are produced.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/underwriting")}
          className="rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2.5 text-xs inline-flex items-center gap-1.5 shrink-0"
        >
          <span>Proceed to Agent 4: Underwriting Package</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {statusMsg && (
        <div
          role="status"
          className="rounded-xl border border-teal-500/40 bg-teal-500/15 px-4 py-3 text-xs text-teal-300 font-medium"
        >
          {statusMsg}
        </div>
      )}

      {/* Configurable Dated Canadian Policy Assumptions Panel */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-teal-400" />
            <h2 className="text-sm font-bold">
              Configurable Dated Canadian Mortgage Policy Assumptions
            </h2>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-teal-400">
            Policy Baseline Date: {policyConfig.effectiveDate} (Editable — Never Hardcoded as Permanent)
          </span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Policy Effective Date
            </label>
            <input
              type="date"
              value={policyConfig.effectiveDate}
              onChange={(e) =>
                setPolicyConfig({ ...policyConfig, effectiveDate: e.target.value })
              }
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              OSFI Benchmark Floor (%)
            </label>
            <input
              type="number"
              step="0.05"
              value={policyConfig.benchmarkFloorRatePct}
              onChange={(e) =>
                setPolicyConfig({
                  ...policyConfig,
                  benchmarkFloorRatePct: Number(e.target.value) || 5.25,
                })
              }
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Stress Buffer (+% over Contract)
            </label>
            <input
              type="number"
              step="0.1"
              value={policyConfig.stressTestBufferPct}
              onChange={(e) =>
                setPolicyConfig({
                  ...policyConfig,
                  stressTestBufferPct: Number(e.target.value) || 2.0,
                })
              }
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Standard Max GDS / TDS (%)
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="number"
                value={policyConfig.standardMaxGdsPct}
                onChange={(e) =>
                  setPolicyConfig({
                    ...policyConfig,
                    standardMaxGdsPct: Number(e.target.value) || 39,
                  })
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 font-mono"
              />
              <input
                type="number"
                value={policyConfig.standardMaxTdsPct}
                onChange={(e) =>
                  setPolicyConfig({
                    ...policyConfig,
                    standardMaxTdsPct: Number(e.target.value) || 44,
                  })
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Insured Price Cap (CAD)
            </label>
            <input
              type="number"
              step="50000"
              value={policyConfig.maxInsuredPriceCad}
              onChange={(e) =>
                setPolicyConfig({
                  ...policyConfig,
                  maxInsuredPriceCad: Number(e.target.value) || 1500000,
                })
              }
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 font-mono"
            />
          </div>
        </div>
      </div>

      {loading || !currentApp || !qualificationResult ? (
        <div className="p-8 text-center text-sm text-slate-400">
          Calculating Canadian mortgage qualification ratios...
        </div>
      ) : (
        <>
          {/* Qualification Metrics Breakdown Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-4 space-y-1.5">
              <div className="text-xs text-slate-400">
                Gross Debt Service (GDS) Ratio
              </div>
              <div
                className={`text-2xl font-extrabold font-mono ${
                  qualificationResult.gdsTds.passesStandardGds
                    ? "text-teal-400"
                    : "text-amber-400"
                }`}
              >
                {qualificationResult.gdsTds.gdsPct}%
              </div>
              <div className="text-[11px] text-slate-400">
                Regulatory Baseline Cap: &le;{" "}
                {policyConfig.standardMaxGdsPct}% ($
                {qualificationResult.gdsTds.gdsMonthlyHousingCosts.toLocaleString()}
                /mo housing)
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-4 space-y-1.5">
              <div className="text-xs text-slate-400">
                Total Debt Service (TDS) Ratio
              </div>
              <div
                className={`text-2xl font-extrabold font-mono ${
                  qualificationResult.gdsTds.passesStandardTds
                    ? "text-sky-400"
                    : "text-amber-400"
                }`}
              >
                {qualificationResult.gdsTds.tdsPct}%
              </div>
              <div className="text-[11px] text-slate-400">
                Regulatory Baseline Cap: &le;{" "}
                {policyConfig.standardMaxTdsPct}% ($
                {qualificationResult.gdsTds.tdsMonthlyTotalObligations.toLocaleString()}
                /mo total)
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-4 space-y-1.5">
              <div className="text-xs text-slate-400">
                Base LTV & Default Insurance
              </div>
              <div className="text-2xl font-extrabold font-mono text-violet-400">
                {qualificationResult.downLtv.baseLtvPct}% LTV
              </div>
              <div className="text-[11px] text-slate-400">
                {qualificationResult.downLtv.insuranceRequired
                  ? `Insured (+$${qualificationResult.downLtv.insurancePremiumAmount.toLocaleString()} CAD)`
                  : "Uninsured Conventional"}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-4 space-y-1.5">
              <div className="text-xs text-slate-400">
                Illustrative Affordability Estimate
              </div>
              <div className="text-2xl font-extrabold font-mono text-emerald-400">
                $
                {(
                  affordabilityEst?.estimatedMaxPurchasePrice || 0
                ).toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400">
                Limiting Factor: {affordabilityEst?.limitingFactor}
              </div>
            </div>
          </div>

          {/* Fixed vs Variable & Amortization Comparison Snapshot */}
          {amortComparison && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold">
                  Amortization & Fixed ({amortComparison.fixedRatePct}%) vs. Variable (
                  {amortComparison.variableRatePct}%) Scenario Comparison
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  Total Financed Mortgage: $
                  {qualificationResult.totalFinancedMortgage.toLocaleString()} CAD
                </span>
              </div>
              <div className="grid sm:grid-cols-4 gap-3 text-xs">
                {amortComparison.scenarios.map((s) => (
                  <div
                    key={s.amortizationYears}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-3 space-y-1"
                  >
                    <div className="font-bold text-teal-400">
                      {s.amortizationYears}-Year Amortization
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-400">Fixed Monthly:</span>
                      <span>${s.fixedMonthlyPayment.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-400">Variable Monthly:</span>
                      <span>${s.variableMonthlyPayment.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-mono text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                      <span>5-Yr End Balance:</span>
                      <span>${s.balanceEndOfTermFixed.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5 Fictional Canadian Lender Profiles with Editable Criteria */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold">
                  Five Fictional Canadian Lender Profiles (Ranked Product Comparison)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Shows why each fictional product fits or does not fit, estimated payments, missing conditions, limitations, and human review requirements. Click &quot;Edit Example Criteria&quot; on any card to adjust rules live.
                </p>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                ILLUSTRATIVE EXAMPLE RATES ONLY — NO LIVE LENDER DECISIONS
              </span>
            </div>

            <div className="space-y-4">
              {qualificationResult.matches.map((match) => {
                const dbLender = lenderProducts.find(
                  (lp) => lp.code === match.lender.code
                );
                const dbMatch = currentApp.lenderMatches?.find(
                  (m: any) => m.lenderProduct?.code === match.lender.code
                );
                const isSelected = Boolean(dbMatch?.isSelectedForPackage);
                const isEditing = editingLenderId === dbLender?.id;

                const statusBadgeStyle =
                  match.fitStatus === "STRONG_FIT"
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                    : match.fitStatus === "CONDITIONAL_FIT"
                    ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
                    : "bg-rose-500/15 text-rose-300 border-rose-500/40";

                return (
                  <div
                    key={match.lender.code}
                    className={`rounded-2xl border p-5 space-y-4 transition ${
                      isSelected
                        ? "border-teal-500 bg-teal-500/5 dark:bg-[#0e1b33]"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426]"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300">
                            Rank #{match.rankOrder} • Fit Score: {match.fitScore}/100
                          </span>
                          <span
                            className={`font-mono text-[11px] font-semibold px-2.5 py-0.5 rounded border ${statusBadgeStyle}`}
                          >
                            {match.fitStatus}
                          </span>
                          {isSelected && (
                            <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded bg-teal-500 text-slate-950">
                              SELECTED FOR DRAFT PACKAGE
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold flex items-center gap-2 pt-1">
                          <Building2 className="h-4 w-4 text-sky-400" />
                          <span>
                            {match.lender.lenderName} — {match.lender.productName}
                          </span>
                        </h3>
                        <p className="text-xs text-slate-400">
                          Category: {match.lender.lenderCategory} • Term:{" "}
                          {match.lender.termYears}-Yr {match.lender.rateType} • Max
                          Amort: {match.lender.maxAmortization} Yrs • Prepayment:{" "}
                          {match.lender.prepaymentPrivilege}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-right px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <div className="text-[10px] text-slate-400 uppercase font-mono">
                            Illustrative Rate & Est. Payment
                          </div>
                          <div className="text-sm font-extrabold font-mono text-teal-400">
                            {match.lender.illustrativeRatePct}% • $
                            {match.estimatedMonthlyPayment.toLocaleString()}/mo
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Stress ({match.qualifyingRateUsed}%): $
                            {match.stressTestMonthlyPayment.toLocaleString()}/mo
                          </div>
                        </div>

                        {dbLender && (
                          <button
                            type="button"
                            onClick={() =>
                              isEditing
                                ? setEditingLenderId(null)
                                : startEditingLender(dbLender)
                            }
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-2 text-xs font-medium"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>
                              {isEditing
                                ? "Cancel Edit"
                                : "Edit Example Criteria"}
                            </span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleSelectForPackage(match)}
                          className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                            isSelected
                              ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                              : "bg-teal-500 hover:bg-teal-400 text-slate-950"
                          }`}
                        >
                          {isSelected
                            ? "Target for Draft Package"
                            : "Select for Draft Package"}
                        </button>
                      </div>
                    </div>

                    {/* Editable Lender Criteria Drawer */}
                    {isEditing && dbLender && (
                      <div className="rounded-xl border border-teal-500/40 bg-slate-100 dark:bg-slate-900 p-4 space-y-3 text-xs">
                        <div className="font-bold text-teal-400">
                          Edit Fictional Lender Criteria ({match.lender.lenderName})
                        </div>
                        <div className="grid sm:grid-cols-6 gap-3">
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">
                              Illustrative Rate (%)
                            </label>
                            <input
                              type="number"
                              step="0.05"
                              value={editLenderForm.illustrativeRatePct}
                              onChange={(e) =>
                                setEditLenderForm({
                                  ...editLenderForm,
                                  illustrativeRatePct: Number(e.target.value),
                                })
                              }
                              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">
                              Min Credit Score
                            </label>
                            <input
                              type="number"
                              value={editLenderForm.minCreditScore}
                              onChange={(e) =>
                                setEditLenderForm({
                                  ...editLenderForm,
                                  minCreditScore: Number(e.target.value),
                                })
                              }
                              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">
                              Max GDS (%)
                            </label>
                            <input
                              type="number"
                              value={editLenderForm.maxGdsPct}
                              onChange={(e) =>
                                setEditLenderForm({
                                  ...editLenderForm,
                                  maxGdsPct: Number(e.target.value),
                                })
                              }
                              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">
                              Max TDS (%)
                            </label>
                            <input
                              type="number"
                              value={editLenderForm.maxTdsPct}
                              onChange={(e) =>
                                setEditLenderForm({
                                  ...editLenderForm,
                                  maxTdsPct: Number(e.target.value),
                                })
                              }
                              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">
                              Max LTV (%)
                            </label>
                            <input
                              type="number"
                              value={editLenderForm.maxLtvPct}
                              onChange={(e) =>
                                setEditLenderForm({
                                  ...editLenderForm,
                                  maxLtvPct: Number(e.target.value),
                                })
                              }
                              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono"
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => handleSaveLenderCriteria(dbLender.id)}
                              className="w-full rounded-lg bg-teal-500 text-slate-950 font-bold py-1.5 px-3 inline-flex items-center justify-center gap-1"
                            >
                              <Save className="h-3.5 w-3.5" />
                              <span>Save Criteria</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Fit Reasons, Risks, Conditions & Limitations */}
                    <div className="grid md:grid-cols-3 gap-4 text-xs pt-2 border-t border-slate-200 dark:border-slate-800/80">
                      <div className="space-y-1.5">
                        <div className="font-bold text-emerald-400">
                          Why This Product Fits:
                        </div>
                        {match.reasonsFit.map((r, idx) => (
                          <div key={idx} className="flex items-start gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1.5">
                        <div className="font-bold text-amber-400">
                          Why It May Not Fit / Risk Factors:
                        </div>
                        {match.reasonsRiskOrMiss.length === 0 ? (
                          <p className="text-slate-400">
                            Meets all quantitative example criteria for this fictional product.
                          </p>
                        ) : (
                          match.reasonsRiskOrMiss.map((r, idx) => (
                            <div key={idx} className="flex items-start gap-1.5">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                              <span>{r}</span>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <div className="font-bold text-sky-400">
                          Conditions, Limitations & Human Review:
                        </div>
                        <ul className="space-y-1 text-[11px] text-slate-300">
                          {match.missingConditions.slice(0, 3).map((c, idx) => (
                            <li key={idx}>• {c}</li>
                          ))}
                        </ul>
                        <p className="text-[11px] text-slate-400 italic pt-1">
                          <strong>Limitation:</strong> {match.lender.limitationsNote}
                        </p>
                        <p className="text-[11px] text-violet-300 font-medium">
                          <strong>Human Review:</strong>{" "}
                          {match.humanReviewRequirement}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
