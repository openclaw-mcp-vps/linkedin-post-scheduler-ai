import Link from "next/link";
import { cookies } from "next/headers";
import { BarChart3, CalendarClock, CheckCircle2, Sparkles } from "lucide-react";

import { AccessUnlockForm } from "@/components/AccessUnlockForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ paywall?: string }>;
}) {
  const cookieStore = await cookies();
  const params = await searchParams;
  const hasAccess = cookieStore.get("lps_paid")?.value === "1";

  const stripePaymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ?? "";

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 p-8 md:p-12">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />

        <Badge className="mb-4">AI LinkedIn Growth System</Badge>
        <h1 className="max-w-3xl text-3xl font-bold leading-tight text-white md:text-5xl">
          Plan smarter LinkedIn posts with AI suggestions and engagement predictions before you
          publish.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-slate-300">
          LinkedIn Post Scheduler AI helps freelancers, consultants, and small teams build a
          consistent content calendar, optimize timing, and ship better posts in less time.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <a href={stripePaymentLink} target="_blank" rel="noreferrer">
              Buy Access for $12/mo
            </a>
          </Button>
          {hasAccess ? (
            <Button asChild variant="secondary" size="lg">
              <Link href="/dashboard">Open Dashboard</Link>
            </Button>
          ) : (
            <Button asChild variant="outline" size="lg">
              <a href="#unlock">I already purchased</a>
            </Button>
          )}
        </div>

        <p className="mt-4 text-sm text-slate-400">
          Cancel anytime. Hosted Stripe checkout. No setup calls or hidden fees.
        </p>
      </section>

      {params.paywall === "1" ? (
        <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          Dashboard access requires an active subscription. Purchase first, then unlock with your
          receipt email below.
        </div>
      ) : null}

      <section className="mt-10 grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CalendarClock className="h-5 w-5 text-sky-300" />
            <CardTitle>Problem</CardTitle>
            <CardDescription>Inconsistent publishing kills trust and reach.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-300">
            Most creators post in bursts, skip strategic timing, and burn hours rewriting ideas
            without knowing what is likely to perform.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Sparkles className="h-5 w-5 text-sky-300" />
            <CardTitle>Solution</CardTitle>
            <CardDescription>Generate, score, and schedule in one workflow.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-300">
            Use AI to create post drafts, predict engagement from timing and structure, then slot
            posts into a calendar built for professional audiences.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <BarChart3 className="h-5 w-5 text-sky-300" />
            <CardTitle>Outcome</CardTitle>
            <CardDescription>Higher quality consistency across every week.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-300">
            Build a repeatable content rhythm that compounds authority and pipeline without spending
            your entire week planning posts.
          </CardContent>
        </Card>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>What You Get</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <p className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
              AI content suggestions tailored by niche, audience, and business goal.
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
              Engagement prediction engine based on content depth, timing, hashtags, and format.
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
              Calendar view for weekly planning and publishing consistency.
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
              API hooks for LinkedIn publishing workflows and analytics persistence.
            </p>
          </CardContent>
        </Card>

        <Card id="pricing">
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            <CardDescription>One simple plan for independent operators.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-3xl font-bold text-white">
              $12<span className="text-base font-medium text-slate-400">/month</span>
            </p>
            <p className="text-sm text-slate-300">
              Ideal for freelancers, consultants, and small business owners who need a dependable
              LinkedIn publishing system.
            </p>
            <Button asChild className="w-full">
              <a href={stripePaymentLink} target="_blank" rel="noreferrer">
                Start Subscription
              </a>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section id="unlock" className="mt-12 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Unlock Your Workspace</CardTitle>
            <CardDescription>
              After checkout, verify your purchase email to access dashboard and calendar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AccessUnlockForm />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>FAQ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-300">
            <div>
              <p className="font-semibold text-slate-100">Do you post directly to LinkedIn?</p>
              <p>
                The app stores and schedules post plans and includes LinkedIn API endpoints for auth
                and publishing integrations.
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-100">How is engagement predicted?</p>
              <p>
                The model evaluates timing windows, format, hashtag quality, and structural signals
                in the content draft.
              </p>
            </div>
            <div>
              <p className="font-semibold text-slate-100">Can I cancel?</p>
              <p>
                Yes. Subscription is month-to-month with no long-term contract and no cancellation
                penalty.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
