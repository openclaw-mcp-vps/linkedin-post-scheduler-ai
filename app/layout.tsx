import type { Metadata } from "next";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";

import "@/app/globals.css";

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "700"],
});

const bodyFont = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://linkedin-post-scheduler-ai.vercel.app"),
  title: "LinkedIn Post Scheduler AI | Predict engagement before you publish",
  description:
    "Plan your LinkedIn content calendar, generate better posts with AI, and schedule at the best time for higher engagement.",
  keywords: [
    "LinkedIn scheduler",
    "AI content calendar",
    "engagement prediction",
    "creator growth",
  ],
  openGraph: {
    title: "LinkedIn Post Scheduler AI",
    description:
      "AI-powered LinkedIn planning with engagement prediction and a simple weekly publishing workflow.",
    type: "website",
    url: "https://linkedin-post-scheduler-ai.vercel.app",
    siteName: "LinkedIn Post Scheduler AI",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "LinkedIn Post Scheduler AI dashboard preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkedIn Post Scheduler AI",
    description:
      "Schedule consistently and predict engagement using timing, hashtags, and post format.",
    images: ["/og-image.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${headingFont.variable} ${bodyFont.variable} min-h-screen bg-[#0d1117] text-slate-100 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
