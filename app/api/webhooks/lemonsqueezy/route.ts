import { NextRequest, NextResponse } from "next/server";

import {
  extractEmailFromLemonSqueezyPayload,
  initializeLemonSqueezy,
  verifyLemonSqueezySignature,
} from "@/lib/lemonsqueezy";
import { markEmailAsPaid } from "@/lib/paywall-store";

export async function POST(request: NextRequest) {
  initializeLemonSqueezy();

  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  if (
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET &&
    !verifyLemonSqueezySignature(rawBody, signature)
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as {
    meta?: { event_name?: string };
    data?: { id?: string };
  };

  const eventName = payload.meta?.event_name;
  const paidEvents = new Set([
    "order_created",
    "subscription_created",
    "subscription_payment_success",
  ]);

  if (eventName && paidEvents.has(eventName)) {
    const email = extractEmailFromLemonSqueezyPayload(payload);
    if (email) {
      await markEmailAsPaid(email, "lemonsqueezy", payload.data?.id);
    }
  }

  return NextResponse.json({ received: true });
}
