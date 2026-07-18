import { mockEmbedding } from "./embeddings";
import type { RetrievableChunk } from "./retrieval";

/**
 * A small, representative corpus derived from the demo knowledge base. Used by
 * the chat/answer flows when no live database is connected so retrieval and
 * citations behave realistically. Each entry is embedded on demand.
 */
const RAW: { documentId: string; documentTitle: string; content: string }[] = [
  {
    documentId: "d10",
    documentTitle: "Encryption Standard",
    content:
      "All customer data is encrypted at rest using AES-256-GCM. Encryption keys are managed in AWS KMS with automatic annual rotation. Data in transit is protected with TLS 1.2 or higher. Backups are also encrypted using AES-256 before replication.",
  },
  {
    documentId: "d7",
    documentTitle: "Incident Response Plan",
    content:
      "The incident response lifecycle follows NIST 800-61: preparation, detection and analysis, containment, eradication, recovery, and lessons learned. A 24/7 on-call rotation triages security alerts. Severity 1 incidents trigger executive notification within one hour and customer notification within regulatory timelines.",
  },
  {
    documentId: "d8",
    documentTitle: "Business Continuity & DR Plan",
    content:
      "Backups are encrypted and replicated to a separate AWS region. Restore procedures are tested quarterly. The recovery time objective (RTO) is 4 hours and the recovery point objective (RPO) is 1 hour for production systems.",
  },
  {
    documentId: "d11",
    documentTitle: "Access Control Policy",
    content:
      "Passwords require a minimum of 12 characters with complexity requirements and are checked against known-breach lists. Multi-factor authentication is enforced for all users. Access is provisioned using role-based access control and reviewed quarterly. Privileged access requires additional approval.",
  },
  {
    documentId: "d2",
    documentTitle: "SOC 2 Type II Report 2025",
    content:
      "The SOC 2 Type II report covers Security, Availability, and Confidentiality trust services criteria. Controls CC6.1 through CC6.8 covering logical and physical access were tested across the audit period with no exceptions noted. The report received an unqualified opinion.",
  },
  {
    documentId: "d3",
    documentTitle: "ISO 27001 Statement of Applicability",
    content:
      "The organization maintains an ISO 27001 certified information security management system. The Statement of Applicability documents all Annex A controls, including cryptography (A.8.24), supplier relationships, and business continuity. Annual surveillance audits are performed by an accredited body.",
  },
  {
    documentId: "d1",
    documentTitle: "Information Security Policy",
    content:
      "The information security policy is approved by executive leadership and reviewed annually. It establishes requirements for data classification, acceptable use, secure development, vendor risk management, and security awareness training completed by all employees within 30 days of hire and annually thereafter.",
  },
  {
    documentId: "d9",
    documentTitle: "Vendor Risk Management Standard",
    content:
      "All third-party vendors undergo a security risk assessment before onboarding and annually thereafter. Critical vendors must provide a SOC 2 report or equivalent. Data processing agreements are required for any vendor handling personal data.",
  },
];

let cached: RetrievableChunk[] | null = null;

export function getDemoCorpus(): RetrievableChunk[] {
  if (!cached) {
    cached = RAW.map((r, i) => ({
      chunkId: `demo-chunk-${i}`,
      documentId: r.documentId,
      documentTitle: r.documentTitle,
      content: r.content,
      vector: mockEmbedding(r.content),
    }));
  }
  return cached;
}
