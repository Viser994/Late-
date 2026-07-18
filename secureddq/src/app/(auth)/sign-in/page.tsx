import Link from "next/link";
import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/sign-in-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <div className="mt-10">
      <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-sm text-muted-foreground">Sign in to your SecureDDQ AI workspace.</p>

      <div className="mt-8 space-y-6">
        <OAuthButtons />
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or continue with email</span>
          </div>
        </div>
        <SignInForm />
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="font-medium text-primary hover:underline">
          Start free
        </Link>
      </p>
    </div>
  );
}
