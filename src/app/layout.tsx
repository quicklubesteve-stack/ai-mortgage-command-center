import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

export const metadata: Metadata = {
  title: "AI Mortgage Command Center | Smarter Mortgage Workflows. Human-Controlled Decisions.",
  description:
    "Canadian Mortgage Intake, Qualification, Document Verification, Lender Matching & Underwriting-Support SaaS Platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen antialiased selection:bg-teal-500/30 selection:text-teal-200">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
