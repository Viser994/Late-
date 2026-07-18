import { getSession, type SessionPayload } from "./session";
import { DEMO_ORG } from "@/lib/data/demo";

export type { SessionPayload } from "./session";

/**
 * Resolve the current user for the authenticated app shell. Falls back to a
 * demo identity so the product renders in preview environments without a
 * configured auth provider.
 */
export async function getCurrentUser(): Promise<SessionPayload> {
  const session = await getSession();
  if (session) return session;
  return {
    userId: "u_demo",
    email: "ava@northwind.io",
    name: "Ava Chen",
    organizationId: DEMO_ORG.id,
    role: DEMO_ORG.role,
  };
}

export { getSession };
