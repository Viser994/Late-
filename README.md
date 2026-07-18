# SecureDDQ AI

SecureDDQ AI is an enterprise SaaS foundation for automating cybersecurity DDQs, vendor security assessments, and RFP security responses with AI-generated, evidence-backed answers.

## Stack

- Next.js App Router, React, TypeScript
- Tailwind CSS with shadcn-style primitives
- Prisma ORM, PostgreSQL, pgvector
- Clerk authentication and organization security
- Stripe Billing
- AWS S3 signed upload routing
- OpenAI RAG answer generation
- Inngest background document processing
- Vitest unit tests

## Product modules

- Premium SaaS landing page with pricing and FAQ
- Multi-tenant organization dashboard
- Role-based access control for Owner, Admin, Security Manager, Security Analyst, Sales Engineer, and Viewer
- Knowledge base inventory, document tags, versioning, expiration and archival data model
- Questionnaire ingestion model with detected questions, sections, field types, choices, and required fields
- AI answer engine that requires citations from retrieved evidence chunks
- Human review workflow with statuses, comments, versions, and audit logs
- AI chat route for evidence-backed security Q&A
- Compliance center for SOC2, ISO27001, HIPAA, GDPR, PCI DSS, and NIST
- Analytics for time saved, revenue protected, AI acceptance, and edit rates
- Billing portal surface and Stripe webhook integration
- Admin panel for users, organizations, subscriptions, storage, AI usage, API keys, audit logs, templates, and settings

## Getting started

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run dev
```

Configure PostgreSQL with the `pgvector` extension enabled before running migrations:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Required environment variables

See `.env.example` for all configuration. Production deployments should provide:

- `DATABASE_URL`
- Clerk keys and webhook secret
- OpenAI API key and model names
- Stripe API key, webhook secret, and price IDs
- S3 credentials
- Inngest keys
- Encryption and security scanning keys

## Security notes

The codebase is designed around organization-scoped data, RBAC, MFA-ready Clerk auth, signed uploads, audit logging, Stripe billing isolation, and evidence-only AI generation. Production deployments should add provider-specific encryption at rest, malware scanning, retention policies, WAF/rate limiting, SAML/OIDC for Enterprise plans, and private networking for database and object storage.

## Validation

```bash
npm run typecheck
npm test
npm run build
```
