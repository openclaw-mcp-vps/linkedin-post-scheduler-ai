import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set("lps_paid", "", {
    maxAge: 0,
    path: "/",
  });

  response.cookies.set("lps_email", "", {
    maxAge: 0,
    path: "/",
  });

  return response;
}
