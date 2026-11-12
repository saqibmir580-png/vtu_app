import { create } from 'zustand';
import { QuestionPaper, PaperFilterState, DownloadProgress } from '../types/paper.types';
import { MOCK_PAPERS } from '../api/mockPapers';
import { fetchQuestionPapersApi, incrementPaperDownloadApi } from '../api/papersApi';
import {
  fetchEngineeringBranches,
  fetchAcademicSchemes,
  fetchAcademicSemesters,
} from '../../onboarding/apifunction/apiFunction';

interface PaperStoreState {
  papers: QuestionPaper[];
  isLoading: boolean;

  // Dynamic Master Lists
  schemesList: string[];
  branchesList: string[];
  semestersList: string[];
  yearsList: string[];
  paperTypesList: string[];

  bookmarkedIds: string[];
  downloadedIds: string[];
  downloadProgressMap: Record<string, DownloadProgress>;
  activeFilters: PaperFilterState;
  activeTab: 'All' | 'Downloaded' | 'Bookmarked';

  // Actions
  loadPapersFromBackend: () => Promise<void>;
  fetchMasterDataFromBackend: () => Promise<void>;
  setFilters: (filters: Partial<PaperFilterState>) => void;
  resetFilters: (userProfileDefaults?: { branch?: string; semester?: number; scheme?: string }) => void;
  toggleBookmark: (paperId: string) => void;
  startDownload: (paperId: string) => void;
  removeDownload: (paperId: string) => void;
  setActiveTab: (tab: 'All' | 'Downloaded' | 'Bookmarked') => void;
  incrementViewCount: (paperId: string) => void;
  initFiltersFromProfile: (profile: { branch?: string; semester?: number; scheme?: string }) => void;
  getFilteredPapers: () => QuestionPaper[];
}

const DEFAULT_FILTERS: PaperFilterState = {
  scheme: 'All',
  branch: 'All',
  semester: 'All',
  subject: 'All',
  year: 'All',
  paperType: 'All',
  searchQuery: '',
};

