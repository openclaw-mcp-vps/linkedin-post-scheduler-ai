"use client";

import { useState } from "react";
import { addDays, format } from "date-fns";
import { Sparkles, WandSparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const editorSchema = z.object({
  content: z.string().min(80, "Write at least 80 characters for a stronger post."),
  hashtags: z.string().min(3, "Add at least one hashtag."),
  contentType: z.enum(["text", "carousel", "video", "poll"]),
  scheduledFor: z.string().min(1, "Choose a date and time."),
  niche: z.string().min(2, "Niche is required for AI suggestions."),
  audience: z.string().min(2, "Audience is required."),
  goal: z.string().min(2, "Goal is required."),
  tone: z.string().min(2, "Tone is required."),
  callToAction: z.string().min(2, "Call to action is required."),
});

type EditorFormValues = z.infer<typeof editorSchema>;

interface PredictionSummary {
  score: number;
  qualitySignals: string[];
  risks: string[];
  optimizationTips: string[];
}

function toDefaultDateTimeLocalValue() {
  const suggestedDate = addDays(new Date(), 1);
  return format(suggestedDate, "yyyy-MM-dd'T'10:00");
}

function normalizeHashtags(raw: string) {
  return raw
    .split(",")
    .map((tag) => tag.trim().replace(/^#/, ""))
    .filter(Boolean);
}

export default function PostEditor() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [prediction, setPrediction] = useState<PredictionSummary | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<EditorFormValues>({
    resolver: zodResolver(editorSchema),
    defaultValues: {
      content: "",
      hashtags: "LinkedInTips, ContentStrategy, ThoughtLeadership",
      contentType: "text",
      scheduledFor: toDefaultDateTimeLocalValue(),
      niche: "Consulting",
      audience: "Founders and service business owners",
      goal: "book more discovery calls",
      tone: "practical and confident",
      callToAction: "Comment 'framework' and I will send the checklist.",
    },
  });

  const generateDraft = async () => {
    setIsGenerating(true);
    setStatus(null);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          niche: getValues("niche"),
          audience: getValues("audience"),
          goal: getValues("goal"),
          tone: getValues("tone"),
          callToAction: getValues("callToAction"),
        }),
      });

      const data = (await response.json()) as {
        content: string;
        hashtags: string[];
        bestPostType: EditorFormValues["contentType"];
        rationale: string;
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Could not generate content right now.");
        return;
      }

      setValue("content", data.content, { shouldValidate: true });
      setValue("hashtags", data.hashtags.join(", "), { shouldValidate: true });
      setValue("contentType", data.bestPostType, { shouldValidate: true });
      setStatus(data.rationale);
    } catch {
      setError("We hit a network issue while generating content.");
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (values: EditorFormValues) => {
    setIsScheduling(true);
    setStatus(null);
    setError(null);

    try {
      const hashtags = normalizeHashtags(values.hashtags);
      const scheduledFor = new Date(values.scheduledFor).toISOString();

      if (Number.isNaN(+new Date(scheduledFor))) {
        setError("Please choose a valid scheduling date.");
        return;
      }

      const predictionResponse = await fetch("/api/ai/predict-engagement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: values.content,
          hashtags,
          contentType: values.contentType,
          scheduledFor,
        }),
      });

      const predictionData = (await predictionResponse.json()) as PredictionSummary & {
        error?: string;
      };

      if (!predictionResponse.ok) {
        setError(predictionData.error ?? "Could not predict engagement.");
        return;
      }

      setPrediction(predictionData);

      const scheduleResponse = await fetch("/api/linkedin/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: values.content,
          hashtags,
          contentType: values.contentType,
          scheduledFor,
          predictedEngagement: predictionData.score,
        }),
      });

      const scheduleData = (await scheduleResponse.json()) as {
        post?: { id: string };
        error?: string;
      };

      if (!scheduleResponse.ok) {
        setError(scheduleData.error ?? "Could not schedule your post.");
        return;
      }

      setStatus(
        `Post scheduled successfully. Predicted engagement score: ${predictionData.score}/100.`,
      );
      router.refresh();
    } catch {
      setError("Scheduling failed due to a network issue.");
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <WandSparkles className="h-5 w-5 text-sky-400" />
          Plan and Schedule Your Next LinkedIn Post
        </CardTitle>
        <CardDescription>
          Generate a high-value draft, predict engagement, and add it to your calendar in one flow.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Input placeholder="Niche" {...register("niche")} />
          <Input placeholder="Audience" {...register("audience")} />
          <Input placeholder="Goal" {...register("goal")} />
          <Input placeholder="Tone" {...register("tone")} />
        </div>
        <Input placeholder="Call to action" {...register("callToAction")} />

        <Button
          type="button"
          variant="secondary"
          onClick={generateDraft}
          disabled={isGenerating}
          className="w-full"
        >
          <Sparkles className="h-4 w-4" />
          {isGenerating ? "Generating AI draft..." : "Generate Draft with AI"}
        </Button>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-slate-300">Post Content</label>
            <Textarea
              {...register("content")}
              placeholder="Write your post or generate one above..."
              className="min-h-44"
            />
            {errors.content ? (
              <p className="mt-1 text-xs text-red-300">{errors.content.message}</p>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-slate-300">Hashtags (comma-separated)</label>
              <Input {...register("hashtags")} />
              {errors.hashtags ? (
                <p className="mt-1 text-xs text-red-300">{errors.hashtags.message}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Content Type</label>
              <select
                className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100"
                {...register("contentType")}
              >
                <option value="text">Text</option>
                <option value="carousel">Carousel</option>
                <option value="video">Video</option>
                <option value="poll">Poll</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">Schedule Time</label>
            <Input type="datetime-local" {...register("scheduledFor")} />
            {errors.scheduledFor ? (
              <p className="mt-1 text-xs text-red-300">{errors.scheduledFor.message}</p>
            ) : null}
          </div>

          <Button type="submit" disabled={isScheduling} className="w-full">
            {isScheduling ? "Predicting and scheduling..." : "Predict Engagement and Schedule"}
          </Button>
        </form>

        {prediction ? (
          <div className="rounded-lg border border-sky-700/50 bg-sky-950/20 p-4">
            <p className="mb-3 text-sm text-sky-200">
              Predicted Engagement Score: <strong>{prediction.score}/100</strong>
            </p>
            <div className="flex flex-wrap gap-2">
              {prediction.qualitySignals.slice(0, 2).map((signal) => (
                <Badge key={signal} variant="success" className="max-w-full text-wrap">
                  {signal}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        {status ? (
          <p className={cn("rounded-lg bg-emerald-950/40 p-3 text-sm text-emerald-200")}>{status}</p>
        ) : null}
        {error ? <p className="rounded-lg bg-red-950/30 p-3 text-sm text-red-200">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
