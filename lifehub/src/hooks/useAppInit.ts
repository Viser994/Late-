import { useEffect } from 'react';
import { useTaskStore } from '../store/taskStore';
import { useDocumentStore } from '../store/documentStore';
import { useSettingsStore } from '../store/settingsStore';

/**
 * Loads all persisted data when the app starts.
 * Returns true once all stores have initialised.
 */
export function useAppInit(): boolean {
  const { loadTasks, isLoaded: tasksLoaded } = useTaskStore();
  const { loadDocuments, isLoaded: docsLoaded } = useDocumentStore();
  const { loadSettings, isLoaded: settingsLoaded } = useSettingsStore();

  useEffect(() => {
    loadTasks();
    loadDocuments();
    loadSettings();
  }, []);

  return tasksLoaded && docsLoaded && settingsLoaded;
}
