"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Send,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  UserPlus,
  Building,
  Briefcase,
  DollarSign,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAppContext } from "@/context/AppContext";
import {
  SAMPLE_BORROWER_SCENARIOS,
  identifyMissingIntakeFields,
} from "@/lib/agent-services";
import {
  calculateDownPaymentAndLtv,
  calculateGdsTds,
  calculateStressTest,
} from "@/lib/mortgage-calculators";
import {
  fetchApplicationsWithFallback,
  createOrResetApplicationWithFallback,
  sendIntakeChatWithFallback,
} from "@/lib/api-client";

const mortgageIntakeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(7, "Phone number is required"),
  province: z.string().min(2, "Province is required"),
  city: z.string().min(2, "City is required"),
  address: z.string().min(3, "Property street address is required"),
  postalCode: z.string().min(3, "Postal code is required"),
  purpose: z.enum(["PURCHASE", "REFINANCE", "RENEWAL"]),
  isFirstTimeBuyer: z.boolean(),
  propertyType: z.string(),
  occupancy: z.string(),
  purchasePriceOrValue: z.coerce
    .number()
    .min(50000, "Property value must be at least $50,000 CAD"),
  downPaymentAmount: z.coerce.number().min(0, "Down payment cannot be negative"),
  downPaymentSource: z.string(),
  existingMortgageBalance: z.coerce.number().min(0),
  requestedMortgageAmount: z.coerce
    .number()
    .min(25000, "Requested mortgage must be at least $25,000 CAD"),
  amortizationYears: z.coerce.number().min(5).max(30),
  termYears: z.coerce.number().min(1).max(10),
  ratePreference: z.enum(["FIXED", "VARIABLE"]),
  paymentFrequency: z.enum(["MONTHLY", "BIWEEKLY", "ACCELERATED_BIWEEKLY"]),
  creditScoreEstimate: z.coerce
    .number()
    .min(300, "Canadian credit score range is 300-900")
    .max(900, "Canadian credit score range is 300-900"),
  employmentType: z.string(),
  employerName: z.string().min(2, "Employer or business name is required"),
  jobTitle: z.string().min(2, "Job title or role is required"),
  yearsAtEmployer: z.coerce.number().min(0),
  incomeFrequency: z.enum(["ANNUAL", "MONTHLY", "BIWEEKLY"]).default("ANNUAL"),
  grossAnnualIncome: z.coerce
    .number()
    .min(15000, "Gross annual income is required"),
  otherMonthlyIncome: z.coerce.number().min(0),
  monthlyDebts: z.coerce.number().min(0),
  annualPropertyTax: z.coerce.number().min(0),
  monthlyHeating: z.coerce.number().min(0),
  monthlyCondoFees: z.coerce.number().min(0),
  coBorrowerName: z.string().optional(),
  coBorrowerIncome: z.coerce.number().min(0).optional(),
});

type IntakeFormValues = z.infer<typeof mortgageIntakeSchema>;

