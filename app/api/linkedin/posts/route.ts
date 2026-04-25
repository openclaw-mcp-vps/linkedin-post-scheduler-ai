import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { listScheduledPostsByUser, scheduleLinkedInPost } from "@/lib/linkedin-api";

const scheduleSchema = z.object({
  content: z.string().min(40),
  hashtags: z.array(z.string().min(1)).max(10),
  contentType: z.enum(["text", "carousel", "video", "poll"]),
  scheduledFor: z.string().datetime(),
  predictedEngagement: z.number().min(1).max(100),
});

export async function GET(request: NextRequest) {
  const queryEmail = request.nextUrl.searchParams.get("email");
  const cookieEmail = request.cookies.get("lps_email")?.value;
  const userEmail = (queryEmail ?? cookieEmail ?? "").trim().toLowerCase();

  if (!userEmail) {
    return NextResponse.json(
      { error: "Missing user email. Unlock access first." },
      { status: 400 },
    );
  }

  const posts = await listScheduledPostsByUser(userEmail);
  return NextResponse.json({ posts });
}

export async function POST(request: NextRequest) {
  const hasAccess = request.cookies.get("lps_paid")?.value === "1";
  const userEmail = request.cookies.get("lps_email")?.value?.trim().toLowerCase();

  if (!hasAccess || !userEmail) {
    return NextResponse.json(
      { error: "Active subscription required." },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = scheduleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid post payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const post = await scheduleLinkedInPost({
    userEmail,
    content: parsed.data.content,
    hashtags: parsed.data.hashtags.map((tag) => tag.replace(/^#/, "")),
    contentType: parsed.data.contentType,
    scheduledFor: parsed.data.scheduledFor,
    predictedEngagement: parsed.data.predictedEngagement,
  });

  return NextResponse.json({ post }, { status: 201 });
}
