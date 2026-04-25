import { createHmac, timingSafeEqual } from "node:crypto";

import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

let initialized = false;

export function initializeLemonSqueezy() {
  if (initialized) {
    return;
  }

  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) {
    return;
  }

  lemonSqueezySetup({
    apiKey,
    onError: (error) => {
      console.error("Lemon Squeezy setup error", error);
    },
  });

  initialized = true;
}

export function verifyLemonSqueezySignature(
  rawBody: string,
  signatureHeader: string | null,
) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  if (!secret || !signatureHeader) {
    return false;
  }

  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");

  const digestBuffer = Buffer.from(digest);
  const signatureBuffer = Buffer.from(signatureHeader);

  if (digestBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return timingSafeEqual(digestBuffer, signatureBuffer);
}

export function extractEmailFromLemonSqueezyPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const typedPayload = payload as {
    data?: { attributes?: Record<string, unknown> };
    meta?: { custom_data?: Record<string, unknown> };
  };

  const fromMeta = typedPayload.meta?.custom_data?.email;
  if (typeof fromMeta === "string" && fromMeta.includes("@")) {
    return fromMeta.trim().toLowerCase();
  }

  const attributes = typedPayload.data?.attributes;
  const candidates = [
    attributes?.user_email,
    attributes?.email,
    attributes?.customer_email,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.includes("@")) {
      return value.trim().toLowerCase();
    }
  }

  return null;
}