export default function IntakePage() {
  const router = useRouter();
  const { selectedApplicationId, setSelectedApplicationId } = useAppContext();
  const [applications, setApplications] = useState<any[]>([]);
  const [activeScenarioId, setActiveScenarioId] =
    useState<string>("FIRST_TIME_BUYER");

  // Conversational Assistant state
  const [chatInput, setChatInput] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<
    Array<{ sender: "AGENT" | "USER" | "GUARDRAIL"; text: string }>
  >([
    {
      sender: "AGENT",
      text: "Welcome to Agent 1 (AI Borrower Intake). Describe a fictional Canadian borrower scenario in plain English (e.g., 'Buying an $820k townhouse in Vancouver with 15% down, earning $165k/yr, credit score 740'), or load one of the 5 sample scenarios above.",
    },
  ]);
  const [saving, setSaving] = useState(false);
  const [saveSuccessRef, setSaveSuccessRef] = useState<string | null>(null);

  const defaultScenario = SAMPLE_BORROWER_SCENARIOS[0].data;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<IntakeFormValues>({
    resolver: zodResolver(mortgageIntakeSchema),
    defaultValues: {
      ...defaultScenario,
      incomeFrequency: "ANNUAL",
      coBorrowerName: defaultScenario.coBorrowerName || "",
      coBorrowerIncome: defaultScenario.coBorrowerIncome || 0,
    },
  });

  const watchedValues = watch();

  useEffect(() => {
    fetchApplicationsWithFallback()
      .then((d) => {
        if (d.success) setApplications(d.applications || []);
      })
      .catch(() => {});
  }, []);

  // Real-time derived Canadian mortgage calculations
  const downLtv = calculateDownPaymentAndLtv({
    propertyPrice: Number(watchedValues.purchasePriceOrValue) || 0,
    downPaymentAmount:
      watchedValues.purpose === "PURCHASE"
        ? Number(watchedValues.downPaymentAmount) || 0
        : Math.max(
            0,
            (Number(watchedValues.purchasePriceOrValue) || 0) -
              (Number(watchedValues.requestedMortgageAmount) || 0)
          ),
    purpose: watchedValues.purpose || "PURCHASE",
    amortizationYears: Number(watchedValues.amortizationYears) || 25,
    isFirstTimeBuyer: Boolean(watchedValues.isFirstTimeBuyer),
  });

  const financedAmount =
    watchedValues.purpose === "PURCHASE"
      ? downLtv.totalMortgageWithInsurance
      : Number(watchedValues.requestedMortgageAmount) || 0;

  const illustrativeRate =
    watchedValues.ratePreference === "VARIABLE" ? 4.55 : 4.64;

  const stressTest = calculateStressTest({
    principal: financedAmount,
    contractRatePct: illustrativeRate,
    amortizationYears: Number(watchedValues.amortizationYears) || 25,
  });

  const totalHouseholdIncome =
    (Number(watchedValues.grossAnnualIncome) || 0) +
    (Number(watchedValues.coBorrowerIncome) || 0) +
    (Number(watchedValues.otherMonthlyIncome) || 0) * 12;

  const gdsTds = calculateGdsTds({
    qualifyingMonthlyPayment: stressTest.stressTestMonthlyPayment,
    annualPropertyTax: Number(watchedValues.annualPropertyTax) || 0,
    monthlyHeating: Number(watchedValues.monthlyHeating) || 0,
    monthlyCondoFees: Number(watchedValues.monthlyCondoFees) || 0,
    monthlyOtherDebts: Number(watchedValues.monthlyDebts) || 0,
    grossAnnualIncome: totalHouseholdIncome,
  });

  const missingFields = identifyMissingIntakeFields(watchedValues);

  const handleLoadScenario = (scenarioId: string) => {
    const found = SAMPLE_BORROWER_SCENARIOS.find((s) => s.id === scenarioId);
    if (!found) return;
    setActiveScenarioId(scenarioId);
    setSaveSuccessRef(null);
    reset({
      ...found.data,
      incomeFrequency: "ANNUAL",
      coBorrowerName: found.data.coBorrowerName || "",
      coBorrowerIncome: found.data.coBorrowerIncome || 0,
    });
    setChatHistory((prev) => [
      ...prev,
      {
        sender: "AGENT",
        text: `Loaded sample scenario "${found.label}": ${found.description}`,
      },
    ]);
  };

  const handleSendChat = async (customText?: string) => {
    const textToSend = (customText ?? chatInput).trim();
    if (!textToSend) return;
    if (!customText) setChatInput("");

    setChatHistory((prev) => [...prev, { sender: "USER", text: textToSend }]);

    try {
      const data = await sendIntakeChatWithFallback({
        message: textToSend,
        currentData: watchedValues,
        applicationId: selectedApplicationId,
      });
      if (data.guardrailTriggered) {
        setChatHistory((prev) => [
          ...prev,
          { sender: "GUARDRAIL", text: data.reply },
        ]);
        return;
      }

      if (data.updates && Object.keys(data.updates).length > 0) {
        Object.entries(data.updates).forEach(([k, v]) => {
          setValue(k as any, v as any, { shouldValidate: true });
        });
      }

      setChatHistory((prev) => [
        ...prev,
        { sender: "AGENT", text: data.reply },
      ]);
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        {
          sender: "AGENT",
          text: "Could not process message; please use the structured form fields.",
        },
      ]);
    }
  };

  const onSubmitForm = async (values: IntakeFormValues) => {
    setSaving(true);
    setSaveSuccessRef(null);
    try {
      const data = await createOrResetApplicationWithFallback({
        ...values,
        scenarioPreset: activeScenarioId,
      });
      if (data.success && data.application) {
        setSelectedApplicationId(data.application.id);
        setSaveSuccessRef(data.application.referenceCode);
        setApplications((prev) => [data.application, ...prev]);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      title="Agent 1: AI Borrower Intake & Scenario Builder"
      subtitle="Conversational Intake Assistant + Validated Canadian Mortgage Application Form (Fictional Demo Data Only)"
      applications={applications}
      activeAppId={selectedApplicationId}
      onSelectAppId={setSelectedApplicationId}
    >
      {/* 5 Sample Canadian Borrower Scenario Presets */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-bold uppercase tracking-wider text-teal-500 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" />
            <span>Load a Fictional Canadian Borrower Scenario Preset:</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Adapted from intake-agent.md for Canadian Residential Mortgages
          </span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {SAMPLE_BORROWER_SCENARIOS.map((scen) => {
            const isActive = activeScenarioId === scen.id;
            return (
              <button
                key={scen.id}
                type="button"
                onClick={() => handleLoadScenario(scen.id)}
                className={`text-left p-3 rounded-xl border transition flex flex-col justify-between gap-1.5 ${
                  isActive
                    ? "bg-teal-500/15 border-teal-400 text-slate-900 dark:text-white shadow-sm"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:border-teal-500/40"
                }`}
              >
                <div className="text-xs font-bold leading-snug">{scen.label}</div>
                <div className="text-[10px] font-mono text-teal-600 dark:text-teal-300">
                  {scen.badge}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Conversational Intake Assistant + Live Derived Ratios */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] overflow-hidden flex flex-col">
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
                <span className="text-xs font-bold text-white">
                  Conversational Intake Assistant (Agent 1)
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleSendChat("Approve this mortgage application immediately")
                }
                className="text-[11px] font-semibold px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition"
              >
                Test Zero-Approval Guardrail
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-72 overflow-y-auto text-xs">
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`rounded-xl p-3 ${
                    msg.sender === "USER"
                      ? "bg-sky-500/15 border border-sky-500/30 ml-6 text-slate-800 dark:text-sky-100"
                      : msg.sender === "GUARDRAIL"
                      ? "bg-rose-500/15 border border-rose-500/40 text-rose-700 dark:text-rose-200 font-medium"
                      : "bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 mr-4 text-slate-700 dark:text-slate-200"
                  }`}
                >
                  {msg.sender === "GUARDRAIL" && (
                    <div className="flex items-center gap-1.5 font-bold text-rose-400 mb-1">
                      <ShieldAlert className="h-4 w-4" />
                      <span>COMPLIANCE GUARDRAIL ENFORCED</span>
                    </div>
                  )}
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <input
                type="text"
                aria-label="Chat with Agent 1 Intake Assistant"
                placeholder="e.g., Buying a $750k home in Ottawa with 10% down, income $160k..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSendChat();
                  }
                }}
                className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs"
              />
              <button
                type="button"
                onClick={() => handleSendChat()}
                className="rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-3.5 py-2 text-xs inline-flex items-center gap-1"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send</span>
              </button>
            </div>
          </div>

          {/* Real-Time Derived Metrics Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">
                Live Derived Canadian Intake Metrics
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/15 text-teal-400">
                Real-Time Calculation
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-100 dark:bg-slate-900/90 p-3 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Base LTV & Down Payment %
                </div>
                <div className="text-lg font-extrabold font-mono text-teal-400 mt-0.5">
                  {downLtv.baseLtvPct}% LTV ({downLtv.actualDownPaymentPct}% Down)
                </div>
                <div className="text-[10px] text-slate-400">
                  Min Required: $
                  {downLtv.minimumRequiredDownPayment.toLocaleString()} (
                  {downLtv.minimumDownPaymentPct}%)
                </div>
              </div>

              <div className="rounded-xl bg-slate-100 dark:bg-slate-900/90 p-3 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Default Insurance & Total Loan
                </div>
                <div className="text-lg font-extrabold font-mono text-sky-400 mt-0.5">
                  ${financedAmount.toLocaleString()} CAD
                </div>
                <div className="text-[10px] text-slate-400">
                  {downLtv.insuranceRequired
                    ? `Insured (+$${downLtv.insurancePremiumAmount.toLocaleString()})`
                    : "Uninsured Conventional"}
                </div>
              </div>

              <div className="rounded-xl bg-slate-100 dark:bg-slate-900/90 p-3 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Stress-Tested GDS / TDS
                </div>
                <div className="text-lg font-extrabold font-mono text-violet-400 mt-0.5">
                  {gdsTds.gdsPct}% / {gdsTds.tdsPct}%
                </div>
                <div className="text-[10px] text-slate-400">
                  At {stressTest.qualifyingRatePct}% OSFI B-20 Rate
                </div>
              </div>

              <div className="rounded-xl bg-slate-100 dark:bg-slate-900/90 p-3 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Est. Monthly Payment (P&I)
                </div>
                <div className="text-lg font-extrabold font-mono text-emerald-400 mt-0.5">
                  ${stressTest.contractMonthlyPayment.toLocaleString()}/mo
                </div>
                <div className="text-[10px] text-slate-400">
                  Stress Payment: $
                  {stressTest.stressTestMonthlyPayment.toLocaleString()}/mo
                </div>
              </div>
            </div>

            {missingFields.length > 0 ? (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Missing Intake Fields ({missingFields.length}):</span>
                </div>
                <p>{missingFields.join(", ")}</p>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  All required intake fields are populated and ready to persist.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Structured Canadian Mortgage Application Form */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-6">
          <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold">
                  Structured Canadian Mortgage Application Form
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Validated with React Hook Form & Zod. Saves directly to local SQLite and hands off to Agent 2.
                </p>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                FICTIONAL DEMO DATA ONLY
              </span>
            </div>

            {saveSuccessRef && (
              <div
                role="status"
                className="rounded-xl border border-teal-500/40 bg-teal-500/15 p-4 text-xs space-y-2"
              >
                <div className="font-bold text-teal-300 flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    Application {saveSuccessRef} Saved & Handed Off to Agent 2!
                  </span>
                </div>
                <p className="text-slate-300">
                  Structured borrower, property, income, liability, document checklist, and preliminary qualification records have been persisted in SQLite.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => router.push("/documents")}
                    className="rounded-lg bg-teal-500 text-slate-950 font-bold px-3.5 py-1.5 text-xs inline-flex items-center gap-1"
                  >
                    <span>Proceed to Agent 2: Document Verification</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Section 1: Borrower & Co-Borrower Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                <UserPlus className="h-4 w-4" />
                <span>1. Borrower & Co-Borrower Profile</span>
              </h3>
              <div className="grid sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    First Name *
                  </label>
                  <input
                    {...register("firstName")}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs"
                  />
                  {errors.firstName && (
                    <p className="text-[11px] text-rose-400 mt-1">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Last Name *
                  </label>
                  <input
                    {...register("lastName")}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs"
                  />
                  {errors.lastName && (
                    <p className="text-[11px] text-rose-400 mt-1">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    {...register("email")}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Phone Number *
                  </label>
                  <input
                    {...register("phone")}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Voluntary Credit Score Estimate (300–900)
                  </label>
                  <input
                    type="number"
                    {...register("creditScoreEstimate")}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs font-mono"
                  />
                  {errors.creditScoreEstimate && (
                    <p className="text-[11px] text-rose-400 mt-1">
                      {errors.creditScoreEstimate.message}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    id="isFirstTimeBuyer"
                    type="checkbox"
                    {...register("isFirstTimeBuyer")}
                    className="h-4 w-4 rounded border-slate-600"
                  />
                  <label htmlFor="isFirstTimeBuyer" className="text-xs font-medium">
                    First-Time Homebuyer Status (FHSA / HBP Eligible)
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Co-Borrower Full Name (If Applicable)
                  </label>
                  <input
                    placeholder="Optional co-applicant"
                    {...register("coBorrowerName")}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Co-Borrower Annual Income (CAD)
                  </label>
                  <input
                    type="number"
                    {...register("coBorrowerIncome")}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Property & Mortgage Purpose */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <Building className="h-4 w-4" />
                <span>2. Canadian Property Location & Mortgage Purpose</span>
              </h3>
              <div className="grid sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Mortgage Purpose *
                  </label>
                  <select
                    {...register("purpose")}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs"
                  >
                    <option value="PURCHASE">Purchase</option>
                    <option value="REFINANCE">Refinance</option>
                    <option value="RENEWAL">Renewal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Province *
                  </label>
                  <select
                    {...register("province")}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs"
                  >
                    <option value="ON">Ontario (ON)</option>
                    <option value="BC">British Columbia (BC)</option>
                    <option value="AB">Alberta (AB)</option>
                    <option value="QC">Quebec (QC)</option>
                    <option value="NS">Nova Scotia (NS)</option>
                    <option value="MB">Manitoba (MB)</option>
                    <option value="SK">Saskatchewan (SK)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">City *</label>
                  <input
                    {...register("city")}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium mb-1">
                    Property Street Address *
                  </label>
                  <input
                    {...register("address")}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Property Type
                  </label>
                  <select
                    {...register("propertyType")}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs"
                  >
                    <option value="DETACHED">Single-Family Detached</option>
                    <option value="TOWNHOUSE">Townhouse / Row</option>
                    <option value="CONDO_APARTMENT">Condo Apartment</option>
                    <option value="DUPLEX">Duplex / 2-Unit</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Mortgage Financing, Down Payment & Terms */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
                <DollarSign className="h-4 w-4" />
                <span>3. Property Value, Down Payment & Requested Terms</span>
              </h3>
              <div className="grid sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Purchase Price / Value (CAD) *
                  </label>
                  <input
                    type="number"
                    {...register("purchasePriceOrValue")}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Down Payment / Equity (CAD) *
                  </label>
                  <input
                    type="number"
                    {...register("downPaymentAmount")}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Source of Down Payment
                  </label>
                  <select
                    {...register("downPaymentSource")}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs"
                  >
                    <option value="SAVINGS">Personal Savings (90-Day History)</option>
                    <option value="FHSA_RRSP_HBP">FHSA + RRSP Home Buyers&apos; Plan</option>
                    <option value="GIFT_IMMEDIATE_FAMILY">Immediate Family Gift Letter</option>
                    <option value="SALE_OF_EXISTING_PROPERTY">Proceeds of Property Sale</option>
                    <option value="EQUITY">Existing Home Equity (Refi/Renewal)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Requested Mortgage (CAD) *
                  </label>
                  <input
                    type="number"
                    {...register("requestedMortgageAmount")}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Existing Mortgage Balance (CAD)
                  </label>
                  <input
                    type="number"
                    {...register("existingMortgageBalance")}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Rate Preference
                  </label>
                  <select
                    {...register("ratePreference")}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs"
                  >
                    <option value="FIXED">Fixed Rate</option>
                    <option value="VARIABLE">Variable Rate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Desired Amortization (Years)
                  </label>
                  <select
                    {...register("amortizationYears")}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs"
                  >
                    <option value={15}>15 Years</option>
                    <option value={20}>20 Years</option>
                    <option value={25}>25 Years</option>
                    <option value={30}>30 Years</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Desired Term (Years)
                  </label>
                  <select
                    {...register("termYears")}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs"
                  >
                    <option value={1}>1-Year Term</option>
                    <option value={2}>2-Year Term</option>
                    <option value={3}>3-Year Term</option>
                    <option value={5}>5-Year Term</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Payment Frequency
                  </label>
                  <select
                    {...register("paymentFrequency")}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs"
                  >
                    <option value="MONTHLY">Monthly (12/yr)</option>
                    <option value="BIWEEKLY">Regular Bi-Weekly (26/yr)</option>
                    <option value="ACCELERATED_BIWEEKLY">
                      Accelerated Bi-Weekly (26/yr)
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 4: Employment, Gross Income & Liabilities */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Briefcase className="h-4 w-4" />
                <span>4. Employment, Gross Income & Property Carrying Costs</span>
              </h3>
              <div className="grid sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Employment Type
                  </label>
                  <select
                    {...register("employmentType")}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs"
                  >
                    <option value="SALARIED_FULL_TIME">Permanent Salaried (T4)</option>
                    <option value="SELF_EMPLOYED_BFS">
                      Self-Employed / Business-for-Self (BFS)
                    </option>
                    <option value="CONTRACT_HOURLY">Contract / Hourly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Employer / Business Name *
                  </label>
                  <input
                    {...register("employerName")}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Job Title & Tenure (Yrs)
                  </label>
                  <input
                    {...register("jobTitle")}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Gross Annual Income (CAD) *
                  </label>
                  <input
                    type="number"
                    {...register("grossAnnualIncome")}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Monthly Non-Mortgage Debts (CAD)
                  </label>
                  <input
                    type="number"
                    {...register("monthlyDebts")}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Annual Property Tax (CAD)
                  </label>
                  <input
                    type="number"
                    {...register("annualPropertyTax")}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Monthly Heating (CAD)
                  </label>
                  <input
                    type="number"
                    {...register("monthlyHeating")}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Monthly Condo Fees (50% in GDS)
                  </label>
                  <input
                    type="number"
                    {...register("monthlyCondoFees")}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Years at Employer
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    {...register("yearsAtEmployer")}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500">
                Agent 1 saves the dossier and initializes Agent 2&apos;s Document Checklist.
              </span>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-400 hover:to-sky-400 text-slate-950 font-bold px-6 py-3 text-xs shadow-md transition disabled:opacity-50"
              >
                {saving
                  ? "Validating & Saving Application..."
                  : "Save Structured Mortgage Application →"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
