export type AnalyticsSnapshot = {
  questionnaires: number;
  completed: number;
  inProgress: number;
  pendingReview: number;
  aiAccuracy: number;
  estimatedHoursSaved: number;
  revenueProtected: number;
  knowledgeBaseSize: number;
  complianceCoverage: number;
  aiAcceptanceRate: number;
  humanEditPercentage: number;
};

export function estimateHoursSaved(answerCount: number) {
  return Math.round(answerCount * 0.18 * 10) / 10;
}

export function estimateRevenueProtected(questionnaires: number, averageDealSize = 85000) {
  return questionnaires * averageDealSize;
}

export const demoAnalytics: AnalyticsSnapshot = {
  questionnaires: 42,
  completed: 28,
  inProgress: 9,
  pendingReview: 5,
  aiAccuracy: 94,
  estimatedHoursSaved: 638,
  revenueProtected: 3120000,
  knowledgeBaseSize: 1284,
  complianceCoverage: 81,
  aiAcceptanceRate: 88,
  humanEditPercentage: 12
};
