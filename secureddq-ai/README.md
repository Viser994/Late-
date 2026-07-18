# SecureDDQ AI

Production-ready AI SaaS platform for automating cybersecurity security questionnaires (DDQs), vendor security assessments, and RFP security responses.

## Features

- **AI-Powered Answers** — RAG architecture with OpenAI for evidence-backed responses
- **Knowledge Base** — Upload PDF, DOCX, Excel, CSV, TXT, Markdown documents
- **Questionnaire Automation** — Parse and auto-answer security questionnaires
- **Compliance Center** — SOC 2, ISO 27001, HIPAA, GDPR, PCI DSS, NIST tracking
- **AI Chat** — Ask questions about your security documentation with citations
- **Team Collaboration** — Role-based access control with 6 user roles
- **Stripe Billing** — Free, Starter, Professional, and Enterprise plans
- **Analytics** — Track time saved, AI acceptance rate, and usage metrics

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS 4, shadcn/ui components
- **Database:** PostgreSQL with pgvector (Prisma ORM)
- **Auth:** Clerk (email/password, Google, Microsoft, MFA, org invitations)
- **AI:** OpenAI API (embeddings + chat completions)
- **Billing:** Stripe
- **File Uploads:** UploadThing
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ with [pgvector](https://github.com/pgvector/pgvector) extension
- Accounts: Clerk, OpenAI, Stripe, UploadThing

### Installation

```bash
cd secureddq-ai
npm install
cp .env.example .env
# Fill in environment variables
```

### Database Setup

Enable pgvector in PostgreSQL:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Run migrations:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Background Jobs

Process pending jobs via cron or manual trigger:

```bash
curl -X POST http://localhost:3000/api/jobs/process \
  -H "Authorization: Bearer $CRON_SECRET"
```

Configure Vercel Cron in `vercel.json` for production.

### Testing

```bash
npm test
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (marketing)/        # Landing page
│   ├── dashboard/          # Authenticated app
│   └── api/                # API routes
├── components/             # React components
│   ├── ui/                 # shadcn/ui primitives
│   ├── dashboard/          # Dashboard layout
│   ├── documents/          # Document upload
│   ├── questionnaires/     # Q&A components
│   └── chat/               # AI chat interface
├── lib/                    # Core business logic
│   ├── ai/                 # RAG, embeddings, OpenAI
│   ├── documents/          # Document processing
│   ├── questionnaires/     # Question parsing
│   ├── stripe/             # Billing integration
│   ├── jobs/               # Background job processor
│   ├── auth.ts             # Clerk auth helpers
│   ├── permissions.ts      # RBAC
│   └── db.ts               # Prisma client
└── middleware.ts           # Auth middleware
```

## User Roles

| Role | Permissions |
|------|-------------|
| Owner | Full access including billing and admin |
| Admin | Full access except ownership transfer |
| Security Manager | Manage documents, questionnaires, approvals |
| Security Analyst | Create and edit questionnaires and answers |
| Sales Engineer | Create questionnaires, export data |
| Viewer | Read-only analytics access |

## Deployment

1. Deploy to Vercel
2. Set all environment variables
3. Connect PostgreSQL (Neon, Supabase, or RDS with pgvector)
4. Run `npx prisma migrate deploy`
5. Configure Stripe webhooks → `/api/webhooks/stripe`
6. Configure Clerk webhooks (optional)
7. Set up Vercel Cron for `/api/jobs/process`

## License

Proprietary — All rights reserved.
