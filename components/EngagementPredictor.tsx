"use client";

import { useState } from "react";
import { addDays, format } from "date-fns";
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

const predictorSchema = z.object({
  content: z.string().min(80, "Add more substance so prediction can be meaningful."),
  hashtags: z.string().min(1, "Add at least one hashtag."),
  scheduledFor: z.string().min(1, "Pick a time."),
  contentType: z.enum(["text", "carousel", "video", "poll"]),
});

type PredictorFormValues = z.infer<typeof predictorSchema>;

interface PredictionResponse {
  score: number;
  qualitySignals: string[];
  risks: string[];
  optimizationTips: string[];
}

function toDefaultDateTimeLocalValue() {
  return format(addDays(new Date(), 1), "yyyy-MM-dd'T'13:00");
}

function parseHashtags(hashtags: string) {
  return hashtags
    .split(",")
    .map((tag) => tag.trim().replace(/^#/, ""))
    .filter(Boolean);
}

export default function EngagementPredictor() {
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PredictorFormValues>({
    resolver: zodResolver(predictorSchema),
    defaultValues: {
      content: "",
      hashtags: "LinkedInGrowth, PersonalBrand",
      scheduledFor: toDefaultDateTimeLocalValue(),
      contentType: "text",
    },
  });

  const onSubmit = async (values: PredictorFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/predict-engagement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: values.content,
          hashtags: parseHashtags(values.hashtags),
          contentType: values.contentType,
          scheduledFor: new Date(values.scheduledFor).toISOString(),
        }),
      });

      const data = (await response.json()) as PredictionResponse & { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Could not estimate engagement.");
        return;
      }

      setResult(data);
    } catch {
      setError("Unable to contact prediction API.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Engagement Predictor</CardTitle>
        <CardDescription>
          Test timing and format combinations before you finalize your publishing slot.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Textarea
            placeholder="Paste your draft post text"
            className="min-h-32"
            {...register("content")}
          />
          {errors.content ? <p className="text-xs text-red-300">{errors.content.message}</p> : null}

          <Input placeholder="Hashtags" {...register("hashtags")} />
          <div className="grid gap-4 md:grid-cols-2">
            <Input type="datetime-local" {...register("scheduledFor")} />
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

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Running prediction..." : "Predict Engagement"}
          </Button>
        </form>

        {result ? (
          <div className="mt-5 space-y-4 rounded-lg border border-slate-700 bg-slate-950/50 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-300">Predicted score</p>
              <Badge>{result.score}/100</Badge>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-emerald-300">Positive Signals</p>
              <ul className="space-y-1 text-sm text-slate-300">
                {result.qualitySignals.map((signal) => (
                  <li key={signal}>• {signal}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-amber-300">Risks</p>
              <ul className="space-y-1 text-sm text-slate-300">
                {result.risks.map((risk) => (
                  <li key={risk}>• {risk}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-sky-300">Optimization Tips</p>
              <ul className="space-y-1 text-sm text-slate-300">
                {result.optimizationTips.map((tip) => (
                  <li key={tip}>• {tip}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
