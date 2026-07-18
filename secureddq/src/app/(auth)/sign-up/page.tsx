import Link from "next/link";
import type { Metadata } from "next";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

export const metadata: Metadata = { title: "Create your account" };

export default function SignUpPage() {
  return (
    <div className="mt-10">
      <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
      <p className="mt-2 text-sm text-muted-foreground">Start automating security questionnaires in minutes.</p>

      <div className="mt-8 space-y-6">
        <OAuthButtons />
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or sign up with email</span>
          </div>
        </div>
        <SignUpForm />
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        By continuing you agree to our Terms and acknowledge our Privacy Policy.
      </p>
    </div>
  );
}
