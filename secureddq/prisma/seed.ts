/**
 * Database seed. Creates a demo organization, users with each role, a plan,
 * knowledge-base documents, a questionnaire with questions/answers, and
 * compliance controls. Run with `npm run db:seed` (requires DATABASE_URL).
 */
import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

async function main() {
  const password = await hashPassword("SecureDDQ!2026");

  const org = await prisma.organization.upsert({
    where: { slug: "northwind" },
    update: {},
    create: {
      name: "Northwind Security",
      slug: "northwind",
      industry: "SaaS / Technology",
      website: "https://northwind.io",
      subscription: { create: { plan: "PROFESSIONAL", status: "ACTIVE", seats: 25 } },
      settings: { create: {} },
    },
  });

  const team: { email: string; name: string; role: Role }[] = [
    { email: "ava@northwind.io", name: "Ava Chen", role: "OWNER" },
    { email: "admin@northwind.io", name: "Admin User", role: "ADMIN" },
    { email: "marcus@northwind.io", name: "Marcus Reed", role: "SECURITY_MANAGER" },
    { email: "priya@northwind.io", name: "Priya Nair", role: "SECURITY_ANALYST" },
    { email: "lena@northwind.io", name: "Lena Petrov", role: "SALES_ENGINEER" },
    { email: "tom@northwind.io", name: "Tom Baker", role: "VIEWER" },
  ];

  for (const member of team) {
    const user = await prisma.user.upsert({
      where: { email: member.email },
      update: {},
      create: { email: member.email, name: member.name, hashedPassword: password, emailVerified: new Date() },
    });
    await prisma.membership.upsert({
      where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
      update: { role: member.role },
      create: { userId: user.id, organizationId: org.id, role: member.role },
    });
  }

  const documents = [
    { title: "Encryption Standard", type: "SECURITY_POLICY" as const, content: "All data at rest is encrypted using AES-256-GCM. Keys are managed in AWS KMS with annual rotation. Data in transit uses TLS 1.2+." },
    { title: "Incident Response Plan", type: "POLICY" as const, content: "Incident response follows NIST 800-61: preparation, detection, containment, eradication, recovery, and lessons learned." },
    { title: "Access Control Policy", type: "SECURITY_POLICY" as const, content: "Passwords require 12+ characters and breach-list checks. MFA is enforced. Access uses RBAC and is reviewed quarterly." },
  ];

  for (const doc of documents) {
    const created = await prisma.document.create({
      data: {
        organizationId: org.id,
        title: doc.title,
        type: doc.type,
        status: "READY",
        processingStage: "INDEXED",
        sizeBytes: doc.content.length,
      },
    });
    await prisma.chunk.create({
      data: { documentId: created.id, index: 0, content: doc.content, tokenCount: Math.ceil(doc.content.length / 4) },
    });
  }

  const questionnaire = await prisma.questionnaire.create({
    data: {
      organizationId: org.id,
      title: "Acme Corp Vendor Assessment",
      status: "IN_PROGRESS",
      requesterEmail: "security@acme.com",
    },
  });

  const q = await prisma.question.create({
    data: {
      questionnaireId: questionnaire.id,
      prompt: "Do you encrypt customer data at rest?",
      type: "LONG_TEXT",
      required: true,
    },
  });
  await prisma.answer.create({
    data: {
      questionId: q.id,
      content: "Yes. All customer data is encrypted at rest using AES-256 with keys managed in AWS KMS.",
      status: "APPROVED",
      aiGenerated: true,
      confidence: 0.97,
    },
  });

  const controls = [
    { framework: "SOC2" as const, code: "CC6.1", title: "Logical access — encryption", status: "IMPLEMENTED" as const },
    { framework: "ISO27001" as const, code: "A.8.24", title: "Use of cryptography", status: "IMPLEMENTED" as const },
  ];
  for (const c of controls) {
    await prisma.complianceControl.upsert({
      where: { organizationId_framework_code: { organizationId: org.id, framework: c.framework, code: c.code } },
      update: {},
      create: { organizationId: org.id, ...c },
    });
  }

  console.log("Seed complete. Sign in with ava@northwind.io / SecureDDQ!2026");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
