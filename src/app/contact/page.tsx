"use client";

import React from "react";
import Link from "next/link";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  Sun,
  Moon,
  Sparkles,
  Calculator,
  Compass,
  CheckCircle2,
} from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { MortgageContactForm } from "@/components/MortgageContactForm";

export default function ContactPage() {
  const { theme, toggleTheme } = useAppContext();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#060b16] dark:text-slate-100 transition-colors">
      {/* Top Banner */}
      <div className="border-b border-teal-500/30 bg-slate-900/95 text-slate-200 px-4 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/20 border border-teal-400/40 px-2.5 py-0.5 font-semibold text-teal-300">
              <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
              CANADIAN MORTGAGE INTAKE
            </span>
            <span className="hidden md:inline text-slate-300">
              Direct Contact & Base Information Portal • Supervised by Steve (Licensed Broker)
            </span>
          </div>
          <Link
            href="/guided-demo"
            className="text-sky-300 hover:text-sky-200 font-medium underline underline-offset-4"
          >
            Launch 6-Step Guided Walkthrough →
          </Link>
        </div>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/85 dark:bg-[#0a1122]/85 border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 via-sky-500 to-violet-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight">
                  AI Mortgage Command Center
                </span>
                <span className="hidden sm:inline-block text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  Canada
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Smarter Mortgage Workflows. Human-Controlled Decisions.
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <Link href="/" className="hover:text-teal-400 transition">
              Home
            </Link>
            <Link href="/calculators" className="hover:text-teal-400 transition">
              Calculators
            </Link>
            <Link href="/intake" className="hover:text-teal-400 transition">
              AI Intake Assistant
            </Link>
            <Link href="/dashboard" className="hover:text-teal-400 transition">
              Broker Dashboard
            </Link>
            <Link href="/contact" className="text-teal-400 font-bold border-b-2 border-teal-400 pb-0.5">
              Contact & Inquiry
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle color theme"
              className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
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
              <span>Command Center</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Page Hero */}
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-400 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Direct Borrower & Client Advisory</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Mortgage Contact & Base Information Portal
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Whether you are purchasing your first home, accessing equity via refinance, or renewing an existing mortgage, submit your base information below. Our automated systems calculate instant estimates, and licensed broker <strong>Steve</strong> personally reviews every file.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Office & Broker Details */}
          <div className="lg:col-span-4 space-y-6">
            {/* Broker Officer Profile Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-teal-500 to-sky-500 flex items-center justify-center font-bold text-slate-950 text-xl shadow-md">
                  S
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Steve
                  </h3>
                  <p className="text-xs text-teal-500 font-medium">
                    Licensed Principal Mortgage Broker & Underwriter
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 dark:text-slate-200 block">Canadian Headquarters</strong>
                    <span>Bay Street Financial District, Toronto, ON, Canada</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Phone className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 dark:text-slate-200 block">Direct Toll-Free Line</strong>
                    <span>1 (800) 555-MORT / (416) 555-0199</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Mail className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 dark:text-slate-200 block">Direct Inquiry Inbox</strong>
                    <span>steve@aimortgagecommand.ca</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 dark:text-slate-200 block">Advisory Hours (EST)</strong>
                    <span>Mon – Fri: 8:00 AM – 7:00 PM<br />Sat: 10:00 AM – 4:00 PM</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                  <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
                  <span>Licensed Across Canadian Provinces</span>
                </div>
                <p>
                  Ontario (FSRA Lic. #13420) • British Columbia (BCFSA) • Alberta (RECA)
                </p>
              </div>
            </div>

            {/* Quick Links Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1426] p-6 shadow-xl space-y-4">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">
                Self-Service Mortgage Tools
              </h4>
              <div className="space-y-2">
                <Link
                  href="/calculators"
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-500/50 hover:bg-teal-500/5 transition text-xs font-medium"
                >
                  <span className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-teal-400" />
                    <span>7 Canadian Mortgage Calculators</span>
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>

                <Link
                  href="/intake"
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 hover:bg-sky-500/5 transition text-xs font-medium"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-sky-400" />
                    <span>Full AI Borrower Intake Assistant</span>
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>

                <Link
                  href="/guided-demo"
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-violet-500/50 hover:bg-violet-500/5 transition text-xs font-medium"
                >
                  <span className="flex items-center gap-2">
                    <Compass className="h-4 w-4 text-violet-400" />
                    <span>6-Step Guided Walkthrough</span>
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Mortgage Contact Form */}
          <div className="lg:col-span-8">
            <MortgageContactForm sourcePage="contact_page" />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 mt-20 py-10 bg-white/50 dark:bg-[#060b16]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 space-y-2">
          <p>
            © 2026 AI Mortgage Command Center. Smarter Mortgage Workflows. Human-Controlled Decisions.
          </p>
          <p className="max-w-2xl mx-auto">
            Disclosures: Fictional demonstration environment. Does not constitute a mortgage approval, commitment, or binding rate lock. All Canadian mortgage qualification formulas conform to OSFI Guideline B-20.
          </p>
        </div>
      </footer>
    </div>
  );
}

