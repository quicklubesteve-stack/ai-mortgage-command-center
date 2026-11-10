import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { evaluateApplicationQualificationAndLenders } from "@/lib/agent-services";

const mortgageInquirySchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(7, "Valid phone number is required"),
  preferredContact: z.string().default("EMAIL"),
  province: z.string().default("ON"),
  city: z.string().min(2, "City is required"),
  purpose: z.string().default("PURCHASE"),
  isFirstTimeBuyer: z.boolean().default(false),
  propertyPriceOrValue: z.number().min(50000, "Price must be at least $50,000"),
  downPaymentOrEquity: z.number().min(0),
  grossAnnualIncome: z.number().min(10000, "Income must be at least $10,000"),
  employmentType: z.string().default("SALARIED_FULL_TIME"),
  creditScoreEstimate: z.number().default(720),
  timeline: z.string().default("Within 60 Days"),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parsed = mortgageInquirySchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const names = data.fullName.trim().split(" ");
    const firstName = names[0] || "Inquiry";
    const lastName = names.slice(1).join(" ") || "Applicant";

    const price = data.propertyPriceOrValue;
    const down = data.downPaymentOrEquity;
    const requestedLoan = Math.max(price - down, 50000);
    const refCode = `CAN-INQ-2026-${Math.floor(1000 + Math.random() * 8999)}`;

    const evalRes = evaluateApplicationQualificationAndLenders({
      purpose: data.purpose as any,
      purchasePriceOrValue: price,
      downPaymentAmount: down,
      existingMortgageBalance: data.purpose === "REFINANCE" ? requestedLoan : 0,
      requestedMortgageAmount: requestedLoan,
      amortizationYears: 25,
      termYears: 5,
      ratePreference: "FIXED",
      grossAnnualIncome: data.grossAnnualIncome,
      coBorrowerIncome: 0,
      otherMonthlyIncome: 0,
      monthlyDebts: 400,
      annualPropertyTax: Math.round(price * 0.0075),
      monthlyHeating: 160,
      monthlyCondoFees: 0,
      creditScoreEstimate: data.creditScoreEstimate,
      employmentType: data.employmentType,
      isFirstTimeBuyer: data.isFirstTimeBuyer,
    });

    let defaultBrokerage = await prisma.brokerage.findFirst();
    if (!defaultBrokerage) {
      defaultBrokerage = await prisma.brokerage.create({
        data: {
          name: "AI Mortgage Command Operations",
          licenseNumber: "FSRA-13420",
          province: "ON",
        },
      });
    }

    const borrower = await prisma.borrower.create({
      data: {
        firstName,
        lastName,
        email: data.email,
        phone: data.phone,
        province: data.province,
        city: data.city,
        isFirstTimeBuyer: data.isFirstTimeBuyer,
        creditScoreEstimate: data.creditScoreEstimate,
      },
    });

    // Create the structured application in stage INTAKE
    const app = await prisma.mortgageApplication.create({
      data: {
        brokerageId: defaultBrokerage.id,
        borrowerId: borrower.id,
        referenceCode: refCode,
        purpose: data.purpose,
        stage: "INTAKE",
        statusBadge: "NEW BORROWER INQUIRY",
        requestedMortgageAmount: requestedLoan,
        downPaymentAmount: down,
        downPaymentSource: "SAVINGS",
        existingMortgageBalance: data.purpose === "REFINANCE" ? requestedLoan : 0,
        amortizationYears: 25,
        termYears: 5,
        ratePreference: "FIXED",
        paymentFrequency: "MONTHLY",
        calculatedGds: evalRes.gdsTds.gdsPct,
        calculatedTds: evalRes.gdsTds.tdsPct,
        calculatedLtv: evalRes.downLtv.baseLtvPct,
        stressTestRate: evalRes.stressTest.qualifyingRatePct,
        estimatedMonthlyPayment: evalRes.stressTest.contractMonthlyPayment,
        insuranceRequired: evalRes.downLtv.insuranceRequired,
        insurancePremium: evalRes.downLtv.insurancePremiumAmount,
        property: {
          create: {
            address: `${data.city}, ${data.province}`,
            city: data.city,
            province: data.province,
            postalCode: "M5V 2T6",
            propertyType: "DETACHED",
            occupancy: "OWNER_OCCUPIED",
            purchasePriceOrValue: price,
            annualPropertyTax: Math.round(price * 0.0075),
            monthlyHeating: 160,
            monthlyCondoFees: 0,
          },
        },
        incomeRecords: {
          create: [
            {
              employmentType: data.employmentType,
              employerName: "Declared in Web Inquiry",
              jobTitle: "Applicant",
              yearsAtEmployer: 2,
              grossAmount: data.grossAnnualIncome,
              annualizedAmount: data.grossAnnualIncome,
              frequency: "ANNUAL",
              otherMonthlyAmt: 0,
            },
          ],
        },
        liabilities: {
          create: [
            {
              liabilityType: "CREDIT_CARD",
              creditorName: "Estimated Debts",
              monthlyPayment: 400,
              balance: 5000,
            },
          ],
        },
        underwritingAssessment: {
          create: {
            borrowerFinancialSummary: `${firstName} ${lastName} — Public Web Inquiry for $${price.toLocaleString()} ${data.purpose}. Income: $${data.grossAnnualIncome.toLocaleString()} CAD/yr.`,
            debtServiceSummary: `Initial Ratios: GDS ${evalRes.gdsTds.gdsPct}% | TDS ${evalRes.gdsTds.tdsPct}%. Stress Test Rate: ${evalRes.stressTest.qualifyingRatePct}%.`,
            propertyMortgageSummary: `${data.purpose} in ${data.city}, ${data.province}. Contact pref: ${data.preferredContact}. Timeline: ${data.timeline}. Notes: ${data.notes || "None"}.`,
            documentStatusSummary: "Awaiting initial borrower document intake.",
            riskFlagsJson: JSON.stringify([
              {
                code: "NEW_BORROWER_INQUIRY",
                severity: "INFO",
                title: "New Public Mortgage Inquiry",
                explanation: `Received via Public Contact Form for ${data.purpose} in ${data.city}, ${data.province}.`,
              },
            ]),
            exceptionsAndMissingJson: JSON.stringify(["Complete full document intake with applicant."]),
            policyVsLenderNotes: "Subject to complete document verification and OSFI B-20 underwriting.",
            humanReviewRecommendation: "NEW INQUIRY — Routed to Steve (Licensed Broker / Principal Officer) for follow-up.",
          },
        },
      },
      include: {
        borrower: true,
        property: true,
      },
    });

    // Record audit event
    await prisma.auditEvent.create({
      data: {
        applicationId: app.id,
        actorName: `${firstName} ${lastName} (Prospective Borrower)`,
        actorRole: "PUBLIC_BORROWER",
        eventType: "NEW_BORROWER_INQUIRY",
        summary: `Submitted base mortgage contact inquiry (${refCode}) for ${data.purpose} in ${data.city}, ${data.province} ($${price.toLocaleString()}).`,
      },
    });

    return NextResponse.json(
      {
        success: true,
        inquiryRef: refCode,
        applicationId: app.id,
        estimatedPayment: evalRes.stressTest.contractMonthlyPayment,
        qualifyingRatePct: evalRes.stressTest.qualifyingRatePct,
        contractRatePct: 4.79,
        loanAmount: requestedLoan,
        downPaymentPct: evalRes.downLtv.actualDownPaymentPct,
        insuranceRequired: evalRes.downLtv.insuranceRequired,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Mortgage inquiry error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process mortgage inquiry" },
      { status: 500 }
    );
  }
}
