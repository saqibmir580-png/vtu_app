import { create } from 'zustand';
import {
  PassingPackage,
  PassingQuestion,
  RevisionResource,
  PackageFilterOptions,
} from '../types/passingPackages.types';
import { MOCK_PASSING_PACKAGES } from '../api/mockPassingPackages';
import { fetchPassingPackagesFromApi } from '../api/packagesApi';

interface PassingPackageStoreState {
  packages: PassingPackage[];
  isLoading: boolean;
  activeBranch: string;
  activeSemester: number;
  activeScheme: string;
  filterOptions: PackageFilterOptions;
  bookmarkedQuestionIds: string[];

  // Actions
  loadPackagesFromBackend: () => Promise<void>;
  setActiveBranch: (branch: string) => void;
  setActiveSemester: (sem: number) => void;
  setActiveScheme: (scheme: string) => void;
  setFilterOptions: (filters: Partial<PackageFilterOptions>) => void;
  resetFilters: () => void;
  toggleQuestionBookmark: (questionId: string) => void;
  
  // Selectors / Helpers
  getPackagesForCurrentStudent: () => PassingPackage[];
  getPackageById: (id: string) => PassingPackage | undefined;
  getQuestionById: (packageId: string, questionId: string) => { pkg: PassingPackage; question: PassingQuestion } | undefined;
  getRevisionResourceById: (packageId: string, resourceId: string) => { pkg: PassingPackage; resource: RevisionResource } | undefined;
}

export const usePassingPackageStore = create<PassingPackageStoreState>((set, get) => ({
  packages: MOCK_PASSING_PACKAGES,
  isLoading: false,
  activeBranch: 'CSE',
  activeSemester: 5,
  activeScheme: '2022',
  filterOptions: {
    selectedUnit: 'All',
    selectedPriority: 'All',
    selectedMarks: 'All',
    searchQuery: '',
  },
  bookmarkedQuestionIds: ['iq-cn-1', 'iq-cn-2', 'rq-cn-1'],

  loadPackagesFromBackend: async () => {
    set({ isLoading: true });
    try {
      const { activeBranch, activeSemester, activeScheme } = get();
      const livePackages = await fetchPassingPackagesFromApi({
        branchCode: activeBranch,
        semester: activeSemester,
        schemeYear: activeScheme,
      });

      if (livePackages && livePackages.length > 0) {
        set({ packages: livePackages, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  setActiveBranch: (branch) => {
    set({ activeBranch: branch });
    get().loadPackagesFromBackend();
  },
  setActiveSemester: (sem) => {
    set({ activeSemester: sem });
    get().loadPackagesFromBackend();
  },
  setActiveScheme: (scheme) => {
    set({ activeScheme: scheme });
    get().loadPackagesFromBackend();
  },

  setFilterOptions: (filters) =>
    set((state) => ({
      filterOptions: { ...state.filterOptions, ...filters },
    })),

  resetFilters: () =>
    set({
      filterOptions: {
        selectedUnit: 'All',
        selectedPriority: 'All',
        selectedMarks: 'All',
        searchQuery: '',
      },
    }),

  toggleQuestionBookmark: (questionId) => {
    set((state) => {
      const exists = state.bookmarkedQuestionIds.includes(questionId);
      const updated = exists
        ? state.bookmarkedQuestionIds.filter((id) => id !== questionId)
        : [...state.bookmarkedQuestionIds, questionId];
      return { bookmarkedQuestionIds: updated };
    });
  },

  getPackagesForCurrentStudent: () => {
    const { packages, activeBranch, activeSemester } = get();
    const filtered = packages.filter(
      (p) =>
        p.branch.toUpperCase() === activeBranch.toUpperCase() &&
        p.semester === activeSemester
    );
    return filtered.length > 0 ? filtered : packages;
  },

  getPackageById: (id) => {
    const { packages } = get();
    return packages.find((p) => p.id === id) || packages[0];
  },

  getQuestionById: (packageId, questionId) => {
    const pkg = get().getPackageById(packageId);
    if (!pkg) return undefined;
    const allQuestions = [
      ...pkg.importantQuestions,
      ...pkg.repeatedQuestions,
      ...pkg.expectedQuestions,
      ...pkg.nightBeforeSequence,
    ];
    const question = allQuestions.find((q) => q.id === questionId);
    return question ? { pkg, question } : undefined;
  },

  getRevisionResourceById: (packageId, resourceId) => {
    const pkg = get().getPackageById(packageId);
    if (!pkg) return undefined;
    const resource = pkg.revisionResources.find((r) => r.id === resourceId);
    return resource ? { pkg, resource } : undefined;
  },
}));
