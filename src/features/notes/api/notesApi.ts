import { apiClient } from '../../../infrastructure/api/client';
import { Subject, NoteResource, ResourceType } from '../types/notes.types';
import { MOCK_SUBJECTS, MOCK_RESOURCES } from './notesData';

export interface QueryNotesParams {
  semester?: number;
  branchCode?: string;
  schemeYear?: string;
  subjectCode?: string;
  search?: string;
  format?: string;
  page?: number;
  limit?: number;
  userId?: string;
}

const normalizeBranch = (branch?: string): string | undefined => {
  if (!branch) return undefined;
  const b = branch.toUpperCase();
  if (b.includes('COMPUTER') || b.includes('CSE') || b === 'CS') return 'CSE';
  if (b.includes('ELECTRONICS') || b.includes('ECE')) return 'ECE';
  if (b.includes('INFORMATION') || b.includes('ISE')) return 'ISE';
  if (b.includes('MECHANICAL') || b.includes('ME')) return 'ME';
  if (b.includes('CIVIL') || b.includes('CV')) return 'CV';
  return branch;
};

const normalizeScheme = (scheme?: string): string | undefined => {
  if (!scheme) return undefined;
  const match = scheme.match(/\d{4}/);
  return match ? match[0] : scheme;
};

const mapFormatToResourceType = (format?: string, title: string = ''): ResourceType => {
  const fmt = (format || '').toUpperCase();
  const t = title.toLowerCase();
  if (fmt === 'HANDWRITTEN' || t.includes('handwritten')) return 'Handwritten Notes';
  if (fmt === 'SHORT_NOTES' || t.includes('short')) return 'Short Notes';
  if (fmt === 'REVISION_NOTES' || t.includes('revision')) return 'Revision Notes';
  if (fmt === 'PPT') return 'PPT';
  return 'Typed Notes';
};

const extractNotesList = (response: any): any[] => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.items)) return response.items;
  if (Array.isArray(response.data)) return response.data;
  if (response.data && Array.isArray(response.data.items)) return response.data.items;
  if (response.data && Array.isArray(response.data.data)) return response.data.data;
  return [];
};

const extractSingleNote = (response: any): any => {
  if (!response) return null;
  if (response.id) return response;
  if (response.data && response.data.id) return response.data;
  if (response.data && response.data.data && response.data.data.id) return response.data.data;
  return null;
};

export const fetchNotesFromApi = async (params: QueryNotesParams = {}): Promise<NoteResource[]> => {
  try {
    const queryParams: any = {};
    if (params.semester) queryParams.semester = params.semester;
    if (params.branchCode) queryParams.branchCode = normalizeBranch(params.branchCode);
    if (params.schemeYear) queryParams.schemeYear = normalizeScheme(params.schemeYear);
    if (params.subjectCode) queryParams.subjectCode = params.subjectCode;
    if (params.search) queryParams.search = params.search;
    if (params.format) queryParams.format = params.format;
    if (params.userId) queryParams.userId = params.userId;

    let response: any = await apiClient.get('/notes', { params: queryParams });
    let rawNotes = extractNotesList(response);

    // Fallback 1: Query by semester if specific branch/scheme combo returned empty
    if (rawNotes.length === 0 && params.semester) {
      response = await apiClient.get('/notes', {
        params: { semester: params.semester, ...(params.userId ? { userId: params.userId } : {}) },
      });
      rawNotes = extractNotesList(response);
    }

    // Fallback 2: Fetch all top published notes without any filter
    if (rawNotes.length === 0) {
      response = await apiClient.get('/notes', {
        params: params.userId ? { userId: params.userId } : {},
      });
      rawNotes = extractNotesList(response);
    }

    if (rawNotes.length === 0) {
      return MOCK_RESOURCES;
    }

    return rawNotes.map((note: any): NoteResource => {
      const isPaid = Boolean(note.isPaid && (note.price && note.price > 0));
      const isPurchased = isPaid ? Boolean(note.isPurchased) : false;
      const hasAccess = !isPaid || isPurchased;

      return {
        id: note.id,
        title: note.title,
        subjectId: note.courseId || note.subjectId || 's-1',
        subjectName: note.subjectName || 'Computer Networks',
        subjectCode: note.subjectCode || '21CS52',
        unitNumber: note.unitNumber || 1,
        unitTitle: note.unitTitle || 'Module Notes',
        type: mapFormatToResourceType(note.format, note.title),
        fileFormat: 'PDF',
        fileSize: note.fileSize || '2.4 MB',
        author: note.authorName || 'VTU Faculty Panel',
        downloadsCount: note.downloads || note.downloadCount || note.downloadsCount || 0,
        isBookmarked: false,
        isDownloaded: false,
        description: note.description || '',
        totalPages: (note.pageCount && Number(note.pageCount) > 1) ? Number(note.pageCount) : 15,
        isPaid,
        price: note.price || 0,
        freePreviewPages: note.freePreviewPages || 2,
        isPurchased,
        hasAccess,
        fileUrl: note.fileUrl || note.secureUrl || '',
      };
    });
  } catch (error: any) {
    console.warn('[fetchNotesFromApi Fallback]:', error?.message || error);
    return MOCK_RESOURCES;
  }
};

