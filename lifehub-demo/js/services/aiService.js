/**
 * Placeholder AI service for later backend integration.
 * The current implementation returns deterministic demo data.
 */
export const aiService = {
  async extractDocumentInsights(fileName) {
    await wait(300);
    return {
      amount: "Potential amount detected: $89.00",
      date: "Potential due date detected: Sep 15, 2026",
      actionItem: `Review "${fileName}" and confirm payment schedule.`
    };
  },

  async summarizeDocument(fileName) {
    await wait(250);
    return [
      `${fileName} appears to include billing details and policy terms.`,
      "One due date and one amount were detected with medium confidence.",
      "Recommended action: verify deadline and save contact details."
    ];
  }
};

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
