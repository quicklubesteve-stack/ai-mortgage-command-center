import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seedDatabaseIfEmpty } from "@/lib/seed-helper";
import {
  DEFAULT_FICTIONAL_LENDERS,
  evaluateApplicationQualificationAndLenders,
  FictionalLenderCriteria,
  identifyMissingIntakeFields,
} from "@/lib/agent-services";

export async function GET() {
  try {
    await seedDatabaseIfEmpty(false);

    const applications = await prisma.mortgageApplication.findMany({
      include: {
        borrower: true,
        property: true,
        incomeRecords: true,
        liabilities: true,
        documents: true,
        documentChecks: true,
        lenderMatches: {
          include: { lenderProduct: true },
          orderBy: { rankOrder: "asc" },
        },
        underwritingAssessment: true,
        reviewDecisions: {
          orderBy: { createdAt: "desc" },
        },
        submissionPackages: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const auditEvents = await prisma.auditEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
    });

    const lenderProducts = await prisma.lenderProduct.findMany({
      orderBy: { illustrativeRatePct: "asc" },
    });

    const demoRequestsCount = await prisma.demoRequest.count();

    return NextResponse.json({
      success: true,
      applications,
      auditEvents,
      lenderProducts,
      demoRequestsCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await seedDatabaseIfEmpty(false);
    const body = await req.json();

    if (body.action === "RESET_DEMO_DATA") {
      const res = await seedDatabaseIfEmpty(true);
      return NextResponse.json({
        success: true,
        message: "Demo database reset to 5 fictional Canadian applications.",
        count: res.count,
      });
    }

    const brokerage = await prisma.brokerage.findFirst();
    if (!brokerage) {
      return NextResponse.json(
        { success: false, error: "Demo brokerage not initialized" },
        { status: 500 }
      );
    }

    const missingFields = identifyMissingIntakeFields(body);
    const refNumber = `CAN-MORT-2026-${Math.floor(200 + Math.random() * 799)}`;

    const dbLenders = await prisma.lenderProduct.findMany();
    const lenderCatalog: FictionalLenderCriteria[] =
      dbLenders.length > 0
        ? dbLenders.map((l) => ({
            code: l.code,
            lenderName: l.lenderName,
            productName: l.productName,
            lenderCategory: l.lenderCategory,
            rateType: l.rateType as "FIXED" | "VARIABLE",
            termYears: l.termYears,
            maxAmortization: l.maxAmortization,
            illustrativeRatePct: l.illustrativeRatePct,
            minCreditScore: l.minCreditScore,
            maxGdsPct: l.maxGdsPct,
            maxTdsPct: l.maxTdsPct,
            maxLtvPct: l.maxLtvPct,
            minLoanCad: l.minLoanCad,
            maxLoanCad: l.maxLoanCad,
            acceptsSelfEmployed: l.acceptsSelfEmployed,
            requiresInsured: l.requiresInsured,
            allowsRefinance: l.allowsRefinance,
            stressTestRule: l.stressTestRule,
            prepaymentPrivilege: l.prepaymentPrivilege,
            keyConditions: JSON.parse(l.keyConditionsJson || "[]"),
            limitationsNote: l.limitationsNote,
            policyEffectiveDate: l.policyEffectiveDate,
          }))
        : DEFAULT_FICTIONAL_LENDERS;

    const purpose = (body.purpose || "PURCHASE") as
      | "PURCHASE"
      | "REFINANCE"
      | "RENEWAL";
    const purchasePriceOrValue = Number(body.purchasePriceOrValue) || 750000;
    const downPaymentAmount = Number(body.downPaymentAmount) || 75000;
    const existingMortgageBalance = Number(body.existingMortgageBalance) || 0;
    const requestedMortgageAmount =
      Number(body.requestedMortgageAmount) ||
      Math.max(0, purchasePriceOrValue - downPaymentAmount);

    const evaluation = evaluateApplicationQualificationAndLenders(
      {
        purpose,
        purchasePriceOrValue,
        downPaymentAmount,
        existingMortgageBalance,
        requestedMortgageAmount,
        amortizationYears: Number(body.amortizationYears) || 25,
        termYears: Number(body.termYears) || 5,
        ratePreference: (body.ratePreference || "FIXED") as "FIXED" | "VARIABLE",
        grossAnnualIncome: Number(body.grossAnnualIncome) || 140000,
        coBorrowerIncome: Number(body.coBorrowerIncome) || 0,
        otherMonthlyIncome: Number(body.otherMonthlyIncome) || 0,
        monthlyDebts: Number(body.monthlyDebts) || 500,
        annualPropertyTax: Number(body.annualPropertyTax) || 4000,
        monthlyHeating: Number(body.monthlyHeating) || 150,
        monthlyCondoFees: Number(body.monthlyCondoFees) || 0,
        creditScoreEstimate: body.creditScoreEstimate
          ? Number(body.creditScoreEstimate)
          : 720,
        employmentType: body.employmentType || "SALARIED_FULL_TIME",
        isFirstTimeBuyer: Boolean(body.isFirstTimeBuyer),
        hasBlockingDocIssues: false,
      },
      lenderCatalog
    );

    const borrower = await prisma.borrower.create({
      data: {
        firstName: body.firstName || "Sample",
        lastName: body.lastName || "Applicant",
        email: body.email || "applicant@demo-borrower.ca",
        phone: body.phone || "(416) 555-0100",
        province: body.province || "ON",
        city: body.city || "Toronto",
        isFirstTimeBuyer: Boolean(body.isFirstTimeBuyer),
        creditScoreEstimate: body.creditScoreEstimate
          ? Number(body.creditScoreEstimate)
          : 720,
        coBorrowerName: body.coBorrowerName || null,
        coBorrowerIncome: Number(body.coBorrowerIncome) || 0,
      },
    });

    const application = await prisma.mortgageApplication.create({
      data: {
        referenceCode: refNumber,
        brokerageId: brokerage.id,
        borrowerId: borrower.id,
        purpose,
        stage: "DOCUMENT_CHECK",
        statusBadge: "PENDING HUMAN REVIEW",
        requestedMortgageAmount,
        downPaymentAmount,
        downPaymentSource: body.downPaymentSource || "SAVINGS",
        existingMortgageBalance,
        amortizationYears: Number(body.amortizationYears) || 25,
        termYears: Number(body.termYears) || 5,
        ratePreference: body.ratePreference || "FIXED",
        paymentFrequency: body.paymentFrequency || "MONTHLY",
        calculatedGds: evaluation.gdsTds.gdsPct,
        calculatedTds: evaluation.gdsTds.tdsPct,
        calculatedLtv: evaluation.downLtv.baseLtvPct,
        stressTestRate: evaluation.stressTest.qualifyingRatePct,
        estimatedMonthlyPayment: evaluation.stressTest.contractMonthlyPayment,
        insuranceRequired: evaluation.downLtv.insuranceRequired,
        insurancePremium: evaluation.downLtv.insurancePremiumAmount,
        missingFieldsJson: JSON.stringify(missingFields),
        scenarioPreset: body.scenarioPreset || "CUSTOM_INTAKE",
        property: {
          create: {
            address: body.address || "100 Demo Avenue",
            city: body.city || "Toronto",
            province: body.province || "ON",
            postalCode: body.postalCode || "M5V 2T6",
            propertyType: body.propertyType || "DETACHED",
            occupancy: body.occupancy || "OWNER_OCCUPIED",
            purchasePriceOrValue,
            annualPropertyTax: Number(body.annualPropertyTax) || 4000,
            monthlyHeating: Number(body.monthlyHeating) || 150,
            monthlyCondoFees: Number(body.monthlyCondoFees) || 0,
          },
        },
        incomeRecords: {
          create: [
            {
              borrowerId: borrower.id,
              employmentType: body.employmentType || "SALARIED_FULL_TIME",
              employerName: body.employerName || "Canadian Demo Employer Inc.",
              jobTitle: body.jobTitle || "Professional",
              yearsAtEmployer: Number(body.yearsAtEmployer) || 3,
              grossAmount: Number(body.grossAnnualIncome) || 140000,
              frequency: "ANNUAL",
              annualizedAmount: Number(body.grossAnnualIncome) || 140000,
              otherMonthlyAmt: Number(body.otherMonthlyIncome) || 0,
              isVerified: false,
            },
          ],
        },
        liabilities: {
          create: [
            {
              borrowerId: borrower.id,
              liabilityType: "CREDIT_CARD",
              creditorName: "Declared Monthly Liabilities",
              balance: (Number(body.monthlyDebts) || 500) * 20,
              monthlyPayment: Number(body.monthlyDebts) || 500,
            },
          ],
        },
      },
    });

    // Default Document Checklist for new application (Agent 2)
    const defaultChecks = [
      {
        category: "PAY_STUB",
        title: "Recent Pay Stubs (Last 30 Days)",
        status: "PENDING_MANUAL_REVIEW",
        severity: "NONE",
        finding: "Awaiting sample PDF upload or manual broker verification.",
      },
      {
        category: "EMPLOYMENT_LETTER",
        title: "Letter of Employment / Business Proof",
        status: "PENDING_MANUAL_REVIEW",
        severity: "NONE",
        finding: `Verify ${body.employmentType || "Salaried"} tenure at ${
          body.employerName || "Employer"
        }.`,
      },
      {
        category: "TAX_NOA_T1",
        title: "CRA Notice of Assessment (NOA) & T1/T4",
        status:
          body.employmentType === "SELF_EMPLOYED_BFS"
            ? "MISSING"
            : "PENDING_MANUAL_REVIEW",
        severity:
          body.employmentType === "SELF_EMPLOYED_BFS" ? "BLOCKING" : "NONE",
        finding:
          body.employmentType === "SELF_EMPLOYED_BFS"
            ? "Self-employed (BFS) requires 2-year CRA T1 General & NOA or 6-month business bank statements."
            : "Standard T4/NOA verification item.",
      },
      {
        category: "BANK_STATEMENT_DOWN_PAYMENT",
        title: "90-Day Down Payment & Source of Funds Evidence",
        status: "PENDING_MANUAL_REVIEW",
        severity: "NONE",
        finding: `Verify $${downPaymentAmount.toLocaleString()} CAD from ${
          body.downPaymentSource || "SAVINGS"
        }.`,
      },
      {
        category:
          purpose === "PURCHASE"
            ? "PURCHASE_AGREEMENT"
            : "EXISTING_MORTGAGE_STATEMENT",
        title:
          purpose === "PURCHASE"
            ? "Agreement of Purchase and Sale (APS)"
            : "Existing Mortgage Renewal / Payout Statement",
        status: "PENDING_MANUAL_REVIEW",
        severity: "NONE",
        finding:
          purpose === "PURCHASE"
            ? `Confirm signed APS for $${purchasePriceOrValue.toLocaleString()} CAD.`
            : `Confirm existing balance of $${existingMortgageBalance.toLocaleString()} CAD.`,
      },
      {
        category: "GOVT_ID_PLACEHOLDER",
        title: "Government ID Verification Status (Placeholder)",
        status: "PENDING_MANUAL_REVIEW",
        severity: "NONE",
        finding:
          "Demo placeholder only — no live identity verification connected. Human broker must verify ID.",
      },
    ];

    for (const c of defaultChecks) {
      await prisma.documentCheck.create({
        data: {
          applicationId: application.id,
          category: c.category,
          title: c.title,
          status: c.status,
          discrepancySeverity: c.severity,
          findingSummary: c.finding,
        },
      });
    }

    // Create LenderMatches (Agent 3)
    for (const m of evaluation.matches) {
      const dbLender = dbLenders.find((dl) => dl.code === m.lender.code);
      if (!dbLender) continue;
      await prisma.lenderMatch.create({
        data: {
          applicationId: application.id,
          lenderProductId: dbLender.id,
          rankOrder: m.rankOrder,
          fitScore: m.fitScore,
          fitStatus: m.fitStatus,
          estimatedMonthlyPayment: m.estimatedMonthlyPayment,
          stressTestMonthlyPayment: m.stressTestMonthlyPayment,
          qualifyingRateUsed: m.qualifyingRateUsed,
          reasonsFitJson: JSON.stringify(m.reasonsFit),
          reasonsRiskOrMissJson: JSON.stringify(m.reasonsRiskOrMiss),
          missingConditionsJson: JSON.stringify(m.missingConditions),
          humanReviewRequirement: m.humanReviewRequirement,
          isSelectedForPackage: m.rankOrder === 1,
        },
      });
    }

    const topMatch = evaluation.matches[0];

    await prisma.underwritingAssessment.create({
      data: {
        applicationId: application.id,
        borrowerFinancialSummary: `${borrower.firstName} ${borrower.lastName} — Qualifying Annual Income: $${evaluation.totalAnnualIncome.toLocaleString()} CAD. Credit Score Estimate: ${borrower.creditScoreEstimate}.`,
        debtServiceSummary: `GDS: ${evaluation.gdsTds.gdsPct}% | TDS: ${evaluation.gdsTds.tdsPct}% under OSFI B-20 Stress Test (${evaluation.stressTest.qualifyingRatePct}%).`,
        propertyMortgageSummary: `${purpose} in ${borrower.city}, ${borrower.province}. Property Value: $${purchasePriceOrValue.toLocaleString()} CAD, Base LTV: ${evaluation.downLtv.baseLtvPct}%.`,
        documentStatusSummary:
          "Initial document checklist created by Agent 2. Pending sample document upload and manual verification.",
        riskFlagsJson: JSON.stringify(
          evaluation.gdsTds.passesStandardBoth
            ? [
                {
                  code: "STANDARD_RATIOS_PASS",
                  severity: "INFO",
                  title: "GDS & TDS Within Standard 39% / 44% Guidelines",
                  explanation: `Stress-tested GDS (${evaluation.gdsTds.gdsPct}%) and TDS (${evaluation.gdsTds.tdsPct}%) pass baseline thresholds.`,
                },
              ]
            : [
                {
                  code: "ELEVATED_DEBT_SERVICE",
                  severity: "HIGH",
                  title: "GDS or TDS Above Standard 39% / 44% Prime Caps",
                  explanation: `Stress-tested GDS (${evaluation.gdsTds.gdsPct}%) / TDS (${evaluation.gdsTds.tdsPct}%) requires B-Lender consideration or human underwriter exception review.`,
                },
              ]
        ),
        exceptionsAndMissingJson: JSON.stringify(
          topMatch ? topMatch.missingConditions : []
        ),
        policyVsLenderNotes:
          "Dated Canadian policy baseline (2026-01-01) separated from fictional lender overlays.",
        humanReviewRecommendation:
          "DRAFT ONLY — Routed to Steve (Authorized Broker / Internal Underwriter) for human review.",
      },
    });

    await prisma.submissionPackage.create({
      data: {
        applicationId: application.id,
        packageNumber: `PKG-${refNumber}`,
        targetLenderName: topMatch
          ? topMatch.lender.lenderName
          : "MapleCrown Bank of Canada",
        targetProductName: topMatch
          ? topMatch.lender.productName
          : "5-Year Fixed Residential",
        packageStatus: "DRAFT_INTERNAL_ONLY",
        summaryPayloadJson: JSON.stringify({
          referenceCode: refNumber,
          borrower: `${borrower.firstName} ${borrower.lastName}`,
          totalFinancedMortgage: evaluation.totalFinancedMortgage,
          gdsPct: evaluation.gdsTds.gdsPct,
          tdsPct: evaluation.gdsTds.tdsPct,
          ltvPct: evaluation.downLtv.baseLtvPct,
        }),
        includedDocsJson: JSON.stringify([]),
        openExceptionsJson: JSON.stringify(
          defaultChecks.map((d) => `${d.title}: ${d.status}`)
        ),
      },
    });

    await prisma.auditEvent.create({
      data: {
        applicationId: application.id,
        actorName: "Agent 1 (AI Borrower Intake)",
        actorRole: "AI_AGENT",
        eventType: "INTAKE_SAVED",
        summary: `Created structured Canadian mortgage application ${refNumber} for ${borrower.firstName} ${borrower.lastName} (${borrower.city}, ${borrower.province}).`,
      },
    });

    const fullCreated = await prisma.mortgageApplication.findUnique({
      where: { id: application.id },
      include: {
        borrower: true,
        property: true,
        incomeRecords: true,
        liabilities: true,
        documents: true,
        documentChecks: true,
        lenderMatches: {
          include: { lenderProduct: true },
          orderBy: { rankOrder: "asc" },
        },
        underwritingAssessment: true,
        reviewDecisions: true,
        submissionPackages: true,
      },
    });

    return NextResponse.json(
      { success: true, application: fullCreated },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create mortgage application",
      },
      { status: 500 }
    );
  }
}
