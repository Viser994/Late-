import {
  DEMO_ACTIVITY,
  DEMO_ANALYTICS,
  DEMO_CHAT,
  DEMO_INVOICES,
  DEMO_MEMBERS,
  DEMO_METRICS,
  DEMO_ORG,
  DEMO_RECENT_UPLOADS,
  demoControls,
  demoDocuments,
  demoFrameworkCoverage,
  demoQuestionnaires,
  demoQuestions,
} from "./demo";

/**
 * Data-access facade. The current implementation serves the built-in demo
 * dataset so the entire product renders without external infrastructure.
 *
 * In production each function is a thin wrapper around Prisma queries scoped
 * to the caller's organization (see repository stubs in `./repositories`).
 * Keeping the async signatures here means swapping the source requires no
 * changes in the UI layer.
 */

export async function getOrgContext() {
  return DEMO_ORG;
}

export async function getDashboardMetrics() {
  return DEMO_METRICS;
}

export async function getRecentActivity() {
  return DEMO_ACTIVITY;
}

export async function getRecentUploads() {
  return DEMO_RECENT_UPLOADS;
}

export async function getMembers() {
  return DEMO_MEMBERS;
}

export async function getDocuments() {
  return demoDocuments();
}

export async function getQuestionnaires() {
  return demoQuestionnaires();
}

export async function getQuestionnaire(id: string) {
  const list = demoQuestionnaires();
  return list.find((item) => item.id === id) ?? list[0];
}

export async function getQuestions(questionnaireId: string) {
  return demoQuestions(questionnaireId);
}

export async function getChatMessages() {
  return DEMO_CHAT;
}

export async function getControls() {
  return demoControls();
}

export async function getFrameworkCoverage() {
  return demoFrameworkCoverage();
}

export async function getAnalytics() {
  return DEMO_ANALYTICS;
}

export async function getInvoices() {
  return DEMO_INVOICES;
}

export * from "./types";
