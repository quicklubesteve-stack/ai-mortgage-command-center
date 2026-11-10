import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const demoRequestSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  workEmail: z.string().email("Valid work email is required"),
  organizationName: z.string().min(2, "Organization name is required"),
  organizationType: z.string().min(2),
  province: z.string().default("ON"),
  teamSize: z.string().default("5-20 brokers"),
  message: z.string().optional(),
});

export async function GET() {
  try {
    const requests = await prisma.demoRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
    });
    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load demo requests" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = demoRequestSchema.safeParse(body);
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

    const created = await prisma.demoRequest.create({
      data: {
        ...parsed.data,
        status: "SAVED_LOCAL_DEMO",
      },
    });

    await prisma.auditEvent.create({
      data: {
        actorName: parsed.data.fullName,
        actorRole: "PUBLIC_VISITOR",
        eventType: "DEMO_BOOKING_SAVED",
        summary: `Local demo booking saved for ${parsed.data.organizationName} (${parsed.data.province}).`,
      },
    });

    return NextResponse.json({ success: true, demoRequest: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save demo request" },
      { status: 500 }
    );
  }
}
