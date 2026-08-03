/**
 * Sample dummy data for LifeHub MVP demo.
 * Loaded on first launch when no local storage data exists.
 */

export const DUMMY_TASKS = [
  {
    id: "task-1",
    title: "Pay electricity bill",
    category: "bills",
    dueDate: daysFromNow(0),
    amount: 142.5,
    priority: "urgent",
    completed: false,
    notes: "Due today — account ending 4821",
    createdAt: daysAgo(3),
  },
  {
    id: "task-2",
    title: "Renew car insurance",
    category: "insurance",
    dueDate: daysFromNow(2),
    amount: 890.0,
    priority: "high",
    completed: false,
    notes: "Compare quotes before renewing",
    createdAt: daysAgo(5),
  },
  {
    id: "task-3",
    title: "Dentist appointment",
    category: "appointments",
    dueDate: daysFromNow(1),
    amount: null,
    priority: "high",
    completed: false,
    notes: "Dr. Patel — 2:30 PM, bring insurance card",
    createdAt: daysAgo(7),
  },
  {
    id: "task-4",
    title: "Submit expense report",
    category: "work",
    dueDate: daysFromNow(3),
    amount: null,
    priority: "medium",
    completed: false,
    notes: "Include receipts from business trip",
    createdAt: daysAgo(2),
  },
  {
    id: "task-5",
    title: "Warranty expires — laptop",
    category: "warranties",
    dueDate: daysFromNow(14),
    amount: null,
    priority: "medium",
    completed: false,
    notes: "MacBook Pro — consider AppleCare extension",
    createdAt: daysAgo(10),
  },
  {
    id: "task-6",
    title: "Water bill payment",
    category: "bills",
    dueDate: daysFromNow(-2),
    amount: 67.25,
    priority: "urgent",
    completed: true,
    notes: "Paid via auto-pay",
    createdAt: daysAgo(8),
  },
  {
    id: "task-7",
    title: "Pick up prescription",
    category: "health",
    dueDate: daysFromNow(0),
    amount: 15.0,
    priority: "high",
    completed: false,
    notes: "CVS on Main St — ready for pickup",
    createdAt: daysAgo(1),
  },
];

export const DUMMY_DOCUMENTS = [
  {
    id: "doc-1",
    name: "Driver's License",
    category: "id",
    type: "image",
    size: "1.2 MB",
    uploadedAt: daysAgo(30),
    expiryDate: daysFromNow(180),
    tags: ["identity", "government"],
    aiSummary: [
      "Valid until March 2027",
      "Class G license — Ontario",
      "No restrictions noted",
    ],
    extractedDates: [{ label: "Expiry", date: daysFromNow(180) }],
    extractedAmounts: [],
  },
  {
    id: "doc-2",
    name: "Health Insurance Card",
    category: "insurance",
    type: "image",
    size: "890 KB",
    uploadedAt: daysAgo(45),
    expiryDate: daysFromNow(320),
    tags: ["health", "insurance"],
    aiSummary: [
      "Policy #HC-928471",
      "Coverage: comprehensive family plan",
      "Renewal due next January",
    ],
    extractedDates: [{ label: "Renewal", date: daysFromNow(320) }],
    extractedAmounts: [{ label: "Deductible", amount: 500 }],
  },
  {
    id: "doc-3",
    name: "MacBook Pro Warranty",
    category: "warranty",
    type: "pdf",
    size: "340 KB",
    uploadedAt: daysAgo(60),
    expiryDate: daysFromNow(14),
    tags: ["electronics", "apple"],
    aiSummary: [
      "Apple Limited Warranty — 1 year",
      "Expires in 14 days",
      "Serial: C02XJ1ABCDEF",
      "Consider AppleCare+ before expiry",
    ],
    extractedDates: [{ label: "Warranty end", date: daysFromNow(14) }],
    extractedAmounts: [{ label: "Repair cost covered", amount: 0 }],
  },
  {
    id: "doc-4",
    name: "Flight Itinerary — Paris",
    category: "travel",
    type: "pdf",
    size: "520 KB",
    uploadedAt: daysAgo(5),
    expiryDate: daysFromNow(21),
    tags: ["travel", "vacation"],
    aiSummary: [
      "Departure: Aug 24, 8:15 AM — YYZ",
      "Return: Aug 31, 6:40 PM — CDG",
      "Confirmation: AF7K29L",
      "Check in 24 hours before departure",
    ],
    extractedDates: [
      { label: "Departure", date: daysFromNow(21) },
      { label: "Return", date: daysFromNow(28) },
    ],
    extractedAmounts: [{ label: "Total fare", amount: 1245.0 }],
  },
  {
    id: "doc-5",
    name: "Grocery Receipt — Aug 1",
    category: "receipt",
    type: "image",
    size: "2.1 MB",
    uploadedAt: daysAgo(2),
    expiryDate: null,
    tags: ["receipt", "groceries"],
    aiSummary: [
      "Total: $87.43 at FreshMart",
      "Items: produce, dairy, household",
      "Eligible for 2% cashback",
    ],
    extractedDates: [{ label: "Purchase date", date: daysAgo(2) }],
    extractedAmounts: [{ label: "Total", amount: 87.43 }],
  },
  {
    id: "doc-6",
    name: "Apartment Lease Agreement",
    category: "other",
    type: "pdf",
    size: "1.8 MB",
    uploadedAt: daysAgo(90),
    expiryDate: daysFromNow(275),
    tags: ["housing", "legal"],
    aiSummary: [
      "12-month lease — $1,850/month",
      "Lease ends May 2027",
      "60-day notice required for non-renewal",
      "Pet deposit: $300 (paid)",
    ],
    extractedDates: [
      { label: "Lease end", date: daysFromNow(275) },
      { label: "Notice deadline", date: daysFromNow(215) },
    ],
    extractedAmounts: [
      { label: "Monthly rent", amount: 1850 },
      { label: "Pet deposit", amount: 300 },
    ],
  },
];

export const DEFAULT_SETTINGS = {
  darkMode: false,
  notifications: true,
  onboardingComplete: false,
  userName: "",
};

/** Helper: ISO date string N days from today */
function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

/** Helper: ISO date string N days ago */
function daysAgo(n) {
  return daysFromNow(-n);
}
