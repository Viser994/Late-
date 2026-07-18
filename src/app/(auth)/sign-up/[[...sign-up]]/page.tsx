import { SignUp } from "@clerk/nextjs";
import { Shield, Check } from "lucide-react";
import Link from "next/link";

const benefits = [
  "Free plan — no credit card required",
  "10x faster questionnaire completion",
  "AI-powered with source citations",
  "SOC 2 compliant & secure",
];

export default function SignUpPage() {
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
          <h2 className="text-3xl font-bold text-white mb-4">
            Stop manually answering security questionnaires
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Build your AI knowledge base from existing security docs and
            complete questionnaires in hours instead of weeks.
          </p>
          <ul className="space-y-4">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-white/90">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-white/60 text-sm">
          Trusted by 500+ security teams worldwide
        </p>
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
          <SignUp />
        </div>
      </div>
    </div>
  );
}
