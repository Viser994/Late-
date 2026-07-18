"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpAction, type AuthActionState } from "@/lib/auth/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Creating account…" : "Create account"}
    </Button>
  );
}

export function SignUpForm() {
  const [state, formAction] = useActionState<AuthActionState, FormData>(signUpAction, {});
  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" placeholder="Ada Lovelace" autoComplete="name" required />
        {state.fieldErrors?.name && <p className="text-xs text-destructive">{state.fieldErrors.name}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="company">Company</Label>
        <Input id="company" name="company" placeholder="Acme Inc." autoComplete="organization" required />
        {state.fieldErrors?.company && <p className="text-xs text-destructive">{state.fieldErrors.company}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Work email</Label>
        <Input id="email" name="email" type="email" placeholder="you@company.com" autoComplete="email" required />
        {state.fieldErrors?.email && <p className="text-xs text-destructive">{state.fieldErrors.email}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
        <p className="text-xs text-muted-foreground">At least 12 characters, with upper, lower, and a number.</p>
        {state.fieldErrors?.password && <p className="text-xs text-destructive">{state.fieldErrors.password}</p>}
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
