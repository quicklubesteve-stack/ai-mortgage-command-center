"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquarePlus,
  FileCheck2,
  Scale,
  FileText,
  UserCheck,
  Calculator,
  Compass,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Building2,
  ShieldAlert,
  Menu,
  X,
  Home,
  Mail,
} from "lucide-react";
import { useAppContext, DEMO_ROLES, UserRole } from "@/context/AppContext";

interface AppShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  applications?: Array<{
    id: string;
    referenceCode: string;
    purpose: string;
    stage: string;
    borrower?: { firstName: string; lastName: string; city: string; province: string };
  }>;
  activeAppId?: string | null;
  onSelectAppId?: (id: string) => void;
}

export function AppShell({
  children,
  title,
  subtitle,
  applications = [],
  activeAppId,
  onSelectAppId,
}: AppShellProps) {
  const pathname = usePathname();
  const { theme, toggleTheme, activeRole, setActiveRole, currentRoleDef } =
    useAppContext();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    {
      href: "/dashboard",
      label: "Command Dashboard",
      badge: "Overview",
      icon: LayoutDashboard,
    },
    {
      href: "/guided-demo",
      label: "Guided Demo Flow",
      badge: "6 Steps",
      icon: Compass,
    },
    {
      href: "/intake",
      label: "Agent 1: Borrower Intake",
      badge: "Stage 1",
      icon: MessageSquarePlus,
    },
    {
      href: "/documents",
      label: "Agent 2: Document Check",
      badge: "Stage 2",
      icon: FileCheck2,
    },
    {
      href: "/qualification",
      label: "Agent 3: Qualification & Match",
      badge: "Stage 3",
      icon: Scale,
    },
    {
      href: "/underwriting",
      label: "Agent 4: Package Builder",
      badge: "Stage 4",
      icon: FileText,
    },
    {
      href: "/review",
      label: "Human Review (Steve)",
      badge: "Human Only",
      icon: UserCheck,
    },
    {
      href: "/calculators",
      label: "7 Mortgage Calculators",
      badge: "Math",
      icon: Calculator,
    },
    {
      href: "/contact",
      label: "Contact & Base Intake",
      badge: "Inquiry",
      icon: Mail,
    },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 dark:bg-[#060b16] dark:text-slate-100">
      {/* Desktop Collapsible Left Sidebar */}
      <aside
        aria-label="Workspace Sidebar Navigation"
        className={`hidden lg:flex flex-col border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0a1122] transition-all duration-200 shrink-0 ${
          collapsed ? "w-20" : "w-72"
        }`}
      >
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80">
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-teal-500 via-sky-500 to-violet-600 flex items-center justify-center shrink-0 shadow-md shadow-teal-500/20">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <div className="font-bold text-sm tracking-tight truncate">
                  AI Mortgage Command
                </div>
                <div className="text-[11px] text-teal-500 font-mono truncate">
                  Canadian Brokerage SaaS
                </div>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                  isActive
                    ? "bg-gradient-to-r from-teal-500/20 to-sky-500/15 text-teal-600 dark:text-teal-300 border border-teal-500/40 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white"
                }`}
                title={item.label}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? "text-teal-400" : "text-slate-400"
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>
                {!collapsed && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isActive
                        ? "bg-teal-500/20 text-teal-300"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
          {!collapsed && (
            <div className="rounded-xl bg-slate-100 dark:bg-slate-900/90 p-3 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1">
              <div className="font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                <span>Zero-Approval Guardrail</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 leading-snug">
                AI agents never approve, deny, or submit applications externally. Steve holds 100% review authority.
              </p>
            </div>
          )}
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Home className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Public Marketing Website</span>}
          </Link>
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-white dark:bg-[#0a1122] h-full flex flex-col z-10 border-r border-slate-800">
            <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <span className="font-bold text-sm">AI Mortgage Command Center</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close mobile menu"
                className="p-1.5 rounded-lg hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs font-medium ${
                      isActive
                        ? "bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold"
                        : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {item.badge}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Workspace Header */}
        <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#0a1122]/90 backdrop-blur-md px-4 sm:px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation menu"
                className="lg:hidden p-2 rounded-lg border border-slate-300 dark:border-slate-700"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight">
                    {title}
                  </h1>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/15 border border-teal-500/40 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-teal-600 dark:text-teal-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
                    DEMO MODE • FICTIONAL DATA
                  </span>
                </div>
                {subtitle && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Active Application Dossier Switcher (if provided) */}
              {applications.length > 0 && onSelectAppId && (
                <div className="flex items-center gap-1.5">
                  <label
                    htmlFor="active-app-select"
                    className="text-[11px] font-mono text-slate-500 dark:text-slate-400 hidden sm:inline"
                  >
                    Active File:
                  </label>
                  <select
                    id="active-app-select"
                    aria-label="Select Active Fictional Mortgage File"
                    value={activeAppId || applications[0]?.id || ""}
                    onChange={(e) => onSelectAppId(e.target.value)}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 text-xs font-medium"
                  >
                    {applications.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.referenceCode} — {a.borrower?.firstName}{" "}
                        {a.borrower?.lastName} ({a.purpose})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Clearly Labeled Local Demo Role Switcher */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-500 font-semibold">
                  Demo Role Switcher:
                </span>
                <select
                  aria-label="Demo Role Switcher"
                  value={activeRole}
                  onChange={(e) => setActiveRole(e.target.value as UserRole)}
                  className="bg-transparent text-xs font-semibold focus:outline-none"
                >
                  {DEMO_ROLES.map((r) => (
                    <option
                      key={r.role}
                      value={r.role}
                      className="bg-slate-900 text-white"
                    >
                      {r.label} — {r.personName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle color theme"
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Toggle Light / Dark Theme"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 text-amber-400" />
                ) : (
                  <Moon className="h-4 w-4 text-slate-700" />
                )}
              </button>
            </div>
          </div>

          {/* Role Context Banner */}
          <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <div>
              <strong>Active Persona:</strong> {currentRoleDef.personName} —{" "}
              {currentRoleDef.description}
            </div>
            <div className="font-mono text-[10px] text-slate-400">
              Note: Local prototype role switcher for demonstration; production deployment uses MFA & OAuth2 RBAC.
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
