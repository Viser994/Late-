"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession } from "./session";
import { passwordIssues } from "./password";
import { DEMO_ORG } from "@/lib/data/demo";

const signInSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

const signUpSchema = z.object({
  name: z.string().min(2, "Enter your name."),
  email: z.string().email("Enter a valid email."),
  password: z.string(),
  company: z.string().min(2, "Enter your company name."),
});

export interface AuthActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Sign in. When a database is configured this verifies credentials against the
 * `User` table; in demo mode any valid email/password establishes a session
 * bound to the demo organization so the product is explorable immediately.
 */
export async function signInAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  const { email } = parsed.data;
  await createSession({
    userId: "u_demo",
    email,
    name: email.split("@")[0] ?? "Member",
    organizationId: DEMO_ORG.id,
    role: DEMO_ORG.role,
  });
  redirect("/dashboard");
}

export async function signUpAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  const issues = passwordIssues(parsed.data.password);
  if (issues.length) {
    return { fieldErrors: { password: issues.join(" ") } };
  }
  await createSession({
    userId: "u_demo",
    email: parsed.data.email,
    name: parsed.data.name,
    organizationId: DEMO_ORG.id,
    role: "OWNER",
  });
  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}

function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !out[key]) out[key] = issue.message;
  }
  return out;
}
