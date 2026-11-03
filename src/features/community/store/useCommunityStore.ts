import { create } from 'zustand';
import {
  CommunityResource,
  CommunityFilterOptions,
  UploadFormData,
  UploadStatus,
  Contributor,
} from '../types/community.types';
import { MOCK_COMMUNITY_RESOURCES, MOCK_CONTRIBUTORS } from '../api/mockCommunityData';
import {
  fetchCommunityNotesApi,
  uploadCommunityNoteApi,
  toggleUsefulVoteApi,
  fetchContributorRewardProfileApi,
  ContributorRewardProfile,
} from '../api/communityApi';
import { useAuthStore } from '@/store';

interface CommunityState {
  resources: CommunityResource[];
  myUploads: CommunityResource[];
  contributors: Contributor[];
  filterOptions: CommunityFilterOptions;
  uploadDraft: UploadFormData;
  uploadStatus: UploadStatus;
  uploadProgressPercent: number;
  isLoading: boolean;
  rewardProfile: ContributorRewardProfile | null;

  // Actions
  fetchRewardProfile: (userId?: string) => Promise<void>;
  fetchCommunityResources: (silent?: boolean) => Promise<void>;
  setFilterOptions: (filters: Partial<CommunityFilterOptions>) => void;
  resetFilters: () => void;
  toggleUsefulVote: (resourceId: string) => void;
  submitRating: (resourceId: string, ratingValue: number) => void;
  
  // Upload Flow Actions
  setUploadDraft: (draft: Partial<UploadFormData>) => void;
  resetUploadDraft: () => void;
  startUploadProcess: (onComplete?: (newId: string) => void) => Promise<void>;
  
  // Selectors / Helpers
  getFilteredResources: () => CommunityResource[];
  getResourceById: (id: string) => CommunityResource | undefined;
  getContributorById: (id: string) => Contributor | undefined;
  getTrendingResources: () => CommunityResource[];
  getFeaturedResources: () => CommunityResource[];
}

const INITIAL_DRAFT: UploadFormData = {
  title: '',
  subjectCode: '21CS52',
  subjectName: 'Computer Networks & Security',
  branch: 'CSE',
  semester: 5,
  scheme: '2022',
  unitNumber: 1,
  resourceType: 'Handwritten Notes',
  description: '',
  tags: 'VTU, Handwritten, Notes',
};

