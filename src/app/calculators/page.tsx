"use client";

import React, { useState } from "react";
import {
  Calculator,
  DollarSign,
  Percent,
  Scale,
  TrendingDown,
  ShieldCheck,
  RefreshCw,
  Info,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import {
  calculateMortgagePayment,
  calculateAffordability,
  calculateGdsTds,
  calculateRefinanceScenario,
  calculateDownPaymentAndLtv,
  calculateAmortizationComparison,
  calculateStressTest,
  PaymentFrequency,
} from "@/lib/mortgage-calculators";

export default function CalculatorsPage() {
  const [activeTab, setActiveTab] = useState<number>(0);

  // 1. Mortgage Payment Calculator State
  const [pmtPrincipal, setPmtPrincipal] = useState(650000);
  const [pmtRate, setPmtRate] = useState(4.64);
  const [pmtAmort, setPmtAmort] = useState(25);
  const [pmtFreq, setPmtFreq] = useState<PaymentFrequency>("MONTHLY");

  // 2. Affordability Calculator State
  const [affIncome, setAffIncome] = useState(160000);
  const [affDown, setAffDown] = useState(95000);
  const [affDebts, setAffDebts] = useState(550);
  const [affRate, setAffRate] = useState(4.69);
  const [affAmort, setAffAmort] = useState(25);

  // 3. GDS / TDS Calculator State
  const [ratioPayment, setRatioPayment] = useState(3850);
  const [ratioTax, setRatioTax] = useState(4200);
  const [ratioHeat, setRatioHeat] = useState(150);
  const [ratioCondo, setRatioCondo] = useState(400);
  const [ratioDebts, setRatioDebts] = useState(600);
  const [ratioIncome, setRatioIncome] = useState(156000);

  // 4. Refinance Calculator State
  const [refiValue, setRefiValue] = useState(1200000);
  const [refiExisting, setRefiExisting] = useState(510000);
  const [refiRequested, setRefiRequested] = useState(760000);
  const [refiCurrentRate, setRefiCurrentRate] = useState(5.49);
  const [refiNewRate, setRefiNewRate] = useState(4.69);
  const [refiAmort, setRefiAmort] = useState(25);

  // 5. Down Payment & LTV Calculator State
  const [dpPrice, setDpPrice] = useState(820000);
  const [dpAmount, setDpAmount] = useState(82000);
  const [dpPurpose, setDpPurpose] = useState<"PURCHASE" | "REFINANCE">("PURCHASE");

  // 6. Amortization Comparison State
  const [amPrincipal, setAmPrincipal] = useState(680000);
  const [amFixedRate, setAmFixedRate] = useState(4.64);
  const [amVarRate, setAmVarRate] = useState(4.55);

  // 7. Stress-Test Calculator State
  const [stPrincipal, setStPrincipal] = useState(700000);
  const [stContractRate, setStContractRate] = useState(4.69);
  const [stAmort, setStAmort] = useState(25);

  const calc1 = calculateMortgagePayment({
    principal: pmtPrincipal,
    annualRatePct: pmtRate,
    amortizationYears: pmtAmort,
    frequency: pmtFreq,
  });

  const calc2 = calculateAffordability({
    grossAnnualIncome: affIncome,
    downPaymentAmount: affDown,
    monthlyOtherDebts: affDebts,
    contractRatePct: affRate,
    amortizationYears: affAmort,
  });

  const calc3 = calculateGdsTds({
    qualifyingMonthlyPayment: ratioPayment,
    annualPropertyTax: ratioTax,
    monthlyHeating: ratioHeat,
    monthlyCondoFees: ratioCondo,
    monthlyOtherDebts: ratioDebts,
    grossAnnualIncome: ratioIncome,
  });

  const calc4 = calculateRefinanceScenario({
    estimatedPropertyValue: refiValue,
    existingMortgageBalance: refiExisting,
    requestedNewMortgageAmount: refiRequested,
    currentRatePct: refiCurrentRate,
    newRatePct: refiNewRate,
    amortizationYears: refiAmort,
  });

  const calc5 = calculateDownPaymentAndLtv({
    propertyPrice: dpPrice,
    downPaymentAmount: dpAmount,
    purpose: dpPurpose,
  });

  const calc6 = calculateAmortizationComparison({
    principal: amPrincipal,
    fixedRatePct: amFixedRate,
    variableRatePct: amVarRate,
  });

  const calc7 = calculateStressTest({
    principal: stPrincipal,
    contractRatePct: stContractRate,
    amortizationYears: stAmort,
  });

  const calculatorTabs = [
    "1. Payment Calculator",
    "2. Affordability",
    "3. GDS / TDS Ratios",
    "4. Refinance Scenario",
    "5. Down Payment & LTV",
    "6. Amortization Comparison",
    "7. Stress-Test (OSFI B-20)",
  ];

  return (
    <AppShell
      title="7 Interactive Canadian Mortgage Calculators"
      subtitle="Semi-Annual Compounding • OSFI B-20 Stress Test • Default Insurance • GDS/TDS/LTV • Refinance & Amortization"
    >
      {/* Compounding & Assumptions Notice */}
      <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 p-4 text-xs space-y-1">
        <div className="font-bold text-teal-400 flex items-center gap-1.5">
          <Info className="h-4 w-4 shrink-0" />
          <span>
            Canadian Mortgage Compounding & Dated Policy Assumptions (2026-01-01 Reference Baseline)
          </span>
        </div>
        <p className="text-slate-700 dark:text-slate-300">
          Under Section 6 of the <em>Interest Act (Canada)</em>, fixed-rate mortgages compound semi-annually (twice per year), not monthly: periodic rate{" "}
          <code>i = (1 + r/2)^(2/m) - 1</code>. All calculations are illustrative educational estimates and never constitute a mortgage approval or commitment.
        </p>
      </div>

      {/* Calculator Navigation Bar */}
      <div className="flex flex-wrap gap-2">
        {calculatorTabs.map((label, idx) => (
          <button
            key={label}
            type="button"
            onClick={() => setActiveTab(idx)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
              activeTab === idx
                ? "bg-teal-500 text-slate-950 border-teal-400 shadow-md font-bold"
                : "bg-white dark:bg-[#0c1426] border-slate-200 dark:border-slate-800 hover:border-teal-500/40"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 1. MORTGAGE PAYMENT CALCULATOR */}
      {activeTab === 0 && (
        <div className="grid lg:grid-cols-12 gap-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-6">
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-lg font-bold">
              1. Canadian Mortgage Payment Calculator
            </h2>
            <p className="text-xs text-slate-400">
              Computes payments using semi-annual compounding across Monthly, Bi-Weekly, Accelerated Bi-Weekly, Weekly, and Accelerated Weekly schedules.
            </p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">
                  Mortgage Principal (CAD)
                </label>
                <input
                  type="number"
                  value={pmtPrincipal}
                  onChange={(e) => setPmtPrincipal(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Annual Nominal Interest Rate (%)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={pmtRate}
                  onChange={(e) => setPmtRate(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Amortization (Years)
                </label>
                <select
                  value={pmtAmort}
                  onChange={(e) => setPmtAmort(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2"
                >
                  <option value={15}>15 Years</option>
                  <option value={20}>20 Years</option>
                  <option value={25}>25 Years</option>
                  <option value={30}>30 Years</option>
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Payment Frequency
                </label>
                <select
                  value={pmtFreq}
                  onChange={(e) =>
                    setPmtFreq(e.target.value as PaymentFrequency)
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2"
                >
                  <option value="MONTHLY">Monthly (12/yr)</option>
                  <option value="BIWEEKLY">Regular Bi-Weekly (26/yr)</option>
                  <option value="ACCELERATED_BIWEEKLY">
                    Accelerated Bi-Weekly (26/yr)
                  </option>
                  <option value="WEEKLY">Regular Weekly (52/yr)</option>
                  <option value="ACCELERATED_WEEKLY">
                    Accelerated Weekly (52/yr)
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 border border-slate-800">
              <div className="text-xs text-slate-400">
                Selected Periodic Payment ({calc1.frequency})
              </div>
              <div className="text-3xl font-extrabold font-mono text-teal-400 mt-1">
                ${calc1.periodicPayment.toLocaleString()} CAD
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Base Monthly Equivalent: $
                {calc1.monthlyEquivalentPayment.toLocaleString()}/mo
              </div>
            </div>
            <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 border border-slate-800">
              <div className="text-xs text-slate-400">
                Effective Annual Rate (Semi-Annual Compounding)
              </div>
              <div className="text-3xl font-extrabold font-mono text-sky-400 mt-1">
                {calc1.effectiveAnnualRatePct}%
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Effective Payoff Time: {calc1.effectiveYearsToPayoff} Years
              </div>
            </div>
            <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 border border-slate-800">
              <div className="text-xs text-slate-400">
                Total Interest Over Amortization
              </div>
              <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                ${calc1.totalInterestOverAmortization.toLocaleString()} CAD
              </div>
            </div>
            <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 border border-slate-800">
              <div className="text-xs text-slate-400">
                Total Principal + Interest Paid
              </div>
              <div className="text-2xl font-bold font-mono text-violet-400 mt-1">
                ${calc1.totalPaidOverAmortization.toLocaleString()} CAD
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. AFFORDABILITY CALCULATOR */}
      {activeTab === 1 && (
        <div className="grid lg:grid-cols-12 gap-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-6">
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-lg font-bold">
              2. Canadian Mortgage Affordability Calculator
            </h2>
            <p className="text-xs text-slate-400">
              Estimates maximum purchase price and mortgage supported by both stress-tested GDS (39%) / TDS (44%) caps and Canadian minimum down payment rules.
            </p>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">
                  Gross Annual Household Income (CAD)
                </label>
                <input
                  type="number"
                  value={affIncome}
                  onChange={(e) => setAffIncome(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Available Down Payment (CAD)
                </label>
                <input
                  type="number"
                  value={affDown}
                  onChange={(e) => setAffDown(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Monthly Recurring Debts (CAD)
                </label>
                <input
                  type="number"
                  value={affDebts}
                  onChange={(e) => setAffDebts(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Illustrative Contract Rate (%)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={affRate}
                  onChange={(e) => setAffRate(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 border border-slate-800">
              <div className="text-xs text-slate-400">
                Estimated Maximum Purchase Price
              </div>
              <div className="text-3xl font-extrabold font-mono text-teal-400 mt-1">
                ${calc2.estimatedMaxPurchasePrice.toLocaleString()} CAD
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Binding Constraint: {calc2.limitingFactor}
              </div>
            </div>
            <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 border border-slate-800">
              <div className="text-xs text-slate-400">
                Estimated Maximum Base Mortgage
              </div>
              <div className="text-3xl font-extrabold font-mono text-sky-400 mt-1">
                ${calc2.estimatedMaxMortgage.toLocaleString()} CAD
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Qualifying Stress Rate Used: {calc2.qualifyingRatePct}%
              </div>
            </div>
            <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 border border-slate-800">
              <div className="text-xs text-slate-400">
                Estimated Contract Monthly Payment
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                ${calc2.estimatedContractMonthlyPayment.toLocaleString()}/mo
              </div>
            </div>
            <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 border border-slate-800">
              <div className="text-xs text-slate-400">
                Max Qualifying Monthly P&I Allowed
              </div>
              <div className="text-2xl font-bold font-mono text-violet-400 mt-1">
                ${calc2.maxQualifyingMonthlyPayment.toLocaleString()}/mo
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. GDS / TDS CALCULATOR */}
      {activeTab === 2 && (
        <div className="grid lg:grid-cols-12 gap-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-6">
          <div className="lg:col-span-5 space-y-3 text-xs">
            <h2 className="text-lg font-bold">
              3. Gross Debt Service (GDS) & Total Debt Service (TDS) Calculator
            </h2>
            <div>
              <label className="block font-medium mb-1">
                Qualifying Monthly P&I Payment (CAD)
              </label>
              <input
                type="number"
                value={ratioPayment}
                onChange={(e) => setRatioPayment(Number(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 font-mono"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">
                Gross Annual Household Income (CAD)
              </label>
              <input
                type="number"
                value={ratioIncome}
                onChange={(e) => setRatioIncome(Number(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium mb-1">
                  Annual Property Tax (CAD)
                </label>
                <input
                  type="number"
                  value={ratioTax}
                  onChange={(e) => setRatioTax(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Monthly Heating (CAD)
                </label>
                <input
                  type="number"
                  value={ratioHeat}
                  onChange={(e) => setRatioHeat(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Monthly Condo Fees (50% Counted)
                </label>
                <input
                  type="number"
                  value={ratioCondo}
                  onChange={(e) => setRatioCondo(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Monthly Other Debts (CAD)
                </label>
                <input
                  type="number"
                  value={ratioDebts}
                  onChange={(e) => setRatioDebts(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 border border-slate-800">
              <div className="text-xs text-slate-400">
                Gross Debt Service (GDS) Ratio
              </div>
              <div
                className={`text-3xl font-extrabold font-mono mt-1 ${
                  calc3.passesStandardGds ? "text-teal-400" : "text-rose-400"
                }`}
              >
                {calc3.gdsPct}%
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Standard Guideline: &le; {calc3.maxStandardGdsPct}% (
                {calc3.passesStandardGds ? "PASS" : "EXCEEDS STANDARD"})
              </div>
            </div>
            <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 border border-slate-800">
              <div className="text-xs text-slate-400">
                Total Debt Service (TDS) Ratio
              </div>
              <div
                className={`text-3xl font-extrabold font-mono mt-1 ${
                  calc3.passesStandardTds ? "text-sky-400" : "text-rose-400"
                }`}
              >
                {calc3.tdsPct}%
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Standard Guideline: &le; {calc3.maxStandardTdsPct}% (
                {calc3.passesStandardTds ? "PASS" : "EXCEEDS STANDARD"})
              </div>
            </div>
            <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 border border-slate-800">
              <div className="text-xs text-slate-400">
                Monthly GDS Housing Numerator
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                ${calc3.gdsMonthlyHousingCosts.toLocaleString()}/mo
              </div>
            </div>
            <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 border border-slate-800">
              <div className="text-xs text-slate-400">
                Monthly TDS Total Obligations Numerator
              </div>
              <div className="text-2xl font-bold font-mono text-violet-400 mt-1">
                ${calc3.tdsMonthlyTotalObligations.toLocaleString()}/mo
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. REFINANCE SCENARIO CALCULATOR */}
      {activeTab === 3 && (
        <div className="grid lg:grid-cols-12 gap-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-6">
          <div className="lg:col-span-5 space-y-3 text-xs">
            <h2 className="text-lg font-bold">
              4. Canadian Refinance & Equity Scenario Calculator
            </h2>
            <p className="text-slate-400">
              Evaluates maximum 80% LTV conventional refinance limit, net equity release, and payment differential.
            </p>
            <div>
              <label className="block font-medium mb-1">
                Estimated Property Value (CAD)
              </label>
              <input
                type="number"
                value={refiValue}
                onChange={(e) => setRefiValue(Number(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 font-mono"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">
                Existing Mortgage Balance (CAD)
              </label>
              <input
                type="number"
                value={refiExisting}
                onChange={(e) => setRefiExisting(Number(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 font-mono"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">
                Requested New Mortgage Balance (CAD)
              </label>
              <input
                type="number"
                value={refiRequested}
                onChange={(e) => setRefiRequested(Number(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium mb-1">
                  Current Rate (%)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={refiCurrentRate}
                  onChange={(e) =>
                    setRefiCurrentRate(Number(e.target.value) || 0)
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Proposed New Rate (%)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={refiNewRate}
                  onChange={(e) => setRefiNewRate(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 border border-slate-800">
              <div className="text-xs text-slate-400">
                Max 80% LTV Refinance Limit
              </div>
              <div className="text-3xl font-extrabold font-mono text-teal-400 mt-1">
                ${calc4.maxAllowedRefinanceMortgage.toLocaleString()} CAD
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Requested LTV: {calc4.requestedLtvPct}% (
                {calc4.isWithin80LtvLimit
                  ? "Within 80% Cap"
                  : "Exceeds 80% Cap"}
                )
              </div>
            </div>
            <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 border border-slate-800">
              <div className="text-xs text-slate-400">
                Net Cash Equity Proceeds (After Est. Fees)
              </div>
              <div className="text-3xl font-extrabold font-mono text-sky-400 mt-1">
                ${calc4.netCashProceeds.toLocaleString()} CAD
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Max Available Equity: $
                {calc4.maxEquityAvailableToExtract.toLocaleString()}
              </div>
            </div>
            <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 border border-slate-800">
              <div className="text-xs text-slate-400">
                Existing vs Proposed Monthly Payment
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                ${calc4.existingMonthlyPayment.toLocaleString()} → $
                {calc4.proposedMonthlyPayment.toLocaleString()}/mo
              </div>
            </div>
            <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 border border-slate-800">
              <div className="text-xs text-slate-400">
                Monthly Payment Difference
              </div>
              <div className="text-2xl font-bold font-mono text-violet-400 mt-1">
                {calc4.monthlyPaymentDifference >= 0 ? "+" : ""}$
                {calc4.monthlyPaymentDifference.toLocaleString()}/mo
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. DOWN PAYMENT & LTV CALCULATOR */}
      {activeTab === 4 && (
        <div className="grid lg:grid-cols-12 gap-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-6">
          <div className="lg:col-span-5 space-y-3 text-xs">
            <h2 className="text-lg font-bold">
              5. Down Payment, LTV & Default Insurance Calculator
            </h2>
            <p className="text-slate-400">
              Checks Canadian tiered minimum down payment requirements (5% on first $500k, 10% up to $1.5M, 20% at $1.5M+) and CMHC/Sagen/Canada Guaranty insurance premiums.
            </p>
            <div>
              <label className="block font-medium mb-1">
                Property Purchase Price / Value (CAD)
              </label>
              <input
                type="number"
                value={dpPrice}
                onChange={(e) => setDpPrice(Number(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 font-mono"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">
                Down Payment Amount (CAD)
              </label>
              <input
                type="number"
                value={dpAmount}
                onChange={(e) => setDpAmount(Number(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 font-mono"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Transaction Type</label>
              <select
                value={dpPurpose}
                onChange={(e) =>
                  setDpPurpose(e.target.value as "PURCHASE" | "REFINANCE")
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2"
              >
                <option value="PURCHASE">Purchase</option>
                <option value="REFINANCE">Refinance (Min 20% Equity)</option>
              </select>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 border border-slate-800">
                <div className="text-xs text-slate-400">
                  Minimum Required Down Payment
                </div>
                <div className="text-2xl font-extrabold font-mono text-teal-400 mt-1">
                  ${calc5.minimumRequiredDownPayment.toLocaleString()} CAD (
                  {calc5.minimumDownPaymentPct}%)
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Actual Down Payment: {calc5.actualDownPaymentPct}% (
                  {calc5.meetsMinimumDownPayment ? "Meets Rule" : "Below Minimum"}
                  )
                </div>
              </div>
              <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 border border-slate-800">
                <div className="text-xs text-slate-400">
                  Base LTV & Default Insurance Premium
                </div>
                <div className="text-2xl font-extrabold font-mono text-sky-400 mt-1">
                  {calc5.baseLtvPct}% LTV • +$
                  {calc5.insurancePremiumAmount.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Total Financed Loan: $
                  {calc5.totalMortgageWithInsurance.toLocaleString()} CAD
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 border border-slate-800 text-xs">
              <strong>Policy Assessment:</strong> {calc5.policyExplanation}
            </div>
          </div>
        </div>
      )}

      {/* 6. AMORTIZATION COMPARISON CALCULATOR */}
      {activeTab === 5 && (
        <div className="space-y-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-6">
          <div className="grid lg:grid-cols-12 gap-6 items-end">
            <div className="lg:col-span-4">
              <h2 className="text-lg font-bold">
                6. Amortization & Fixed vs. Variable Comparison
              </h2>
              <p className="text-xs text-slate-400">
                Compare 15, 20, 25, and 30-year amortizations and visualize 25-year principal paydown.
              </p>
            </div>
            <div className="lg:col-span-8 grid sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-medium mb-1">
                  Mortgage Principal (CAD)
                </label>
                <input
                  type="number"
                  value={amPrincipal}
                  onChange={(e) => setAmPrincipal(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Fixed Rate (%)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={amFixedRate}
                  onChange={(e) => setAmFixedRate(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  Variable Rate (%)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={amVarRate}
                  onChange={(e) => setAmVarRate(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-4 gap-4 text-xs">
            {calc6.scenarios.map((s) => (
              <div
                key={s.amortizationYears}
                className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 border border-slate-800 space-y-1.5"
              >
                <div className="text-sm font-bold text-teal-400">
                  {s.amortizationYears} Years
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">Fixed Monthly:</span>
                  <span>${s.fixedMonthlyPayment.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">Variable Monthly:</span>
                  <span>${s.variableMonthlyPayment.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">Total Fixed Int:</span>
                  <span>${s.totalInterestFixed.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-mono text-[11px] text-sky-400 pt-1 border-t border-slate-800">
                  <span>5-Yr Balance:</span>
                  <span>${s.balanceEndOfTermFixed.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={calc6.yearlySchedule}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                />
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
                <Area
                  type="monotone"
                  dataKey="remainingBalance"
                  name="Remaining Principal Balance (CAD)"
                  stroke="#14b8a6"
                  fill="#14b8a6"
                  fillOpacity={0.2}
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeInterest"
                  name="Cumulative Interest Paid (CAD)"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.15}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 7. OSFI B-20 MORTGAGE STRESS-TEST CALCULATOR */}
      {activeTab === 6 && (
        <div className="grid lg:grid-cols-12 gap-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-6">
          <div className="lg:col-span-5 space-y-3 text-xs">
            <h2 className="text-lg font-bold">
              7. OSFI Guideline B-20 Mortgage Stress-Test Calculator
            </h2>
            <p className="text-slate-400">
              Computes the qualifying stress-test rate{" "}
              <code>max(Contract Rate + 2.00%, 5.25% Floor)</code> and resulting monthly payment buffer required to qualify.
            </p>
            <div>
              <label className="block font-medium mb-1">
                Mortgage Amount (CAD)
              </label>
              <input
                type="number"
                value={stPrincipal}
                onChange={(e) => setStPrincipal(Number(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 font-mono"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">
                Contract Interest Rate (%)
              </label>
              <input
                type="number"
                step="0.05"
                value={stContractRate}
                onChange={(e) => setStContractRate(Number(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 font-mono"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">
                Amortization (Years)
              </label>
              <select
                value={stAmort}
                onChange={(e) => setStAmort(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2"
              >
                <option value={15}>15 Years</option>
                <option value={20}>20 Years</option>
                <option value={25}>25 Years</option>
                <option value={30}>30 Years</option>
              </select>
            </div>
          </div>

          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 border border-slate-800">
              <div className="text-xs text-slate-400">
                Qualifying Stress-Test Rate
              </div>
              <div className="text-3xl font-extrabold font-mono text-teal-400 mt-1">
                {calc7.qualifyingRatePct}%
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {calc7.usedFloorRate
                  ? `Benchmark Floor (${calc7.benchmarkFloorPct}%) Applied`
                  : `Contract (${calc7.contractRatePct}%) + ${calc7.bufferPct}% Buffer`}
              </div>
            </div>
            <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 border border-slate-800">
              <div className="text-xs text-slate-400">
                Stress-Tested Qualifying Monthly Payment
              </div>
              <div className="text-3xl font-extrabold font-mono text-sky-400 mt-1">
                ${calc7.stressTestMonthlyPayment.toLocaleString()}/mo
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Actual Contract Payment: $
                {calc7.contractMonthlyPayment.toLocaleString()}/mo
              </div>
            </div>
            <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 border border-slate-800">
              <div className="text-xs text-slate-400">
                Monthly Qualifying Buffer Required
              </div>
              <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                +${calc7.monthlyPaymentIncrease.toLocaleString()}/mo
              </div>
            </div>
            <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-4 border border-slate-800">
              <div className="text-xs text-slate-400">
                Payment Increase Under Stress Test
              </div>
              <div className="text-2xl font-bold font-mono text-violet-400 mt-1">
                +{calc7.percentagePaymentIncrease}%
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
