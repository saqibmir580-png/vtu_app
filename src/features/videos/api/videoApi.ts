import { apiClient } from '../../../infrastructure/api/client';
import { VideoCourse } from '../types/video.types';

export interface QueryVideoCoursesParams {
  branchCode?: string;
  semester?: number;
  schemeYear?: string;
  subjectCode?: string;
  search?: string;
}

export const fetchVideoCoursesFromApi = async (params?: QueryVideoCoursesParams): Promise<VideoCourse[]> => {
  try {
    const query: Record<string, any> = {};
    if (params?.branchCode && params.branchCode !== 'ALL') query.branchCode = params.branchCode;
    if (params?.semester) query.semester = params.semester;
    if (params?.schemeYear && params.schemeYear !== 'ALL') query.schemeYear = params.schemeYear;
    if (params?.subjectCode && params.subjectCode !== 'ALL') query.subjectCode = params.subjectCode;
    if (params?.search) query.search = params.search;

    const res: any = await apiClient.get('/videos/courses', { params: query });
    const payload = res.data?.data || res.data || res;
    const items = Array.isArray(payload) ? payload : payload.items || [];
    return items;
  } catch (error) {
    console.warn('[videoApi] Failed to fetch video courses from backend:', error);
    return [];
  }
};

export const fetchVideoCourseByIdFromApi = async (id: string): Promise<VideoCourse | null> => {
  try {
    const res: any = await apiClient.get(`/videos/courses/${id}`);
    const payload = res.data?.data || res.data || res;
    return payload || null;
  } catch (error) {
    console.error(`[videoApi] Failed to fetch course detail for ID ${id}:`, error);
    return null;
  }
};
