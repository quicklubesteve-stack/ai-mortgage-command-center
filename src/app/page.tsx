"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Sparkles,
  FileCheck2,
  Calculator,
  Scale,
  ArrowRight,
  CheckCircle2,
  Lock,
  UserCheck,
  Building2,
  HelpCircle,
  Sun,
  Moon,
  AlertTriangle,
  Layers,
  ChevronRight,
  Play,
  FileSpreadsheet,
} from "lucide-react";
import { useAppContext, DEMO_ROLES, UserRole } from "@/context/AppContext";
import {
  calculateDownPaymentAndLtv,
  calculateMortgagePayment,
  calculateStressTest,
} from "@/lib/mortgage-calculators";
import { saveDemoRequestWithFallback } from "@/lib/api-client";
import { MortgageContactForm } from "@/components/MortgageContactForm";

export default function MarketingHomePage() {
  const router = useRouter();
  const { theme, toggleTheme, activeRole, setActiveRole } = useAppContext();

  // Contact form active tab: Borrower Mortgage Inquiry vs Broker Demo
  const [contactTab, setContactTab] = useState<"BORROWER" | "BROKER_DEMO">("BORROWER");

  // Interactive Product Preview state
  const [previewStage, setPreviewStage] = useState<number>(0);

  // Interactive Mortgage Calculator Preview state
  const [calcPrice, setCalcPrice] = useState<number>(780000);
  const [calcDown, setCalcDown] = useState<number>(78000);
  const [calcRate, setCalcRate] = useState<number>(4.69);
  const [calcAmort, setCalcAmort] = useState<number>(25);

  const downLtv = calculateDownPaymentAndLtv({
    propertyPrice: calcPrice,
    downPaymentAmount: calcDown,
    purpose: "PURCHASE",
    amortizationYears: calcAmort,
  });

  const paymentResult = calculateMortgagePayment({
    principal: downLtv.totalMortgageWithInsurance,
    annualRatePct: calcRate,
    amortizationYears: calcAmort,
    frequency: "MONTHLY",
  });

  const stressResult = calculateStressTest({
    principal: downLtv.totalMortgageWithInsurance,
    contractRatePct: calcRate,
    amortizationYears: calcAmort,
  });

  // Book a Demo Form state
  const [demoForm, setDemoForm] = useState({
    fullName: "",
    workEmail: "",
    organizationName: "",
    organizationType: "MORTGAGE_BROKERAGE",
    province: "ON",
    teamSize: "5-20 brokers",
    message: "",
  });
  const [demoStatus, setDemoStatus] = useState<
    "IDLE" | "SUBMITTING" | "SAVED" | "ERROR"
  >("IDLE");
  const [demoError, setDemoError] = useState<string>("");

  const handleBookDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    setDemoStatus("SUBMITTING");
    setDemoError("");
    try {
      const { ok, data } = await saveDemoRequestWithFallback(demoForm);
      if (!ok || !data.success) {
        setDemoStatus("ERROR");
        setDemoError(data.error || "Please check all required fields.");
        return;
      }
      setDemoStatus("SAVED");
    } catch (err: any) {
      setDemoStatus("ERROR");
      setDemoError(err.message || "Failed to save local demo request.");
    }
  };

  const handleEnterDashboard = (role?: UserRole, path = "/dashboard") => {
    if (role) setActiveRole(role);
    router.push(path);
  };

  const workflowStages = [
    {
      stageNumber: "Stage 1",
      title: "Agent 1: AI Borrower Intake",
      subtitle: "Conversational & Structured Canadian Mortgage Intake",
      badge: "intake-agent.md (Adapted to Mortgages)",
      summary:
        "Collects borrower identity, Canadian province, purchase/refinance/renewal purpose, employment history, gross income, liabilities, down payment source, and rate preferences using fictional demo scenarios.",
      outputs: [
        "Validated Canadian application dossier (Purchase, Refinance, or Renewal)",
        "Automatic derivation of base loan, down payment %, and missing field alerts",
        "Strict Zero-Approval Guardrail enforced on every chat & form interaction",
      ],
    },
    {
      stageNumber: "Stage 2",
      title: "Agent 2: Document Verification",
      subtitle: "Checklist & Discrepancy Detection Queue",
      badge: "document-agent.md (Adapted to Mortgages)",
      summary:
        "Cross-checks Pay Stubs, Letters of Employment, CRA T1/NOA tax filings, 90-Day Down Payment Bank Statements, Purchase Agreements, and Refinance Statements against the intake dossier.",
      outputs: [
        "Explicit flags for missing or inconsistent income & gift-letter evidence",
        "Clear Government ID verification status placeholder (no fake identity claims)",
        "Internal document review queue with manual broker override states",
      ],
    },
    {
      stageNumber: "Stage 3",
      title: "Agent 3: Qualification & Lender Matching",
      subtitle: "Deterministic Canadian Ratios & 5 Fictional Lenders",
      badge: "lender-match-agent.md (Adapted to Mortgages)",
      summary:
        "Computes GDS, TDS, LTV, semi-annual compounding payments, default insurance premiums, and OSFI B-20 stress tests using dated configurable policy assumptions, then ranks 5 fictional Canadian lenders.",
      outputs: [
        "Separates regulatory baseline (OSFI B-20 / down payment rules) from lender rules",
        "Plain-language explanations of why each fictional lender product fits or misses",
        "Editable lender criteria for live broker and investor demonstrations",
      ],
    },
    {
      stageNumber: "Stage 4",
      title: "Agent 4: Underwriting Support & Package Builder",
      subtitle: "Explainable Risk Flags, Draft PDF Dossier & Human Review",
      badge: "package-agent.md (Adapted to Mortgages)",
      summary:
        "Synthesizes ratios, document checks, risk flags, and lender comparisons into a downloadable draft PDF underwriting summary routed to Steve's Human Review Workspace.",
      outputs: [
        "Explainable risk flags and open exception tracking",
        "Downloadable PDF underwriting & lender package summary",
        "100% Human-in-the-Loop control — never approves, denies, or submits externally",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#060b16] dark:text-slate-100 transition-colors">
      {/* Top Compliance & Demo Banner */}
      <div className="border-b border-teal-500/30 bg-slate-900/95 text-slate-200 px-4 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/20 border border-teal-400/40 px-2.5 py-0.5 font-semibold text-teal-300">
              <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
              DEMO MODE — FICTIONAL SAMPLE DATA ONLY
            </span>
            <span className="hidden md:inline text-slate-300">
              Canadian Mortgage Workflow Prototype • No Live Rates, Credit Bureau Pulls, or Automated Lending Approvals
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/guided-demo"
              className="text-sky-300 hover:text-sky-200 font-medium underline underline-offset-4"
            >
              Launch 6-Step Guided Walkthrough →
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/85 dark:bg-[#0a1122]/85 border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 via-sky-500 to-violet-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight">
                  AI Mortgage Command Center
                </span>
                <span className="hidden sm:inline-block text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  Canada SaaS
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Smarter Mortgage Workflows. Human-Controlled Decisions.
              </p>
            </div>
          </div>

          <nav
            aria-label="Primary Marketing Navigation"
            className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300"
          >
            <a href="#contact" className="text-teal-400 font-bold hover:text-teal-300 transition flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
              Mortgage Inquiry
            </a>
            <a href="#preview" className="hover:text-teal-400 transition">
              Product Preview
            </a>
            <a href="#workflow" className="hover:text-teal-400 transition">
              4-Stage AI
            </a>
            <a href="#calculator" className="hover:text-teal-400 transition">
              Calculators
            </a>
            <a href="#security" className="hover:text-teal-400 transition">
              Governance
            </a>
            <a href="#faq" className="hover:text-teal-400 transition">
              FAQ
            </a>
            <Link href="/contact" className="hover:text-teal-400 transition">
              Contact Us
            </Link>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle color theme"
              className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Switch Light / Dark Theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-700" />
              )}
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-400 hover:to-sky-400 text-slate-950 font-semibold px-4 py-2 text-sm shadow-md shadow-teal-500/20 transition"
            >
              <span>Sign In to Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* 1. HERO SECTION */}
        <section className="relative overflow-hidden py-16 lg:py-24 border-b border-slate-200 dark:border-slate-800/80">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-500/10 via-sky-500/5 to-transparent" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex flex-wrap items-center gap-2 rounded-full bg-slate-200/80 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 px-3.5 py-1.5 text-xs font-medium text-teal-700 dark:text-teal-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>
                    Built for Canadian Mortgage Brokers, Lenders, Credit Unions & Financial Institutions
                  </span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
                  AI Mortgage Command Center{" "}
                  <span className="block mt-2 bg-gradient-to-r from-teal-400 via-sky-400 to-violet-400 bg-clip-text text-transparent">
                    Smarter Mortgage Workflows. Human-Controlled Decisions.
                  </span>
                </h1>

                <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                  Unify Canadian borrower intake, document discrepancy checking,
                  OSFI B-20 stress-test qualification, multi-lender product comparison,
                  and underwriting package generation in one explainable workspace—while
                  keeping{" "}
                  <strong className="text-slate-900 dark:text-white font-semibold">
                    100% of credit decisions and submission authority in licensed human hands
                  </strong>
                  .
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href="#contact"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-400 hover:to-sky-400 text-slate-950 font-extrabold px-6 py-3.5 text-sm shadow-xl shadow-teal-500/25 transition cursor-pointer"
                  >
                    <span>🍁 Start Mortgage Inquiry</span>
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900/90 dark:bg-slate-800/90 hover:bg-slate-800 text-white border border-slate-700 font-semibold px-5 py-3.5 text-sm transition"
                  >
                    <span>Open Command Dashboard</span>
                  </Link>
                  <Link
                    href="/calculators"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/60 px-5 py-3.5 text-sm font-medium transition"
                  >
                    <Calculator className="h-4 w-4 text-sky-400" />
                    <span>7 Canadian Calculators</span>
                  </Link>
                </div>

                {/* Role Sign-In Entry Point Bar */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                    9. Private Dashboard Entry Point — Select Demo Persona:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {DEMO_ROLES.map((r) => (
                      <button
                        key={r.role}
                        type="button"
                        onClick={() => handleEnterDashboard(r.role)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 ${
                          activeRole === r.role
                            ? "bg-teal-500/20 border-teal-400 text-teal-700 dark:text-teal-200 font-semibold"
                            : "border-slate-300 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 hover:border-teal-500/50"
                        }`}
                      >
                        <UserCheck className="h-3.5 w-3.5 text-teal-400" />
                        <span>{r.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. INTERACTIVE PRODUCT PREVIEW CARD */}
              <div id="preview" className="lg:col-span-5">
                <div className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-[#0c1426] shadow-2xl shadow-teal-950/40 overflow-hidden">
                  <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                      <span className="ml-2 text-xs font-mono text-slate-300">
                        Interactive Cockpit Preview • CAN-MORT-2026-101
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      PENDING HUMAN REVIEW
                    </span>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-4 gap-1.5 bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl">
                      {["1. Intake", "2. Docs", "3. Match", "4. Package"].map(
                        (tab, idx) => (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setPreviewStage(idx)}
                            className={`text-xs py-2 px-2 rounded-lg font-medium transition ${
                              previewStage === idx
                                ? "bg-teal-500 text-slate-950 font-bold shadow"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            }`}
                          >
                            {tab}
                          </button>
                        )
                      )}
                    </div>

                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#101b35]/60 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase text-teal-600 dark:text-teal-400 font-semibold">
                          {workflowStages[previewStage].stageNumber}
                        </span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {workflowStages[previewStage].badge}
                        </span>
                      </div>
                      <h3 className="text-base font-bold">
                        {workflowStages[previewStage].title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {workflowStages[previewStage].summary}
                      </p>
                      <ul className="space-y-1.5 pt-1">
                        {workflowStages[previewStage].outputs.map((out, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-200"
                          >
                            <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                            <span>{out}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Sample Dossier Metrics Snapshot */}
                    <div className="grid grid-cols-3 gap-2.5 text-center">
                      <div className="rounded-xl bg-slate-100 dark:bg-slate-900/90 p-3 border border-slate-200 dark:border-slate-800">
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Stress-Tested GDS / TDS
                        </div>
                        <div className="text-sm font-bold text-teal-500 mt-0.5">
                          32.4% / 36.6%
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Guideline &le; 39% / 44%
                        </div>
                      </div>
                      <div className="rounded-xl bg-slate-100 dark:bg-slate-900/90 p-3 border border-slate-200 dark:border-slate-800">
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Base LTV & Insurance
                        </div>
                        <div className="text-sm font-bold text-sky-400 mt-0.5">
                          90.0% LTV
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Insured (+$21,762)
                        </div>
                      </div>
                      <div className="rounded-xl bg-slate-100 dark:bg-slate-900/90 p-3 border border-slate-200 dark:border-slate-800">
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Human Authority
                        </div>
                        <div className="text-sm font-bold text-violet-400 mt-0.5">
                          Steve (UW)
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Human Decision Only
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        All preview numbers use fictional demo records.
                      </span>
                      <Link
                        href="/intake"
                        className="text-xs font-semibold text-teal-500 hover:text-teal-400 inline-flex items-center gap-1"
                      >
                        Try Live Agent 1 Intake <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. BENEFITS FOR BROKERS AND MORTGAGE COMPANIES */}
        <section className="py-16 border-b border-slate-200 dark:border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="max-w-3xl space-y-3">
              <span className="text-xs font-mono uppercase tracking-wider text-teal-500 font-semibold">
                Built for Canadian Mortgage Professionals
              </span>
              <h2 className="text-3xl font-bold tracking-tight">
                Operational Benefits for Brokerages, Lenders & Underwriting Desks
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Designed to eliminate repetitive manual spreadsheet entry and surface document discrepancies early—without ever presenting simulated demo metrics as live business performance or automating final credit decisions.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-6 space-y-3 hover:border-teal-500/50 transition">
                <div className="h-10 w-10 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold">
                  Structured Canadian Intake & Scenarios
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Captures Canadian-specific mortgage parameters—provincial location, purchase/refinance/renewal purpose, FHSA/RRSP Home Buyers&apos; Plan down payments, condo fees (50% GDS inclusion), and co-borrower incomes.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-6 space-y-3 hover:border-sky-500/50 transition">
                <div className="h-10 w-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center">
                  <Scale className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold">
                  Transparent OSFI B-20 & Lender Separation
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Clearly distinguishes dated Canadian regulatory requirements (minimum down payment tiers, 80% refinance LTV limit, and stress-test floor rates) from customizable individual lender guidelines.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-6 space-y-3 hover:border-violet-500/50 transition">
                <div className="h-10 w-10 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold">
                  Explainable Underwriting & Audit Trail
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Every ratio calculation, document discrepancy warning, draft PDF export, and human reviewer action is logged in an immutable audit trail with explicit human-in-the-loop guardrails.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. FOUR-STAGE AI WORKFLOW VISUALIZATION */}
        <section
          id="workflow"
          className="py-16 border-b border-slate-200 dark:border-slate-800/80 bg-slate-100/60 dark:bg-[#091020]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2 max-w-3xl">
                <span className="text-xs font-mono uppercase tracking-wider text-sky-400 font-semibold">
                  Four-Stage Multi-Agent Architecture
                </span>
                <h2 className="text-3xl font-bold tracking-tight">
                  End-to-End Canadian Mortgage Workflow Pipeline
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Adapted from our reusable four-stage agent card architecture (`intake-agent.md`, `document-agent.md`, `lender-match-agent.md`, and `package-agent.md`—originally designed for an automotive finance workflow and cleanly re-engineered with 100% Canadian residential mortgage fields and brokerage governance).
                </p>
              </div>
              <Link
                href="/guided-demo"
                className="inline-flex items-center gap-2 rounded-xl bg-teal-500/15 border border-teal-500/40 text-teal-600 dark:text-teal-300 px-4 py-2.5 text-xs font-semibold hover:bg-teal-500/25 transition shrink-0"
              >
                <span>Walk Through All 4 Agents + Human Review</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {workflowStages.map((stg, idx) => (
                <div
                  key={stg.stageNumber}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-5 flex flex-col justify-between space-y-4 relative"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-teal-500/15 text-teal-500 border border-teal-500/30">
                        {stg.stageNumber}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Hands off to Stage {idx + 2 <= 4 ? idx + 2 : "Human Review"}
                      </span>
                    </div>
                    <h3 className="text-base font-bold">{stg.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {stg.summary}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-1.5">
                    {stg.outputs.map((o, i) => (
                      <div
                        key={i}
                        className="text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-1.5"
                      >
                        <span className="text-teal-400 font-bold">•</span>
                        <span>{o}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. INTERACTIVE MORTGAGE CALCULATOR PREVIEW */}
        <section
          id="calculator"
          className="py-16 border-b border-slate-200 dark:border-slate-800/80"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-5 space-y-4">
                <span className="text-xs font-mono uppercase tracking-wider text-teal-500 font-semibold">
                  Canadian Semi-Annual Compounding Engine
                </span>
                <h2 className="text-3xl font-bold tracking-tight">
                  Interactive Canadian Mortgage & Stress-Test Preview
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Test our deterministic Canadian mortgage math right here. In accordance with the{" "}
                  <em>Interest Act (Canada)</em>, fixed-rate mortgages compound semi-annually (twice per year), and high-ratio purchases (&gt;80% LTV under $1.5M) include mortgage default insurance and OSFI Guideline B-20 stress testing.
                </p>
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-700 dark:text-amber-300 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Dated Policy Reference Assumption (2026-01-01)</span>
                  </div>
                  <p>
                    Qualifying stress-test rate is calculated as{" "}
                    <code>max(Contract Rate + 2.00%, 5.25% Benchmark Floor)</code>. All outputs are illustrative estimates, not a lending commitment.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/calculators"
                    className="inline-flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-5 py-3 text-sm transition"
                  >
                    <Calculator className="h-4 w-4" />
                    <span>Explore All 7 Interactive Mortgage Calculators</span>
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-6 shadow-xl space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="home-calc-price"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5"
                    >
                      Property Purchase Price (CAD)
                    </label>
                    <input
                      id="home-calc-price"
                      type="number"
                      min={100000}
                      max={5000000}
                      step={10000}
                      value={calcPrice}
                      onChange={(e) => setCalcPrice(Number(e.target.value) || 0)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="home-calc-down"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5"
                    >
                      Down Payment Amount (CAD)
                    </label>
                    <input
                      id="home-calc-down"
                      type="number"
                      min={5000}
                      max={4000000}
                      step={5000}
                      value={calcDown}
                      onChange={(e) => setCalcDown(Number(e.target.value) || 0)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="home-calc-rate"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5"
                    >
                      Illustrative Contract Rate (%)
                    </label>
                    <input
                      id="home-calc-rate"
                      type="number"
                      min={1}
                      max={15}
                      step={0.05}
                      value={calcRate}
                      onChange={(e) => setCalcRate(Number(e.target.value) || 0)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="home-calc-amort"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5"
                    >
                      Amortization Period (Years)
                    </label>
                    <select
                      id="home-calc-amort"
                      value={calcAmort}
                      onChange={(e) => setCalcAmort(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm"
                    >
                      <option value={15}>15 Years</option>
                      <option value={20}>20 Years</option>
                      <option value={25}>25 Years (Standard Insured Max)</option>
                      <option value={30}>30 Years (Uninsured / First-Time Buyer)</option>
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 pt-2">
                  <div className="rounded-xl bg-slate-100 dark:bg-slate-900/90 p-4 border border-slate-200 dark:border-slate-800">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Est. Monthly Payment (P&I)
                    </div>
                    <div className="text-2xl font-extrabold text-teal-500 mt-1 font-mono">
                      ${paymentResult.monthlyEquivalentPayment.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Effective Annual Rate: {paymentResult.effectiveAnnualRatePct}%
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-100 dark:bg-slate-900/90 p-4 border border-slate-200 dark:border-slate-800">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      OSFI Stress-Test Payment
                    </div>
                    <div className="text-2xl font-extrabold text-sky-400 mt-1 font-mono">
                      ${stressResult.stressTestMonthlyPayment.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Qualifying Rate: {stressResult.qualifyingRatePct}%
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-100 dark:bg-slate-900/90 p-4 border border-slate-200 dark:border-slate-800">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Base LTV & Default Insurance
                    </div>
                    <div className="text-2xl font-extrabold text-violet-400 mt-1 font-mono">
                      {downLtv.baseLtvPct}% LTV
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {downLtv.insuranceRequired
                        ? `Insurance: +$${downLtv.insurancePremiumAmount.toLocaleString()}`
                        : "Conventional (No Insurance)"}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/60 rounded-lg px-3.5 py-2.5 border border-slate-200 dark:border-slate-800">
                  <strong>Policy Check:</strong> {downLtv.policyExplanation}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. SECURITY AND HUMAN-OVERSIGHT EXPLANATION */}
        <section
          id="security"
          className="py-16 border-b border-slate-200 dark:border-slate-800/80 bg-slate-100/60 dark:bg-[#091020]"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="max-w-3xl space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-violet-400 font-semibold">
                Human-in-the-Loop Governance & Canadian Privacy Architecture
              </span>
              <h2 className="text-3xl font-bold tracking-tight">
                Security, Compliance & Non-Delegable Human Review
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Built from the ground up around strict lending guardrails: AI agents structure data, verify checklists, and compute ratios, while licensed humans retain 100% authority over underwriting review.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-5 space-y-2">
                <Lock className="h-5 w-5 text-teal-400" />
                <h3 className="font-bold text-sm">
                  Zero Automated Lending Decisions
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  No agent can approve, pre-approve, commit to, or deny a mortgage or submit a file externally. Direct approval commands trigger an immediate compliance refusal.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-5 space-y-2">
                <UserCheck className="h-5 w-5 text-sky-400" />
                <h3 className="font-bold text-sm">
                  Protected Characteristics Excluded
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Qualification and lender matching rely strictly on verifiable financial ratios (GDS, TDS, LTV, down payment, and voluntary credit estimates)—never protected human attributes.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-5 space-y-2">
                <FileCheck2 className="h-5 w-5 text-violet-400" />
                <h3 className="font-bold text-sm">
                  Explicit Demo vs. Production Boundaries
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Uses 100% fictional borrower data in local mode. Does not claim real document authenticity, identity verification, or live credit bureau pulls.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-5 space-y-2">
                <Layers className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-sm">
                  PIPEDA & Provincial Regulatory Readiness
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Includes server-side role authorization, brokerage tenant isolation, immutable audit logging, and documented production encryption/retention checklists (requiring independent legal validation prior to live deployment).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 8. PRODUCT FEATURES AND FAQ */}
        <section
          id="faq"
          className="py-16 border-b border-slate-200 dark:border-slate-800/80"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="max-w-3xl space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-teal-500 font-semibold">
                Product Capabilities & Frequently Asked Questions
              </span>
              <h2 className="text-3xl font-bold tracking-tight">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-6 space-y-2">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-teal-400 shrink-0" />
                  <span>Does the AI ever approve or decline a borrower&apos;s mortgage?</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Never. Every agent in the AI Mortgage Command Center is governed by a hardcoded Zero-Approval Guardrail. Agents collect intake data, flag missing documents, calculate GDS/TDS/LTV ratios, and prepare draft packages—while only an authorized human broker or internal underwriter (Steve) can review and record internal decisions.Even internal review completion is not a final lender mortgage approval.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-6 space-y-2">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-teal-400 shrink-0" />
                  <span>How are Canadian mortgage calculations handled?</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Fixed-rate mortgage payments use Canadian semi-annual compounding in accordance with the <em>Interest Act (Canada)</em>. Qualification calculations include configurable dated assumptions for the OSFI Guideline B-20 stress test (<code>max(Contract Rate + 2.00%, 5.25%)</code>), tiered minimum down payments (5% up to $500k, 10% up to $1.5M, 20% at $1.5M+), and default insurance premiums.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-6 space-y-2">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-teal-400 shrink-0" />
                  <span>Are live credit bureaus, live lender rates, or real customer PII used?</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  No. This demonstration environment uses 100% fictional Canadian borrower profiles and five fictional lender profiles with editable example criteria. No connections to Equifax, TransUnion, Finmo, Filogix, or live lender pricing engines are active in demo mode.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-6 space-y-2">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-teal-400 shrink-0" />
                  <span>How were the four workflow agents designed?</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  The workflow adapts a modular four-stage agent card architecture (Intake Agent, Document Agent, Lender Match Agent, and Package Agent—originally structured for an automotive finance pipeline) and replaces all domain logic with Canadian residential mortgage intake, document verification, GDS/TDS/LTV qualification, and underwriting package preparation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 7. MORTGAGE CONTACT & INTAKE PORTAL */}
        <section id="contact" className="py-16 scroll-mt-20">
          <span id="book-demo" className="scroll-mt-24" />
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-teal-400 font-bold">
                Get In Touch • Canadian Mortgage Advisory & Command Center
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Connect With Our Team
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Choose your inquiry type below to submit your base information directly to our licensed mortgage specialists.
              </p>

              {/* Inquiry Type Tab Selector */}
              <div className="inline-flex p-1.5 rounded-2xl bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shadow-inner mt-4">
                <button
                  type="button"
                  onClick={() => setContactTab("BORROWER")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
                    contactTab === "BORROWER"
                      ? "bg-gradient-to-r from-teal-500 to-sky-500 text-slate-950 shadow-md shadow-teal-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <span>🍁 I&apos;m Looking for a Mortgage</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/20 font-normal">
                    Borrower Intake
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setContactTab("BROKER_DEMO")}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
                    contactTab === "BROKER_DEMO"
                      ? "bg-gradient-to-r from-teal-500 to-sky-500 text-slate-950 shadow-md shadow-teal-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <span>🏢 Brokerage / Lender Demo</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/20 font-normal">
                    SaaS Demo
                  </span>
                </button>
              </div>
            </div>

            {contactTab === "BORROWER" ? (
              <MortgageContactForm sourcePage="home_page" />
            ) : (
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-8 shadow-xl space-y-6">
                <div className="space-y-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-teal-400 font-semibold">
                    Local Demo Persistence • SQLite Database
                  </span>
                  <h3 className="text-2xl font-bold">
                    Book an Institutional Demo Walkthrough
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    For mortgage brokerages, monolines, credit unions, and fintech investors evaluating the platform architecture.
                  </p>
                </div>

                {demoStatus === "SAVED" ? (
                  <div
                    role="status"
                    className="rounded-2xl border border-teal-500/40 bg-teal-500/10 p-6 text-sm space-y-3"
                  >
                    <div className="flex items-center gap-2 font-bold text-teal-600 dark:text-teal-300 text-base">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Demo Request Saved Locally in SQLite (Demo Mode)!</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-xs">
                      Thank you, <strong>{demoForm.fullName}</strong> from{" "}
                      <strong>{demoForm.organizationName}</strong>. Your inquiry has been persisted in the local `DemoRequest` model and recorded in the platform audit trail.
                    </p>
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setDemoStatus("IDLE")}
                        className="text-xs px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Submit Another Inquiry
                      </button>
                      <Link
                        href="/dashboard"
                        className="text-xs px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-bold"
                      >
                        Proceed to Private Dashboard →
                      </Link>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleBookDemo} className="space-y-4">
                    {demoStatus === "ERROR" && (
                      <div className="rounded-xl bg-rose-500/15 border border-rose-500/40 p-3 text-xs text-rose-300">
                        {demoError}
                      </div>
                    )}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="demo-fullName"
                          className="block text-xs font-medium mb-1"
                        >
                          Full Name *
                        </label>
                        <input
                          id="demo-fullName"
                          required
                          type="text"
                          placeholder="e.g., Nadia Desjardins"
                          value={demoForm.fullName}
                          onChange={(e) =>
                            setDemoForm({ ...demoForm, fullName: e.target.value })
                          }
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="demo-workEmail"
                          className="block text-xs font-medium mb-1"
                        >
                          Work Email *
                        </label>
                        <input
                          id="demo-workEmail"
                          required
                          type="email"
                          placeholder="nadia@brokerage-demo.ca"
                          value={demoForm.workEmail}
                          onChange={(e) =>
                            setDemoForm({ ...demoForm, workEmail: e.target.value })
                          }
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="demo-orgName"
                          className="block text-xs font-medium mb-1"
                        >
                          Brokerage / Financial Institution Name *
                        </label>
                        <input
                          id="demo-orgName"
                          required
                          type="text"
                          placeholder="e.g., Maple Horizon Mortgage Group"
                          value={demoForm.organizationName}
                          onChange={(e) =>
                            setDemoForm({
                              ...demoForm,
                              organizationName: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label
                            htmlFor="demo-orgType"
                            className="block text-xs font-medium mb-1"
                          >
                            Organization Type
                          </label>
                          <select
                            id="demo-orgType"
                            value={demoForm.organizationType}
                            onChange={(e) =>
                              setDemoForm({
                                ...demoForm,
                                organizationType: e.target.value,
                              })
                            }
                            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-sm"
                          >
                            <option value="MORTGAGE_BROKERAGE">Mortgage Brokerage</option>
                            <option value="MONOLINE_LENDER">Monoline Lender</option>
                            <option value="CREDIT_UNION">Credit Union</option>
                            <option value="FINANCIAL_INSTITUTION">Bank / Institution</option>
                            <option value="INVESTOR">Fintech Investor</option>
                          </select>
                        </div>
                        <div>
                          <label
                            htmlFor="demo-province"
                            className="block text-xs font-medium mb-1"
                          >
                            Province
                          </label>
                          <select
                            id="demo-province"
                            value={demoForm.province}
                            onChange={(e) =>
                              setDemoForm({ ...demoForm, province: e.target.value })
                            }
                            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-sm"
                          >
                            <option value="ON">Ontario (ON)</option>
                            <option value="BC">British Columbia (BC)</option>
                            <option value="AB">Alberta (AB)</option>
                            <option value="QC">Quebec (QC)</option>
                            <option value="NS">Nova Scotia (NS)</option>
                            <option value="MB">Manitoba (MB)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="demo-message"
                        className="block text-xs font-medium mb-1"
                      >
                        Workflow Goals or Questions (Optional)
                      </label>
                      <textarea
                        id="demo-message"
                        rows={3}
                        placeholder="Tell us what mortgage intake or underwriting workflows you want to evaluate..."
                        value={demoForm.message}
                        onChange={(e) =>
                          setDemoForm({ ...demoForm, message: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm"
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Saved locally in SQLite demo database. No external emails transmitted.
                      </span>
                      <button
                        type="submit"
                        disabled={demoStatus === "SUBMITTING"}
                        className="rounded-xl bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-400 hover:to-sky-400 text-slate-950 font-bold px-6 py-3 text-sm shadow-md transition disabled:opacity-50"
                      >
                        {demoStatus === "SUBMITTING"
                          ? "Saving Demo Request..."
                          : "Save Demo Request (Local Demo Mode)"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#060b16] py-12 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center font-bold text-teal-400 text-xs">
                🍁
              </div>
              <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                AI Mortgage Command Center (Canada)
              </strong>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-slate-600 dark:text-slate-400 font-medium">
              <a href="#contact" className="hover:text-teal-400 transition">
                Mortgage Inquiry
              </a>
              <Link href="/contact" className="hover:text-teal-400 transition">
                Contact & Headquarters
              </Link>
              <Link href="/calculators" className="hover:text-teal-400 transition">
                Mortgage Calculators
              </Link>
              <Link href="/intake" className="hover:text-teal-400 transition">
                AI Intake Assistant
              </Link>
              <Link href="/dashboard" className="hover:text-teal-400 transition">
                Broker Dashboard
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              © 2026 AI Mortgage Command Center. Smarter Mortgage Workflows. Human-Controlled Decisions.
            </div>
            <div className="text-center sm:text-right">
              Supervised by Steve (Licensed Broker) • OSFI B-20 Compliant Calculations • Zero Automated Lending Approvals
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
