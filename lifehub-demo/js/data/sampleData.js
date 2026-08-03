const now = new Date();

function daysFromNow(days) {
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export const sampleTasks = [
  {
    id: "task-1",
    title: "Pay electricity bill",
    category: "Bills",
    dueAt: daysFromNow(1),
    notes: "Auto-pay failed last month, verify payment method.",
    completed: false
  },
  {
    id: "task-2",
    title: "Renew passport",
    category: "Travel",
    dueAt: daysFromNow(8),
    notes: "Bring old passport and two photos.",
    completed: false
  },
  {
    id: "task-3",
    title: "Dentist appointment reminder",
    category: "Health",
    dueAt: daysFromNow(0),
    notes: "Appointment at 3:30 PM downtown clinic.",
    completed: false
  }
];

export const sampleDocuments = [
  {
    id: "doc-1",
    name: "Car Insurance Card.pdf",
    type: "Insurance",
    uploadedAt: daysFromNow(-20),
    extracted: {
      amount: "$1,280 yearly premium",
      date: "Renews on Dec 02, 2026",
      actionItem: "Compare rates before renewal date."
    },
    summary: [
      "Policy active for 12 months.",
      "Roadside assistance included.",
      "Renewal reminder needed 30 days before expiry."
    ]
  },
  {
    id: "doc-2",
    name: "Laptop Warranty Receipt.png",
    type: "Warranty",
    uploadedAt: daysFromNow(-6),
    extracted: {
      amount: "$1,099 purchase",
      date: "Warranty ends Jun 15, 2028",
      actionItem: "Keep serial number and store invoice."
    },
    summary: [
      "2-year manufacturer warranty.",
      "Covers hardware faults only.",
      "Repair requests require original receipt."
    ]
  }
];
