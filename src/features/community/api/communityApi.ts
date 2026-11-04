import { apiClient } from '../../../infrastructure/api/client';
import { CommunityResource, Contributor, UploadFormData, ResourceType } from '../types/community.types';
import { MOCK_COMMUNITY_RESOURCES, MOCK_CONTRIBUTORS } from './mockCommunityData';

export interface QueryCommunityParams {
  branchCode?: string;
  schemeYear?: string;
  semester?: number;
  subjectCode?: string;
  search?: string;
  page?: number;
  limit?: number;
}

const extractNotesList = (response: any): any[] => {
  if (!response) return [];
  let d = response.data !== undefined ? response.data : response;
  if (Array.isArray(d)) return d;
  if (d.items && Array.isArray(d.items)) return d.items;
  if (d.data && Array.isArray(d.data)) return d.data;
  if (d.data) {
    if (d.data.data && Array.isArray(d.data.data)) return d.data.data;
    if (d.data.items && Array.isArray(d.data.items)) return d.data.items;
  }
  return [];
};

export const mapBackendNoteToCommunityResource = (n: any): CommunityResource => {
  const contributor: Contributor = {
    id: n.authorId || n.authorUsn || 'student-peer',
    name: n.authorName || 'Student Peer',
    college: n.authorCollege || 'VTU Affiliated College',
    branch: n.branchCode || 'CSE',
    semester: n.semester || 5,
    avatarUrl: n.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    contributionsCount: n.contributionsCount || 5,
    totalUpvotes: n.bookmarks ? n.bookmarks * 3 : 150,
    reputationBadge:
      n.authorRole === 'TOPPER_STUDENT'
        ? 'VTU Top Contributor'
        : n.authorRole === 'FACULTY' || n.authorRole === 'ADMIN'
        ? 'Star Scholar'
        : 'Verified Peer',
  };

  const resourceType: ResourceType =
    n.format === 'HANDWRITTEN'
      ? 'Handwritten Notes'
      : n.title?.toLowerCase().includes('formula')
      ? 'Formula Sheet'
      : n.title?.toLowerCase().includes('solved') || n.title?.toLowerCase().includes('question')
      ? 'Solved Question Bank'
      : 'Typed PDF';

  const uploadStatus =
    n.status === 'PUBLISHED'
      ? 'published'
      : n.status === 'REJECTED'
      ? 'rejected'
      : 'pending_review';

  return {
    id: n.id,
    title: n.title,
    subjectCode: n.subjectCode || '21CS51',
    subjectName: n.subjectName || 'VTU Subject',
    branch: n.branchCode || 'CSE',
    semester: n.semester || 5,
    scheme: n.schemeYear || '2022',
    unitNumber: n.unitNumber || (n.moduleNumber ? Number(n.moduleNumber) : 1),
    resourceType,
    fileSize: n.fileSize || '3.2 MB',
    fileFormat: n.format || 'PDF',
    pageCount: n.pageCount || 16,
    contributor,
    rating: 4.8,
    ratingCount: n.views ? Math.max(1, Math.round(n.views / 20)) : 42,
    usefulCount: n.bookmarks || 89,
    downloadsCount: n.downloads || 120,
    viewsCount: n.views || 340,
    isOfficial: n.authorRole === 'ADMIN' || n.authorRole === 'FACULTY',
    isVerified: true,
    uploadStatus,
    uploadedAt: n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Recently',
    description: n.description || 'Comprehensive lecture notes prepared according to VTU curriculum.',
    tags: [n.branchCode || 'CSE', n.subjectCode || 'VTU', n.schemeYear ? `${n.schemeYear} Scheme` : '2022 Scheme'],
    previewPages: [
      `Page 1: ${n.title} Overview`,
      'Page 2: Key Concepts & Theory',
      'Page 3: Important Formulas & Solved Problems',
    ],
  };
};

export const fetchCommunityNotesApi = async (
  params: QueryCommunityParams = {}
): Promise<CommunityResource[]> => {
  try {
    const queryParams: any = {
      limit: params.limit || 50,
      status: 'PUBLISHED',
    };
    if (params.branchCode && params.branchCode !== 'All') queryParams.branchCode = params.branchCode;
    if (params.schemeYear && params.schemeYear !== 'All') queryParams.schemeYear = params.schemeYear;
    if (params.semester && String(params.semester) !== 'All') queryParams.semester = params.semester;
    if (params.subjectCode && params.subjectCode !== 'All') queryParams.subjectCode = params.subjectCode;
    if (params.search) queryParams.search = params.search;

    const res: any = await apiClient.get('/notes', { params: queryParams });
    const rawList = extractNotesList(res);

    if (rawList.length > 0) {
      return rawList.map(mapBackendNoteToCommunityResource);
    }
    return MOCK_COMMUNITY_RESOURCES;
  } catch (err: any) {
    console.warn('[communityApi] fetchCommunityNotesApi fallback to mock:', err?.message);
    return MOCK_COMMUNITY_RESOURCES;
  }
};

