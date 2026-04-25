import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { generateLinkedInContent } from "@/lib/openai";

const generateSchema = z.object({
  niche: z.string().min(2),
  audience: z.string().min(2),
  goal: z.string().min(2),
  tone: z.string().min(2),
  callToAction: z.string().min(2),
});

export async function POST(request: NextRequest) {
  const hasAccess = request.cookies.get("lps_paid")?.value === "1";

  if (!hasAccess) {
    return NextResponse.json(
      { error: "Subscription required to generate AI content." },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = generateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await generateLinkedInContent(parsed.data);
  return NextResponse.json(result);
}
