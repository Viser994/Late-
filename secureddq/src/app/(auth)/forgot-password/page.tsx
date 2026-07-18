import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <div className="mt-10">
      <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter your email and we&apos;ll send you a secure reset link.
      </p>
      <form className="mt-8 space-y-4" action="/sign-in">
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" name="email" type="email" placeholder="you@company.com" required />
        </div>
        <Button type="submit" className="w-full">
          Send reset link
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/sign-in" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
