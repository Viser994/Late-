# SecureDDQ AI

**Answer security questionnaires in minutes, not weeks.**

SecureDDQ AI is a production-oriented, enterprise-grade SaaS platform that automates cybersecurity
security questionnaires (DDQs), vendor security assessments, and RFP security responses. It builds an
evidence-backed knowledge base from a company's security documentation and generates accurate,
citable answers using a Retrieval-Augmented Generation (RAG) architecture.

> Built as a scalable, modular codebase suitable for extension into a commercial product.

---

## ✨ Features

| Area | What it does |
| --- | --- |
| **Landing page** | Premium marketing site: hero, features, how-it-works, testimonials, pricing, FAQ, CTA, footer |
| **Authentication** | Email/password, OAuth (Google/Microsoft) hooks, JWT sessions, password policy, forgot-password |
| **Organizations & RBAC** | Multi-tenant orgs with 6 roles (Owner, Admin, Security Manager, Security Analyst, Sales Engineer, Viewer) and a granular permission catalog |
| **Dashboard** | Questionnaire totals, completion, AI accuracy, hours saved, revenue protected, compliance coverage, team activity, recent uploads |
| **Knowledge Base** | Upload PDF/DOCX/XLSX/CSV/TXT/MD → extract → chunk → embed → index; tags, versions, expiry tracking, semantic search |
| **Questionnaires** | Upload + auto-detect sections/questions; AI answer engine with confidence scores, citations, multiple answer styles, and a draft → edited → approved review workflow |
| **AI Chat** | Retrieval-augmented chat over your documents, with source citations |
| **Compliance Center** | SOC 2, ISO 27001, HIPAA, GDPR, PCI DSS, NIST — coverage, gaps, mapped documents |
| **Analytics** | Questions answered, time/money saved, AI acceptance rate, human edit rate, knowledge growth, top questions |
| **Billing** | Stripe subscription plans (Free / Starter $49 / Professional $199 / Enterprise), usage, invoices, portal |
| **Admin** | Audit logs, API keys, templates, system status |
| **Settings** | Org profile, security (MFA/SSO/retention), AI preferences, notifications |

## 🧱 Tech stack

- **Next.js 15** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS** + a hand-authored **shadcn/ui** component library (light + dark mode)
- **Prisma ORM** · **PostgreSQL** · **pgvector**
- **OpenAI** for embeddings + chat completions (RAG)
- **Stripe** for billing · **S3-compatible** object storage
- **jose** (JWT sessions) · **bcryptjs** (password hashing) · **zod** (validation)
- **Recharts** for analytics · **Vitest** for unit tests

## 🏗️ Architecture

```
src/
├── app/
│   ├── (marketing)          # public landing page (root)
│   ├── (auth)               # sign-in / sign-up / forgot-password
│   ├── (app)                # authenticated app shell + all modules
│   └── api/                 # health, stripe webhook, upload endpoints
├── components/
│   ├── ui/                  # shadcn-style primitives
│   ├── marketing/           # landing page sections
│   ├── app/                 # dashboard, tables, workspaces, charts
│   └── auth/                # auth forms
├── lib/
│   ├── ai/                  # RAG: chunking, embeddings, retrieval, answer/chat engines
│   ├── auth/                # sessions, password, RBAC actions
│   ├── billing/             # Stripe abstraction
│   ├── storage/             # S3 / local storage abstraction
│   ├── documents/           # text extraction dispatcher
│   ├── data/                # data-access facade (demo provider today, Prisma-ready)
│   ├── actions/             # server actions (answers, chat, billing)
│   ├── constants.ts         # plans, roles, frameworks
│   └── rbac.ts              # permission catalog
└── prisma/
    ├── schema.prisma        # full normalized schema + pgvector
    ├── migrations/          # pgvector extension + HNSW index
    └── seed.ts              # demo data seed
```

### Graceful degradation (runs with zero external services)

Every external integration degrades to a safe local behaviour when its credentials are absent:

- **OpenAI** → deterministic hash-based embeddings + grounded extractive answers, so retrieval,
  citations, and the review workflow all work offline.
- **Stripe** → checkout/portal return local URLs simulating success.
- **S3** → uploads target a local dev endpoint.
- **Database** → the `@/lib/data` facade serves a rich demo dataset, so the entire UI renders.

This means `npm run dev` works out of the box, and adding keys "upgrades" the same code paths to
production behaviour with no code changes.

### RAG pipeline

1. **Ingest** — `extractText()` pulls plain text from an upload (format parsers registered at deploy time).
2. **Chunk** — `chunkText()` splits text into overlapping, token-budgeted chunks.
3. **Embed** — `embedText()`/`embedBatch()` create vectors (OpenAI, or a deterministic mock).
4. **Store** — vectors persist in the `Embedding.vector` `vector(1536)` column with an HNSW index.
5. **Retrieve** — `retrieveRelevant()` runs cosine-similarity ANN search scoped to the org.
6. **Generate** — `generateAnswer()` / `answerChat()` produce grounded, cited answers with confidence.

## 🚀 Getting started

```bash
cd secureddq
cp .env.example .env          # fill in what you have; everything else mocks
npm install
npm run dev                   # http://localhost:3000
```

Explore the product immediately — click **"View live demo"** on the landing page, or sign in with
any email/password (demo mode establishes a session bound to the demo organization).

### With a database

```bash
# Requires PostgreSQL with the pgvector extension available
createdb secureddq
psql secureddq -c 'CREATE EXTENSION IF NOT EXISTS vector;'

npm run db:push               # sync schema
npm run db:seed               # demo org + users + docs + questionnaire
# Seed login: ava@northwind.io / SecureDDQ!2026
```

## 🔧 Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Prisma generate + production build |
| `npm run start` | Start the production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type check |
| `npm run test` | Run Vitest unit tests |
| `npm run db:push` | Push the Prisma schema |
| `npm run db:migrate` | Create/apply a migration |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio |

## 🔐 Environment variables

See [`.env.example`](./.env.example). Key groups: `AUTH_SECRET`, `DATABASE_URL`, `OPENAI_*`,
`STRIPE_*`, `S3_*`, OAuth client ids/secrets, and SMTP. All are optional in development.

## ✅ Testing

Unit tests cover the RBAC engine, chunking, embeddings/similarity, the answer engine, plan
definitions, and utilities:

```bash
npm run test
```

## ☁️ Deployment

Optimised for **Vercel**. Provision a PostgreSQL instance with pgvector (e.g. Neon, Supabase, RDS),
set the environment variables, run `npm run db:push` (or migrations), and deploy. Point the Stripe
webhook at `/api/stripe/webhook`.

## 🗺️ Roadmap

Salesforce / HubSpot / Slack / Teams integrations, Google Drive / SharePoint / OneDrive / Jira
connectors, browser extension, customer Trust Center, public security profile, automatic evidence
collection, risk scoring, AI policy generation, and a vendor risk portal.

## 📄 Security

Encryption in transit and at rest, RBAC, MFA, session management, signed upload URLs, rate limiting,
virus scanning, and comprehensive audit logging are first-class concerns modelled in the schema and
service layer. See the Settings → Security and Admin → Audit sections in-app.