export const fetchMyContributionsApi = async (
  authorId?: string
): Promise<CommunityResource[]> => {
  try {
    const res: any = await apiClient.get('/notes', {
      params: {
        limit: 50,
        ...(authorId ? { authorId } : {}),
      },
    });
    const rawList = extractNotesList(res);
    if (rawList.length > 0) {
      return rawList.map(mapBackendNoteToCommunityResource);
    }
    return [];
  } catch (err: any) {
    console.warn('[communityApi] fetchMyContributionsApi fallback:', err?.message);
    return [];
  }
};

export const uploadCommunityNoteApi = async (
  draft: UploadFormData,
  user?: any
): Promise<CommunityResource> => {
  const formData = new FormData();

  if (draft.fileUri) {
    const fileName = draft.fileName || 'vtu_notes.pdf';
    // Append binary file payload for React Native multipart upload
    (formData as any).append('file', {
      uri: draft.fileUri,
      name: fileName,
      type: 'application/pdf',
    });
  }

  formData.append('title', draft.title.trim());
  formData.append('description', draft.description?.trim() || `VTU Community Notes for ${draft.subjectCode}`);
  formData.append('subjectCode', draft.subjectCode);
  formData.append('subjectName', draft.subjectName);
  formData.append('branchCode', draft.branch);
  formData.append('schemeYear', draft.scheme);
  formData.append('semester', String(draft.semester));
  if (draft.unitNumber) formData.append('unitNumber', String(draft.unitNumber));
  formData.append('authorName', user?.name || user?.email?.split('@')[0] || 'Student Contributor');
  formData.append('authorRole', 'STUDENT');
  if (user?.studentProfile?.usn || user?.usn) {
    formData.append('authorUsn', user?.studentProfile?.usn || user?.usn);
  }
  if (user?.id) {
    formData.append('authorId', user.id);
  }
  formData.append('status', 'PENDING_REVIEW');
  formData.append('format', draft.resourceType === 'Handwritten Notes' ? 'HANDWRITTEN' : 'PDF');

  const res: any = await apiClient.post('/notes/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  const created = res.data?.data || res.data || res;
  return mapBackendNoteToCommunityResource(created);
};

export const toggleUsefulVoteApi = async (noteId: string): Promise<void> => {
  try {
    await apiClient.post(`/notes/${noteId}/upvote`);
  } catch {
    try {
      await apiClient.post(`/notes/${noteId}/download`);
    } catch {
      // Graceful offline fallback
    }
  }
};

export const submitRatingApi = async (noteId: string, rating: number): Promise<void> => {
  try {
    await apiClient.post(`/notes/${noteId}/rate`, { rating });
  } catch {
    // Graceful offline fallback
  }
};


export interface ContributorRewardProfile {
  id: string;
  name: string;
  usn: string;
  email: string;
  branch: string;
  semester: number;
  college: string;
  coinsBalance: number;
  totalXp: number;
  level: number;
  levelTitle: string;
  nextLevelXp: number;
  badges: string[];
  uploadCount: number;
  publishedCount: number;
  downloadsCount: number;
  usefulVotes: number;
  reputationScore: number;
}

export const fetchContributorRewardProfileApi = async (
  userId?: string
): Promise<ContributorRewardProfile> => {
  try {
    const endpoint = userId ? `/rewards/profile/${userId}` : '/rewards/me';
    const res: any = await apiClient.get(endpoint);
    const data = res.data?.data || res.data || res;
    if (data && data.coinsBalance !== undefined) {
      return data;
    }
  } catch (err: any) {
    console.warn('[communityApi] fetchContributorRewardProfileApi fallback:', err?.message);
  }

  return {
    id: userId || 'usr-101',
    name: 'Student Contributor',
    usn: '1VA21CS042',
    email: 'contributor@vtu.ac.in',
    branch: 'CSE',
    semester: 5,
    college: 'Visvesvaraya Academy (1VA)',
    coinsBalance: 350,
    totalXp: 750,
    level: 3,
    levelTitle: 'Community Scholar',
    nextLevelXp: 900,
    badges: ['Verified Contributor', 'Top Note Creator', 'Community Pillar'],
    uploadCount: 5,
    publishedCount: 4,
    downloadsCount: 380,
    usefulVotes: 64,
    reputationScore: 92,
  };
};
