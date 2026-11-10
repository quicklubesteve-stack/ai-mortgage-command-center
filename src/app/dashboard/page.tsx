"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Users,
  FileWarning,
  UserCheck,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  ShieldAlert,
  Clock,
  Play,
  Download,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { useAppContext } from "@/context/AppContext";
import {
  fetchApplicationsWithFallback,
  createOrResetApplicationWithFallback,
  downloadApplicationPdfClient,
} from "@/lib/api-client";

export default function DashboardPage() {
  const router = useRouter();
  const { selectedApplicationId, setSelectedApplicationId } = useAppContext();
  const [applications, setApplications] = useState<any[]>([]);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [demoRequestsCount, setDemoRequestsCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [resetting, setResetting] = useState<boolean>(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const data = await fetchApplicationsWithFallback();
      if (data.success) {
        setApplications(data.applications || []);
        setAuditEvents(data.auditEvents || []);
        setDemoRequestsCount(data.demoRequestsCount || 0);
        if (!selectedApplicationId && data.applications?.length > 0) {
          setSelectedApplicationId(data.applications[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleResetDemo = async () => {
    setResetting(true);
    try {
      await createOrResetApplicationWithFallback({ action: "RESET_DEMO_DATA" });
      await fetchDashboardData();
    } finally {
      setResetting(false);
    }
  };

  const totalApplications = applications.length;
  const awaitingDocsCount = applications.filter(
    (a) =>
      a.stage === "DOCUMENT_CHECK" ||
      a.documentChecks?.some(
        (d: any) => d.status === "MISSING" || d.status === "INCONSISTENT"
      )
  ).length;
  const readyForHumanReviewCount = applications.filter((a) =>
    ["HUMAN_REVIEW", "DRAFT_PACKAGE"].includes(a.stage)
  ).length;
  const totalFictionalVolumeCad = applications.reduce(
    (sum, a) => sum + (Number(a.requestedMortgageAmount) || 0),
    0
  );

  // Chart 1: Pipeline Volume by Stage (Fictional Sample Data)
  const stageLabels: Record<string, string> = {
    INTAKE: "1. Intake",
    DOCUMENT_CHECK: "2. Doc Check",
    QUALIFICATION: "3. Qualification",
    LENDER_COMPARISON: "3B. Lender Match",
    DRAFT_PACKAGE: "4. Draft Package",
    HUMAN_REVIEW: "5. Human Review",
    INTERNALLY_REVIEWED: "6. Reviewed",
  };

  const stageChartData = Object.entries(stageLabels).map(([key, label]) => {
    const matching = applications.filter((a) => a.stage === key);
    return {
      stage: label,
      files: matching.length,
      volumeThousands: Math.round(
        matching.reduce(
          (s, a) => s + (Number(a.requestedMortgageAmount) || 0),
          0
        ) / 1000
      ),
    };
  });

  // Chart 2: GDS / TDS / LTV Ratios by Fictional File
  const ratioChartData = applications.map((a) => ({
    name: `${a.borrower?.firstName || "Applicant"} (${a.borrower?.province})`,
    GDS: Number((a.calculatedGds || 0).toFixed(1)),
    TDS: Number((a.calculatedTds || 0).toFixed(1)),
    LTV: Number((a.calculatedLtv || 0).toFixed(1)),
  }));

  return (
    <AppShell
      title="Private Mortgage Command Dashboard"
      subtitle="Fictional Canadian Sample Pipeline • 4-Stage AI Workflow Orchestration • Human-Controlled Underwriting"
      applications={applications}
      activeAppId={selectedApplicationId}
      onSelectAppId={setSelectedApplicationId}
    >
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal-500/30 bg-gradient-to-r from-teal-500/10 via-sky-500/10 to-violet-500/10 p-4">
        <div className="space-y-0.5">
          <div className="text-xs font-mono uppercase tracking-wider text-teal-500 font-semibold">
            Interactive Canadian Mortgage SaaS Prototype
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            All metrics below are calculated dynamically from our{" "}
            <strong>5 seeded fictional Canadian mortgage applications</strong> (never fake business performance claims).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/guided-demo"
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-2 text-xs transition"
          >
            <Play className="h-3.5 w-3.5" />
            <span>Launch Guided Demo</span>
          </Link>
          <Link
            href="/intake"
            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-600 dark:text-sky-300 font-semibold px-3.5 py-2 text-xs transition"
          >
            <span>+ New Borrower Intake</span>
          </Link>
          <button
            type="button"
            onClick={handleResetDemo}
            disabled={resetting}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-2 text-xs font-medium transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${resetting ? "animate-spin" : ""}`} />
            <span>{resetting ? "Resetting..." : "Reset 5 Sample Files"}</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Applications</span>
            <FileText className="h-4 w-4 text-teal-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono">
            {totalApplications}
          </div>
          <div className="text-[11px] text-slate-400">
            Fictional Canadian demo files
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>New Inquiries & Bookings</span>
            <Users className="h-4 w-4 text-sky-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono">
            {totalApplications + demoRequestsCount}
          </div>
          <div className="text-[11px] text-slate-400">
            Includes {demoRequestsCount} saved local demo request(s)
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Awaiting Documents</span>
            <FileWarning className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-amber-400">
            {awaitingDocsCount}
          </div>
          <div className="text-[11px] text-slate-400">
            Flagged by Agent 2 checklist
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Ready for Human Review</span>
            <UserCheck className="h-4 w-4 text-violet-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-violet-400">
            {readyForHumanReviewCount}
          </div>
          <div className="text-[11px] text-slate-400">
            Routed to Steve&apos;s Underwriter Desk
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Est. Sample Volume (CAD)</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-400">
            ${(totalFictionalVolumeCad / 1000000).toFixed(2)}M
          </div>
          <div className="text-[11px] text-slate-400">
            Fictional sample data sum (${totalFictionalVolumeCad.toLocaleString()})
          </div>
        </div>
      </div>

      {/* Mortgage Pipeline Table by Stage */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold">
              Canadian Mortgage Pipeline by Stage (5 Seeded Fictional Applications)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select any application to inspect its intake profile, document checklist, GDS/TDS/LTV ratios, draft PDF package, or human review status.
            </p>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400">
            Zero Automated Approvals • Human-Controlled Workflow
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">
            Loading Canadian mortgage pipeline...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase font-mono text-[11px]">
                  <th className="py-3 px-4">File Ref</th>
                  <th className="py-3 px-4">Borrower & Location</th>
                  <th className="py-3 px-4">Purpose</th>
                  <th className="py-3 px-4">Mortgage / Value</th>
                  <th className="py-3 px-4">GDS / TDS / LTV</th>
                  <th className="py-3 px-4">Stage & Governance Badge</th>
                  <th className="py-3 px-4 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70">
                {applications.map((app) => {
                  const isSelected = app.id === selectedApplicationId;
                  return (
                    <tr
                      key={app.id}
                      onClick={() => setSelectedApplicationId(app.id)}
                      className={`cursor-pointer transition ${
                        isSelected
                          ? "bg-teal-500/10"
                          : "hover:bg-slate-50 dark:hover:bg-slate-900/40"
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-600 dark:text-teal-400">
                        {app.referenceCode}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {app.borrower?.firstName} {app.borrower?.lastName}
                          {app.borrower?.coBorrowerName
                            ? ` & ${app.borrower.coBorrowerName}`
                            : ""}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {app.borrower?.city}, {app.borrower?.province} • Score Est:{" "}
                          {app.borrower?.creditScoreEstimate || "N/A"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                          {app.purpose}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-semibold">
                          ${Number(app.requestedMortgageAmount).toLocaleString()} CAD
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Prop: $
                          {Number(
                            app.property?.purchasePriceOrValue || 0
                          ).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <div>
                          GDS:{" "}
                          <span
                            className={
                              (app.calculatedGds || 0) > 39
                                ? "text-amber-400 font-bold"
                                : "text-emerald-400"
                            }
                          >
                            {app.calculatedGds?.toFixed(1)}%
                          </span>{" "}
                          | TDS:{" "}
                          <span
                            className={
                              (app.calculatedTds || 0) > 44
                                ? "text-amber-400 font-bold"
                                : "text-emerald-400"
                            }
                          >
                            {app.calculatedTds?.toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Base LTV: {app.calculatedLtv?.toFixed(1)}%{" "}
                          {app.insuranceRequired ? "(Insured)" : "(Uninsured)"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-[11px] font-semibold text-sky-400">
                          {app.stage}
                        </div>
                        <div className="inline-block mt-0.5 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          {app.statusBadge}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApplicationId(app.id);
                            router.push("/documents");
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-500/20 text-[11px] font-medium"
                        >
                          Docs
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApplicationId(app.id);
                            router.push("/qualification");
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-500/20 text-[11px] font-medium"
                        >
                          Match
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApplicationId(app.id);
                            router.push("/review");
                          }}
                          className="px-2.5 py-1 rounded-lg bg-teal-500/20 border border-teal-500/40 text-teal-600 dark:text-teal-300 text-[11px] font-semibold"
                        >
                          Review →
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadApplicationPdfClient(app);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-500/20 border border-violet-500/40 text-violet-300 text-[11px] font-semibold"
                          title="Download Draft PDF Summary"
                        >
                          <Download className="h-3 w-3" />
                          <span>PDF</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Analytics Charts Section (Recharts) */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold">
              Workflow Pipeline Distribution ($ Thousands CAD — Fictional Sample Data)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Distribution of requested mortgage volumes across the 4 agent workflow stages and human review.
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="stage" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0a1122",
                    borderColor: "#1e293b",
                    color: "#f8fafc",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar
                  dataKey="volumeThousands"
                  name="Mortgage Volume ($K CAD)"
                  fill="#14b8a6"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold">
              Stress-Tested GDS, TDS & Base LTV by Fictional Borrower (%)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Compares each applicant&apos;s OSFI B-20 stress-tested ratios against standard 39% GDS / 44% TDS guidelines.
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratioChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0a1122",
                    borderColor: "#1e293b",
                    color: "#f8fafc",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="GDS" name="GDS %" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="TDS" name="TDS %" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey="LTV"
                  name="Base LTV %"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Actionable Alerts & Agent Audit Trail */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Actionable Alerts and Tasks */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-400" />
              <span>Actionable Underwriting Alerts & Tasks</span>
            </h3>
            <span className="text-[11px] font-mono text-amber-400">
              Human Attention Required
            </span>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                <span>CAN-MORT-2026-102 • Tyler MacLeod (Calgary, AB)</span>
                <span className="font-mono text-[10px]">Agent 2 Flag</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Self-employed (BFS) applicant is missing 2-year CRA T1 General / NOA tax filings and has a $30,000 down payment source discrepancy.
              </p>
              <button
                type="button"
                onClick={() => {
                  const found = applications.find(
                    (a) => a.referenceCode === "CAN-MORT-2026-102"
                  );
                  if (found) setSelectedApplicationId(found.id);
                  router.push("/documents");
                }}
                className="text-xs font-semibold text-teal-400 hover:underline inline-flex items-center gap-1 pt-1"
              >
                Open Document Verification Queue <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-rose-400">
                <span>CAN-MORT-2026-105 • Priya Patel (Ottawa, ON)</span>
                <span className="font-mono text-[10px]">Agent 3 & 4 Flag</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Higher-value $1.18M purchase exceeds standard 39%/44% GDS/TDS caps under OSFI B-20 stress test and shows a $15,000 gift wire variance. Routed to Steve for manual review.
              </p>
              <button
                type="button"
                onClick={() => {
                  const found = applications.find(
                    (a) => a.referenceCode === "CAN-MORT-2026-105"
                  );
                  if (found) setSelectedApplicationId(found.id);
                  router.push("/review");
                }}
                className="text-xs font-semibold text-teal-400 hover:underline inline-flex items-center gap-1 pt-1"
              >
                Inspect in Steve&apos;s Human Review Workspace{" "}
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 p-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-teal-400">
                <span>CAN-MORT-2026-101 • Jordan Campbell (Toronto, ON)</span>
                <span className="font-mono text-[10px]">Ready for Review</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                First-time homebuyer file with complete demo documents, GDS 32.4% / TDS 36.6%, ready for Steve&apos;s internal review sign-off.
              </p>
              <button
                type="button"
                onClick={() => {
                  const found = applications.find(
                    (a) => a.referenceCode === "CAN-MORT-2026-101"
                  );
                  if (found) setSelectedApplicationId(found.id);
                  router.push("/review");
                }}
                className="text-xs font-semibold text-teal-400 hover:underline inline-flex items-center gap-1 pt-1"
              >
                Open File in Human Review <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Agent Activity & Immutable Audit History */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-sky-400" />
              <span>Agent Activity & Immutable Audit History</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              Latest {auditEvents.length} Logged Events
            </span>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {auditEvents.map((ev) => (
              <div
                key={ev.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60 p-3 text-xs flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-teal-600 dark:text-teal-300">
                      {ev.actorName}
                    </span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {ev.eventType}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    {ev.summary}
                  </p>
                </div>
                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                  {new Date(ev.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
