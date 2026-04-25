import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { buildLinkedInAuthUrl, exchangeLinkedInCodeForToken } from "@/lib/linkedin-api";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (code) {
    try {
      const tokenData = await exchangeLinkedInCodeForToken(code);
      return NextResponse.json({
        connected: true,
        expiresIn: tokenData.expires_in,
        scope: tokenData.scope,
      });
    } catch (error) {
      return NextResponse.json(
        {
          error: "Failed to exchange LinkedIn authorization code.",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 400 },
      );
    }
  }

  const state = request.nextUrl.searchParams.get("state") ?? randomUUID();
  const authUrl = buildLinkedInAuthUrl(state);

  if (!authUrl) {
    return NextResponse.json(
      {
        error:
          "LinkedIn OAuth is not configured. Set LINKEDIN_CLIENT_ID and LINKEDIN_REDIRECT_URI.",
      },
      { status: 400 },
    );
  }

  if (request.nextUrl.searchParams.get("redirect") === "1") {
    return NextResponse.redirect(authUrl);
  }

  return NextResponse.json({ authUrl, state });
}
