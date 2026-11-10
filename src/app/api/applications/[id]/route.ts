import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const application = await prisma.mortgageApplication.findUnique({
      where: { id: params.id },
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
        auditEvents: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: "Mortgage application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, application });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load application" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roleHeader = req.headers.get("x-demo-role") || "INTERNAL_UNDERWRITER";
    const body = await req.json();
    const { action } = body;

    const app = await prisma.mortgageApplication.findUnique({
      where: { id: params.id },
      include: { borrower: true },
    });

    if (!app) {
      return NextResponse.json(
        { success: false, error: "Mortgage application not found" },
        { status: 404 }
      );
    }

    if (action === "UPDATE_STAGE") {
      const updated = await prisma.mortgageApplication.update({
        where: { id: params.id },
        data: {
          stage: body.stage,
          ...(body.statusBadge && { statusBadge: body.statusBadge }),
        },
      });

      await prisma.auditEvent.create({
        data: {
          applicationId: params.id,
          actorName: `User (${roleHeader})`,
          actorRole: roleHeader,
          eventType: "STAGE_ADVANCED",
          summary: `Application ${app.referenceCode} moved to stage ${body.stage}.`,
        },
      });

      return NextResponse.json({ success: true, application: updated });
    }

    if (action === "UPLOAD_SAMPLE_DOC") {
      const { checkId, category, fileName, findingSummary, newStatus } = body;

      const doc = await prisma.document.create({
        data: {
          applicationId: params.id,
          category: category || "PAY_STUB",
          fileName: fileName || "Sample_Supporting_Document_DEMO.pdf",
          fileSizeKb: 285,
          mimeType: "application/pdf",
          uploadedByRole: roleHeader,
          isSampleDemo: true,
        },
      });

      if (checkId) {
        await prisma.documentCheck.update({
          where: { id: checkId },
          data: {
            documentId: doc.id,
            status: newStatus || "PENDING_MANUAL_REVIEW",
            discrepancySeverity: "NONE",
            findingSummary:
              findingSummary ||
              `Uploaded sample PDF (${doc.fileName}). Ready for manual human verification (demo mode — no automated authenticity claim).`,
          },
        });
      }

      await prisma.auditEvent.create({
        data: {
          applicationId: params.id,
          actorName: "Agent 2 (Document Verification)",
          actorRole: roleHeader,
          eventType: "DOC_UPLOADED",
          summary: `Uploaded demo PDF "${doc.fileName}" for category ${category}. Marked for manual human review.`,
        },
      });

      return NextResponse.json({ success: true, document: doc });
    }

    if (action === "UPDATE_DOC_CHECK") {
      if (roleHeader === "BORROWER") {
        return NextResponse.json(
          {
            success: false,
            error:
              "Unauthorized: Borrowers cannot manually override internal document review statuses.",
          },
          { status: 403 }
        );
      }

      const { checkId, status, discrepancySeverity, findingSummary, reviewerOverrideNote } =
        body;

      const updatedCheck = await prisma.documentCheck.update({
        where: { id: checkId },
        data: {
          status,
          ...(discrepancySeverity && { discrepancySeverity }),
          ...(findingSummary && { findingSummary }),
          ...(reviewerOverrideNote !== undefined && { reviewerOverrideNote }),
        },
      });

      await prisma.auditEvent.create({
        data: {
          applicationId: params.id,
          actorName: `Internal Reviewer (${roleHeader})`,
          actorRole: roleHeader,
          eventType: "DOC_CHECK_UPDATED",
          summary: `Updated "${updatedCheck.title}" status to ${status}.${
            reviewerOverrideNote ? ` Note: ${reviewerOverrideNote}` : ""
          }`,
        },
      });

      return NextResponse.json({ success: true, documentCheck: updatedCheck });
    }

    if (action === "SELECT_LENDER_MATCH") {
      const { matchId, targetLenderName, targetProductName } = body;

      await prisma.lenderMatch.updateMany({
        where: { applicationId: params.id },
        data: { isSelectedForPackage: false },
      });

      await prisma.lenderMatch.update({
        where: { id: matchId },
        data: { isSelectedForPackage: true },
      });

      await prisma.submissionPackage.updateMany({
        where: { applicationId: params.id },
        data: {
          targetLenderName: targetLenderName || "Selected Fictional Lender",
          targetProductName: targetProductName || "Selected Mortgage Product",
        },
      });

      await prisma.auditEvent.create({
        data: {
          applicationId: params.id,
          actorName: "Agent 4 (Package Builder)",
          actorRole: roleHeader,
          eventType: "PACKAGE_LENDER_SELECTED",
          summary: `Updated draft submission package target lender to ${targetLenderName} (${targetProductName}).`,
        },
      });

      return NextResponse.json({ success: true });
    }

    if (action === "RECORD_HUMAN_REVIEW") {
      // Enforce server-side RBAC: Only INTERNAL_UNDERWRITER, MORTGAGE_BROKER, or BROKERAGE_ADMIN can record human review decisions
      if (!["INTERNAL_UNDERWRITER", "MORTGAGE_BROKER", "BROKERAGE_ADMIN"].includes(roleHeader)) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Forbidden (HTTP 403): Current role does not have human underwriter review authority. Switch to Internal Underwriter (Steve) or Mortgage Broker.",
          },
          { status: 403 }
        );
      }

      const { reviewAction, notes, reviewerName } = body;
      const validActions = [
        "MARK_INTERNALLY_REVIEWED",
        "REQUEST_MISSING_INFO",
        "RETURN_FOR_CORRECTION",
        "PREPARE_EXTERNAL_SUBMISSION",
      ];

      if (!validActions.includes(reviewAction)) {
        return NextResponse.json(
          { success: false, error: "Invalid human review action" },
          { status: 400 }
        );
      }

      let newStage = app.stage;
      let newBadge = app.statusBadge;
      let pkgStatus = "DRAFT_INTERNAL_ONLY";

      if (reviewAction === "MARK_INTERNALLY_REVIEWED") {
        newStage = "INTERNALLY_REVIEWED";
        newBadge = "INTERNALLY REVIEWED (NOT AN APPROVAL)";
        pkgStatus = "INTERNALLY_REVIEWED";
      } else if (reviewAction === "REQUEST_MISSING_INFO") {
        newStage = "DOCUMENT_CHECK";
        newBadge = "MISSING INFO REQUESTED BY REVIEWER";
      } else if (reviewAction === "RETURN_FOR_CORRECTION") {
        newStage = "RETURNED_FOR_CORRECTION";
        newBadge = "RETURNED FOR CORRECTION";
      } else if (reviewAction === "PREPARE_EXTERNAL_SUBMISSION") {
        newStage = "INTERNALLY_REVIEWED";
        newBadge = "READY FOR FUTURE EXTERNAL SUBMISSION WORKFLOW";
        pkgStatus = "READY_FOR_FUTURE_SUBMISSION";
      }

      const decision = await prisma.reviewDecision.create({
        data: {
          applicationId: params.id,
          reviewerName:
            reviewerName || "Steve (Senior Mortgage Broker & Principal Underwriter)",
          reviewerRole: roleHeader,
          action: reviewAction,
          notes:
            notes ||
            "Reviewed file in Human Review Workspace. Internal review completion is not a final mortgage approval.",
          disclaimerAck: true,
        },
      });

      await prisma.mortgageApplication.update({
        where: { id: params.id },
        data: {
          stage: newStage,
          statusBadge: newBadge,
        },
      });

      await prisma.submissionPackage.updateMany({
        where: { applicationId: params.id },
        data: {
          packageStatus: pkgStatus,
          reviewerNotes: notes,
        },
      });

      await prisma.auditEvent.create({
        data: {
          applicationId: params.id,
          actorName:
            reviewerName || "Steve (Senior Mortgage Broker & Principal Underwriter)",
          actorRole: roleHeader,
          eventType: "HUMAN_REVIEW_RECORDED",
          summary: `Human Reviewer recorded "${reviewAction}" on ${app.referenceCode}. Notes: "${
            notes || "Standard review"
          }". (Internal review is not a lending approval.)`,
        },
      });

      return NextResponse.json({ success: true, decision, newStage, newBadge });
    }

    return NextResponse.json(
      { success: false, error: "Unsupported PATCH action" },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update application" },
      { status: 500 }
    );
  }
}
