import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import CalendarView from "@/components/CalendarView";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listScheduledPostsByUser } from "@/lib/linkedin-api";

export default async function CalendarPage() {
  const cookieStore = await cookies();
  const hasAccess = cookieStore.get("lps_paid")?.value === "1";
  const userEmail = cookieStore.get("lps_email")?.value ?? "";

  if (!hasAccess || !userEmail) {
    redirect("/?paywall=1");
  }

  const posts = await listScheduledPostsByUser(userEmail);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Calendar</h1>
          <p className="text-sm text-slate-400">
            Review your post plan by day and adjust for consistency.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center rounded-lg border border-slate-700 bg-slate-900 px-4 text-sm text-slate-100 hover:bg-slate-800"
        >
          Back to Dashboard
        </Link>
      </div>

      <CalendarView
        posts={posts.map((post) => ({
          id: post.id,
          content: post.content,
          contentType: post.contentType,
          scheduledFor: post.scheduledFor,
          predictedEngagement: post.predictedEngagement,
          hashtags: post.hashtags,
        }))}
      />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Calendar Optimization Tip</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-300">
          Keep at least one deep educational post and one contrarian opinion post each week. Mixing
          formats improves both reach and high-intent engagement from potential clients.
        </CardContent>
      </Card>
    </main>
  );
}
