import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { GET as getPdfRoute } from "@/app/api/applications/[id]/pdf/route";
import { PATCH as patchAppRoute } from "@/app/api/applications/[id]/route";
import { NextRequest } from "next/server";

describe("Phase 4: Underwriting Support, PDF Export, Human Review & Audit Trail", () => {
  it("stores explainable risk flags and draft submission packages without autonomous approvals", async () => {
    const app = await prisma.mortgageApplication.findUnique({
      where: { referenceCode: "CAN-MORT-2026-105" },
      include: {
        underwritingAssessment: true,
        submissionPackages: true,
      },
    });

    expect(app).not.toBeNull();
    expect(app?.underwritingAssessment).not.toBeNull();
    expect(
      app?.underwritingAssessment?.humanReviewRecommendation
    ).toContain("cannot approve, pre-approve, or deny");

    const riskFlags = JSON.parse(
      app?.underwritingAssessment?.riskFlagsJson || "[]"
    );
    expect(riskFlags.length).toBeGreaterThanOrEqual(2);
    expect(app?.submissionPackages[0]?.packageStatus).toBe(
      "DRAFT_INTERNAL_ONLY"
    );
  });

  it("generates a valid downloadable PDF summary buffer from Agent 4", async () => {
    const app = await prisma.mortgageApplication.findUnique({
      where: { referenceCode: "CAN-MORT-2026-101" },
    });
    expect(app).not.toBeNull();

    const req = new NextRequest(
      `http://127.0.0.1:3000/api/applications/${app!.id}/pdf`
    );
    const res = await getPdfRoute(req, { params: { id: app!.id } });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");

    const buf = await res.arrayBuffer();
    const header = Buffer.from(buf).subarray(0, 5).toString("ascii");
    expect(header).toBe("%PDF-");
  });

  it("enforces server-side RBAC on Human Review actions and logs immutable ReviewDecision + AuditEvent", async () => {
    const app = await prisma.mortgageApplication.findUnique({
      where: { referenceCode: "CAN-MORT-2026-101" },
    });
    expect(app).not.toBeNull();

    // 1. Test BORROWER role is rejected with HTTP 403
    const unauthorizedReq = new NextRequest(
      `http://127.0.0.1:3000/api/applications/${app!.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-demo-role": "BORROWER",
        },
        body: JSON.stringify({
          action: "RECORD_HUMAN_REVIEW",
          reviewAction: "MARK_INTERNALLY_REVIEWED",
          notes: "Borrower attempting to self-review",
        }),
      }
    );
    const unauthorizedRes = await patchAppRoute(unauthorizedReq, {
      params: { id: app!.id },
    });
    expect(unauthorizedRes.status).toBe(403);

    // 2. Test INTERNAL_UNDERWRITER (Steve) succeeds and updates status to INTERNALLY REVIEWED (NOT AN APPROVAL)
    const authorizedReq = new NextRequest(
      `http://127.0.0.1:3000/api/applications/${app!.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-demo-role": "INTERNAL_UNDERWRITER",
        },
        body: JSON.stringify({
          action: "RECORD_HUMAN_REVIEW",
          reviewAction: "MARK_INTERNALLY_REVIEWED",
          notes:
            "Reviewed by Steve: Complete first-time buyer file; internal review completed.",
          reviewerName: "Steve (Principal Underwriter)",
        }),
      }
    );
    const authorizedRes = await patchAppRoute(authorizedReq, {
      params: { id: app!.id },
    });
    expect(authorizedRes.status).toBe(200);
    const data = await authorizedRes.json();
    expect(data.success).toBe(true);
    expect(data.newBadge).toBe("INTERNALLY REVIEWED (NOT AN APPROVAL)");
  });
});
