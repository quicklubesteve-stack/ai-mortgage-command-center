"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileCheck2,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  FileText,
  UserCheck,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAppContext } from "@/context/AppContext";
import {
  fetchApplicationsWithFallback,
  patchApplicationWithFallback,
} from "@/lib/api-client";

export default function DocumentVerificationPage() {
  const router = useRouter();
  const { activeRole, selectedApplicationId, setSelectedApplicationId } =
    useAppContext();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingCheckId, setUploadingCheckId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchApplications = async () => {
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
    fetchApplications();
  }, []);

  const currentApp =
    applications.find((a) => a.id === selectedApplicationId) || applications[0];

  const handleUploadSamplePdf = async (check: any) => {
    if (!currentApp) return;
    setUploadingCheckId(check.id);
    setActionMessage(null);

    const sampleFileName = `${currentApp.borrower?.lastName || "Borrower"}_${
      check.category
    }_Sample_DEMO.pdf`;

    try {
      const { data } = await patchApplicationWithFallback(
        currentApp.id,
        {
          action: "UPLOAD_SAMPLE_DOC",
          checkId: check.id,
          category: check.category,
          fileName: sampleFileName,
          newStatus: "PENDING_MANUAL_REVIEW",
          findingSummary: `Sample PDF "${sampleFileName}" uploaded in Demo Mode. Queued for manual broker/underwriter review (no automated authenticity claim).`,
        },
        activeRole
      );
      if (data.success) {
        setActionMessage(
          `Uploaded sample PDF "${sampleFileName}" for ${check.title}. Status updated to PENDING_MANUAL_REVIEW.`
        );
        await fetchApplications();
      }
    } finally {
      setUploadingCheckId(null);
    }
  };

  const handleManualReviewStateChange = async (
    checkId: string,
    newStatus: string
  ) => {
    if (!currentApp) return;
    setActionMessage(null);
    const { ok, data } = await patchApplicationWithFallback(
      currentApp.id,
      {
        action: "UPDATE_DOC_CHECK",
        checkId,
        status: newStatus,
        discrepancySeverity:
          newStatus === "MISSING"
            ? "BLOCKING"
            : newStatus === "INCONSISTENT"
            ? "WARNING"
            : "NONE",
        reviewerOverrideNote: `Manually set to ${newStatus} by ${activeRole}`,
      },
      activeRole
    );
    if (!ok) {
      setActionMessage(data.error || "Role not authorized to override review status.");
      return;
    }
    setActionMessage(`Updated checklist status to ${newStatus}.`);
    await fetchApplications();
  };

  const checks: any[] = currentApp?.documentChecks || [];
  const missingOrInconsistent = checks.filter(
    (c) => c.status === "MISSING" || c.status === "INCONSISTENT"
  );

  return (
    <AppShell
      title="Agent 2: Document Verification & Discrepancy Queue"
      subtitle="Pay Stubs • Employment Letters • CRA Tax NOA/T1 • 90-Day Down Payment Proof • APS / Mortgage Statements • ID Placeholder"
      applications={applications}
      activeAppId={currentApp?.id}
      onSelectAppId={setSelectedApplicationId}
    >
      {/* Important Compliance & Authenticity Boundary Banner */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1 max-w-3xl">
          <div className="font-bold text-amber-400 flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>
              Document & Identity Verification Boundary (Adapted from document-agent.md)
            </span>
          </div>
          <p className="text-slate-700 dark:text-slate-300">
            In Demo Mode, Agent 2 cross-checks sample PDF metadata against the structured application record and flags missing or inconsistent items.{" "}
            <strong>
              This prototype does not claim cryptographic document authenticity or live government identity verification
            </strong>
            —all items require explicit manual verification by a licensed broker or internal underwriter.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/qualification")}
          className="rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2.5 text-xs inline-flex items-center gap-1.5 shrink-0"
        >
          <span>Proceed to Agent 3: Qualification & Match</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {actionMessage && (
        <div
          role="status"
          className="rounded-xl border border-teal-500/40 bg-teal-500/15 px-4 py-3 text-xs text-teal-300 font-medium"
        >
          {actionMessage}
        </div>
      )}

      {loading || !currentApp ? (
        <div className="p-8 text-center text-sm text-slate-400">
          Loading document checklist...
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Column: Active File Summary & Warnings */}
          <div className="lg:col-span-4 space-y-5">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-5 space-y-3">
              <div className="text-xs font-mono text-teal-400 font-bold">
                {currentApp.referenceCode} • {currentApp.purpose}
              </div>
              <h2 className="text-lg font-bold">
                {currentApp.borrower?.firstName} {currentApp.borrower?.lastName}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {currentApp.property?.address}, {currentApp.borrower?.city},{" "}
                {currentApp.borrower?.province}
              </p>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Declared Income:</span>
                  <span className="font-mono font-semibold">
                    $
                    {Number(
                      currentApp.incomeRecords?.[0]?.annualizedAmount || 0
                    ).toLocaleString()}{" "}
                    CAD/yr
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Employment Type:</span>
                  <span className="font-mono">
                    {currentApp.incomeRecords?.[0]?.employmentType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Down Payment / Equity:</span>
                  <span className="font-mono font-semibold">
                    ${Number(currentApp.downPaymentAmount).toLocaleString()} CAD (
                    {currentApp.downPaymentSource})
                  </span>
                </div>
              </div>
            </div>

            {/* Missing & Inconsistent Document Warnings */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-5 space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span>
                  Missing & Inconsistent Warnings ({missingOrInconsistent.length})
                </span>
              </h3>

              {missingOrInconsistent.length === 0 ? (
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>
                    No missing or inconsistent document warnings on this file.
                  </span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {missingOrInconsistent.map((w) => (
                    <div
                      key={w.id}
                      className={`rounded-xl p-3 text-xs border ${
                        w.status === "MISSING"
                          ? "bg-rose-500/10 border-rose-500/40 text-rose-200"
                          : "bg-amber-500/10 border-amber-500/40 text-amber-200"
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span>{w.title}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/30">
                          {w.status}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] opacity-90">
                        {w.findingSummary}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Interactive Document Checklist & Internal Review Queue */}
          <div className="lg:col-span-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold">
                  Canadian Mortgage Document Checklist & Internal Review Queue
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Upload sample PDF documents in Demo Mode or set explicit manual review states (`VERIFIED_DEMO`, `PENDING_MANUAL_REVIEW`, `INCONSISTENT`, `MISSING`).
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {checks.length} Checklist Items
              </span>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {checks.map((check) => {
                const statusColors: Record<string, string> = {
                  VERIFIED_DEMO:
                    "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
                  PENDING_MANUAL_REVIEW:
                    "bg-sky-500/15 text-sky-300 border-sky-500/40",
                  INCONSISTENT:
                    "bg-amber-500/15 text-amber-300 border-amber-500/40",
                  MISSING: "bg-rose-500/15 text-rose-300 border-rose-500/40",
                };

                return (
                  <div key={check.id} className="p-5 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1 max-w-xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm">{check.title}</span>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            {check.category}
                          </span>
                          <span
                            className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded border ${
                              statusColors[check.status] ||
                              statusColors.PENDING_MANUAL_REVIEW
                            }`}
                          >
                            {check.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          {check.findingSummary}
                        </p>
                        {check.reviewerOverrideNote && (
                          <p className="text-[11px] text-teal-400 font-mono">
                            Reviewer Note: {check.reviewerOverrideNote}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUploadSamplePdf(check)}
                          disabled={uploadingCheckId === check.id}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/40 text-teal-600 dark:text-teal-300 px-3 py-1.5 text-xs font-semibold transition"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          <span>
                            {uploadingCheckId === check.id
                              ? "Uploading..."
                              : "Upload Sample PDF"}
                          </span>
                        </button>

                        <select
                          aria-label={`Set manual review state for ${check.title}`}
                          value={check.status}
                          onChange={(e) =>
                            handleManualReviewStateChange(
                              check.id,
                              e.target.value
                            )
                          }
                          className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 text-xs font-mono"
                        >
                          <option value="VERIFIED_DEMO">
                            Manual State: VERIFIED_DEMO
                          </option>
                          <option value="PENDING_MANUAL_REVIEW">
                            Manual State: PENDING_MANUAL_REVIEW
                          </option>
                          <option value="INCONSISTENT">
                            Manual State: INCONSISTENT
                          </option>
                          <option value="MISSING">Manual State: MISSING</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