export const fetchNoteByIdFromApi = async (id: string, userId?: string): Promise<NoteResource | null> => {
  const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);

  if (!isUuid) {
    const allNotes = await fetchNotesFromApi({ userId });
    const found = allNotes.find((r) => r.id === id) || allNotes[0];
    return found || null;
  }

  try {
    const response: any = await apiClient.get(`/notes/${id}`, {
      params: userId ? { userId } : {},
    });
    const note = extractSingleNote(response);

    if (!note || !note.id) {
      const allNotes = await fetchNotesFromApi({ userId });
      return allNotes[0] || null;
    }

    const isPaid = Boolean(note.isPaid && (note.price && note.price > 0));
    const isPurchased = isPaid ? Boolean(note.isPurchased) : false;
    const hasAccess = !isPaid || isPurchased;

    return {
      id: note.id,
      title: note.title,
      subjectId: note.courseId || note.subjectId || 's-1',
      subjectName: note.subjectName || 'Computer Networks',
      subjectCode: note.subjectCode || '21CS52',
      unitNumber: note.unitNumber || 1,
      unitTitle: note.unitTitle || 'Module Notes',
      type: mapFormatToResourceType(note.format, note.title),
      fileFormat: 'PDF',
      fileSize: note.fileSize || '2.4 MB',
      author: note.authorName || 'VTU Faculty Panel',
      downloadsCount: note.downloads || note.downloadCount || note.downloadsCount || 0,
      isBookmarked: false,
      isDownloaded: false,
      description: note.description || '',
      totalPages: (note.pageCount && Number(note.pageCount) > 1) ? Number(note.pageCount) : 15,
      isPaid,
      price: note.price || 0,
      freePreviewPages: note.freePreviewPages !== undefined ? Number(note.freePreviewPages) : 2,
      isPurchased,
      hasAccess,
      fileUrl: note.fileUrl || note.secureUrl || '',
    };
  } catch (error: any) {
    const allNotes = await fetchNotesFromApi({ userId });
    return allNotes[0] || null;
  }
};

export const checkNoteAccessFromApi = async (
  noteId: string,
  userId?: string,
): Promise<{ hasAccess: boolean; isPaid: boolean; freePreviewPages: number; price: number } | null> => {
  const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(noteId);
  if (!isUuid) return null;

  try {
    const response: any = await apiClient.get(`/orders/check-access/${noteId}`, {
      params: userId ? { userId } : {},
    });
    const payload = response.data?.data || response.data || response;
    return {
      hasAccess: Boolean(payload.hasAccess),
      isPaid: Boolean(payload.isPaid),
      freePreviewPages: payload.freePreviewPages ?? 2,
      price: payload.price ?? 0,
    };
  } catch (error) {
    console.warn('[checkNoteAccessFromApi Error]:', error);
    return null;
  }
};

export const purchaseNoteFromApi = async (noteId: string, amount?: number): Promise<{ success: boolean; hasAccess: boolean } | null> => {
  const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(noteId);
  if (!isUuid) {
    // Mock purchase fallback for non-UUID / demo IDs
    return { success: true, hasAccess: true };
  }

  try {
    const response: any = await apiClient.post('/orders/checkout', { noteId, amount });
    const payload = response.data || response;
    return {
      success: Boolean(payload.success),
      hasAccess: Boolean(payload.hasAccess),
    };
  } catch (error) {
    console.warn('[purchaseNoteFromApi Error]:', error);
    return null;
  }
};

export const createRazorpayOrderFromApi = async (noteId: string, userId?: string) => {
  try {
    const response: any = await apiClient.post('/orders/razorpay/create-order', {
      noteId,
      userId,
    });
    const body = response.data || response;
    const orderData = body.data || body;
    return {
      success: Boolean(body.success || orderData.success),
      alreadyPurchased: Boolean(body.alreadyPurchased || orderData.alreadyPurchased),
      orderId: orderData.orderId || body.orderId,
      amount: orderData.amount || body.amount,
      currency: orderData.currency || body.currency || 'INR',
      keyId: orderData.keyId || body.keyId,
      note: orderData.note || body.note,
      internalOrderId: orderData.internalOrderId || body.internalOrderId,
      message: body.message || orderData.message,
    };
  } catch (error: any) {
    console.warn('[createRazorpayOrderFromApi Error]:', error?.response?.data || error?.message || error);
    return null;
  }
};

export const verifyRazorpayPaymentFromApi = async (data: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string;
  noteId: string;
  userId?: string;
}) => {
  try {
    const response: any = await apiClient.post('/orders/razorpay/verify', data);
    const body = response.data || response;
    const verifyData = body.data || body;
    return {
      success: Boolean(body.success && (verifyData.success !== false)),
      hasAccess: Boolean(verifyData.hasAccess || body.hasAccess),
      message: body.message || verifyData.message,
      order: verifyData.order || body.order,
    };
  } catch (error: any) {
    console.warn('[verifyRazorpayPaymentFromApi Error]:', error?.response?.data || error?.message || error);
    return null;
  }
};

export const fetchSubjectsFromApi = async (params: { semester?: number; branchCode?: string; schemeYear?: string } = {}): Promise<Subject[]> => {
  try {
    const response: any = await apiClient.get('/academics/courses', { params });
    const payload = response.data || response;
    const rawCourses = Array.isArray(payload) ? payload : payload.items || payload.data || [];

    if (!Array.isArray(rawCourses) || rawCourses.length === 0) {
      return MOCK_SUBJECTS;
    }

    return rawCourses.map((course: any, idx: number): Subject => ({
      id: course.id || `c-${idx}`,
      code: course.subjectCode || course.code || '21CS51',
      name: course.name || course.subjectName || course.title || 'Academic Course',
      semester: course.semester || params.semester || 5,
      branch: course.branchCode || params.branchCode || 'CSE',
      unitCount: 5,
      resourceCount: course.notesCount || course._count?.notes || 12,
      progress: Math.floor(Math.random() * 40) + 40,
      iconName: 'book-open',
      iconBg: '#EEF2FF',
      iconColor: '#0745E8',
    }));
  } catch (error: any) {
    console.warn('[fetchSubjectsFromApi Fallback]:', error?.message || error);
    return MOCK_SUBJECTS;
  }
};

