# SecureDDQ AI

**Production-ready AI SaaS platform for automating security questionnaires, DDQs, and vendor assessments.**

SecureDDQ AI dramatically reduces the time required to complete security questionnaires by building an AI-powered knowledge base from your security documentation and automatically generating accurate, evidence-backed answers.

---

## Features

- **AI Answer Engine** — GPT-4o powered RAG system that answers questions from your knowledge base with source citations
- **Smart Knowledge Base** — Upload PDFs, Word docs, Excel, CSV, and more. AI indexes everything for semantic search
- **Questionnaire Automation** — Upload any questionnaire format (Excel, Word, PDF, CSV) and get AI-generated answers
- **Compliance Center** — Track coverage for SOC 2, ISO 27001, HIPAA, GDPR, PCI DSS, and NIST
- **Approval Workflows** — Route answers through security teams with review, approval, and audit trails
- **AI Chat** — Conversational interface to query your entire security knowledge base
- **Analytics Dashboard** — Track time saved, AI accuracy, and ROI
- **Role-Based Access** — Owner, Admin, Security Manager, Security Analyst, Sales Engineer, Viewer
- **Stripe Billing** — Free, Starter ($49/mo), Professional ($199/mo), Enterprise (custom)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | PostgreSQL + pgvector |
| ORM | Prisma v7 |
| Authentication | Clerk |
| AI / LLM | OpenAI GPT-4o + text-embedding-3-small |
| File Storage | UploadThing |
| Billing | Stripe |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL with pgvector extension
- Accounts: Clerk, OpenAI, Stripe, UploadThing

### 1. Clone and install

```bash
git clone <repo-url>
cd secure-ddq-ai
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in all values in `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/secure_ddq_ai"

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# OpenAI
OPENAI_API_KEY=sk-xxx

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# UploadThing
UPLOADTHING_SECRET=sk_live_xxx
UPLOADTHING_APP_ID=xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set up the database

```bash
# Create the database
createdb secure_ddq_ai

# Enable pgvector
psql secure_ddq_ai -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

### 4. Start development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Sign-in/sign-up pages
│   ├── (dashboard)/      # Protected dashboard pages
│   │   ├── dashboard/    # Main dashboard
│   │   ├── knowledge-base/ # Document management
│   │   ├── questionnaires/ # Questionnaire module
│   │   ├── compliance/   # Compliance center
│   │   ├── chat/         # AI chat interface
│   │   ├── analytics/    # Analytics & metrics
│   │   └── settings/     # Organization settings
│   ├── api/              # API routes
│   │   ├── ai/           # AI generation endpoints
│   │   ├── documents/    # Document processing
│   │   ├── stripe/       # Billing & webhooks
│   │   └── webhooks/     # Clerk webhooks
│   └── onboarding/       # Onboarding flow
├── components/
│   ├── dashboard/        # Dashboard layout components
│   ├── landing/          # Landing page components
│   ├── providers/        # Context providers
│   ├── shared/           # Shared components
│   └── ui/               # shadcn/ui components
├── lib/
│   ├── auth.ts           # Auth helpers
│   ├── openai.ts         # OpenAI client & helpers
│   ├── prisma.ts         # Prisma client
│   ├── rag.ts            # RAG pipeline
│   ├── stripe.ts         # Stripe client & plans
│   └── uploadthing.ts    # UploadThing config
└── middleware.ts          # Auth middleware
prisma/
└── schema.prisma         # Database schema
```

---

## Database Schema

The schema includes 20+ tables:
- `Organization`, `User`, `OrganizationMember`, `Invitation`
- `Subscription`, `Invoice`, `UsageRecord`
- `Document`, `DocumentChunk` (with pgvector embeddings)
- `Project`, `Questionnaire`, `Section`, `Question`
- `Answer`, `AnswerVersion`, `Evidence`, `Comment`
- `ComplianceControl`, `ComplianceMapping`
- `AuditLog`, `ActivityLog`, `Notification`
- `ApiKey`, `OrganizationSettings`, `UserSession`

---

## Deployment

### Vercel (Recommended)

```bash
npx vercel --prod
```

Set all environment variables in the Vercel dashboard.

### Database

Use [Neon](https://neon.tech) or [Supabase](https://supabase.com) for PostgreSQL with pgvector support.

---

## Pricing Plans

| Plan | Price | Users | Documents | Questionnaires |
|------|-------|-------|-----------|----------------|
| Free | $0 | 2 | 10 | 1/month |
| Starter | $49/mo | 5 | 100 | Unlimited |
| Professional | $199/mo | Unlimited | Unlimited | Unlimited |
| Enterprise | Custom | Unlimited | Unlimited | Unlimited |

---

## Roadmap

- [ ] Salesforce / HubSpot integration
- [ ] Slack / Teams notifications
- [ ] Google Drive / SharePoint sync
- [ ] Browser extension
- [ ] Customer Trust Center
- [ ] Automatic evidence collection
- [ ] Risk scoring
- [ ] AI policy generation
- [ ] Vendor risk portal

---

## Security

- Data encrypted at rest (AES-256) and in transit (TLS 1.3)
- SOC 2 compliant architecture
- RBAC with 6 role levels
- MFA support via Clerk
- Full audit logging
- Signed URLs for file access
- Rate limiting on all API endpoints
