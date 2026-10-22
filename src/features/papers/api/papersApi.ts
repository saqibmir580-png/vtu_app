import { apiClient } from '../../../infrastructure/api/client';
import { QuestionPaper, QuestionModule } from '../types/paper.types';
import { MOCK_PAPERS } from './mockPapers';

export interface QueryPapersParams {
  branchCode?: string;
  schemeYear?: string;
  semester?: number;
  subjectCode?: string;
  paperType?: string;
  contentType?: string;
  year?: number;
  search?: string;
  page?: number;
  limit?: number;
}

const extractPapersList = (response: any): any[] => {
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

export const mapBackendToQuestionPaper = (item: any): QuestionPaper => {
  let modules: QuestionModule[] = [];

  const rawModules = item.modulesData !== undefined ? item.modulesData : item.modules_data;
  if (rawModules) {
    if (typeof rawModules === 'string') {
      try {
        modules = JSON.parse(rawModules);
      } catch {
        modules = [];
      }
    } else if (Array.isArray(rawModules)) {
      modules = rawModules;
    }
  }

  if (modules.length === 0 && item.modules && Array.isArray(item.modules)) {
    modules = item.modules;
  }

  return {
    id: item.id || `paper-${Math.random()}`,
    title: item.title || `${item.subjectCode || ''} ${item.subjectName || ''}`,
    subjectName: item.subjectName || 'Question Paper',
    subjectCode: item.subjectCode || 'VTU',
    scheme: item.schemeYear || item.scheme || '2021',
    branch: item.branchCode || item.branch || 'CSE',
    semester: item.semester || 5,
    paperType: item.paperType || 'SEE_THEORY',
    contentType: item.contentType || (modules.length > 0 ? 'DIGITAL_TYPED' : 'PDF_UPLOAD'),
    hasSolutionKey: Boolean(item.hasSolutionKey) || Boolean(item.solutionPdfUrl) || Boolean(item.solution_pdf_url),
    year: String(item.year || '2025'),
    month: item.month || 'Jan/Feb',
    maxMarks: item.maxMarks || 100,
    durationHours: item.durationHours || 3.0,
    fileSize: item.fileSize || '2.5 MB',
    pageCount: item.pageCount || 4,
    viewsCount: item.viewsCount || item.views || 0,
    downloadsCount: item.downloads || item.downloadsCount || 0,
    pdfUrl: item.pdfUrl || item.fileUrl || item.pdf_url || item.file_url,
    solutionPdfUrl: item.solutionPdfUrl || item.solution_pdf_url,
    thumbnailBg: item.contentType === 'PDF_UPLOAD' ? '#FFF7ED' : '#F3E8FF',
    modules: modules.length > 0 ? modules : (MOCK_PAPERS[0]?.modules || []),
  };
};

export const fetchQuestionPapersApi = async (params?: QueryPapersParams): Promise<QuestionPaper[]> => {
  try {
    const res: any = await apiClient.get('/question-papers', { params });
    const rawList = extractPapersList(res);
    if (rawList && rawList.length > 0) {
      return rawList.map(mapBackendToQuestionPaper);
    }
    return MOCK_PAPERS;
  } catch (error) {
    console.warn('[QuestionPapers API]: Backend offline or unreachable. Using cached/mock papers dataset.');
    return MOCK_PAPERS;
  }
};

export const fetchQuestionPaperByIdApi = async (id: string): Promise<QuestionPaper | null> => {
  try {
    const res: any = await apiClient.get(`/question-papers/${id}`);
    const rawData = res.data?.data?.data || res.data?.data || res.data || res;
    if (rawData && rawData.id) {
      return mapBackendToQuestionPaper(rawData);
    }
    return MOCK_PAPERS.find((p) => p.id === id) || null;
  } catch (error) {
    return MOCK_PAPERS.find((p) => p.id === id) || null;
  }
};

export const incrementPaperDownloadApi = async (id: string): Promise<void> => {
  try {
    await apiClient.post(`/question-papers/${id}/download`);
  } catch {
    // Silent telemetry fallback
  }
};
