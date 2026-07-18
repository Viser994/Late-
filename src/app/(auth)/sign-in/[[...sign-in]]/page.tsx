import { SignIn } from "@clerk/nextjs";
import { Shield } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-primary p-12">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-white">SecureDDQ AI</span>
        </Link>

        <div>
          <blockquote className="text-white text-2xl font-medium leading-relaxed mb-6">
            &ldquo;We reduced questionnaire completion time from 3 weeks to 1 day.
            SecureDDQ AI is now an essential part of our sales process.&rdquo;
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-sm">
              SC
            </div>
            <div>
              <div className="text-white font-medium text-sm">Sarah Chen</div>
              <div className="text-white/70 text-xs">
                Head of Security, TechFlow Inc
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {[
            { value: "40+", label: "Hours saved per DDQ" },
            { value: "95%", label: "AI accuracy" },
            { value: "10x", label: "Faster completion" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-black text-white">{stat.value}</div>
              <div className="text-white/70 text-xs mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">SecureDDQ AI</span>
            </Link>
          </div>
          <SignIn />
        </div>
      </div>
    </div>
  );
}
