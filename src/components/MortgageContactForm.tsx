"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Send,
  CheckCircle2,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Briefcase,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calculator,
  HelpCircle,
  FileCheck,
} from "lucide-react";
import {
  calculateDownPaymentAndLtv,
  calculateMortgagePayment,
  calculateStressTest,
} from "@/lib/mortgage-calculators";
import { saveMortgageInquiryWithFallback } from "@/lib/api-client";

interface MortgageContactFormProps {
  className?: string;
  sourcePage?: string;
  onSuccess?: (inquiryRef: string) => void;
}

export function MortgageContactForm({
  className = "",
  sourcePage = "home",
  onSuccess,
}: MortgageContactFormProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    preferredContact: "EMAIL",
    province: "ON",
    city: "Toronto",
    purpose: "PURCHASE",
    isFirstTimeBuyer: true,
    propertyPriceOrValue: 750000,
    downPaymentOrEquity: 75000,
    grossAnnualIncome: 140000,
    employmentType: "SALARIED_FULL_TIME",
    creditScoreEstimate: 720,
    timeline: "Within 60 Days",
    notes: "",
  });

  const [status, setStatus] = useState<"IDLE" | "SUBMITTING" | "SUCCESS" | "ERROR">("IDLE");
  const [errorMessage, setErrorMessage] = useState("");
  const [resultData, setResultData] = useState<any>(null);

  // Live Canadian calculations based on current form inputs
  const liveCalc = useMemo(() => {
    const price = Math.max(Number(formData.propertyPriceOrValue) || 100000, 50000);
    const down = Math.min(
      Math.max(Number(formData.downPaymentOrEquity) || 0, 0),
      price * 0.95
    );

    const downLtv = calculateDownPaymentAndLtv({
      propertyPrice: price,
      downPaymentAmount: down,
      purpose: formData.purpose as any,
      amortizationYears: 25,
    });

    const payment = calculateMortgagePayment({
      principal: downLtv.totalMortgageWithInsurance,
      annualRatePct: 4.79, // Illustrative benchmark 5-year fixed
      amortizationYears: 25,
      frequency: "MONTHLY",
    });

    const stress = calculateStressTest({
      principal: downLtv.totalMortgageWithInsurance,
      contractRatePct: 4.79,
      amortizationYears: 25,
    });

    return {
      downLtv,
      payment,
      stress,
    };
  }, [
    formData.propertyPriceOrValue,
    formData.downPaymentOrEquity,
    formData.purpose,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("SUBMITTING");
    setErrorMessage("");

    if (!formData.fullName.trim()) {
      setStatus("ERROR");
      setErrorMessage("Please provide your full name.");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setStatus("ERROR");
      setErrorMessage("Please provide a valid email address.");
      return;
    }
    if (!formData.phone.trim() || formData.phone.length < 7) {
      setStatus("ERROR");
      setErrorMessage("Please provide a valid phone number.");
      return;
    }

    try {
      const { ok, data } = await saveMortgageInquiryWithFallback({
        ...formData,
        propertyPriceOrValue: Number(formData.propertyPriceOrValue),
        downPaymentOrEquity: Number(formData.downPaymentOrEquity),
        grossAnnualIncome: Number(formData.grossAnnualIncome),
        creditScoreEstimate: Number(formData.creditScoreEstimate),
        sourcePage,
      });

      if (!ok || !data?.success) {
        setStatus("ERROR");
        setErrorMessage(data?.error || "Unable to submit inquiry. Please check your fields.");
        return;
      }

      setResultData(data);
      setStatus("SUCCESS");
      if (onSuccess && data.inquiryRef) {
        onSuccess(data.inquiryRef);
      }
    } catch (err: any) {
      setStatus("ERROR");
      setErrorMessage(err.message || "Failed to submit mortgage inquiry.");
    }
  };

  const setPresetDownPayment = (pct: number) => {
    const price = Number(formData.propertyPriceOrValue) || 750000;
    setFormData((prev) => ({
      ...prev,
      downPaymentOrEquity: Math.round(price * pct),
    }));
  };

  return (
    <div className={`rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-6 sm:p-10 shadow-2xl relative overflow-hidden ${className}`}>
      {/* Subtle background glow */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

      {status === "SUCCESS" && resultData ? (
        <div className="space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-200">
          <div className="rounded-2xl border border-teal-500/40 bg-teal-500/10 p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-teal-500 text-slate-950 flex items-center justify-center font-bold text-xl shadow-lg shadow-teal-500/30">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-teal-400 font-bold">
                    Inquiry Successfully Received
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 text-[10px] font-mono">
                    ⚡ Persisted to Cloudflare D1 SQLite
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Thank You, {formData.fullName}!
                </h3>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Your mortgage interest dossier has been registered in the <strong>AI Mortgage Command Center</strong> and assigned to <strong>Steve (Licensed Mortgage Broker / Officer)</strong> for priority review.
            </p>

            {/* Reference Badge & Live Summary */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-3.5 space-y-1">
                <span className="text-[11px] font-mono uppercase text-slate-500">Inquiry Reference</span>
                <div className="font-mono text-base font-bold text-teal-400">
                  {resultData.inquiryRef}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-3.5 space-y-1">
                <span className="text-[11px] font-mono uppercase text-slate-500">Estimated Loan</span>
                <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                  ${resultData.loanAmount?.toLocaleString()} CAD
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-3.5 space-y-1">
                <span className="text-[11px] font-mono uppercase text-slate-500">Est. Monthly Payment</span>
                <div className="text-base font-bold text-sky-400">
                  ${resultData.estimatedPayment?.toLocaleString()} /mo
                </div>
                <span className="text-[10px] text-slate-500 block">@ 4.79% illustrative</span>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-3.5 space-y-1">
                <span className="text-[11px] font-mono uppercase text-slate-500">Stress Test Rate (B-20)</span>
                <div className="text-base font-bold text-amber-400">
                  {resultData.qualifyingRatePct}%
                </div>
                <span className="text-[10px] text-slate-500 block">OSFI Qualifying</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1">
              <p className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <ShieldCheck className="h-4 w-4 text-teal-400" />
                Human Review Guarantee
              </p>
              <p>
                Our AI agents structure and prepare your numbers, but all final rate options, lender submissions, and mortgage recommendations are conducted exclusively by licensed human mortgage professionals.
              </p>
            </div>

            {/* Fast-Track Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <Link
                href="/intake"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-400 hover:to-sky-400 text-slate-950 font-bold px-5 py-2.5 text-sm shadow-lg shadow-teal-500/20 transition"
              >
                <span>Fast-Track with AI Intake Assistant</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold px-4 py-2.5 text-sm transition"
              >
                <span>View Command Center Pipeline</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setStatus("IDLE");
                  setResultData(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-400 underline underline-offset-4 ml-auto"
              >
                Submit another inquiry
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-400 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Canadian Mortgage Intake • Cloudflare D1 SQLite Database</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Get Started with Your Canadian Mortgage
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              Provide your base mortgage information below. Our automated system calculates your preliminary numbers immediately and routes your file directly to <strong>Steve</strong> for professional brokerage review.
            </p>
          </div>

          {errorMessage && (
            <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 text-sm flex items-center gap-2">
              <span className="font-bold">Error:</span> {errorMessage}
            </div>
          )}

          {/* SECTION 1: Personal & Contact Information */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-teal-400 font-bold flex items-center gap-2">
              <User className="h-3.5 w-3.5" />
              1. Your Contact Information
            </h4>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Alex Tremblay"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="alex@example.ca"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(416) 555-0199"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Province *
                </label>
                <select
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="ON">Ontario (ON)</option>
                  <option value="BC">British Columbia (BC)</option>
                  <option value="AB">Alberta (AB)</option>
                  <option value="QC">Quebec (QC)</option>
                  <option value="NS">Nova Scotia (NS)</option>
                  <option value="MB">Manitoba (MB)</option>
                  <option value="SK">Saskatchewan (SK)</option>
                  <option value="NB">New Brunswick (NB)</option>
                  <option value="PE">Prince Edward Island (PE)</option>
                  <option value="NL">Newfoundland & Labrador (NL)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  City / Municipality *
                </label>
                <div className="relative">
                  <MapPin className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Toronto, Vancouver, Calgary"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Preferred Contact Method
                </label>
                <select
                  value={formData.preferredContact}
                  onChange={(e) => setFormData({ ...formData, preferredContact: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="EMAIL">Email</option>
                  <option value="PHONE">Phone Call</option>
                  <option value="TEXT">SMS / Text Message</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: Mortgage Requirements & Property */}
          <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-mono uppercase tracking-wider text-sky-400 font-bold flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5" />
              2. Mortgage Purpose & Property Details
            </h4>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Mortgage Goal / Purpose *
                </label>
                <select
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="PURCHASE">Purchase a Home</option>
                  <option value="REFINANCE">Refinance Existing Mortgage (Access Equity)</option>
                  <option value="RENEWAL">Mortgage Renewal / Switch Lenders</option>
                  <option value="PRE_APPROVAL">Pre-Approval & Rate Hold</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {formData.purpose === "REFINANCE"
                      ? "Estimated Home Value ($ CAD) *"
                      : "Purchase Price / Budget ($ CAD) *"}
                  </label>
                  <div className="flex gap-1 text-[10px]">
                    {[650000, 800000, 1000000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setFormData({ ...formData, propertyPriceOrValue: val })}
                        className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 hover:text-teal-400 transition"
                      >
                        ${val / 1000}k
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <DollarSign className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="number"
                    min={50000}
                    step={5000}
                    required
                    value={formData.propertyPriceOrValue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        propertyPriceOrValue: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 pl-9 pr-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {formData.purpose === "REFINANCE"
                      ? "Current Mortgage Balance ($) *"
                      : "Available Down Payment ($) *"}
                  </label>
                  {formData.purpose !== "REFINANCE" && (
                    <div className="flex gap-1 text-[10px]">
                      {[0.05, 0.1, 0.2].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setPresetDownPayment(pct)}
                          className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 hover:text-teal-400 transition"
                        >
                          {pct * 100}%
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <DollarSign className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="number"
                    min={0}
                    step={2500}
                    required
                    value={formData.downPaymentOrEquity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        downPaymentOrEquity: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 pl-9 pr-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="firstTimeBuyerCheck"
                checked={formData.isFirstTimeBuyer}
                onChange={(e) =>
                  setFormData({ ...formData, isFirstTimeBuyer: e.target.checked })
                }
                className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-teal-500 focus:ring-teal-500"
              />
              <label
                htmlFor="firstTimeBuyerCheck"
                className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                I am a <strong>First-Time Homebuyer</strong> (eligible for FHSA / 30-year insured amortization rules)
              </label>
            </div>
          </div>

          {/* SECTION 3: Financial Baseline & Live Payment Estimator */}
          <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-mono uppercase tracking-wider text-violet-400 font-bold flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5" />
              3. Financial Baseline & Income
            </h4>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Gross Annual Household Income ($ CAD) *
                </label>
                <div className="relative">
                  <DollarSign className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="number"
                    min={20000}
                    step={5000}
                    required
                    value={formData.grossAnnualIncome}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        grossAnnualIncome: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 pl-9 pr-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Employment Type
                </label>
                <select
                  value={formData.employmentType}
                  onChange={(e) =>
                    setFormData({ ...formData, employmentType: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="SALARIED_FULL_TIME">Salaried Full-Time Permanent</option>
                  <option value="SELF_EMPLOYED">Self-Employed / Sole Proprietor</option>
                  <option value="INCORPORATED_PRO">Incorporated Professional / Business Owner</option>
                  <option value="HOURLY_COMMISSION">Hourly / Commission / Bonus</option>
                  <option value="RETIRED_PENSION">Retired / Pension / Investment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Estimated Credit Rating
                </label>
                <select
                  value={formData.creditScoreEstimate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      creditScoreEstimate: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value={760}>Excellent (750+)</option>
                  <option value={710}>Good (680 – 749)</option>
                  <option value={630}>Fair (600 – 679)</option>
                  <option value={580}>Rebuilding / Below 600</option>
                </select>
              </div>
            </div>

            {/* LIVE PREVIEW BOX */}
            <div className="rounded-2xl border border-teal-500/30 bg-teal-500/5 dark:bg-[#071524] p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-teal-400 font-bold flex items-center gap-1.5">
                  <Calculator className="h-4 w-4" />
                  Live Canadian Mortgage Estimate
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Semi-Annual Compounding
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="text-slate-500 dark:text-slate-400">Base Mortgage Loan</span>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    ${liveCalc.downLtv.baseLoanAmount.toLocaleString()} CAD
                  </div>
                </div>

                <div className="space-y-0.5">
                  <span className="text-slate-500 dark:text-slate-400">Down Payment %</span>
                  <div className="font-bold text-sm text-teal-400">
                    {liveCalc.downLtv.actualDownPaymentPct}%{" "}
                    <span className="text-[10px] font-normal text-slate-400">
                      {liveCalc.downLtv.insuranceRequired ? "(Default Insured)" : "(Conventional)"}
                    </span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <span className="text-slate-500 dark:text-slate-400">Est. Monthly Payment</span>
                  <div className="font-bold text-sm text-sky-400">
                    ${liveCalc.payment.monthlyEquivalentPayment.toLocaleString()} /mo
                  </div>
                  <span className="text-[10px] text-slate-500">@ 4.79% illustrative</span>
                </div>

                <div className="space-y-0.5">
                  <span className="text-slate-500 dark:text-slate-400">OSFI Stress Rate (B-20)</span>
                  <div className="font-bold text-sm text-amber-400">
                    {liveCalc.stress.qualifyingRatePct}%
                  </div>
                  <span className="text-[10px] text-slate-500">Qualifying Rate</span>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Timeline / Moving Date
                </label>
                <select
                  value={formData.timeline}
                  onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Immediately (Under 30 Days)">Immediately (Under 30 Days)</option>
                  <option value="Within 60 Days">Within 60 Days</option>
                  <option value="1 – 3 Months">1 – 3 Months</option>
                  <option value="3 – 6 Months">3 – 6 Months</option>
                  <option value="Just Exploring Rates">Just Exploring Rates & Pre-Qualification</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Questions, Notes or Special Scenarios (Optional)
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Gifted down payment, co-signer available, condo fees"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* PRIVACY & SUBMIT */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
              <p className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-teal-400" />
                <span>CASL & Canadian Privacy Safeguards • No Credit Bureau Hard Inquiries</span>
              </p>
              <p className="text-[11px] text-slate-500">
                Submitting stores your base details for Steve and the mortgage intake team.
              </p>
            </div>

            <button
              type="submit"
              disabled={status === "SUBMITTING"}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-400 hover:to-sky-400 disabled:opacity-50 text-slate-950 font-extrabold px-8 py-3 text-sm shadow-xl shadow-teal-500/25 transition cursor-pointer"
            >
              <Send className="h-4 w-4" />
              <span>{status === "SUBMITTING" ? "Submitting Inquiry..." : "Submit Mortgage Inquiry"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
