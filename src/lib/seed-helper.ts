import { prisma } from "./prisma";
import {
  DEFAULT_FICTIONAL_LENDERS,
  evaluateApplicationQualificationAndLenders,
  SAMPLE_BORROWER_SCENARIOS,
} from "./agent-services";

export async function seedDatabaseIfEmpty(forceReset = false) {
  if (!forceReset) {
    const existingCount = await prisma.mortgageApplication.count();
    if (existingCount >= 5) {
      return { seeded: false, count: existingCount };
    }
  }

  if (forceReset) {
    await prisma.auditEvent.deleteMany();
    await prisma.reviewDecision.deleteMany();
    await prisma.submissionPackage.deleteMany();
    await prisma.underwritingAssessment.deleteMany();
    await prisma.lenderMatch.deleteMany();
    await prisma.documentCheck.deleteMany();
    await prisma.document.deleteMany();
    await prisma.liability.deleteMany();
    await prisma.incomeRecord.deleteMany();
    await prisma.property.deleteMany();
    await prisma.mortgageApplication.deleteMany();
    await prisma.borrower.deleteMany();
    await prisma.lenderProduct.deleteMany();
    await prisma.user.deleteMany();
    await prisma.brokerage.deleteMany();
    await prisma.demoRequest.deleteMany();
  }

  // 1. Create Brokerage
  const brokerage = await prisma.brokerage.create({
    data: {
      name: "TrueNorth Canadian Mortgage Advisory Corp. (Demo Brokerage)",
      licenseNumber: "FSRA-DEMO-13482",
      province: "ON",
      address: "100 King Street West, Suite 5600, Toronto, ON M5X 1C9",
    },
  });

  // 2. Create Users for all 5 Roles
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "steve@truenorth-mortgage-demo.ca" },
      update: {},
      create: {
        email: "steve@truenorth-mortgage-demo.ca",
        name: "Steve (Internal Underwriter & Principal Broker)",
        role: "INTERNAL_UNDERWRITER",
        title: "Principal Mortgage Underwriter & Compliance Officer",
        licenseId: "LIC-CA-UW-001",
        brokerageId: brokerage.id,
      },
    }),
    prisma.user.upsert({
      where: { email: "alex.mercer@truenorth-mortgage-demo.ca" },
      update: {},
      create: {
        email: "alex.mercer@truenorth-mortgage-demo.ca",
        name: "Alex Mercer (Mortgage Broker)",
        role: "MORTGAGE_BROKER",
        title: "Senior Licensed Mortgage Broker",
        licenseId: "LIC-CA-MB-204",
        brokerageId: brokerage.id,
      },
    }),
    prisma.user.upsert({
      where: { email: "claire.vance@truenorth-mortgage-demo.ca" },
      update: {},
      create: {
        email: "claire.vance@truenorth-mortgage-demo.ca",
        name: "Claire Vance (Brokerage Admin)",
        role: "BROKERAGE_ADMIN",
        title: "Director of Brokerage Operations",
        licenseId: "LIC-CA-ADM-012",
        brokerageId: brokerage.id,
      },
    }),
    prisma.user.upsert({
      where: { email: "marcus.chen@truenorth-mortgage-demo.ca" },
      update: {},
      create: {
        email: "marcus.chen@truenorth-mortgage-demo.ca",
        name: "Marcus Chen (Platform Admin)",
        role: "PLATFORM_ADMIN",
        title: "Principal AI Systems & Security Administrator",
        licenseId: "SYS-ADMIN-01",
        brokerageId: brokerage.id,
      },
    }),
    prisma.user.upsert({
      where: { email: "jordan.campbell@demo-borrower.ca" },
      update: {},
      create: {
        email: "jordan.campbell@demo-borrower.ca",
        name: "Jordan Campbell (Demo Borrower)",
        role: "BORROWER",
        title: "Mortgage Applicant",
        brokerageId: brokerage.id,
      },
    }),
  ]);

  const steveUser = users[0];

  // 3. Seed 5 Fictional Lender Products
  const lenderMap: Record<string, string> = {};
  for (const l of DEFAULT_FICTIONAL_LENDERS) {
    const created = await prisma.lenderProduct.upsert({
      where: { code: l.code },
      update: {},
      create: {
        brokerageId: brokerage.id,
        code: l.code,
        lenderName: l.lenderName,
        productName: l.productName,
        lenderCategory: l.lenderCategory,
        rateType: l.rateType,
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
        keyConditionsJson: JSON.stringify(l.keyConditions),
        limitationsNote: l.limitationsNote,
        policyEffectiveDate: l.policyEffectiveDate,
      },
    });
    lenderMap[l.code] = created.id;
  }

  // 4. Seed the 5 Fictional Mortgage Applications
  const appMeta = [
    {
      ref: "CAN-MORT-2026-101",
      scenario: SAMPLE_BORROWER_SCENARIOS[0],
      stage: "HUMAN_REVIEW",
      statusBadge: "READY FOR HUMAN REVIEW",
      hasBlockingDocs: false,
      docChecks: [
        {
          category: "PAY_STUB",
          title: "Recent Pay Stubs (Last 30 Days)",
          status: "VERIFIED_DEMO",
          severity: "NONE",
          finding: "Demo pay stubs match declared $158,000 CAD base salary at NorthStar Cloud Technologies Inc.",
          fileName: "Jordan_Campbell_PayStubs_Oct2026_DEMO.pdf",
        },
        {
          category: "EMPLOYMENT_LETTER",
          title: "Letter of Employment",
          status: "VERIFIED_DEMO",
          severity: "NONE",
          finding: "Confirmed full-time permanent tenure (4.5 years) and base salary.",
          fileName: "NorthStar_Employment_Letter_DEMO.pdf",
        },
        {
          category: "TAX_NOA_T1",
          title: "CRA Notice of Assessment (NOA) & T4",
          status: "VERIFIED_DEMO",
          severity: "NONE",
          finding: "Line 15000 income consistent with salaried declaration; zero CRA tax arrears.",
          fileName: "CRA_NOA_2025_Campbell_DEMO.pdf",
        },
        {
          category: "BANK_STATEMENT_DOWN_PAYMENT",
          title: "90-Day Down Payment & FHSA Statements",
          status: "VERIFIED_DEMO",
          severity: "NONE",
          finding: "$78,000 CAD down payment verified across FHSA ($40,000) and savings ($38,000).",
          fileName: "FHSA_90Day_DownPayment_DEMO.pdf",
        },
        {
          category: "PURCHASE_AGREEMENT",
          title: "Agreement of Purchase and Sale (APS)",
          status: "VERIFIED_DEMO",
          severity: "NONE",
          finding: "Signed APS for 420 Wellington St W, Suite 1804 at $780,000 CAD purchase price.",
          fileName: "APS_420_Wellington_Toronto_DEMO.pdf",
        },
        {
          category: "GOVT_ID_PLACEHOLDER",
          title: "Government ID Verification Status (Placeholder)",
          status: "PENDING_MANUAL_REVIEW",
          severity: "NONE",
          finding: "Demo placeholder only — no live cryptographic identity verification connected. Broker must sight physical/verified ID.",
          fileName: "ON_PhotoID_Placeholder_DEMO.pdf",
        },
      ],
      riskFlags: [
        {
          code: "HIGH_RATIO_INSURED",
          severity: "INFO",
          title: "High-Ratio Mortgage Default Insurance Required (90% Base LTV)",
          explanation: "Down payment is 10% ($78,000 CAD). Requires $21,762 CAD illustrative default insurance premium added to loan balance.",
        },
      ],
    },
    {
      ref: "CAN-MORT-2026-102",
      scenario: SAMPLE_BORROWER_SCENARIOS[1],
      stage: "DOCUMENT_CHECK",
      statusBadge: "AWAITING DOCUMENTS — BLOCKING ITEMS",
      hasBlockingDocs: true,
      docChecks: [
        {
          category: "TAX_NOA_T1",
          title: "2-Year CRA T1 Generals & Notices of Assessment",
          status: "MISSING",
          severity: "BLOCKING",
          finding: "MISSING: Self-employed (BFS) applicant has not uploaded 2024/2025 CRA T1 General & NOA packages.",
          fileName: null,
        },
        {
          category: "BANK_STATEMENT_DOWN_PAYMENT",
          title: "6-Month Business Bank Statements & Down Payment Proof",
          status: "INCONSISTENT",
          severity: "WARNING",
          finding: "INCONSISTENT: Uploaded savings statement shows $94,000 CAD vs. declared $124,000 CAD down payment ($30,000 transfer source undocumented).",
          fileName: "MacLeod_Savings_Partial_DEMO.pdf",
        },
        {
          category: "EMPLOYMENT_LETTER",
          title: "Articles of Incorporation & Business License",
          status: "VERIFIED_DEMO",
          severity: "NONE",
          finding: "Alberta corporate registry confirms MacLeod Precision Contracting Ltd. active for 5 years.",
          fileName: "AB_Articles_Of_Incorporation_DEMO.pdf",
        },
        {
          category: "PURCHASE_AGREEMENT",
          title: "Agreement of Purchase and Sale (APS)",
          status: "VERIFIED_DEMO",
          severity: "NONE",
          finding: "APS matches 88 Aspen Summit Way SW, Calgary at $620,000 CAD.",
          fileName: "APS_88_Aspen_Calgary_DEMO.pdf",
        },
        {
          category: "GOVT_ID_PLACEHOLDER",
          title: "Government ID Verification Status (Placeholder)",
          status: "PENDING_MANUAL_REVIEW",
          severity: "NONE",
          finding: "Demo placeholder only — manual broker verification required.",
          fileName: "AB_ID_Placeholder_DEMO.pdf",
        },
      ],
      riskFlags: [
        {
          code: "BFS_MISSING_TAX_EVIDENCE",
          severity: "HIGH",
          title: "Self-Employed Income Documentation Incomplete",
          explanation: "Applicant is Business-for-Self (BFS) with 655 credit score; missing 2-year T1/NOA and 6-month business cash-flow statements.",
        },
        {
          code: "DOWN_PAYMENT_GAP",
          severity: "HIGH",
          title: "$30,000 Down Payment Source Unverified",
          explanation: "Bank statements show $94,000 vs $124,000 declared down payment. Anti-money laundering (FINTRAC) 90-day paper trail required.",
        },
      ],
    },
    {
      ref: "CAN-MORT-2026-103",
      scenario: SAMPLE_BORROWER_SCENARIOS[2],
      stage: "DRAFT_PACKAGE",
      statusBadge: "DRAFT PACKAGE ASSEMBLED — PENDING HUMAN REVIEW",
      hasBlockingDocs: false,
      docChecks: [
        {
          category: "EXISTING_MORTGAGE_STATEMENT",
          title: "Current Mortgage Statement & Payout Balance",
          status: "VERIFIED_DEMO",
          severity: "NONE",
          finding: "Confirms $520,000 CAD existing balance on 2145 West 14th Avenue, Vancouver.",
          fileName: "Existing_Mortgage_Statement_Zhang_DEMO.pdf",
        },
        {
          category: "PAY_STUB",
          title: "Recent Pay Stubs & T4",
          status: "VERIFIED_DEMO",
          severity: "NONE",
          finding: "Matches $225,000 CAD gross annual salary at Pacific Coastal Health Authority.",
          fileName: "Zhang_PayStub_Oct2026_DEMO.pdf",
        },
        {
          category: "EMPLOYMENT_LETTER",
          title: "Letter of Employment",
          status: "VERIFIED_DEMO",
          severity: "NONE",
          finding: "8-year tenure as Clinical Director verified in demo document.",
          fileName: "PCHA_Employment_Letter_DEMO.pdf",
        },
        {
          category: "GOVT_ID_PLACEHOLDER",
          title: "Government ID Verification Status (Placeholder)",
          status: "PENDING_MANUAL_REVIEW",
          severity: "NONE",
          finding: "Demo placeholder — requires in-person or verified broker ID sighting prior to external submission.",
          fileName: "BC_ID_Placeholder_DEMO.pdf",
        },
      ],
      riskFlags: [
        {
          code: "REFINANCE_APPRAISAL_CONDITION",
          severity: "LOW",
          title: "Full Appraisal Required for $260,000 Equity Take-Out",
          explanation: "LTV is conservative at 57.8% (well below 80% refinance limit), but property value of $1.35M requires certified appraisal.",
        },
      ],
    },
    {
      ref: "CAN-MORT-2026-104",
      scenario: SAMPLE_BORROWER_SCENARIOS[3],
      stage: "LENDER_COMPARISON",
      statusBadge: "COMPARING RENEWAL TERMS — PENDING HUMAN REVIEW",
      hasBlockingDocs: false,
      docChecks: [
        {
          category: "EXISTING_MORTGAGE_STATEMENT",
          title: "Maturing Mortgage Renewal Statement",
          status: "VERIFIED_DEMO",
          severity: "NONE",
          finding: "Confirms $415,000 CAD balance maturing next month in Montreal, QC.",
          fileName: "Renewal_Statement_Tremblay_DEMO.pdf",
        },
        {
          category: "PAY_STUB",
          title: "Applicant & Co-Borrower Pay Stubs",
          status: "VERIFIED_DEMO",
          severity: "NONE",
          finding: "Combined household income of $170,000 CAD ($112k + $58k co-borrower) matches pay stubs.",
          fileName: "Tremblay_Gagnon_PayStubs_DEMO.pdf",
        },
        {
          category: "GOVT_ID_PLACEHOLDER",
          title: "Government ID Verification Status (Placeholder)",
          status: "PENDING_MANUAL_REVIEW",
          severity: "NONE",
          finding: "Demo placeholder — requires human verification.",
          fileName: "QC_ID_Placeholder_DEMO.pdf",
        },
      ],
      riskFlags: [
        {
          code: "VARIABLE_RATE_SENSITIVITY",
          severity: "INFO",
          title: "Borrower Comparing Variable vs. 3-Year Fixed Renewal",
          explanation: "Low LTV (64.8%) and strong GDS/TDS ratios allow flexibility between 3-Yr Fixed and 5-Yr Variable.",
        },
      ],
    },
    {
      ref: "CAN-MORT-2026-105",
      scenario: SAMPLE_BORROWER_SCENARIOS[4],
      stage: "HUMAN_REVIEW",
      statusBadge: "ESCALATED FOR MANUAL UNDERWRITER REVIEW",
      hasBlockingDocs: true,
      docChecks: [
        {
          category: "BANK_STATEMENT_DOWN_PAYMENT",
          title: "Gift Letter & 90-Day Donor Account Evidence",
          status: "INCONSISTENT",
          severity: "WARNING",
          finding: "WARNING: Signed gift letter states $150,000 CAD non-repayable gift, but wire deposit shows $135,000 CAD ($15,000 variance).",
          fileName: "Patel_GiftLetter_Discrepancy_DEMO.pdf",
        },
        {
          category: "PAY_STUB",
          title: "Recent Pay Stubs & Employment Letter",
          status: "VERIFIED_DEMO",
          severity: "NONE",
          finding: "Matches $176,000 CAD annual income at Capital Region Advisory Group.",
          fileName: "Patel_Income_Docs_DEMO.pdf",
        },
        {
          category: "PURCHASE_AGREEMENT",
          title: "Agreement of Purchase and Sale (APS)",
          status: "VERIFIED_DEMO",
          severity: "NONE",
          finding: "Confirmed $1,180,000 CAD purchase price in Ottawa, ON.",
          fileName: "APS_112_QueenElizabeth_Ottawa_DEMO.pdf",
        },
        {
          category: "GOVT_ID_PLACEHOLDER",
          title: "Government ID Verification Status (Placeholder)",
          status: "PENDING_MANUAL_REVIEW",
          severity: "NONE",
          finding: "Demo placeholder — human underwriter must confirm identity verification.",
          fileName: "ON_ID_Patel_Placeholder_DEMO.pdf",
        },
      ],
      riskFlags: [
        {
          code: "STRETCHED_STRESS_TEST_RATIOS",
          severity: "HIGH",
          title: "Stress-Tested GDS/TDS Exceed Standard 39% / 44% Prime Caps",
          explanation: "On a $944,000 mortgage at the OSFI B-20 qualifying stress rate, GDS/TDS exceed standard Prime A-Lender limits, requiring co-signer, debt paydown, or alternative equity lender review.",
        },
        {
          code: "GIFT_AMOUNT_MISMATCH",
          severity: "MEDIUM",
          title: "Down Payment Gift Letter vs Deposit Discrepancy ($15,000)",
          explanation: "Agent 2 flagged a $15,000 gap between the gift letter ($150k) and verified bank wire ($135k). Requires manual review by Steve.",
        },
      ],
    },
  ];

  for (const item of appMeta) {
    const s = item.scenario.data;
    const evaluation = evaluateApplicationQualificationAndLenders({
      purpose: s.purpose,
      purchasePriceOrValue: s.purchasePriceOrValue,
      downPaymentAmount: s.downPaymentAmount,
      existingMortgageBalance: s.existingMortgageBalance,
      requestedMortgageAmount: s.requestedMortgageAmount,
      amortizationYears: s.amortizationYears,
      termYears: s.termYears,
      ratePreference: s.ratePreference,
      grossAnnualIncome: s.grossAnnualIncome,
      coBorrowerIncome: s.coBorrowerIncome || 0,
      otherMonthlyIncome: s.otherMonthlyIncome || 0,
      monthlyDebts: s.monthlyDebts,
      annualPropertyTax: s.annualPropertyTax,
      monthlyHeating: s.monthlyHeating,
      monthlyCondoFees: s.monthlyCondoFees,
      creditScoreEstimate: s.creditScoreEstimate,
      employmentType: s.employmentType,
      isFirstTimeBuyer: s.isFirstTimeBuyer,
      hasBlockingDocIssues: item.hasBlockingDocs,
    });

    const borrower = await prisma.borrower.create({
      data: {
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        phone: s.phone,
        province: s.province,
        city: s.city,
        isFirstTimeBuyer: s.isFirstTimeBuyer,
        creditScoreEstimate: s.creditScoreEstimate,
        coBorrowerName: s.coBorrowerName || null,
        coBorrowerIncome: s.coBorrowerIncome || 0,
      },
    });

    const app = await prisma.mortgageApplication.create({
      data: {
        referenceCode: item.ref,
        brokerageId: brokerage.id,
        borrowerId: borrower.id,
        purpose: s.purpose,
        stage: item.stage,
        statusBadge: item.statusBadge,
        requestedMortgageAmount: s.requestedMortgageAmount,
        downPaymentAmount: s.downPaymentAmount,
        downPaymentSource: s.downPaymentSource,
        existingMortgageBalance: s.existingMortgageBalance,
        amortizationYears: s.amortizationYears,
        termYears: s.termYears,
        ratePreference: s.ratePreference,
        paymentFrequency: s.paymentFrequency,
        calculatedGds: evaluation.gdsTds.gdsPct,
        calculatedTds: evaluation.gdsTds.tdsPct,
        calculatedLtv: evaluation.downLtv.baseLtvPct,
        stressTestRate: evaluation.stressTest.qualifyingRatePct,
        estimatedMonthlyPayment: evaluation.stressTest.contractMonthlyPayment,
        insuranceRequired: evaluation.downLtv.insuranceRequired,
        insurancePremium: evaluation.downLtv.insurancePremiumAmount,
        scenarioPreset: item.scenario.id,
        property: {
          create: {
            address: s.address,
            city: s.city,
            province: s.province,
            postalCode: s.postalCode,
            propertyType: s.propertyType,
            occupancy: s.occupancy,
            purchasePriceOrValue: s.purchasePriceOrValue,
            annualPropertyTax: s.annualPropertyTax,
            monthlyHeating: s.monthlyHeating,
            monthlyCondoFees: s.monthlyCondoFees,
          },
        },
        incomeRecords: {
          create: [
            {
              borrowerId: borrower.id,
              employmentType: s.employmentType,
              employerName: s.employerName,
              jobTitle: s.jobTitle,
              yearsAtEmployer: s.yearsAtEmployer,
              grossAmount: s.grossAnnualIncome,
              frequency: "ANNUAL",
              annualizedAmount: s.grossAnnualIncome,
              otherMonthlyAmt: s.otherMonthlyIncome,
              isVerified: !item.hasBlockingDocs,
            },
          ],
        },
        liabilities: {
          create: [
            {
              borrowerId: borrower.id,
              liabilityType: "CREDIT_CARD",
              creditorName: "Canadian Revolving Credit & Installment Obligations",
              balance: s.monthlyDebts * 22,
              monthlyPayment: s.monthlyDebts,
              toBePaidOff: false,
            },
          ],
        },
      },
    });

    // Create Documents and DocumentChecks
    for (const dc of item.docChecks) {
      let docId: string | undefined = undefined;
      if (dc.fileName) {
        const createdDoc = await prisma.document.create({
          data: {
            applicationId: app.id,
            category: dc.category,
            fileName: dc.fileName,
            fileSizeKb: 310,
            mimeType: "application/pdf",
            uploadedByRole: "BORROWER",
            isSampleDemo: true,
            extractedData: JSON.stringify({ note: dc.finding }),
          },
        });
        docId = createdDoc.id;
      }

      await prisma.documentCheck.create({
        data: {
          applicationId: app.id,
          documentId: docId,
          category: dc.category,
          title: dc.title,
          status: dc.status,
          discrepancySeverity: dc.severity,
          findingSummary: dc.finding,
        },
      });
    }

    // Create LenderMatches
    for (const m of evaluation.matches) {
      const lpId = lenderMap[m.lender.code];
      if (!lpId) continue;
      await prisma.lenderMatch.create({
        data: {
          applicationId: app.id,
          lenderProductId: lpId,
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

    // Create UnderwritingAssessment (Agent 4)
    await prisma.underwritingAssessment.create({
      data: {
        applicationId: app.id,
        borrowerFinancialSummary: `${s.firstName} ${s.lastName} (${s.employmentType.replace(
          /_/g,
          " "
        )} at ${s.employerName}). Total qualifying household income: $${evaluation.totalAnnualIncome.toLocaleString()} CAD/yr. Voluntarily supplied credit score estimate: ${s.creditScoreEstimate}. Monthly recurring debt obligations: $${s.monthlyDebts.toLocaleString()} CAD/mo.`,
        debtServiceSummary: `GDS: ${evaluation.gdsTds.gdsPct}% (Standard Regulatory Guideline: <= 39.0%) | TDS: ${evaluation.gdsTds.tdsPct}% (Standard Regulatory Guideline: <= 44.0%) evaluated at OSFI B-20 stress-test rate of ${evaluation.stressTest.qualifyingRatePct}%.`,
        propertyMortgageSummary: `${s.purpose} on ${s.propertyType.replace(
          /_/g,
          " "
        )} at ${s.address}, ${s.city}, ${s.province}. Value: $${s.purchasePriceOrValue.toLocaleString()} CAD. Base LTV: ${evaluation.downLtv.baseLtvPct}%. Total financed mortgage: $${evaluation.totalFinancedMortgage.toLocaleString()} CAD (${
          evaluation.downLtv.insuranceRequired
            ? `includes $${evaluation.downLtv.insurancePremiumAmount.toLocaleString()} default insurance`
            : "Uninsured Conventional"
        }).`,
        documentStatusSummary: item.hasBlockingDocs
          ? "Attention Required: One or more missing or inconsistent supporting documents flagged by Agent 2."
          : "All required demo supporting documents uploaded and cross-checked; manual human ID verification pending.",
        riskFlagsJson: JSON.stringify(item.riskFlags),
        exceptionsAndMissingJson: JSON.stringify(
          topMatch ? topMatch.missingConditions : []
        ),
        policyVsLenderNotes:
          "Regulatory baseline (OSFI B-20 stress test at max(contract + 2.00%, 5.25%) and statutory down payment minimums) is separated from individual fictional lender overlays.",
        humanReviewRecommendation:
          "DRAFT UNDERWRITING PACKAGE ONLY — AI agents cannot approve, pre-approve, or deny any mortgage. File is routed to Steve (Authorized Broker / Internal Underwriter) for human review.",
      },
    });

    // Create SubmissionPackage (Agent 4)
    await prisma.submissionPackage.create({
      data: {
        applicationId: app.id,
        packageNumber: `PKG-${item.ref}`,
        targetLenderName: topMatch
          ? topMatch.lender.lenderName
          : "MapleCrown Bank of Canada",
        targetProductName: topMatch
          ? topMatch.lender.productName
          : "5-Year Fixed Residential",
        packageStatus: "DRAFT_INTERNAL_ONLY",
        summaryPayloadJson: JSON.stringify({
          referenceCode: item.ref,
          borrower: `${s.firstName} ${s.lastName}`,
          location: `${s.city}, ${s.province}`,
          purpose: s.purpose,
          totalFinancedMortgage: evaluation.totalFinancedMortgage,
          gdsPct: evaluation.gdsTds.gdsPct,
          tdsPct: evaluation.gdsTds.tdsPct,
          ltvPct: evaluation.downLtv.baseLtvPct,
          stressRate: evaluation.stressTest.qualifyingRatePct,
        }),
        includedDocsJson: JSON.stringify(
          item.docChecks.filter((d) => d.fileName).map((d) => d.title)
        ),
        openExceptionsJson: JSON.stringify(
          item.docChecks
            .filter((d) => d.status !== "VERIFIED_DEMO")
            .map((d) => `${d.title}: ${d.finding}`)
        ),
        reviewerNotes:
          "Draft package compiled by Agent 4. Awaiting human review in Steve's Underwriter Workspace.",
      },
    });

    // Create Audit Trail Events
    await prisma.auditEvent.createMany({
      data: [
        {
          applicationId: app.id,
          actorName: "Agent 1 (AI Borrower Intake)",
          actorRole: "AI_AGENT",
          eventType: "INTAKE_SAVED",
          summary: `Structured Canadian ${s.purpose} application ${item.ref} created for ${s.firstName} ${s.lastName} (${s.city}, ${s.province}).`,
        },
        {
          applicationId: app.id,
          actorName: "Agent 2 (Document Verification)",
          actorRole: "AI_AGENT",
          eventType: "DOC_CHECK_RUN",
          summary: `Evaluated ${item.docChecks.length} checklist items. ${
            item.hasBlockingDocs
              ? "Flagged missing/inconsistent items for manual review."
              : "All demo documents present; awaiting manual human ID sighting."
          }`,
        },
        {
          applicationId: app.id,
          actorName: "Agent 3 (Qualification & Lender Matcher)",
          actorRole: "AI_AGENT",
          eventType: "QUALIFICATION_CALCULATED",
          summary: `Calculated GDS=${evaluation.gdsTds.gdsPct}%, TDS=${evaluation.gdsTds.tdsPct}%, Base LTV=${evaluation.downLtv.baseLtvPct}% at ${evaluation.stressTest.qualifyingRatePct}% stress-test rate. Ranked 5 fictional lenders.`,
        },
        {
          applicationId: app.id,
          actorName: "Agent 4 (Underwriting Support & Package Builder)",
          actorRole: "AI_AGENT",
          eventType: "PACKAGE_GENERATED",
          summary: `Assembled draft underwriting package PKG-${item.ref}. Enforced Zero-Approval Guardrail — routed to Steve for human review.`,
        },
      ],
    });
  }

  // Seed a sample DemoRequest
  await prisma.demoRequest.create({
    data: {
      fullName: "nadia.desjardins@maplebrokerage-demo.ca",
      workEmail: "nadia.desjardins@maplebrokerage-demo.ca",
      organizationName: "Maple Horizon Mortgage Group (Fictional)",
      organizationType: "MORTGAGE_BROKERAGE",
      province: "ON",
      teamSize: "20-50 brokers",
      message:
        "Interested in demonstrating the 4-stage human-controlled mortgage intake and OSFI B-20 underwriting cockpit to our regional underwriting team.",
      status: "SAVED_LOCAL_DEMO",
    },
  });

  const finalCount = await prisma.mortgageApplication.count();
  return { seeded: true, count: finalCount, reviewerId: steveUser.id };
}
