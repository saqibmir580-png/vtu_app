import { apiClient } from '../../../infrastructure/api/client';
import { PassingPackage, PassingQuestion } from '../types/passingPackages.types';
import { MOCK_PASSING_PACKAGES } from './mockPassingPackages';

export interface QueryPackagesParams {
  branchCode?: string;
  schemeYear?: string;
  semester?: number;
  subjectCode?: string;
  search?: string;
}

const extractPackagesList = (response: any): any[] => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.items)) return response.items;
  if (Array.isArray(response.data)) return response.data;
  if (response.data && Array.isArray(response.data.items)) return response.data.items;
  if (response.data && Array.isArray(response.data.data)) return response.data.data;
  return [];
};

export const mapBackendToPassingPackage = (item: any): PassingPackage => {
  let questions: any[] = [];
  if (item.questions) {
    if (typeof item.questions === 'string') {
      try {
        questions = JSON.parse(item.questions);
      } catch {
        questions = [];
      }
    } else if (Array.isArray(item.questions)) {
      questions = item.questions;
    }
  }

  const mappedQuestions: PassingQuestion[] = questions.map((q: any, idx: number) => ({
    id: q.id || `q-${idx}`,
    questionText: q.questionText || q.text || 'Passing Question',
    unitNumber: q.unitNumber || 1,
    unitTitle: q.unitName || q.unitTitle || `Unit ${q.unitNumber || 1}`,
    marks: q.marks || 10,
    sourceYears: q.sourceYears || ['2024 Reg', '2023 Reg'],
    frequency: q.frequency || 'Frequently Repeated',
    priority: q.priority === 'HIGH' ? 'High Priority' : 'Very High Priority',
    bloomLevel: q.bloomLevel || 'L2',
    solutionSnippet: q.answerSummary || q.solutionSnippet || '',
    diagramAvailable: Boolean(q.diagramAvailable),
    keyPoints: q.keyPoints || [],
  }));

  const important = mappedQuestions.filter((q) => q.priority === 'Very High Priority' || q.priority === 'High Priority');
  const repeated = mappedQuestions.filter((q) => q.frequency);

  // If questions from backend are sparse, use mock questions as enriched fallback
  const mockMatch = MOCK_PASSING_PACKAGES.find(
    (m) => m.subjectCode === item.subjectCode || m.semester === item.semester
  ) || MOCK_PASSING_PACKAGES[0];

  return {
    id: item.id,
    subjectCode: item.subjectCode,
    subjectName: item.subjectName,
    semester: item.semester,
    branch: item.branchCode || 'CSE',
    scheme: item.schemeYear || '2022',
    unitCount: item.unitsCount || 5,
    totalQuestionsCount: item.questionsCount || (mappedQuestions.length > 0 ? mappedQuestions.length : mockMatch.totalQuestionsCount),
    importantQuestionsCount: important.length > 0 ? important.length : mockMatch.importantQuestionsCount,
    repeatedQuestionsCount: repeated.length > 0 ? repeated.length : mockMatch.repeatedQuestionsCount,
    expectedQuestionsCount: mockMatch.expectedQuestionsCount,
    revisionResourceCount: mockMatch.revisionResourceCount,
    unitsWeightage: mockMatch.unitsWeightage,
    importantQuestions: mappedQuestions.length > 0 ? mappedQuestions : mockMatch.importantQuestions,
    repeatedQuestions: repeated.length > 0 ? repeated : mockMatch.repeatedQuestions,
    expectedQuestions: mockMatch.expectedQuestions,
    revisionResources: mockMatch.revisionResources,
    nightBeforeSequence: mappedQuestions.length > 0 ? mappedQuestions.slice(0, 5) : mockMatch.nightBeforeSequence,
  };
};

export const fetchPassingPackagesFromApi = async (
  params: QueryPackagesParams = {}
): Promise<PassingPackage[]> => {
  try {
    const queryParams: any = {};
    if (params.branchCode && params.branchCode !== 'All') queryParams.branchCode = params.branchCode;
    if (params.schemeYear && params.schemeYear !== 'All') queryParams.schemeYear = params.schemeYear;
    if (params.semester && String(params.semester) !== 'All') queryParams.semester = params.semester;
    if (params.subjectCode) queryParams.subjectCode = params.subjectCode;
    if (params.search) queryParams.search = params.search;

    const response: any = await apiClient.get('/passing-packages', { params: queryParams });
    const rawList = extractPackagesList(response);

    if (rawList.length > 0) {
      return rawList.map(mapBackendToPassingPackage);
    }

    return MOCK_PASSING_PACKAGES;
  } catch (error: any) {
    console.warn('[fetchPassingPackagesFromApi Fallback]:', error?.message || error);
    return MOCK_PASSING_PACKAGES;
  }
};
