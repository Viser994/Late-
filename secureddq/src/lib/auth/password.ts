import bcrypt from "bcryptjs";

const ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Basic password strength policy used by sign-up validation. */
export function passwordIssues(password: string): string[] {
  const issues: string[] = [];
  if (password.length < 12) issues.push("Use at least 12 characters.");
  if (!/[a-z]/.test(password)) issues.push("Add a lowercase letter.");
  if (!/[A-Z]/.test(password)) issues.push("Add an uppercase letter.");
  if (!/[0-9]/.test(password)) issues.push("Add a number.");
  return issues;
}
