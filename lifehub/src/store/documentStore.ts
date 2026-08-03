import { create } from 'zustand';
import { StoredDocument, DocumentCategory, AIProcessingStatus } from '../types';
import { DUMMY_DOCUMENTS } from '../data/dummy';
import { storage } from '../services/storage';
import { processDocument } from '../services/ai';

interface DocumentStore {
  documents: StoredDocument[];
  processingStatus: Record<string, AIProcessingStatus>;
  isLoaded: boolean;

  loadDocuments: () => Promise<void>;
  persistDocuments: () => Promise<void>;

  addDocument: (doc: Omit<StoredDocument, 'id' | 'createdAt' | 'updatedAt'>) => Promise<StoredDocument>;
  updateDocument: (id: string, updates: Partial<StoredDocument>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;

  processWithAI: (id: string) => Promise<void>;

  getByCategory: (category: DocumentCategory) => StoredDocument[];
  searchDocuments: (query: string) => StoredDocument[];
}

function generateId() {
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: [],
  processingStatus: {},
  isLoaded: false,

  loadDocuments: async () => {
    const stored = await storage.documents.get();
    if (stored && stored.length > 0) {
      set({ documents: stored as StoredDocument[], isLoaded: true });
    } else {
      set({ documents: DUMMY_DOCUMENTS, isLoaded: true });
      await storage.documents.set(DUMMY_DOCUMENTS);
    }
  },

  persistDocuments: async () => {
    await storage.documents.set(get().documents);
  },

  addDocument: async (docData) => {
    const now = new Date().toISOString();
    const newDoc: StoredDocument = {
      ...docData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    set((s) => ({ documents: [newDoc, ...s.documents] }));
    await get().persistDocuments();
    return newDoc;
  },

  updateDocument: async (id, updates) => {
    set((s) => ({
      documents: s.documents.map((d) =>
        d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d,
      ),
    }));
    await get().persistDocuments();
  },

  deleteDocument: async (id) => {
    set((s) => ({ documents: s.documents.filter((d) => d.id !== id) }));
    await get().persistDocuments();
  },

  processWithAI: async (id) => {
    const doc = get().documents.find((d) => d.id === id);
    if (!doc) return;

    set((s) => ({
      processingStatus: {
        ...s.processingStatus,
        [id]: { documentId: id, status: 'processing' },
      },
    }));

    try {
      const result = await processDocument(doc.uri, doc.mimeType);
      await get().updateDocument(id, {
        aiSummary: result.summary,
        aiExtractedDates: result.extractedDates,
        aiExtractedAmounts: result.extractedAmounts,
        aiActionItems: result.actionItems,
      });
      set((s) => ({
        processingStatus: {
          ...s.processingStatus,
          [id]: { documentId: id, status: 'done' },
        },
      }));
    } catch (err) {
      set((s) => ({
        processingStatus: {
          ...s.processingStatus,
          [id]: { documentId: id, status: 'error', error: String(err) },
        },
      }));
    }
  },

  getByCategory: (category) =>
    get().documents.filter((d) => d.category === category),

  searchDocuments: (query) => {
    const q = query.toLowerCase();
    return get().documents.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.aiSummary?.toLowerCase().includes(q) ||
        d.tags?.some((t) => t.toLowerCase().includes(q)),
    );
  },
}));
