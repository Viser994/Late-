// ============================================================================
// Sample data
// ----------------------------------------------------------------------------
// Realistic dummy content so the app looks alive on first launch. This is only
// used to seed the store the very first time; afterwards the user's own data
// (persisted to localStorage) takes over. Dates are generated relative to
// "today" so the Today dashboard always has meaningful urgency.
// ============================================================================

import { isoDaysFromNow } from '../utils/dates.js';

/** Task categories shown in the type picker + used for chip colors. */
export const TASK_TYPES = {
  bill: { label: 'Bill', color: 'var(--cat-bill)' },
  appointment: { label: 'Appointment', color: 'var(--cat-appointment)' },
  reminder: { label: 'Reminder', color: 'var(--cat-reminder)' },
};

/** Document categories shown as filters + tile colors/icons. */
export const DOC_CATEGORIES = {
  id: { label: 'IDs', color: 'var(--cat-id)', icon: 'id' },
  insurance: { label: 'Insurance', color: 'var(--cat-insurance)', icon: 'heart' },
  warranty: { label: 'Warranties', color: 'var(--cat-warranty)', icon: 'shield' },
  travel: { label: 'Travel', color: 'var(--cat-travel)', icon: 'plane' },
  receipt: { label: 'Receipts', color: 'var(--cat-bill)', icon: 'file' },
  document: { label: 'Documents', color: 'var(--brand-500)', icon: 'documents' },
};

export const sampleTasks = [
  {
    id: 't1', title: 'Electricity bill — PowerCo', type: 'bill',
    dueDate: isoDaysFromNow(-1), amount: 84.5, note: 'Auto-pay is off this month.',
    done: false, createdAt: isoDaysFromNow(-8),
  },
  {
    id: 't2', title: 'Dentist appointment', type: 'appointment',
    dueDate: isoDaysFromNow(0), amount: null, note: '2:30 PM · Dr. Alvarez, Suite 210.',
    done: false, createdAt: isoDaysFromNow(-14),
  },
  {
    id: 't3', title: 'Renew car insurance', type: 'bill',
    dueDate: isoDaysFromNow(2), amount: 640, note: 'Policy #AZ-88213. Compare quotes first.',
    done: false, createdAt: isoDaysFromNow(-20),
  },
  {
    id: 't4', title: 'Passport renewal reminder', type: 'reminder',
    dueDate: isoDaysFromNow(5), amount: null, note: 'Expires in 6 months — start early.',
    done: false, createdAt: isoDaysFromNow(-3),
  },
  {
    id: 't5', title: 'Internet bill — FibreNet', type: 'bill',
    dueDate: isoDaysFromNow(9), amount: 59.99, note: '', done: false, createdAt: isoDaysFromNow(-2),
  },
  {
    id: 't6', title: 'Pick up dry cleaning', type: 'reminder',
    dueDate: isoDaysFromNow(-3), amount: null, note: '', done: true, createdAt: isoDaysFromNow(-6),
  },
];

export const sampleDocuments = [
  {
    id: 'd1', name: "Driver's License", category: 'id', fileType: 'image',
    addedAt: isoDaysFromNow(-40), size: '1.2 MB', note: 'Expires 2029',
    summary: null, extracted: null,
    content: 'State ID card. Name: Jordan Rivera. License No: D1234567. Class C. Expiry: 03/2029.',
  },
  {
    id: 'd2', name: 'Health Insurance Card', category: 'insurance', fileType: 'image',
    addedAt: isoDaysFromNow(-30), size: '0.9 MB', note: 'Member since 2021',
    summary: null, extracted: null,
    content: 'HealthPlus PPO. Member ID: HP-55231. Group: 8842. Copay $25. RxBIN 004336.',
  },
  {
    id: 'd3', name: 'Laptop Warranty', category: 'warranty', fileType: 'pdf',
    addedAt: isoDaysFromNow(-90), size: '340 KB', note: 'Valid 3 years',
    summary: null, extracted: null,
    content: 'Warranty certificate for Aurora Pro 14 laptop. Purchased 06/2025 for $1,499. ' +
      'Covers manufacturing defects for 36 months until 06/2028. Serial ABX-99120. ' +
      'Claims: support@auroratech.example within warranty period. Accidental damage not covered.',
  },
  {
    id: 'd4', name: 'Flight to Lisbon', category: 'travel', fileType: 'pdf',
    addedAt: isoDaysFromNow(-5), size: '210 KB', note: 'Boarding pass',
    summary: null, extracted: null,
    content: 'Booking ref TZ8842. Passenger Jordan Rivera. Flight AT204 departs ' +
      isoDaysFromNow(21) + ' 09:40 from Terminal 2, gate B14, seat 18A. Arrival Lisbon 13:15. ' +
      'Baggage: 1 checked 23kg. Check in online 24h before.',
  },
  {
    id: 'd5', name: 'Grocery Receipt', category: 'receipt', fileType: 'image',
    addedAt: isoDaysFromNow(-2), size: '0.6 MB', note: '',
    summary: null, extracted: null,
    content: 'FreshMart receipt. Date ' + isoDaysFromNow(-2) + '. Total $63.20. ' +
      'Items: produce $18.40, dairy $9.10, household $22.70, snacks $13.00. Paid by card ending 4021.',
  },
];

/** A sample email body used to demo the "summarize" AI action. */
export const sampleEmail =
  `Subject: Your annual home insurance policy is up for renewal\n\n` +
  `Hi Jordan, your HomeShield policy #HS-77420 renews on ${isoDaysFromNow(18)}. ` +
  `The new premium is $1,180 for the year (up 6% from last year). To keep your current ` +
  `coverage you don't need to do anything — payment will be taken automatically on the ` +
  `renewal date from the card ending 4021. If you'd like to adjust your coverage, add ` +
  `flood protection, or switch to monthly payments, please contact us at least 7 days ` +
  `before the renewal date. You can also download your renewal documents from your online ` +
  `account. Thank you for being a valued customer since 2020.`;
