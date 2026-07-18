import { PrismaClient, ComplianceFramework } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});

const prisma = new PrismaClient({ adapter } as any);

const SOC2_CONTROLS = [
  { controlId: "CC1.1", name: "COSO Principle 1", category: "Control Environment" },
  { controlId: "CC2.1", name: "Information and Communication", category: "Information and Communication" },
  { controlId: "CC3.1", name: "Risk Assessment Process", category: "Risk Assessment" },
  { controlId: "CC6.1", name: "Logical and Physical Address Controls", category: "Logical and Physical Access" },
  { controlId: "CC6.2", name: "Prior to Issuing System Credentials", category: "Logical and Physical Access" },
  { controlId: "CC6.3", name: "Authorized Users", category: "Logical and Physical Access" },
  { controlId: "CC6.6", name: "Logical Access Security Measures", category: "Logical and Physical Access" },
  { controlId: "CC6.7", name: "Transmission, Movement of Information", category: "Logical and Physical Access" },
  { controlId: "CC7.1", name: "Detection and Monitoring Procedures", category: "System Operations" },
  { controlId: "CC7.2", name: "Monitoring System Performance", category: "System Operations" },
  { controlId: "CC9.1", name: "Risk Mitigation", category: "Risk Mitigation" },
];

const ISO27001_CONTROLS = [
  { controlId: "A.5.1", name: "Policies for information security", category: "Organizational Controls" },
  { controlId: "A.5.2", name: "Information security roles and responsibilities", category: "Organizational Controls" },
  { controlId: "A.8.1", name: "User endpoint devices", category: "Technological Controls" },
  { controlId: "A.8.5", name: "Secure authentication", category: "Technological Controls" },
  { controlId: "A.8.7", name: "Protection against malware", category: "Technological Controls" },
  { controlId: "A.8.12", name: "Data leakage prevention", category: "Technological Controls" },
  { controlId: "A.8.24", name: "Use of cryptography", category: "Technological Controls" },
];

async function main() {
  console.log("Seeding database...");

  // Create a demo organization
  const org = await prisma.organization.upsert({
    where: { slug: "demo-org" },
    update: {},
    create: {
      name: "Demo Organization",
      slug: "demo-org",
      industry: "SaaS / Technology",
      description: "Demo organization for SecureDDQ AI",
    },
  });

  // Create organization settings
  await prisma.organizationSettings.upsert({
    where: { organizationId: org.id },
    update: {},
    create: {
      organizationId: org.id,
    },
  });

  // Create subscription
  await prisma.subscription.upsert({
    where: { organizationId: org.id },
    update: {},
    create: {
      organizationId: org.id,
      plan: "PROFESSIONAL",
      status: "ACTIVE",
    },
  });

  // Seed SOC2 controls
  for (const control of SOC2_CONTROLS) {
    await prisma.complianceControl.upsert({
      where: {
        organizationId_framework_controlId: {
          organizationId: org.id,
          framework: "SOC2",
          controlId: control.controlId,
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        framework: "SOC2",
        ...control,
      },
    });
  }

  // Seed ISO 27001 controls
  for (const control of ISO27001_CONTROLS) {
    await prisma.complianceControl.upsert({
      where: {
        organizationId_framework_controlId: {
          organizationId: org.id,
          framework: "ISO27001",
          controlId: control.controlId,
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        framework: "ISO27001",
        ...control,
      },
    });
  }

  console.log("Seed complete!");
  console.log(`Created organization: ${org.name} (${org.id})`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
