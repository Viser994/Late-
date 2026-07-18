import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { createBillingPortalSession } from "@/lib/stripe";

export async function POST() {
  try {
    const ctx = await requirePermission("org:billing");

    const url = await createBillingPortalSession(
      ctx.organizationId,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`
    );

    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
