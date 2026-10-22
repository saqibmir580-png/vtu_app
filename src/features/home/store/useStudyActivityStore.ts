import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StudyHistory } from '../types/home.types';

const STORAGE_KEY = 'vtu_mobile_study_history';

interface StudyActivityStoreState {
  recentActivity: StudyHistory | null;
  historyList: StudyHistory[];
  isLoaded: boolean;

  // Actions
  recordActivity: (activity: {
    resourceId: string;
    subject: string;
    unit: string;
    resourceTitle: string;
    progress: number;
    lastOpenedTime?: string;
  }) => Promise<void>;
  loadHistory: () => Promise<void>;
  clearHistory: () => Promise<void>;
}

export const useStudyActivityStore = create<StudyActivityStoreState>((set, get) => ({
  recentActivity: {
    id: '1',
    subject: 'Data Structures & Algorithms',
    unit: 'Unit 3',
    resourceTitle: 'Stacks & Queues Notes',
    progress: 68,
    lastOpenedTime: 'Recently',
    resourceId: '1',
  },
  historyList: [],
  isLoaded: false,

  recordActivity: async (data) => {
    const newEntry: StudyHistory = {
      id: `study-${data.resourceId}`,
      subject: data.subject || 'Engineering Subject',
      unit: data.unit || 'Module Notes',
      resourceTitle: data.resourceTitle || 'VTU Subject Notes',
      progress: Math.min(100, Math.max(5, Math.round(data.progress))),
      lastOpenedTime: data.lastOpenedTime || 'Just now',
      resourceId: data.resourceId,
    };

    const currentList = get().historyList.filter((item) => item.resourceId !== data.resourceId);
    const updatedList = [newEntry, ...currentList].slice(0, 10);

    set({
      recentActivity: newEntry,
      historyList: updatedList,
    });

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    } catch (err) {
      console.warn('[useStudyActivityStore] Failed to persist study history', err);
    }
  },

  loadHistory: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: StudyHistory[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          set({
            recentActivity: parsed[0],
            historyList: parsed,
            isLoaded: true,
          });
          return;
        }
      }
    } catch (err) {
      console.warn('[useStudyActivityStore] Error reading study history', err);
    }
    set({ isLoaded: true });
  },

  clearHistory: async () => {
    set({ recentActivity: null, historyList: [] });
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  },
}));
