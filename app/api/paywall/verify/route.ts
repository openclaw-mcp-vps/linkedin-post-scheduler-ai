import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { isEmailPaid } from "@/lib/paywall-store";

const verifySchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = verifySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid purchase email address." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const isPaid = await isEmailPaid(email);

  if (!isPaid) {
    return NextResponse.json(
      {
        error:
          "No completed purchase found for this email yet. If you just paid, wait a minute and try again.",
      },
      { status: 402 },
    );
  }

  const response = NextResponse.json({
    success: true,
    message: "Purchase verified. Access unlocked.",
  });

  const cookieConfig = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  };

  response.cookies.set("lps_paid", "1", cookieConfig);
  response.cookies.set("lps_email", email, cookieConfig);

  return response;
}
