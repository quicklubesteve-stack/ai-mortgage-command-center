"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Download,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Clock,
  Scale,
  UserCheck,
  Building2,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAppContext } from "@/context/AppContext";
import {
  fetchApplicationsWithFallback,
  downloadApplicationPdfClient,
} from "@/lib/api-client";

export default function UnderwritingPackagePage() {
  const router = useRouter();
  const { selectedApplicationId, setSelectedApplicationId } = useAppContext();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await fetchApplicationsWithFallback();
      if (data.success) {
        const list = data.applications || [];
        setApplications(list);
        if (!selectedApplicationId && list.length > 0) {
          setSelectedApplicationId(list[0].id);
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

  const assessment = currentApp?.underwritingAssessment;
  const riskFlags: Array<{
    code: string;
    severity: string;
    title: string;
    explanation: string;
  }> = assessment?.riskFlagsJson ? JSON.parse(assessment.riskFlagsJson) : [];

  const exceptionsList: string[] = assessment?.exceptionsAndMissingJson
    ? JSON.parse(assessment.exceptionsAndMissingJson)
    : [];

  const selectedMatch =
    currentApp?.lenderMatches?.find((m: any) => m.isSelectedForPackage) ||
    currentApp?.lenderMatches?.[0];

  const latestPackage = currentApp?.submissionPackages?.[0];

  return (
    <AppShell
      title="Agent 4: Underwriting Support & Draft Package Builder"
      subtitle="Borrower Summary • GDS/TDS/LTV Ratios • Explainable Risk Flags • Draft Lender Package • Downloadable PDF Summary"
      applications={applications}
      activeAppId={currentApp?.id}
      onSelectAppId={setSelectedApplicationId}
    >
      {/* Mandatory Non-Approval & Non-Submission Guardrail Banner */}
      <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1 max-w-3xl">
          <div className="font-bold text-rose-400 flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>
              Mandatory Agent 4 Governance Boundary (Adapted from package-agent.md)
            </span>
          </div>
          <p className="text-slate-700 dark:text-slate-200">
            <strong>
              Agent 4 never independently approves or denies a mortgage and never submits an application externally.
            </strong>{" "}
            All outputs are assembled strictly as a draft internal underwriting package and routed to Steve&apos;s Human Review Workspace.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {currentApp && (
            <button
              type="button"
              onClick={() => downloadApplicationPdfClient(currentApp)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-slate-950 font-bold px-4 py-2.5 text-xs shadow-md transition"
            >
              <Download className="h-4 w-4" />
              <span>Download Draft PDF Summary</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => router.push("/review")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2.5 text-xs shadow-md transition"
          >
            <span>Route to Human Review (Steve)</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading || !currentApp ? (
        <div className="p-8 text-center text-sm text-slate-400">
          Assembling underwriting support package...
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Column: Executive Summaries, Explainable Risk Flags, Missing Items */}
          <div className="lg:col-span-7 space-y-6">
            {/* Borrower, Property & Debt-Service Executive Dossier */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-mono text-teal-400 font-bold">
                    {currentApp.referenceCode} • Package{" "}
                    {latestPackage?.packageNumber || `PKG-${currentApp.referenceCode}`}
                  </span>
                  <h2 className="text-lg font-bold">
                    Draft Underwriting Support Dossier:{" "}
                    {currentApp.borrower?.firstName} {currentApp.borrower?.lastName}
                  </h2>
                </div>
                <span className="font-mono text-[11px] font-semibold px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {currentApp.statusBadge}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="rounded-xl bg-slate-50 dark:bg-slate-900/70 p-3.5 border border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-teal-400 mb-1">
                    Borrower Financial Summary
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {assessment?.borrowerFinancialSummary}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 dark:bg-slate-900/70 p-3.5 border border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-sky-400 mb-1">
                    Calculated Debt-Service & Stress-Test Summary
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {assessment?.debtServiceSummary}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 dark:bg-slate-900/70 p-3.5 border border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-violet-400 mb-1">
                    Property & Mortgage Structure Summary
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {assessment?.propertyMortgageSummary}
                  </p>
                </div>
              </div>
            </div>

            {/* Explainable Risk Flags */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span>Explainable Underwriting Risk Flags ({riskFlags.length})</span>
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  Deterministic Rule Explanations
                </span>
              </div>

              <div className="space-y-3">
                {riskFlags.map((rf, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl border p-3.5 text-xs ${
                      rf.severity === "HIGH"
                        ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
                        : rf.severity === "MEDIUM"
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                        : "border-sky-500/40 bg-sky-500/10 text-sky-200"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>{rf.title}</span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-black/30">
                        {rf.severity} • {rf.code}
                      </span>
                    </div>
                    <p className="mt-1 opacity-90 leading-relaxed">
                      {rf.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Lender Program Comparison Table */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold">
                  Lender Program Comparison Matrix (5 Fictional Lenders)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-400 font-mono text-[10px] uppercase">
                      <th className="py-2.5 px-4">Rank</th>
                      <th className="py-2.5 px-4">Fictional Lender & Product</th>
                      <th className="py-2.5 px-4">Illustrative Rate</th>
                      <th className="py-2.5 px-4">Est. Payment</th>
                      <th className="py-2.5 px-4">Fit Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70">
                    {currentApp.lenderMatches?.map((m: any) => (
                      <tr
                        key={m.id}
                        className={
                          m.isSelectedForPackage ? "bg-teal-500/10 font-semibold" : ""
                        }
                      >
                        <td className="py-2.5 px-4 font-mono">#{m.rankOrder}</td>
                        <td className="py-2.5 px-4">
                          <div>{m.lenderProduct?.lenderName}</div>
                          <div className="text-[11px] text-slate-400">
                            {m.lenderProduct?.productName}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-teal-400">
                          {m.lenderProduct?.illustrativeRatePct}%
                        </td>
                        <td className="py-2.5 px-4 font-mono">
                          ${Number(m.estimatedMonthlyPayment).toLocaleString()}/mo
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11px]">
                          {m.fitStatus}{" "}
                          {m.isSelectedForPackage ? "★ Target" : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Draft Package Summary, Document Checklist Status, Missing Info & Audit Trail */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-teal-500/40 bg-white dark:bg-[#0c1426] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-teal-400" />
                  <span>Draft Lender Submission Package</span>
                </h3>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-teal-500/20 text-teal-300">
                  {latestPackage?.packageStatus || "DRAFT_INTERNAL_ONLY"}
                </span>
              </div>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3.5 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Package ID:</span>
                  <span className="font-mono font-bold">
                    {latestPackage?.packageNumber || `PKG-${currentApp.referenceCode}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Fictional Lender:</span>
                  <span className="font-semibold text-teal-400 text-right">
                    {selectedMatch?.lenderProduct?.lenderName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Product:</span>
                  <span className="text-right">
                    {selectedMatch?.lenderProduct?.productName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Est. Monthly P&I:</span>
                  <span className="font-mono font-bold">
                    $
                    {Number(
                      selectedMatch?.estimatedMonthlyPayment ||
                        currentApp.estimatedMonthlyPayment
                    ).toLocaleString()}{" "}
                    CAD/mo
                  </span>
                </div>
              </div>

              {/* Document Status Summary */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300">
                  Document Checklist Status ({currentApp.documentChecks?.length || 0}{" "}
                  Items):
                </div>
                <div className="space-y-1.5">
                  {currentApp.documentChecks?.map((dc: any) => (
                    <div
                      key={dc.id}
                      className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900/70"
                    >
                      <span className="truncate pr-2">{dc.title}</span>
                      <span
                        className={`font-mono text-[10px] shrink-0 ${
                          dc.status === "VERIFIED_DEMO"
                            ? "text-emerald-400"
                            : dc.status === "PENDING_MANUAL_REVIEW"
                            ? "text-sky-400"
                            : "text-amber-400 font-bold"
                        }`}
                      >
                        {dc.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing Information & Exceptions */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                <div className="font-bold text-amber-400">
                  Missing Information, Conditions & Exceptions:
                </div>
                <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                  {exceptionsList.map((ex, i) => (
                    <li key={i}>• {ex}</li>
                  ))}
                </ul>
              </div>

              {/* Download PDF Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => downloadApplicationPdfClient(currentApp)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-sky-500 hover:from-violet-400 hover:to-sky-400 text-slate-950 font-bold py-3 px-4 text-xs shadow-md transition"
                >
                  <Download className="h-4 w-4" />
                  <span>
                    Download Complete Draft PDF Summary ({currentApp.referenceCode})
                  </span>
                </button>
              </div>
            </div>

            {/* Human Review Notes & History */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-5 space-y-3 text-xs">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-teal-400" />
                <span>Human Review Notes & Decision History</span>
              </h3>
              {currentApp.reviewDecisions?.length === 0 ? (
                <p className="text-slate-400">
                  No human review actions recorded yet on this file. Click &quot;Route to Human Review (Steve)&quot; to record an internal review action.
                </p>
              ) : (
                <div className="space-y-2">
                  {currentApp.reviewDecisions?.map((rd: any) => (
                    <div
                      key={rd.id}
                      className="rounded-xl bg-teal-500/10 border border-teal-500/30 p-3 space-y-1"
                    >
                      <div className="font-bold text-teal-300 flex justify-between">
                        <span>{rd.action}</span>
                        <span className="font-mono text-[10px]">
                          {rd.reviewerName}
                        </span>
                      </div>
                      <p className="text-slate-300">{rd.notes}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
