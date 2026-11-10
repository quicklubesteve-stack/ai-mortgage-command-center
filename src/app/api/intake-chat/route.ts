import { NextRequest, NextResponse } from "next/server";
import { parseConversationalIntakeMessage } from "@/lib/agent-services";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, currentData, applicationId } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    const result = parseConversationalIntakeMessage(message, currentData || {});

    if (result.guardrailTriggered) {
      await prisma.auditEvent.create({
        data: {
          applicationId: applicationId || null,
          actorName: "Agent 1 (AI Borrower Intake)",
          actorRole: "AI_AGENT",
          eventType: "GUARDRAIL_ENFORCED",
          summary: `Blocked autonomous approval/denial request: "${message.slice(0, 80)}". Enforced human-only decision guardrail.`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Intake assistant error" },
      { status: 500 }
    );
  }
}