export const usePaperStore = create<PaperStoreState>((set, get) => ({
  papers: [],
  isLoading: false,

  // Master Data Initial Defaults (Will be updated dynamically from backend)
  schemesList: ['All', '2025', '2022', '2021', '2018'],
  branchesList: ['All', 'CSE', 'ECE', 'ISE', 'AIML', 'EEE', 'ME', 'CV'],
  semestersList: ['All', '1', '2', '3', '4', '5', '6', '7', '8'],
  yearsList: ['All', '2026', '2025', '2024', '2023', '2022'],
  paperTypesList: ['All', 'SEE_THEORY', 'Regular', 'Makeup', 'Model', 'IA_1', 'IA_2'],

  bookmarkedIds: [],
  downloadedIds: [],
  downloadProgressMap: {},
  activeFilters: DEFAULT_FILTERS,
  activeTab: 'All',

  fetchMasterDataFromBackend: async () => {
    try {
      const [bRes, sRes, semRes] = await Promise.all([
        fetchEngineeringBranches(),
        fetchAcademicSchemes(),
        fetchAcademicSemesters(),
      ]);

      const branches = ['All', ...new Set(bRes.map((b) => b.code || b.name))];
      const schemes = ['All', ...new Set(sRes.map((s) => s.schemeYear || s.name?.match(/\d{4}/)?.[0] || '2022'))];
      const sems = [
        'All',
        ...new Set(
          semRes.map((sem) => String(sem.number ?? sem.id)).filter(Boolean)
        ),
      ].sort((a, b) => (a === 'All' ? -1 : b === 'All' ? 1 : Number(a) - Number(b)));

      set((state) => ({
        branchesList: branches.length > 1 ? branches : state.branchesList,
        schemesList: schemes.length > 1 ? schemes : state.schemesList,
        semestersList: sems.length > 1 ? sems : state.semestersList,
      }));
    } catch {
      // Retain defaults gracefully
    }
  },

  loadPapersFromBackend: async () => {
    set({ isLoading: true });
    try {
      // Trigger dynamic master data fetch simultaneously
      get().fetchMasterDataFromBackend();

      const fetched = await fetchQuestionPapersApi();
      if (fetched && fetched.length > 0) {
        // Derive dynamic years and paper types from loaded papers
        const derivedYears = ['All', ...new Set(fetched.map((p) => p.year).filter(Boolean))].sort().reverse();
        const derivedTypes = ['All', ...new Set(fetched.map((p) => p.paperType).filter(Boolean))];

        set((state) => ({
          papers: fetched,
          isLoading: false,
          yearsList: derivedYears.length > 1 ? derivedYears : state.yearsList,
          paperTypesList: derivedTypes.length > 1 ? derivedTypes : state.paperTypesList,
        }));
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  setFilters: (newFilters) =>
    set((state) => ({
      activeFilters: { ...state.activeFilters, ...newFilters },
    })),

  resetFilters: (userProfileDefaults) =>
    set(() => ({
      activeFilters: {
        ...DEFAULT_FILTERS,
        branch: userProfileDefaults?.branch || 'All',
        semester: userProfileDefaults?.semester ? String(userProfileDefaults.semester) : 'All',
        scheme: userProfileDefaults?.scheme || 'All',
      },
    })),

  initFiltersFromProfile: (profile) => {
    const current = get().activeFilters;
    if (current.branch === 'All' && current.semester === 'All' && current.scheme === 'All') {
      set({
        activeFilters: {
          ...current,
          branch: profile.branch || 'CSE',
          semester: profile.semester ? String(profile.semester) : '5',
          scheme: profile.scheme || '2021',
        },
      });
    }
    // Fetch live backend question papers & master data
    get().loadPapersFromBackend();
  },

  toggleBookmark: (paperId) =>
    set((state) => {
      const exists = state.bookmarkedIds.includes(paperId);
      const updated = exists
        ? state.bookmarkedIds.filter((id) => id !== paperId)
        : [...state.bookmarkedIds, paperId];
      return { bookmarkedIds: updated };
    }),

  startDownload: (paperId) => {
    const state = get();
    if (state.downloadedIds.includes(paperId)) return;

    incrementPaperDownloadApi(paperId);

    set((s) => ({
      downloadProgressMap: {
        ...s.downloadProgressMap,
        [paperId]: {
          paperId,
          progress: 10,
          downloadedBytes: 250000,
          totalBytes: 2500000,
          isCompleted: false,
          isError: false,
        },
      },
    }));

    let currentProgress = 10;
    const interval = setInterval(() => {
      currentProgress += 25;
      if (currentProgress >= 100) {
        clearInterval(interval);
        set((s) => ({
          downloadedIds: [...new Set([...s.downloadedIds, paperId])],
          downloadProgressMap: {
            ...s.downloadProgressMap,
            [paperId]: {
              paperId,
              progress: 100,
              downloadedBytes: 2500000,
              totalBytes: 2500000,
              isCompleted: true,
              isError: false,
            },
          },
        }));
      } else {
        set((s) => ({
          downloadProgressMap: {
            ...s.downloadProgressMap,
            [paperId]: {
              paperId,
              progress: currentProgress,
              downloadedBytes: Math.round((currentProgress / 100) * 2500000),
              totalBytes: 2500000,
              isCompleted: false,
              isError: false,
            },
          },
        }));
      }
    }, 300);
  },

  removeDownload: (paperId) =>
    set((state) => {
      const newMap = { ...state.downloadProgressMap };
      delete newMap[paperId];
      return {
        downloadedIds: state.downloadedIds.filter((id) => id !== paperId),
        downloadProgressMap: newMap,
      };
    }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  incrementViewCount: (paperId) =>
    set((state) => ({
      papers: state.papers.map((p) =>
        p.id === paperId ? { ...p, viewsCount: (p.viewsCount || 0) + 1 } : p
      ),
    })),

  getFilteredPapers: () => {
    const { papers, activeFilters, bookmarkedIds, downloadedIds, activeTab } = get();

    return papers.filter((paper) => {
      // Tab filter
      if (activeTab === 'Downloaded' && !downloadedIds.includes(paper.id)) return false;
      if (activeTab === 'Bookmarked' && !bookmarkedIds.includes(paper.id)) return false;

      // Scheme
      if (activeFilters.scheme !== 'All' && paper.scheme !== activeFilters.scheme) return false;

      // Branch
      if (activeFilters.branch !== 'All' && paper.branch !== activeFilters.branch) return false;

      // Semester
      if (
        activeFilters.semester !== 'All' &&
        String(paper.semester) !== String(activeFilters.semester)
      ) {
        return false;
      }

      // Year
      if (activeFilters.year !== 'All' && paper.year !== activeFilters.year) return false;

      // Paper Type
      if (
        activeFilters.paperType !== 'All' &&
        paper.paperType.toLowerCase() !== activeFilters.paperType.toLowerCase()
      ) {
        return false;
      }

      // Search Query
      if (activeFilters.searchQuery.trim() !== '') {
        const query = activeFilters.searchQuery.toLowerCase();
        const matchName = (paper.subjectName || '').toLowerCase().includes(query);
        const matchCode = (paper.subjectCode || '').toLowerCase().includes(query);
        const matchBranch = (paper.branch || '').toLowerCase().includes(query);
        const matchYear = (paper.year || '').toLowerCase().includes(query);
        const matchTitle = (paper.title || '').toLowerCase().includes(query);
        if (!matchName && !matchCode && !matchBranch && !matchYear && !matchTitle) return false;
      }

      return true;
    });
  },
}));
