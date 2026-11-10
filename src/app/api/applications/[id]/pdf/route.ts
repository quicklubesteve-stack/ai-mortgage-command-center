import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsPDF } from "jspdf";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const app = await prisma.mortgageApplication.findUnique({
      where: { id: params.id },
      include: {
        borrower: true,
        property: true,
        incomeRecords: true,
        liabilities: true,
        documentChecks: true,
        lenderMatches: {
          include: { lenderProduct: true },
          orderBy: { rankOrder: "asc" },
        },
        underwritingAssessment: true,
        reviewDecisions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!app) {
      return NextResponse.json(
        { success: false, error: "Mortgage application not found" },
        { status: 404 }
      );
    }

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // Header Banner
    doc.setFillColor(10, 17, 34);
    doc.rect(0, 0, 210, 34, "F");
    doc.setTextColor(20, 184, 166);
    doc.setFontSize(10);
    doc.text("AI MORTGAGE COMMAND CENTER — DEMO MODE (FICTIONAL DATA ONLY)", 14, 11);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text(`DRAFT UNDERWRITING & LENDER PACKAGE: ${app.referenceCode}`, 14, 21);
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Status: ${app.statusBadge} | Generated: ${new Date().toISOString().slice(0, 10)} | Human-Controlled Decisions`,
      14,
      29
    );

    let y = 44;
    const addSectionTitle = (title: string) => {
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y - 5, 182, 8, "F");
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.text(title, 17, y);
      y += 8;
    };

    const addLine = (label: string, value: string) => {
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`${label}:`, 16, y);
      doc.setTextColor(15, 23, 42);
      const wrapped = doc.splitTextToSize(value, 125);
      doc.text(wrapped, 68, y);
      y += Math.max(6, wrapped.length * 5);
    };

    addSectionTitle("1. BORROWER & PROPERTY SUMMARY (FICTIONAL DEMO RECORD)");
    addLine(
      "Applicant Name",
      `${app.borrower.firstName} ${app.borrower.lastName} (${app.borrower.email})`
    );
    addLine(
      "Property Location",
      `${app.property?.address || ""}, ${app.borrower.city}, ${app.borrower.province}`
    );
    addLine(
      "Mortgage Purpose & Type",
      `${app.purpose} | ${app.property?.propertyType || "RESIDENTIAL"} | First-Time Buyer: ${
        app.borrower.isFirstTimeBuyer ? "Yes" : "No"
      }`
    );
    addLine(
      "Property Price / Value",
      `$${(app.property?.purchasePriceOrValue || 0).toLocaleString()} CAD`
    );
    addLine(
      "Requested Mortgage & Down Payment",
      `Mortgage: $${app.requestedMortgageAmount.toLocaleString()} CAD | Down Payment / Equity: $${app.downPaymentAmount.toLocaleString()} CAD (${app.downPaymentSource})`
    );

    y += 3;
    addSectionTitle("2. CANADIAN QUALIFICATION & STRESS-TEST RATIOS (AGENT 3)");
    addLine(
      "Debt Service Ratios",
      `GDS: ${app.calculatedGds?.toFixed(2)}% (Guideline <= 39.0%) | TDS: ${app.calculatedTds?.toFixed(
        2
      )}% (Guideline <= 44.0%)`
    );
    addLine(
      "Loan-to-Value (LTV) & Insurance",
      `Base LTV: ${app.calculatedLtv?.toFixed(2)}% | Default Insurance Required: ${
        app.insuranceRequired
          ? `Yes ($${app.insurancePremium.toLocaleString()} CAD illustrative premium)`
          : "No (Conventional Uninsured)"
      }`
    );
    addLine(
      "OSFI B-20 Stress Test & Payment",
      `Qualifying Stress Rate: ${app.stressTestRate?.toFixed(2)}% | Est. Contract Monthly P&I: $${(
        app.estimatedMonthlyPayment || 0
      ).toLocaleString()} CAD/mo (${app.amortizationYears}yr amort / ${app.termYears}yr ${
        app.ratePreference
      })`
    );

    y += 3;
    addSectionTitle("3. DOCUMENT VERIFICATION SUMMARY (AGENT 2)");
    for (const check of app.documentChecks.slice(0, 6)) {
      addLine(check.title, `[${check.status}] ${check.findingSummary}`);
    }

    y += 3;
    addSectionTitle("4. TOP FICTIONAL LENDER COMPARISON & HUMAN REVIEW NOTES");
    const selectedMatch =
      app.lenderMatches.find((m) => m.isSelectedForPackage) ||
      app.lenderMatches[0];
    if (selectedMatch) {
      addLine(
        "Target Fictional Product",
        `${selectedMatch.lenderProduct.lenderName} — ${selectedMatch.lenderProduct.productName} (${selectedMatch.lenderProduct.illustrativeRatePct}% Illustrative)`
      );
      addLine(
        "Fit Score & Monthly Payment",
        `Fit Score: ${selectedMatch.fitScore}/100 (${selectedMatch.fitStatus}) | Est. Payment: $${selectedMatch.estimatedMonthlyPayment.toLocaleString()} CAD/mo`
      );
    }

    const latestDecision = app.reviewDecisions[0];
    addLine(
      "Human Reviewer Status",
      latestDecision
        ? `${latestDecision.action} by ${latestDecision.reviewerName}: "${latestDecision.notes}"`
        : "Pending Human Review in Steve's Underwriter Workspace"
    );

    // Mandatory Governance Disclaimer Footer
    doc.setFillColor(254, 242, 242);
    doc.rect(14, 262, 182, 22, "F");
    doc.setTextColor(153, 27, 27);
    doc.setFontSize(8.5);
    doc.text(
      "MANDATORY COMPLIANCE & HUMAN-IN-THE-LOOP NOTICE: This document is a fictional demonstration summary generated by AI Mortgage Command Center.",
      17,
      268
    );
    doc.text(
      "AI agents never approve, pre-approve, guarantee, or deny mortgages or submit files externally. Internal human review is NOT a final mortgage approval.",
      17,
      274
    );
    doc.text(
      "Dated Canadian mortgage policy assumptions (2026-01-01 baseline) and fictional lender products are for demonstration only.",
      17,
      280
    );

    const pdfArrayBuffer = doc.output("arraybuffer");

    await prisma.auditEvent.create({
      data: {
        applicationId: app.id,
        actorName: "Agent 4 (PDF Package Exporter)",
        actorRole: "SYSTEM",
        eventType: "PDF_PACKAGE_EXPORTED",
        summary: `Exported downloadable draft PDF summary for ${app.referenceCode}.`,
      },
    });

    return new NextResponse(Buffer.from(pdfArrayBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${app.referenceCode}-Draft-Underwriting-Package.pdf"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
