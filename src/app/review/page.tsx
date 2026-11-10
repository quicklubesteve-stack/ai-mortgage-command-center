"use client";

import React, { useEffect, useState } from "react";
import {
  UserCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Send,
  FileWarning,
  Download,
  Clock,
  Lock,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAppContext } from "@/context/AppContext";
import {
  fetchApplicationsWithFallback,
  patchApplicationWithFallback,
  downloadApplicationPdfClient,
} from "@/lib/api-client";

export default function HumanReviewPage() {
  const {
    activeRole,
    currentRoleDef,
    selectedApplicationId,
    setSelectedApplicationId,
  } = useAppContext();
  const [applications, setApplications] = useState<any[]>([]);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewerNotes, setReviewerNotes] = useState<string>("");
  const [submittingAction, setSubmittingAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "SUCCESS" | "ERROR";
    message: string;
  } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await fetchApplicationsWithFallback();
      if (data.success) {
        const list = data.applications || [];
        setApplications(list);
        setAuditEvents(data.auditEvents || []);
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

  const handleRecordReviewAction = async (
    reviewAction:
      | "MARK_INTERNALLY_REVIEWED"
      | "REQUEST_MISSING_INFO"
      | "RETURN_FOR_CORRECTION"
      | "PREPARE_EXTERNAL_SUBMISSION"
  ) => {
    if (!currentApp) return;
    setSubmittingAction(reviewAction);
    setFeedback(null);

    try {
      const { ok, data } = await patchApplicationWithFallback(
        currentApp.id,
        {
          action: "RECORD_HUMAN_REVIEW",
          reviewAction,
          notes:
            reviewerNotes.trim() ||
            `Recorded ${reviewAction} by ${currentRoleDef.personName}. Internal review completion is not a final lender mortgage approval.`,
          reviewerName: currentRoleDef.personName,
        },
        activeRole
      );
      if (!ok || !data.success) {
        setFeedback({
          type: "ERROR",
          message:
            data.error ||
            "Current demo role is not authorized to record human review decisions.",
        });
        return;
      }

      setReviewerNotes("");
      setFeedback({
        type: "SUCCESS",
        message: `Recorded human review action "${reviewAction}" on ${currentApp.referenceCode}. File status updated to "${data.newBadge}".`,
      });
      await fetchData();
    } finally {
      setSubmittingAction(null);
    }
  };

  const assessment = currentApp?.underwritingAssessment;
  const riskFlags: any[] = assessment?.riskFlagsJson
    ? JSON.parse(assessment.riskFlagsJson)
    : [];

  return (
    <AppShell
      title="Human Review Workspace (Steve's Authorization Desk)"
      subtitle="Authorized Broker & Internal Underwriter Review • RBAC Protected • Immutable Audit Trail"
      applications={applications}
      activeAppId={currentApp?.id}
      onSelectAppId={setSelectedApplicationId}
    >
      {/* Mandatory Internal Review Governance Notice */}
      <div className="rounded-2xl border border-teal-500/40 bg-teal-500/10 p-4 text-xs flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1 max-w-3xl">
          <div className="font-bold text-teal-400 flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>
              Human-in-the-Loop Underwriting Governance • Internal Review Completion Is Not a Mortgage Approval
            </span>
          </div>
          <p className="text-slate-700 dark:text-slate-300">
            This workspace is reserved for licensed human reviewers (
            <strong>Steve — Principal Underwriter / Broker</strong>). AI agents never approve, deny, or submit applications externally.{" "}
            <strong className="underline">
              Marking a file as internally reviewed prepares the draft dossier for brokerage governance and is not a binding lender mortgage approval.
            </strong>
          </p>
        </div>

        {currentApp && (
          <button
            type="button"
            onClick={() => downloadApplicationPdfClient(currentApp)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-slate-950 font-bold px-4 py-2.5 text-xs shadow-md transition shrink-0"
          >
            <Download className="h-4 w-4" />
            <span>Download Draft PDF Dossier</span>
          </button>
        )}
      </div>

      {/* Role Authorization Banner if current role is BORROWER or PLATFORM_ADMIN */}
      {!currentRoleDef.canExecuteHumanReview && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/15 p-4 text-xs text-amber-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-400 shrink-0" />
            <span>
              <strong>RBAC Notice:</strong> You are currently viewing as{" "}
              <strong>{currentRoleDef.label}</strong>. Server-side authorization restricts human review decision buttons to{" "}
              <strong>Internal Underwriter (Steve)</strong>,{" "}
              <strong>Mortgage Broker</strong>, or{" "}
              <strong>Brokerage Administrator</strong>. Try clicking an action below to test the server-side HTTP 403 check, or use the top Demo Role Switcher.
            </span>
          </div>
        </div>
      )}

      {feedback && (
        <div
          role="status"
          className={`rounded-xl border px-4 py-3 text-xs font-medium ${
            feedback.type === "SUCCESS"
              ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
              : "border-rose-500/40 bg-rose-500/15 text-rose-300"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {loading || !currentApp ? (
        <div className="p-8 text-center text-sm text-slate-400">
          Loading Human Review Workspace...
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Column: Complete File Inspection */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-mono text-teal-400 font-bold">
                    {currentApp.referenceCode} • Stage: {currentApp.stage}
                  </span>
                  <h2 className="text-lg font-bold">
                    Complete File Review: {currentApp.borrower?.firstName}{" "}
                    {currentApp.borrower?.lastName}
                  </h2>
                </div>
                <span className="font-mono text-[11px] font-semibold px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {currentApp.statusBadge}
                </span>
              </div>

              <div className="grid sm:grid-cols-3 gap-3 text-xs">
                <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-3 border border-slate-800">
                  <div className="text-[11px] text-slate-400">
                    Stress-Tested GDS / TDS
                  </div>
                  <div className="text-lg font-bold font-mono text-teal-400 mt-0.5">
                    {currentApp.calculatedGds?.toFixed(1)}% /{" "}
                    {currentApp.calculatedTds?.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Qualifying Rate: {currentApp.stressTestRate?.toFixed(2)}%
                  </div>
                </div>

                <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-3 border border-slate-800">
                  <div className="text-[11px] text-slate-400">
                    Base LTV & Mortgage
                  </div>
                  <div className="text-lg font-bold font-mono text-sky-400 mt-0.5">
                    {currentApp.calculatedLtv?.toFixed(1)}% LTV
                  </div>
                  <div className="text-[10px] text-slate-400">
                    $
                    {Number(currentApp.requestedMortgageAmount).toLocaleString()}{" "}
                    CAD ({currentApp.purpose})
                  </div>
                </div>

                <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-3 border border-slate-800">
                  <div className="text-[11px] text-slate-400">
                    Est. Monthly P&I
                  </div>
                  <div className="text-lg font-bold font-mono text-violet-400 mt-0.5">
                    $
                    {Number(
                      currentApp.estimatedMonthlyPayment || 0
                    ).toLocaleString()}
                    /mo
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {currentApp.amortizationYears}yr Amort •{" "}
                    {currentApp.termYears}yr {currentApp.ratePreference}
                  </div>
                </div>
              </div>

              {/* Risk Flags & Document Check Summary */}
              <div className="space-y-2.5 text-xs pt-2">
                <div className="font-bold text-amber-400">
                  Explainable Risk Flags & Document Findings:
                </div>
                {riskFlags.map((rf, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-slate-50 dark:bg-slate-900/80 p-3 border border-slate-200 dark:border-slate-800"
                  >
                    <div className="font-semibold text-teal-400">
                      [{rf.severity}] {rf.title}
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                      {rf.explanation}
                    </p>
                  </div>
                ))}

                <div className="grid sm:grid-cols-2 gap-2 pt-2">
                  {currentApp.documentChecks?.map((dc: any) => (
                    <div
                      key={dc.id}
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-2.5 flex items-center justify-between"
                    >
                      <span className="truncate pr-2 font-medium">
                        {dc.title}
                      </span>
                      <span
                        className={`font-mono text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                          dc.status === "VERIFIED_DEMO"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : dc.status === "PENDING_MANUAL_REVIEW"
                            ? "bg-sky-500/20 text-sky-300"
                            : "bg-rose-500/20 text-rose-300"
                        }`}
                      >
                        {dc.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Human Reviewer Controls & Decision History */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-teal-500/40 bg-white dark:bg-[#0c1426] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-teal-400" />
                  <span>Record Human Review Action</span>
                </h3>
                <span className="font-mono text-[10px] text-teal-400">
                  Reviewer: {currentRoleDef.personName}
                </span>
              </div>

              <div>
                <label
                  htmlFor="reviewer-notes"
                  className="block text-xs font-medium mb-1.5"
                >
                  Human Reviewer / Underwriter Notes *
                </label>
                <textarea
                  id="reviewer-notes"
                  rows={3}
                  placeholder="Enter internal review findings, conditions, or instructions for the broker/borrower..."
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={submittingAction !== null}
                  onClick={() =>
                    handleRecordReviewAction("MARK_INTERNALLY_REVIEWED")
                  }
                  className="rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-2.5 px-3 text-xs inline-flex items-center justify-center gap-1.5 shadow transition"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Mark Draft Internally Reviewed</span>
                </button>

                <button
                  type="button"
                  disabled={submittingAction !== null}
                  onClick={() =>
                    handleRecordReviewAction("PREPARE_EXTERNAL_SUBMISSION")
                  }
                  className="rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-600 dark:text-sky-300 font-bold py-2.5 px-3 text-xs inline-flex items-center justify-center gap-1.5 transition"
                >
                  <Send className="h-4 w-4" />
                  <span>Prepare for Future Submission</span>
                </button>

                <button
                  type="button"
                  disabled={submittingAction !== null}
                  onClick={() =>
                    handleRecordReviewAction("REQUEST_MISSING_INFO")
                  }
                  className="rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-600 dark:text-amber-300 font-semibold py-2.5 px-3 text-xs inline-flex items-center justify-center gap-1.5 transition"
                >
                  <FileWarning className="h-4 w-4" />
                  <span>Request Missing Information</span>
                </button>

                <button
                  type="button"
                  disabled={submittingAction !== null}
                  onClick={() =>
                    handleRecordReviewAction("RETURN_FOR_CORRECTION")
                  }
                  className="rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-600 dark:text-rose-300 font-semibold py-2.5 px-3 text-xs inline-flex items-center justify-center gap-1.5 transition"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Return File for Correction</span>
                </button>
              </div>

              <div className="rounded-xl bg-slate-100 dark:bg-slate-900/90 p-3 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                <strong>Compliance Confirmation:</strong> Internal review completion records that an authorized human has inspected the draft file. It is{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  not a mortgage approval
                </strong>{" "}
                and does not transmit data to any external lender.
              </div>
            </div>

            {/* Recorded Review Decisions & Audit Trail */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-5 space-y-3 text-xs">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Clock className="h-4 w-4 text-sky-400" />
                <span>Recorded Review Decisions & File Audit Trail</span>
              </h3>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {currentApp.reviewDecisions?.map((rd: any) => (
                  <div
                    key={rd.id}
                    className="rounded-xl border border-teal-500/40 bg-teal-500/10 p-3 space-y-1"
                  >
                    <div className="font-bold text-teal-300 flex justify-between">
                      <span>{rd.action}</span>
                      <span className="font-mono text-[10px]">
                        {rd.reviewerName}
                      </span>
                    </div>
                    <p className="text-slate-200">{rd.notes}</p>
                  </div>
                ))}

                {auditEvents
                  .filter((e) => !e.applicationId || e.applicationId === currentApp.id)
                  .slice(0, 10)
                  .map((ev) => (
                    <div
                      key={ev.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-2.5 space-y-1"
                    >
                      <div className="flex justify-between font-semibold text-slate-300">
                        <span>{ev.actorName}</span>
                        <span className="font-mono text-[10px] text-teal-400">
                          {ev.eventType}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px]">{ev.summary}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
