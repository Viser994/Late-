import { ArrowLeft, Zap, CheckCircle2, Clock, AlertCircle, MessageSquare, ChevronDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

const mockQuestionnaire = {
  id: "1",
  name: "Acme Corp Security Assessment",
  company: "Acme Corporation",
  status: "IN_PROGRESS",
  totalQuestions: 85,
  answeredCount: 61,
  approvedCount: 45,
  dueDate: "Jul 25, 2026",
};

const mockSections = [
  {
    id: "s1",
    name: "Access Control & Authentication",
    questions: [
      {
        id: "q1",
        text: "Does your organization enforce multi-factor authentication (MFA) for all user accounts?",
        status: "APPROVED",
        confidence: 0.97,
        answer:
          "Yes, Acme Corp enforces multi-factor authentication (MFA) for all user accounts. Our organization uses a combination of hardware security keys (FIDO2/WebAuthn) and authenticator apps (TOTP) as second factors. MFA is enforced via our Identity Provider (Okta) for all cloud services, VPN access, and critical internal systems. New employee onboarding includes mandatory MFA enrollment as part of the security baseline.",
        sources: ["Security Policy v3.2, Section 4.2", "SOC 2 Report 2026, CC6.1"],
      },
      {
        id: "q2",
        text: "What password policies are in place for user accounts?",
        status: "APPROVED",
        confidence: 0.95,
        answer:
          "Our password policy requires a minimum of 14 characters with complexity requirements including uppercase, lowercase, numbers, and special characters. Passwords expire every 90 days and cannot be reused from the last 12 passwords. We also employ breach detection to identify compromised passwords using Have I Been Pwned.",
        sources: ["Security Policy v3.2, Section 4.1"],
      },
      {
        id: "q3",
        text: "How do you manage privileged access (admin accounts)?",
        status: "EDITED",
        confidence: 0.88,
        answer:
          "Privileged access is managed through a Privileged Access Management (PAM) solution. All privileged accounts require just-in-time (JIT) access approval, are reviewed quarterly, and are fully audited. Service accounts follow the principle of least privilege.",
        sources: ["Security Policy v3.2, Section 4.5", "SOC 2 Report 2026, CC6.3"],
      },
    ],
  },
  {
    id: "s2",
    name: "Data Encryption",
    questions: [
      {
        id: "q4",
        text: "How is customer data encrypted at rest?",
        status: "DRAFT",
        confidence: 0.72,
        answer:
          "Customer data is encrypted at rest using AES-256 encryption. Our cloud infrastructure (AWS) utilizes server-side encryption for all S3 buckets, RDS databases, and EBS volumes using AWS KMS-managed keys.",
        sources: ["Encryption Standards Guide, Section 3", "SOC 2 Report 2026, CC9.1"],
      },
      {
        id: "q5",
        text: "What encryption is used for data in transit?",
        status: "PENDING_REVIEW",
        confidence: 0.94,
        answer:
          "All data in transit is protected using TLS 1.3 (with TLS 1.2 as minimum). We enforce HTTPS on all endpoints, use HSTS headers, and regularly test our TLS configuration using SSL Labs, maintaining an A+ rating.",
        sources: ["Encryption Standards Guide, Section 4"],
      },
    ],
  },
];

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; color: string }> = {
  DRAFT: { label: "Draft", icon: Clock, color: "text-muted-foreground" },
  AI_GENERATED: { label: "AI Generated", icon: Zap, color: "text-blue-500" },
  EDITED: { label: "Edited", icon: Clock, color: "text-yellow-500" },
  APPROVED: { label: "Approved", icon: CheckCircle2, color: "text-green-500" },
  REJECTED: { label: "Rejected", icon: AlertCircle, color: "text-red-500" },
  PENDING_REVIEW: { label: "Pending Review", icon: Clock, color: "text-orange-500" },
};

export default function QuestionnairePage({
  params,
}: {
  params: { id: string };
}) {
  const progress = Math.round(
    (mockQuestionnaire.answeredCount / mockQuestionnaire.totalQuestions) * 100
  );
  const approved = Math.round(
    (mockQuestionnaire.approvedCount / mockQuestionnaire.totalQuestions) * 100
  );

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back + Header */}
      <div>
        <Button variant="ghost" size="sm" className="gap-2 -ml-2 mb-4" asChild>
          <Link href="/questionnaires">
            <ArrowLeft className="w-4 h-4" />
            Back to Questionnaires
          </Link>
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {mockQuestionnaire.name}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {mockQuestionnaire.company} · Due {mockQuestionnaire.dueDate}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Zap className="w-4 h-4" />
              Generate All Answers
            </Button>
            <Button className="gap-2">Export</Button>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{progress}%</div>
            <div className="text-xs text-muted-foreground mb-2">Answered</div>
            <Progress value={progress} className="h-1.5" />
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{approved}%</div>
            <div className="text-xs text-muted-foreground mb-2">Approved</div>
            <Progress value={approved} className="h-1.5" />
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {mockQuestionnaire.totalQuestions - mockQuestionnaire.answeredCount}
            </div>
            <div className="text-xs text-muted-foreground">
              Questions remaining
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {mockSections.map((section) => (
          <div key={section.id}>
            <h2 className="font-semibold text-base mb-4 flex items-center gap-2">
              <ChevronDown className="w-4 h-4" />
              {section.name}
            </h2>
            <div className="space-y-4">
              {section.questions.map((question) => {
                const status = statusConfig[question.status];

                return (
                  <Card key={question.id} className="border-border/60">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <p className="font-medium text-sm leading-relaxed flex-1">
                          {question.text}
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                          <status.icon
                            className={`w-4 h-4 ${status.color}`}
                          />
                          <span className={`text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                          {question.confidence !== undefined && (
                            <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted">
                              {Math.round(question.confidence * 100)}% confidence
                            </span>
                          )}
                        </div>
                      </div>

                      <Textarea
                        defaultValue={question.answer}
                        className="text-sm min-h-[100px] bg-muted/30 border-border/60 resize-none"
                        rows={4}
                      />

                      {question.sources && question.sources.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {question.sources.map((source) => (
                            <span
                              key={source}
                              className="text-[11px] px-2 py-1 rounded-md bg-blue-500/10 text-blue-600 font-medium"
                            >
                              📄 {source}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-4">
                        <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs">
                          <Zap className="w-3 h-3" />
                          Regenerate
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs">
                          <MessageSquare className="w-3 h-3" />
                          Comment
                        </Button>
                        <Button
                          size="sm"
                          className="gap-1.5 h-7 text-xs ml-auto"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Approve
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
