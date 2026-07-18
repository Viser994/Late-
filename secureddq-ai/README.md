# SecureDDQ AI

Production-grade SaaS foundation for automating security questionnaires (DDQs), vendor assessments, and RFP security responses using AI and evidence-backed retrieval.

## Stack

- Next.js 16 (App Router)
- React + TypeScript
- Tailwind CSS + reusable UI primitives (shadcn-style approach)
- Prisma ORM + PostgreSQL + pgvector (`vector(1536)` in `DocumentChunk`)
- OpenAI API for embeddings + answer generation (RAG)
- Clerk authentication
- Stripe billing and portal support
- UploadThing-ready uploads
- Upstash rate limiting
- Trigger.dev-style background indexing task scaffold

## Core Modules

1. **Authentication and organization access**
   - Clerk middleware route protection
   - User synchronization to Prisma
   - Membership model and role-based permissions

2. **Knowledge base ingestion**
   - Text extraction for PDF, DOCX, CSV, XLSX, TXT
   - Chunking service
   - Embedding-ready schema and retrieval pipeline
   - Citation-aware answer engine

3. **Questionnaire automation**
   - AI answer endpoint with confidence and citations
   - Answer status model: draft, edited, approved, rejected
   - Review comments and answer versioning in schema

4. **Compliance and analytics**
   - Framework controls and evidence mappings
   - AI usage logs, activity logs, audit logs
   - Notification and settings models

5. **Billing**
   - Stripe webhook handler
   - Billing portal endpoint
   - Plan limits in typed config

## Database

See `prisma/schema.prisma` for normalized models:

- users, organizations, memberships, roles
- projects, questionnaires, questions, answers, answer versions
- documents, chunks, embeddings, evidence, document history
- compliance controls and mappings
- subscriptions, invoices, notifications, logs, API keys, settings

> pgvector extension must be enabled in your PostgreSQL instance.

## Local Setup

```bash
npm install
cp .env.example .env
npm run db:generate
npm run dev
```

Run tests:

```bash
npm run test
```

## API Endpoints

- `POST /api/ai/answer` — evidence-backed answer generation
- `POST /api/documents/ingest` — file extraction + chunk creation
- `POST /api/billing/portal` — Stripe billing portal launch
- `POST /api/webhooks/stripe` — Stripe webhook events
- `GET|POST /api/uploadthing` — upload route handlers

## Security Foundation

- middleware-protected app and API routes
- RBAC permission map
- AI endpoint rate limiting
- audit and activity log schema
- RAG prompt constraints to reduce hallucination risk

## Suggested Next Delivery Phases

- OCR fallback path for scanned PDFs
- field-level questionnaire parser (checkboxes, multiple choice, required fields)
- full semantic global search UI + API
- async malware scanning and signed URL pipeline
- export engine for DOCX/XLSX/PDF with format preservation
- enterprise SSO (SAML/OIDC) and SCIM provisioning
