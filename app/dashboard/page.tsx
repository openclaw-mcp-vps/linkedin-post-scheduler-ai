import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { format } from "date-fns";

import EngagementPredictor from "@/components/EngagementPredictor";
import { LogoutButton } from "@/components/LogoutButton";
import PostEditor from "@/components/PostEditor";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listScheduledPostsByUser } from "@/lib/linkedin-api";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const hasAccess = cookieStore.get("lps_paid")?.value === "1";
  const userEmail = cookieStore.get("lps_email")?.value ?? "";

  if (!hasAccess || !userEmail) {
    redirect("/?paywall=1");
  }

  const posts = await listScheduledPostsByUser(userEmail);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-sky-300">Workspace</p>
          <h1 className="text-2xl font-bold text-white">LinkedIn Content Dashboard</h1>
          <p className="text-sm text-slate-400">Signed in as {userEmail}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/calendar"
            className="inline-flex h-10 items-center rounded-lg border border-slate-700 bg-slate-900 px-4 text-sm text-slate-100 hover:bg-slate-800"
          >
            Open Calendar
          </Link>
          <LogoutButton />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <PostEditor />
        <EngagementPredictor />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Upcoming Scheduled Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <p className="text-sm text-slate-400">
              You do not have posts scheduled yet. Build your next week now and keep your audience
              warm.
            </p>
          ) : (
            <div className="space-y-4">
              {posts.slice(0, 8).map((post) => (
                <div
                  key={post.id}
                  className="rounded-lg border border-slate-700 bg-slate-950/60 p-4 text-sm"
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="muted" className="uppercase">
                        {post.contentType}
                      </Badge>
                      <Badge>{post.predictedEngagement}/100</Badge>
                    </div>
                    <span className="text-xs text-slate-400">
                      {format(new Date(post.scheduledFor), "EEE, MMM d 'at' h:mm a")}
                    </span>
                  </div>
                  <p className="line-clamp-3 text-slate-200">{post.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
