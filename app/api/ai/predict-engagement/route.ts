import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { predictLinkedInEngagement } from "@/lib/openai";

const predictSchema = z.object({
  content: z.string().min(40),
  scheduledFor: z.string().datetime(),
  hashtags: z.array(z.string().min(1)).max(10),
  contentType: z.enum(["text", "carousel", "video", "poll"]),
  historicalAverageEngagement: z.number().optional(),
});

export async function POST(request: NextRequest) {
  const hasAccess = request.cookies.get("lps_paid")?.value === "1";

  if (!hasAccess) {
    return NextResponse.json(
      { error: "Subscription required to predict engagement." },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = predictSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const prediction = await predictLinkedInEngagement(parsed.data);
  return NextResponse.json(prediction);
}
