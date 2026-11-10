export type QuestionPriority =
  | 'Very High Priority'
  | 'High Priority'
  | 'Medium Priority'
  | 'Suggested Focus';

export type QuestionFrequency =
  | '4x in Last 5 Years'
  | '3x in Last 5 Years'
  | '2x in Last 5 Years'
  | 'Appeared Last 2 Semesters'
  | 'Frequently Repeated';

export interface PassingQuestion {
  id: string;
  questionText: string;
  unitNumber: number;
  unitTitle: string;
  marks: number;
  sourceYears: string[]; // e.g. ['2024 Reg', '2023 Reg', '2021 Makeup']
  frequency?: QuestionFrequency;
  priority: QuestionPriority;
  bloomLevel?: 'L1' | 'L2' | 'L3' | 'L4';
  relatedNoteId?: string;
  relatedPaperId?: string;
  solutionSnippet?: string;
  diagramAvailable?: boolean;
  diagramTitle?: string;
  keyPoints?: string[];
}

export interface UnitWeightage {
  unitNumber: number;
  unitTitle: string;
  expectedMarks: number; // e.g. 20
  percentageWeightage: number; // e.g. 20
  importanceLevel: 'Must Master' | 'High Weightage' | 'Moderate Weightage';
  questionsCount: number;
  revisionResourceCount: number;
  summary: string;
}

export interface RevisionResource {
  id: string;
  title: string;
  subTitle: string;
  type: 'Quick PDF' | 'Key Concepts' | 'Important Diagrams' | 'Formula Sheet';
  fileSize: string;
  pageCount: number;
  downloadUrl?: string;
  isDownloaded?: boolean;
  isBookmarked?: boolean;
  unitNumber?: number;
  previewSnippet?: string;
}

export interface PassingPackage {
  id: string;
  subjectCode: string;
  subjectName: string;
  semester: number;
  branch: string; // e.g. 'CSE'
  scheme: string; // e.g. '2022'
  unitCount: number;
  totalQuestionsCount: number;
  importantQuestionsCount: number;
  repeatedQuestionsCount: number;
  expectedQuestionsCount: number;
  revisionResourceCount: number;
  unitsWeightage: UnitWeightage[];
  importantQuestions: PassingQuestion[];
  repeatedQuestions: PassingQuestion[];
  expectedQuestions: PassingQuestion[];
  revisionResources: RevisionResource[];
  nightBeforeSequence: PassingQuestion[];
  isPaid?: boolean;
  price?: number;
  originalPrice?: number;
  freePreviewQuestionsCount?: number;
  isPurchased?: boolean;
}

export interface PackageFilterOptions {
  selectedUnit?: number | 'All';
  selectedPriority?: QuestionPriority | 'All';
  selectedMarks?: number | 'All';
  searchQuery?: string;
}
