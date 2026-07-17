import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  BUSINESS_NAME: z.string().default("Your Business"),
  BUSINESS_DESCRIPTION: z
    .string()
    .default("A professional local business serving customers."),
  BUSINESS_HOURS: z
    .string()
    .default("Monday to Friday, 9:00 AM to 6:00 PM local time."),
  FALLBACK_FORWARD_NUMBER: z.string().optional(),
  MAX_TURNS_PER_CALL: z.coerce.number().int().min(1).max(12).default(5)
});

const result = schema.safeParse(process.env);

if (!result.success) {
  const issues = result.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const settings = result.data;
