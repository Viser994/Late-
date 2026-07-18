import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "How does SecureDDQ AI avoid hallucinating answers?",
    a: "Every answer is generated with retrieval-augmented generation (RAG). The model is only allowed to use passages retrieved from your own documents, and each answer links back to the exact source. Low-confidence answers are flagged for human review.",
  },
  {
    q: "What file types can I upload?",
    a: "Documents: PDF, DOCX, Excel, CSV, TXT, and Markdown — including SOC reports, ISO documents, policies, architecture diagrams, and pentest reports. Questionnaires: PDF, Excel, Word, and CSV, with automatic question and section detection.",
  },
  {
    q: "Is my data secure?",
    a: "Data is encrypted at rest and in transit. We enforce role-based access control, MFA, signed upload URLs, virus scanning, rate limiting, and full audit logging. Enterprise plans add SSO (SAML/OIDC) and private cloud options.",
  },
  {
    q: "Which compliance frameworks are supported?",
    a: "SOC 2, ISO 27001, HIPAA, GDPR, PCI DSS, and NIST. The compliance center maps your documents to controls and tracks coverage and gaps.",
  },
  {
    q: "Can I export answers back to the original questionnaire?",
    a: "Yes. Export to Excel, Word, or PDF while preserving the original formatting wherever possible, so you can return the file exactly as requested.",
  },
  {
    q: "Do you offer a free plan?",
    a: "Yes. The Free plan includes 1 organization, 2 users, 10 document uploads, and 1 questionnaire per month with basic AI responses — no credit card required.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="border-t py-24">
      <div className="container max-w-3xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Frequently asked questions</h2>
        </div>
        <div className="mt-12 divide-y rounded-xl border bg-card">
          {faqs.map((faq) => (
            <details key={faq.q} className="group px-6 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between py-5 font-medium">
                {faq.q}
                <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="pb-5 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
