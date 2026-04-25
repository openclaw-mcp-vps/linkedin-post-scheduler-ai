import { createHmac, timingSafeEqual } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { markEmailAsPaid } from "@/lib/paywall-store";

interface StripeEvent {
  id: string;
  type: string;
  data?: {
    object?: {
      customer_email?: string;
      customer_details?: {
        email?: string;
      };
      receipt_email?: string;
    };
  };
}

function verifyStripeSignature(rawBody: string, signatureHeader: string, secret: string) {
  const pairs = signatureHeader.split(",").map((piece) => piece.split("="));
  const timestamp = pairs.find(([key]) => key === "t")?.[1];
  const signature = pairs.find(([key]) => key === "v1")?.[1];

  if (!timestamp || !signature) {
    return false;
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const expectedSignature = createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature);
  const signatureBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, signatureBuffer);
}

function extractStripeEmail(event: StripeEvent) {
  return (
    event.data?.object?.customer_details?.email ??
    event.data?.object?.customer_email ??
    event.data?.object?.receipt_email ??
    null
  );
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (secret) {
    if (!signatureHeader) {
      return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
    }

    if (!verifyStripeSignature(rawBody, signatureHeader, secret)) {
      return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 401 });
    }
  }

  const event = JSON.parse(rawBody) as StripeEvent;

  if (event.type === "checkout.session.completed") {
    const email = extractStripeEmail(event);
    if (email) {
      await markEmailAsPaid(email, "stripe", event.id);
    }
  }

  return NextResponse.json({ received: true });
}
