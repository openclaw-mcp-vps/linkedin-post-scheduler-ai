import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type PaymentSource = "stripe" | "lemonsqueezy" | "manual";

export interface PaidEmailRecord {
  email: string;
  source: PaymentSource;
  purchasedAt: string;
  eventId?: string;
}

interface PaymentStore {
  emails: PaidEmailRecord[];
}

const storePath = path.join(process.cwd(), "data", "payments.json");

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function ensureStore() {
  const directory = path.dirname(storePath);
  await mkdir(directory, { recursive: true });

  try {
    await readFile(storePath, "utf8");
  } catch {
    const initialStore: PaymentStore = { emails: [] };
    await writeFile(storePath, JSON.stringify(initialStore, null, 2), "utf8");
  }
}

async function readStore(): Promise<PaymentStore> {
  await ensureStore();
  const raw = await readFile(storePath, "utf8");

  try {
    const parsed = JSON.parse(raw) as PaymentStore;
    if (!Array.isArray(parsed.emails)) {
      return { emails: [] };
    }
    return parsed;
  } catch {
    return { emails: [] };
  }
}

async function writeStore(store: PaymentStore) {
  await writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}

export async function markEmailAsPaid(
  email: string,
  source: PaymentSource,
  eventId?: string,
) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return;
  }

  const store = await readStore();
  const existingRecord = store.emails.find(
    (record) => record.email === normalizedEmail,
  );

  const purchasedAt = new Date().toISOString();
  if (existingRecord) {
    existingRecord.source = source;
    existingRecord.purchasedAt = purchasedAt;
    existingRecord.eventId = eventId;
  } else {
    store.emails.push({
      email: normalizedEmail,
      source,
      purchasedAt,
      eventId,
    });
  }

  await writeStore(store);
}

export async function isEmailPaid(email: string) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return false;
  }

  const store = await readStore();
  return store.emails.some((record) => record.email === normalizedEmail);
}

export async function getPaidEmails() {
  const store = await readStore();
  return store.emails;
}
