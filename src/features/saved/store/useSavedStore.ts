import { create } from 'zustand';
import { SavedItem, SavedTab, StorageSummary } from '../types/saved.types';

interface SavedStoreState {
  items: SavedItem[];
  activeTab: SavedTab;
  activeCategory: 'All' | 'Notes' | 'Question Papers';
  searchQuery: string;
  isOfflineMode: boolean;

  // Actions
  setActiveTab: (tab: SavedTab) => void;
  setActiveCategory: (category: 'All' | 'Notes' | 'Question Papers') => void;
  setSearchQuery: (query: string) => void;
  toggleOfflineMode: () => void;
  toggleBookmark: (id: string) => void;
  toggleDownload: (id: string) => void;
  removeItem: (id: string) => void;
  clearOfflineStorage: () => void;
  getFilteredItems: () => SavedItem[];
  getStorageSummary: () => StorageSummary;
}

export const useSavedStore = create<SavedStoreState>((set, get) => ({
  items: [],
  activeTab: 'All',
  activeCategory: 'All',
  searchQuery: '',
  isOfflineMode: false,

  setActiveTab: (tab) => set({ activeTab: tab }),

  setActiveCategory: (category) => set({ activeCategory: category }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  toggleOfflineMode: () => set((state) => ({ isOfflineMode: !state.isOfflineMode })),

  toggleBookmark: (id) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, isBookmarked: !item.isBookmarked } : item
      ),
    })),

  toggleDownload: (id) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id
          ? {
              ...item,
              isDownloaded: !item.isDownloaded,
              downloadedAt: !item.isDownloaded ? 'Just now' : undefined,
            }
          : item
      ),
    })),

  removeItem: (id) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, isDownloaded: false, isBookmarked: false } : item
      ),
    })),

  clearOfflineStorage: () =>
    set((state) => ({
      items: state.items.map((item) => ({ ...item, isDownloaded: false })),
    })),

  getFilteredItems: () => {
    const { items, activeTab, activeCategory, searchQuery } = get();

    return items.filter((item) => {
      // Must be either downloaded or bookmarked
      if (!item.isDownloaded && !item.isBookmarked) return false;

      // Active Tab filter
      if (activeTab === 'Downloaded' && !item.isDownloaded) return false;
      if (activeTab === 'Bookmarked' && !item.isBookmarked) return false;

      // Category filter
      if (activeCategory === 'Notes' && item.type !== 'Note') return false;
      if (activeCategory === 'Question Papers' && item.type !== 'QuestionPaper') return false;

      // Search Query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchCode = item.subjectCode.toLowerCase().includes(query);
        const matchName = item.subjectName.toLowerCase().includes(query);
        if (!matchTitle && !matchCode && !matchName) return false;
      }

      return true;
    });
  },

  getStorageSummary: () => {
    const { items } = get();
    const downloadedItems = items.filter((i) => i.isDownloaded);
    const bookmarkedItems = items.filter((i) => i.isBookmarked);

    const totalUsedBytes = downloadedItems.reduce((acc, curr) => acc + curr.fileSizeBytes, 0);
    const totalUsedMb = Math.round((totalUsedBytes / (1024 * 1024)) * 10) / 10;

    return {
      totalUsedBytes,
      totalUsedMb,
      downloadedCount: downloadedItems.length,
      bookmarkedCount: bookmarkedItems.length,
      maxStorageMb: 500, // 500 MB simulated local cache limit
    };
  },
}));
