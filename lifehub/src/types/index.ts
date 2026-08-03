// ─── Core domain types ───────────────────────────────────────────────────────

export type Priority = 'urgent' | 'high' | 'normal' | 'low';
export type TaskStatus = 'pending' | 'completed' | 'snoozed';
export type DocumentCategory =
  | 'identity'
  | 'insurance'
  | 'warranty'
  | 'medical'
  | 'finance'
  | 'travel'
  | 'receipt'
  | 'other';

export type ReminderType = 'task' | 'bill' | 'appointment' | 'renewal' | 'custom';

// ─── Task / Reminder ─────────────────────────────────────────────────────────

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: ReminderType;
  priority: Priority;
  status: TaskStatus;
  dueDate: string; // ISO string
  amount?: number; // for bills
  currency?: string;
  tags?: string[];
  linkedDocumentId?: string;
  createdAt: string;
  updatedAt: string;
  notificationId?: string;
}

// ─── Document ─────────────────────────────────────────────────────────────────

export interface StoredDocument {
  id: string;
  name: string;
  category: DocumentCategory;
  uri: string; // local file URI
  mimeType: string;
  sizeBytes?: number;
  thumbnail?: string;
  extractedText?: string;
  aiSummary?: string;
  aiExtractedDates?: ExtractedDate[];
  aiExtractedAmounts?: ExtractedAmount[];
  aiActionItems?: string[];
  tags?: string[];
  notes?: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractedDate {
  label: string;
  date: string;
  confidence: number;
}

export interface ExtractedAmount {
  label: string;
  amount: number;
  currency: string;
  confidence: number;
}

// ─── AI Processing ────────────────────────────────────────────────────────────

export interface AIProcessingResult {
  summary: string;
  extractedDates: ExtractedDate[];
  extractedAmounts: ExtractedAmount[];
  actionItems: string[];
  suggestedCategory?: DocumentCategory;
  suggestedTags?: string[];
}

export interface AIProcessingStatus {
  documentId: string;
  status: 'idle' | 'processing' | 'done' | 'error';
  error?: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface ScheduledNotification {
  id: string;
  taskId: string;
  title: string;
  body: string;
  scheduledFor: string;
}

// ─── User / Settings ─────────────────────────────────────────────────────────

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  reminderLeadHours: number; // hours before due date
  defaultCurrency: string;
  aiProcessingEnabled: boolean;
  biometricLock: boolean;
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export type RootTabParamList = {
  Today: undefined;
  Documents: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  AddTask: { taskId?: string };
  AddDocument: { documentId?: string };
  DocumentDetail: { documentId: string };
  TaskDetail: { taskId: string };
  Onboarding: undefined;
};
