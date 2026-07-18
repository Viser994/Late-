"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Building2, Users, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  { id: 1, title: "Organization", description: "Tell us about your company" },
  { id: 2, title: "Use Case", description: "How will you use SecureDDQ?" },
  { id: 3, title: "Team", description: "Invite your team members" },
];

const useCases = [
  { id: "answer", label: "Answer security questionnaires", icon: Shield },
  { id: "knowledge", label: "Build a security knowledge base", icon: Building2 },
  { id: "compliance", label: "Track compliance frameworks", icon: Check },
  { id: "team", label: "Collaborate with security team", icon: Users },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [orgName, setOrgName] = useState("");
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([]);
  const [teamEmails, setTeamEmails] = useState("");
  const router = useRouter();

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">SecureDDQ AI</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Welcome! Let&apos;s get you set up</h1>
          <p className="text-muted-foreground">
            This takes less than 2 minutes.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  step > s.id
                    ? "bg-green-500 text-white"
                    : step === s.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s.id ? <Check className="w-4 h-4" /> : s.id}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`h-px w-12 ${step > s.id ? "bg-green-500" : "bg-muted"}`}
                />
              )}
            </div>
          ))}
        </div>

        <Card className="border-border/60">
          <CardContent className="p-6">
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold mb-1">
                    {steps[0].title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {steps[0].description}
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Acme Corporation"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Industry</Label>
                    <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                      <option>SaaS / Technology</option>
                      <option>Healthcare</option>
                      <option>Finance</option>
                      <option>Government</option>
                      <option>Retail</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Company Size</Label>
                    <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                      <option>1-10 employees</option>
                      <option>11-50 employees</option>
                      <option>51-200 employees</option>
                      <option>201-1000 employees</option>
                      <option>1000+ employees</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold mb-1">
                    {steps[1].title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Select all that apply
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {useCases.map((uc) => (
                    <button
                      key={uc.id}
                      onClick={() => {
                        setSelectedUseCases((prev) =>
                          prev.includes(uc.id)
                            ? prev.filter((id) => id !== uc.id)
                            : [...prev, uc.id]
                        );
                      }}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedUseCases.includes(uc.id)
                          ? "border-primary bg-primary/5"
                          : "border-border/60 hover:border-primary/30"
                      }`}
                    >
                      <uc.icon
                        className={`w-5 h-5 mb-2 ${
                          selectedUseCases.includes(uc.id)
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                      <div className="text-sm font-medium">{uc.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold mb-1">
                    {steps[2].title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Optional — you can do this later
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Team Member Emails</Label>
                  <textarea
                    value={teamEmails}
                    onChange={(e) => setTeamEmails(e.target.value)}
                    placeholder="alice@company.com&#10;bob@company.com&#10;carol@company.com"
                    className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    One email per line
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-between">
              {step > 1 ? (
                <Button
                  variant="ghost"
                  onClick={() => setStep(step - 1)}
                >
                  Back
                </Button>
              ) : (
                <div />
              )}
              <Button onClick={handleNext} className="gap-2">
                {step === 3 ? "Go to Dashboard" : "Continue"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
