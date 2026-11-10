import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seedDatabaseIfEmpty } from "@/lib/seed-helper";

export async function GET() {
  try {
    await seedDatabaseIfEmpty(false);
    const lenders = await prisma.lenderProduct.findMany({
      orderBy: { illustrativeRatePct: "asc" },
    });
    return NextResponse.json({ success: true, lenders });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load lender products" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const roleHeader = req.headers.get("x-demo-role") || "INTERNAL_UNDERWRITER";
    if (roleHeader === "BORROWER") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unauthorized: Borrowers cannot modify fictional lender product rules.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      id,
      illustrativeRatePct,
      minCreditScore,
      maxGdsPct,
      maxTdsPct,
      maxLtvPct,
      acceptsSelfEmployed,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Lender product id is required" },
        { status: 400 }
      );
    }

    const updated = await prisma.lenderProduct.update({
      where: { id },
      data: {
        ...(illustrativeRatePct !== undefined && {
          illustrativeRatePct: Number(illustrativeRatePct),
        }),
        ...(minCreditScore !== undefined && {
          minCreditScore: Number(minCreditScore),
        }),
        ...(maxGdsPct !== undefined && { maxGdsPct: Number(maxGdsPct) }),
        ...(maxTdsPct !== undefined && { maxTdsPct: Number(maxTdsPct) }),
        ...(maxLtvPct !== undefined && { maxLtvPct: Number(maxLtvPct) }),
        ...(acceptsSelfEmployed !== undefined && {
          acceptsSelfEmployed: Boolean(acceptsSelfEmployed),
        }),
      },
    });

    await prisma.auditEvent.create({
      data: {
        actorName: `Role: ${roleHeader}`,
        actorRole: roleHeader,
        eventType: "LENDER_CRITERIA_UPDATED",
        summary: `Updated fictional lender rules for ${updated.lenderName} (${updated.productName}): Rate=${updated.illustrativeRatePct}%, MinScore=${updated.minCreditScore}, MaxGDS=${updated.maxGdsPct}%, MaxTDS=${updated.maxTdsPct}%.`,
      },
    });

    return NextResponse.json({ success: true, lender: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update lender" },
      { status: 500 }
    );
  }
}
