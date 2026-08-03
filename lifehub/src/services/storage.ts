/**
 * Storage Service
 *
 * Thin wrapper around AsyncStorage. All data is stored as JSON strings.
 * In a production app, migrate to SQLite (expo-sqlite) or a cloud backend.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TASKS: '@lifehub:tasks',
  DOCUMENTS: '@lifehub:documents',
  SETTINGS: '@lifehub:settings',
  USER: '@lifehub:user',
  ONBOARDED: '@lifehub:onboarded',
} as const;

// ─── Generic helpers ──────────────────────────────────────────────────────────

async function get<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

async function set<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

async function remove(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const storage = {
  tasks: {
    get: () => get<object[]>(KEYS.TASKS),
    set: (v: object[]) => set(KEYS.TASKS, v),
  },
  documents: {
    get: () => get<object[]>(KEYS.DOCUMENTS),
    set: (v: object[]) => set(KEYS.DOCUMENTS, v),
  },
  settings: {
    get: () => get<object>(KEYS.SETTINGS),
    set: (v: object) => set(KEYS.SETTINGS, v),
  },
  user: {
    get: () => get<object>(KEYS.USER),
    set: (v: object) => set(KEYS.USER, v),
  },
  onboarded: {
    get: () => get<boolean>(KEYS.ONBOARDED),
    set: (v: boolean) => set(KEYS.ONBOARDED, v),
  },
  clearAll: async () => {
    for (const key of Object.values(KEYS)) {
      await AsyncStorage.removeItem(key);
    }
  },
};