export const useCommunityStore = create<CommunityState>((set, get) => ({
  resources: MOCK_COMMUNITY_RESOURCES,
  myUploads: [MOCK_COMMUNITY_RESOURCES[3]], // Initial user contribution
  contributors: MOCK_CONTRIBUTORS,
  isLoading: false,
  filterOptions: {
    searchQuery: '',
    selectedBranch: 'All',
    selectedSemester: 'All',
    selectedScheme: 'All',
    selectedSubject: 'All',
    selectedUnit: 'All',
    selectedResourceType: 'All',
    sortBy: 'Most Popular',
  },
  uploadDraft: INITIAL_DRAFT,
  uploadStatus: 'uploading',
  uploadProgressPercent: 0,
  rewardProfile: null,

  fetchRewardProfile: async (userId?: string) => {
    try {
      const profile = await fetchContributorRewardProfileApi(userId);
      set({ rewardProfile: profile });
    } catch {
      // Fallback
    }
  },

  fetchCommunityResources: async (silent = false) => {
    if (!silent) set({ isLoading: true });
    try {
      const { filterOptions } = get();
      const liveList = await fetchCommunityNotesApi({
        branchCode: filterOptions.selectedBranch,
        semester: filterOptions.selectedSemester === 'All' ? undefined : filterOptions.selectedSemester,
        schemeYear: filterOptions.selectedScheme,
        subjectCode: filterOptions.selectedSubject,
        search: filterOptions.searchQuery,
      });

      if (liveList && liveList.length > 0) {
        set({ resources: liveList, isLoading: false });
      } else {
        set({ isLoading: false });
      }
      get().fetchRewardProfile();
    } catch {
      set({ isLoading: false });
    }
  },

  setFilterOptions: (filters) => {
    set((state) => ({
      filterOptions: { ...state.filterOptions, ...filters },
    }));
    get().fetchCommunityResources(true);
  },

  resetFilters: () => {
    set({
      filterOptions: {
        searchQuery: '',
        selectedBranch: 'All',
        selectedSemester: 'All',
        selectedScheme: 'All',
        selectedSubject: 'All',
        selectedUnit: 'All',
        selectedResourceType: 'All',
        sortBy: 'Most Popular',
      },
    });
    get().fetchCommunityResources(true);
  },

  toggleUsefulVote: (resourceId) => {
    set((state) => ({
      resources: state.resources.map((res) => {
        if (res.id === resourceId) {
          const isVoted = res.isUsefulVoted;
          return {
            ...res,
            isUsefulVoted: !isVoted,
            usefulCount: isVoted ? res.usefulCount - 1 : res.usefulCount + 1,
          };
        }
        return res;
      }),
    }));
    toggleUsefulVoteApi(resourceId);
  },

  submitRating: (resourceId, ratingValue) => {
    set((state) => ({
      resources: state.resources.map((res) => {
        if (res.id === resourceId) {
          const newCount = res.ratingCount + 1;
          const newAvg = Math.round(((res.rating * res.ratingCount + ratingValue) / newCount) * 10) / 10;
          return {
            ...res,
            rating: newAvg,
            ratingCount: newCount,
          };
        }
        return res;
      }),
    }));
  },

  setUploadDraft: (draft) =>
    set((state) => ({
      uploadDraft: { ...state.uploadDraft, ...draft },
    })),

  resetUploadDraft: () => set({ uploadDraft: INITIAL_DRAFT }),

  startUploadProcess: async (onComplete) => {
    set({ uploadStatus: 'uploading', uploadProgressPercent: 20 });
    const draft = get().uploadDraft;
    const user = useAuthStore.getState().user;

    try {
      // Progress simulation for UI feedback
      setTimeout(() => {
        set({ uploadProgressPercent: 55 });
      }, 300);

      setTimeout(() => {
        set({ uploadStatus: 'processing', uploadProgressPercent: 85 });
      }, 700);

      // Real multipart API dispatch to backend POST /notes/upload
      const createdResource = await uploadCommunityNoteApi(draft, user);

      set((state) => ({
        uploadStatus: 'pending_review',
        uploadProgressPercent: 100,
        resources: [createdResource, ...state.resources],
        myUploads: [createdResource, ...state.myUploads],
      }));

      get().resetUploadDraft();
      get().fetchRewardProfile();
      if (onComplete) onComplete(createdResource.id);
    } catch (err: any) {
      console.warn('[CommunityStore] Real upload fallback to local pending:', err?.message);
      // Graceful offline fallback
      const fallbackId = `cr-user-${Date.now()}`;
      const fallbackResource: CommunityResource = {
        id: fallbackId,
        title: draft.title || 'Untitled Community Note',
        subjectCode: draft.subjectCode,
        subjectName: draft.subjectName,
        branch: draft.branch,
        semester: draft.semester,
        scheme: draft.scheme,
        unitNumber: draft.unitNumber,
        resourceType: draft.resourceType,
        fileSize: draft.fileSize || '3.5 MB',
        fileFormat: 'PDF',
        pageCount: draft.pageCount || 18,
        contributor: {
          id: user?.id || 'fardeen-khan',
          name: user?.name || 'Mohammed Fardeen',
          college: user?.college || 'Sai Vidya Institute of Technology',
          branch: draft.branch,
          semester: draft.semester,
          contributionsCount: 6,
          totalUpvotes: 310,
          reputationBadge: 'Star Scholar',
        },
        rating: 5.0,
        ratingCount: 1,
        usefulCount: 1,
        downloadsCount: 0,
        viewsCount: 1,
        isOfficial: false,
        isVerified: false,
        uploadStatus: 'pending_review',
        uploadedAt: 'Just now',
        description: draft.description || 'Uploaded via VTU Community Notes',
        tags: draft.tags.split(',').map((t) => t.trim()),
      };

      set((state) => ({
        uploadStatus: 'pending_review',
        uploadProgressPercent: 100,
        resources: [fallbackResource, ...state.resources],
        myUploads: [fallbackResource, ...state.myUploads],
      }));

      get().resetUploadDraft();
      if (onComplete) onComplete(fallbackId);
    }
  },

  getFilteredResources: () => {
    const { resources, filterOptions } = get();
    const {
      searchQuery,
      selectedBranch,
      selectedSemester,
      selectedScheme,
      selectedSubject,
      selectedUnit,
      selectedResourceType,
      sortBy,
    } = filterOptions;

    let list = resources.filter((res) => {
      if (selectedBranch !== 'All' && res.branch !== selectedBranch) return false;
      if (selectedSemester !== 'All' && res.semester !== selectedSemester) return false;
      if (selectedScheme !== 'All' && res.scheme !== selectedScheme) return false;
      if (selectedSubject !== 'All' && res.subjectCode !== selectedSubject) return false;
      if (selectedUnit !== 'All' && res.unitNumber !== selectedUnit) return false;
      if (selectedResourceType !== 'All' && res.resourceType !== selectedResourceType) return false;

      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase();
        const matchTitle = res.title.toLowerCase().includes(query);
        const matchSubject = res.subjectName.toLowerCase().includes(query) || res.subjectCode.toLowerCase().includes(query);
        const matchContributor = res.contributor.name.toLowerCase().includes(query);
        const matchTags = res.tags.some((t) => t.toLowerCase().includes(query));
        if (!matchTitle && !matchSubject && !matchContributor && !matchTags) return false;
      }

      return true;
    });

    switch (sortBy) {
      case 'Highest Rated':
        list = [...list].sort((a, b) => b.rating - a.rating);
        break;
      case 'Most Useful':
        list = [...list].sort((a, b) => b.usefulCount - a.usefulCount);
        break;
      case 'Recently Uploaded':
        list = [...list].sort((a, b) => b.id.localeCompare(a.id));
        break;
      case 'Most Popular':
      default:
        list = [...list].sort((a, b) => b.downloadsCount - a.downloadsCount);
        break;
    }

    return list;
  },

  getResourceById: (id) => {
    const { resources, myUploads } = get();
    return myUploads.find((r) => r.id === id) || resources.find((r) => r.id === id);
  },

  getContributorById: (id) => {
    const { contributors } = get();
    return contributors.find((c) => c.id === id);
  },

  getTrendingResources: () => {
    const { resources } = get();
    return [...resources].sort((a, b) => b.downloadsCount - a.downloadsCount).slice(0, 5);
  },

  getFeaturedResources: () => {
    const { resources } = get();
    return resources.filter((r) => r.rating >= 4.8).slice(0, 4);
  },
}));

