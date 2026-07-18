import OpenAI from "openai";
import { hasOpenAI } from "./config";

let client: OpenAI | null = null;

/** Lazily construct a shared OpenAI client, or null when no key is present. */
export function getOpenAI(): OpenAI | null {
  if (!hasOpenAI()) return null;
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}
