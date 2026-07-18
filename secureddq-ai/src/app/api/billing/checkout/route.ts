import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { createCheckoutSession } from "@/lib/stripe";
import { db } from "@/lib/db";
import type { SubscriptionPlan } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const ctx = await requirePermission("org:billing");
    const { plan } = await request.json();

    if (!["STARTER", "PROFESSIONAL"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const org = await db.organization.findUnique({
      where: { id: ctx.organizationId },
    });

    const url = await createCheckoutSession({
      organizationId: ctx.organizationId,
      plan: plan as SubscriptionPlan,
      email: ctx.user.email,
      orgName: org?.name ?? "Organization",
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
    });

    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
