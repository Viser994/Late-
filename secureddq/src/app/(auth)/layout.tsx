import Link from "next/link";
import { Logo } from "@/components/brand";
import { ShieldCheck, Quote } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="inline-flex">
            <Logo />
          </Link>
          {children}
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary to-indigo-800 lg:block">
        <div className="absolute inset-0 grid-pattern opacity-10" />
        <div className="relative flex h-full flex-col justify-between p-12 text-primary-foreground">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ShieldCheck className="h-5 w-5" /> Enterprise-grade security automation
          </div>
          <div>
            <Quote className="h-10 w-10 opacity-40" />
            <p className="mt-4 max-w-md text-2xl font-medium leading-snug">
              We cut our questionnaire turnaround from two weeks to a single afternoon — with citations our
              reviewers actually trust.
            </p>
            <p className="mt-4 text-sm text-primary-foreground/70">— Placeholder customer, Security Program Manager</p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              ["85%", "faster"],
              ["94%", "accuracy"],
              ["1,600+", "questions/file"],
            ].map(([stat, label]) => (
              <div key={label}>
                <div className="text-2xl font-bold">{stat}</div>
                <div className="text-xs text-primary-foreground/70">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
