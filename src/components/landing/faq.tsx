"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "How accurate is the AI?",
    a: "Our AI achieves 95%+ accuracy when your knowledge base contains relevant documentation. Every answer includes a confidence score and source citations, so your team always knows exactly where the information came from. For low-confidence answers, the system flags them for human review.",
  },
  {
    q: "What document formats do you support?",
    a: "We support PDF, Word (DOCX), Excel (XLSX), CSV, TXT, and Markdown files. PDF files with scanned text are automatically processed with OCR. You can upload up to 32MB per file.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We're SOC 2 Type II certified, GDPR compliant, and never use your data to train AI models. Enterprise customers can opt for private cloud deployment.",
  },
  {
    q: "Can I customize the AI's answers?",
    a: "Absolutely. You can edit any AI-generated answer, and the system learns from your edits over time. You can also configure answer style (formal, technical, concise) and require human approval before answers are finalized.",
  },
  {
    q: "How does the compliance center work?",
    a: "The compliance center maps your uploaded documents to specific controls in frameworks like SOC 2, ISO 27001, HIPAA, and GDPR. It shows you coverage percentages, identifies gaps, and helps you understand what documentation you're missing.",
  },
  {
    q: "Can multiple team members work on a questionnaire?",
    a: "Yes. You can assign specific questions or sections to different team members, track who reviewed and approved each answer, leave comments and mentions, and see the full revision history for every answer.",
  },
  {
    q: "What questionnaire formats can I upload?",
    a: "You can upload questionnaires as Excel spreadsheets, Word documents, PDFs, or CSV files. Our AI automatically detects the question structure, including multiple choice, checkboxes, and free-text fields.",
  },
  {
    q: "Do you offer an API?",
    a: "Yes. Professional and Enterprise plans include full API access to programmatically manage documents, questionnaires, and retrieve answers. Comprehensive API documentation is available.",
  },
  {
    q: "What's the difference between Starter and Professional?",
    a: "Starter is designed for smaller teams with up to 5 users and 100 documents. Professional removes all limits and adds approval workflows, advanced analytics, custom templates, and priority support. Both include unlimited questionnaires.",
  },
  {
    q: "Can I cancel my subscription?",
    a: "Yes, you can cancel at any time. Your subscription continues until the end of the billing period. You can also downgrade to the free plan and keep access to your data.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="py-24 bg-muted/20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            Frequently asked questions
          </h2>
          <p className="text-xl text-muted-foreground">
            Everything you need to know about SecureDDQ AI.
          </p>
        </div>

        <Accordion className="space-y-2">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="border border-border/60 rounded-xl px-6 bg-card"
            >
              <AccordionTrigger className="text-left font-medium hover:no-underline py-5">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
