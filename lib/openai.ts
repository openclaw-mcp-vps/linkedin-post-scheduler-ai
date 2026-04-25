import OpenAI from "openai";

export interface ContentGenerationInput {
  niche: string;
  audience: string;
  goal: string;
  tone: string;
  callToAction: string;
}

export interface ContentGenerationResult {
  content: string;
  hashtags: string[];
  bestPostType: "text" | "carousel" | "video" | "poll";
  rationale: string;
}

export interface EngagementPredictionInput {
  content: string;
  scheduledFor: string;
  hashtags: string[];
  contentType: "text" | "carousel" | "video" | "poll";
  historicalAverageEngagement?: number;
}

export interface EngagementPredictionResult {
  score: number;
  qualitySignals: string[];
  risks: string[];
  optimizationTips: string[];
}

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function clampScore(score: number) {
  return Math.max(1, Math.min(100, Math.round(score)));
}

function fallbackContentSuggestions(input: ContentGenerationInput): ContentGenerationResult {
  const content = `Creators in ${input.niche} don't need more tactics, they need a consistent system.\n\nI recommend this weekly structure for ${input.audience}:\n1) Monday: a practical lesson from real client work\n2) Wednesday: a framework people can reuse immediately\n3) Friday: a candid breakdown of what didn't work and why\n\nThis rhythm builds trust because it mixes proof, process, and honesty.\n\nIf your goal is ${input.goal}, start by mapping 12 weeks of topics before writing a single post. ${input.callToAction}`;

  return {
    content,
    hashtags: ["LinkedInTips", "CreatorBusiness", "ContentStrategy", "ThoughtLeadership", "AudienceGrowth"],
    bestPostType: "text",
    rationale:
      "Text performs well for nuanced thought leadership and tends to generate comments when the post includes a concrete system and a direct call to action.",
  };
}

function fallbackEngagementPrediction(
  input: EngagementPredictionInput,
): EngagementPredictionResult {
  const lengthScore = Math.min(input.content.length / 18, 25);
  const hashtagScore = Math.min(input.hashtags.length * 4, 16);
  const callToActionBonus = /\?/.test(input.content) ? 10 : 0;

  const scheduleDate = new Date(input.scheduledFor);
  const day = scheduleDate.getUTCDay();
  const hour = scheduleDate.getUTCHours();

  const businessDayBonus = day >= 1 && day <= 4 ? 14 : day === 5 ? 8 : 2;
  const timeBonus = hour >= 13 && hour <= 17 ? 14 : hour >= 10 && hour <= 20 ? 8 : 3;

  const contentTypeMultiplier: Record<EngagementPredictionInput["contentType"], number> = {
    text: 1,
    carousel: 1.15,
    video: 1.2,
    poll: 1.1,
  };

  const base =
    28 +
    lengthScore +
    hashtagScore +
    callToActionBonus +
    businessDayBonus +
    timeBonus;

  const historicalBias = input.historicalAverageEngagement
    ? Math.min(input.historicalAverageEngagement * 20, 12)
    : 0;

  const score = clampScore((base + historicalBias) * contentTypeMultiplier[input.contentType]);

  return {
    score,
    qualitySignals: [
      "Content length supports a complete narrative with actionable value.",
      "Hashtag selection is focused enough for topic relevance.",
      "Scheduled timing aligns with professional browsing windows.",
    ],
    risks: [
      "If the first two lines are not specific, viewers may skip before expanding.",
      "Posting frequency drops can reduce momentum even with strong individual posts.",
    ],
    optimizationTips: [
      "Open with a result-based hook and a number in the first sentence.",
      "Add one concrete mini-framework readers can copy immediately.",
      "End with a single focused question to increase meaningful comments.",
    ],
  };
}

export async function generateLinkedInContent(
  input: ContentGenerationInput,
): Promise<ContentGenerationResult> {
  if (!openai) {
    return fallbackContentSuggestions(input);
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.8,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a senior LinkedIn growth strategist. Return concise JSON with keys: content, hashtags (array), bestPostType, rationale.",
        },
        {
          role: "user",
          content: `Niche: ${input.niche}\nAudience: ${input.audience}\nGoal: ${input.goal}\nTone: ${input.tone}\nCall to action: ${input.callToAction}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return fallbackContentSuggestions(input);
    }

    const parsed = JSON.parse(raw) as Partial<ContentGenerationResult>;

    if (
      !parsed.content ||
      !Array.isArray(parsed.hashtags) ||
      !parsed.bestPostType ||
      !parsed.rationale
    ) {
      return fallbackContentSuggestions(input);
    }

    return {
      content: parsed.content,
      hashtags: parsed.hashtags.map((tag) => tag.replace(/^#/, "")),
      bestPostType: parsed.bestPostType,
      rationale: parsed.rationale,
    };
  } catch {
    return fallbackContentSuggestions(input);
  }
}

export async function predictLinkedInEngagement(
  input: EngagementPredictionInput,
): Promise<EngagementPredictionResult> {
  if (!openai) {
    return fallbackEngagementPrediction(input);
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an analytics model for LinkedIn performance. Return JSON with keys score (1-100), qualitySignals (array), risks (array), optimizationTips (array).",
        },
        {
          role: "user",
          content: JSON.stringify(input),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return fallbackEngagementPrediction(input);
    }

    const parsed = JSON.parse(raw) as Partial<EngagementPredictionResult>;
    if (
      typeof parsed.score !== "number" ||
      !Array.isArray(parsed.qualitySignals) ||
      !Array.isArray(parsed.risks) ||
      !Array.isArray(parsed.optimizationTips)
    ) {
      return fallbackEngagementPrediction(input);
    }

    return {
      score: clampScore(parsed.score),
      qualitySignals: parsed.qualitySignals,
      risks: parsed.risks,
      optimizationTips: parsed.optimizationTips,
    };
  } catch {
    return fallbackEngagementPrediction(input);
  }
}
