"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type UserRole =
  | "BORROWER"
  | "MORTGAGE_BROKER"
  | "INTERNAL_UNDERWRITER"
  | "BROKERAGE_ADMIN"
  | "PLATFORM_ADMIN";

export interface RoleDefinition {
  role: UserRole;
  label: string;
  personName: string;
  badgeColor: string;
  description: string;
  canExecuteHumanReview: boolean;
  canEditLenderCriteria: boolean;
}

export const DEMO_ROLES: RoleDefinition[] = [
  {
    role: "INTERNAL_UNDERWRITER",
    label: "Internal Underwriter / Reviewer",
    personName: "Steve (Principal Underwriter)",
    badgeColor: "bg-teal-500/20 text-teal-300 border-teal-500/40",
    description:
      "Full access to all 4 agent stages + sole human review authority in the Human Review Workspace.",
    canExecuteHumanReview: true,
    canEditLenderCriteria: true,
  },
  {
    role: "MORTGAGE_BROKER",
    label: "Mortgage Broker",
    personName: "Alex Mercer (Licensed Broker)",
    badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/40",
    description:
      "Manages borrower intake, document collection, qualification scenarios, and prepares draft packages.",
    canExecuteHumanReview: true,
    canEditLenderCriteria: false,
  },
  {
    role: "BORROWER",
    label: "Borrower (Applicant View)",
    personName: "Jordan Campbell (Applicant)",
    badgeColor: "bg-violet-500/20 text-violet-300 border-violet-500/40",
    description:
      "Completes conversational/form intake, uploads documents, and views illustrative payment calculators.",
    canExecuteHumanReview: false,
    canEditLenderCriteria: false,
  },
  {
    role: "BROKERAGE_ADMIN",
    label: "Brokerage Administrator",
    personName: "Claire Vance (Brokerage Ops)",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    description:
      "Oversees brokerage pipeline, configures fictional lender product rules, and audits compliance.",
    canExecuteHumanReview: true,
    canEditLenderCriteria: true,
  },
  {
    role: "PLATFORM_ADMIN",
    label: "Platform Administrator",
    personName: "Marcus Chen (Systems Admin)",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    description:
      "Configures Canadian policy assumptions, monitors audit trails, and manages tenant settings.",
    canExecuteHumanReview: false,
    canEditLenderCriteria: true,
  },
];

interface AppContextValue {
  theme: "dark" | "light";
  toggleTheme: () => void;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  currentRoleDef: RoleDefinition;
  selectedApplicationId: string | null;
  setSelectedApplicationId: (id: string | null) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeRole, setActiveRoleState] = useState<UserRole>(
    "INTERNAL_UNDERWRITER"
  );
  const [selectedApplicationId, setSelectedApplicationId] = useState<
    string | null
  >(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("amcc_theme") as
      | "dark"
      | "light"
      | null;
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else {
      document.documentElement.classList.add("dark");
    }

    const savedRole = localStorage.getItem("amcc_role") as UserRole | null;
    if (savedRole && DEMO_ROLES.some((r) => r.role === savedRole)) {
      setActiveRoleState(savedRole);
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("amcc_theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  const setActiveRole = (role: UserRole) => {
    setActiveRoleState(role);
    localStorage.setItem("amcc_role", role);
  };

  const currentRoleDef =
    DEMO_ROLES.find((r) => r.role === activeRole) || DEMO_ROLES[0];

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        activeRole,
        setActiveRole,
        currentRoleDef,
        selectedApplicationId,
        setSelectedApplicationId,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppContext must be used inside AppProvider");
  }
  return ctx;
}
