/**
 * Business profile — edit this file to configure the AI voice agent for a
 * specific client. Everything the agent knows and how it introduces itself
 * lives here, so onboarding a new business is a single-file change.
 */
export const BUSINESS = {
  name: "Bright Smile Dental",
  type: "dental clinic in Brampton, Ontario",
  agentName: "Ava",

  // Spoken when the AI first answers.
  greeting: "Thanks for calling Bright Smile Dental — sorry we missed you!",

  // Knowledge base used to answer caller questions.
  hours: "Monday to Friday 9 AM to 6 PM, Saturday 9 AM to 2 PM, closed Sundays.",
  location: "25 Peel Centre Drive, Suite 200, Brampton, Ontario.",
  services:
    "New-patient exams and cleanings from $129, whitening, fillings, and Invisalign. Most insurance plans accepted.",
  booking:
    "Appointments can be booked Monday to Saturday during business hours; collect the caller's preferred day and time.",

  // Twilio <Say> voice. Swap for a premium neural voice (e.g. Polly.Joanna-Neural).
  ttsVoice: "Polly.Joanna",
};
