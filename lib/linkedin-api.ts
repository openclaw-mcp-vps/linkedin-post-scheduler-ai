import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import axios from "axios";

import { insertScheduledPostAnalytics } from "@/lib/supabase";

export type PostStatus = "scheduled" | "published" | "failed";
export type ContentType = "text" | "carousel" | "video" | "poll";

export interface ScheduledPost {
  id: string;
  userEmail: string;
  content: string;
  hashtags: string[];
  contentType: ContentType;
  scheduledFor: string;
  predictedEngagement: number;
  status: PostStatus;
  createdAt: string;
  linkedinPostId?: string;
}

interface PostStore {
  posts: ScheduledPost[];
}

interface SchedulePostInput {
  userEmail: string;
  content: string;
  hashtags: string[];
  contentType: ContentType;
  scheduledFor: string;
  predictedEngagement: number;
}

const postStorePath = path.join(process.cwd(), "data", "posts.json");

async function ensurePostStore() {
  const directory = path.dirname(postStorePath);
  await mkdir(directory, { recursive: true });

  try {
    await readFile(postStorePath, "utf8");
  } catch {
    const initialStore: PostStore = { posts: [] };
    await writeFile(postStorePath, JSON.stringify(initialStore, null, 2), "utf8");
  }
}

async function readPostStore(): Promise<PostStore> {
  await ensurePostStore();
  const raw = await readFile(postStorePath, "utf8");

  try {
    const parsed = JSON.parse(raw) as PostStore;
    if (!Array.isArray(parsed.posts)) {
      return { posts: [] };
    }

    return parsed;
  } catch {
    return { posts: [] };
  }
}

async function writePostStore(store: PostStore) {
  await writeFile(postStorePath, JSON.stringify(store, null, 2), "utf8");
}

export function buildLinkedInAuthUrl(state: string) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return null;
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: "openid profile w_member_social",
  });

  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

export async function exchangeLinkedInCodeForToken(code: string) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("LinkedIn OAuth environment variables are missing.");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  });

  const response = await axios.post(
    "https://www.linkedin.com/oauth/v2/accessToken",
    body.toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: 15000,
    },
  );

  return response.data;
}

export async function scheduleLinkedInPost(input: SchedulePostInput) {
  const now = new Date().toISOString();

  const post: ScheduledPost = {
    id: randomUUID(),
    userEmail: input.userEmail,
    content: input.content,
    hashtags: input.hashtags,
    contentType: input.contentType,
    scheduledFor: input.scheduledFor,
    predictedEngagement: input.predictedEngagement,
    status: "scheduled",
    createdAt: now,
  };

  const store = await readPostStore();
  store.posts.push(post);
  await writePostStore(store);

  await insertScheduledPostAnalytics({
    id: post.id,
    user_email: post.userEmail,
    content: post.content,
    scheduled_for: post.scheduledFor,
    content_type: post.contentType,
    hashtags: post.hashtags,
    predicted_engagement: post.predictedEngagement,
    status: post.status,
    created_at: post.createdAt,
  }).catch(() => {
    // Supabase is optional. Local JSON remains the source of truth.
  });

  return post;
}

export async function listScheduledPostsByUser(userEmail: string) {
  const normalizedEmail = userEmail.trim().toLowerCase();
  const store = await readPostStore();

  return store.posts
    .filter((post) => post.userEmail === normalizedEmail)
    .sort((a, b) => +new Date(a.scheduledFor) - +new Date(b.scheduledFor));
}

export async function listAllScheduledPosts() {
  const store = await readPostStore();
  return store.posts.sort(
    (a, b) => +new Date(a.scheduledFor) - +new Date(b.scheduledFor),
  );
}
