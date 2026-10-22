export interface GradeDefinition {
  grade: 'O' | 'A+' | 'A' | 'B+' | 'B' | 'C' | 'P' | 'F';
  gradePoint: number;
  description: string;
  minMarks: number;
  maxMarks: number;
  badgeBg: string;
  badgeColor: string;
}

export const VTU_GRADE_SCALE: GradeDefinition[] = [
  {
    grade: 'O',
    gradePoint: 10,
    description: 'Outstanding',
    minMarks: 90,
    maxMarks: 100,
    badgeBg: '#DCFCE7',
    badgeColor: '#16A34A',
  },
  {
    grade: 'A+',
    gradePoint: 9,
    description: 'Excellent',
    minMarks: 80,
    maxMarks: 89,
    badgeBg: '#E0F2FE',
    badgeColor: '#0284C7',
  },
  {
    grade: 'A',
    gradePoint: 8,
    description: 'Very Good',
    minMarks: 70,
    maxMarks: 79,
    badgeBg: '#EEF2FF',
    badgeColor: '#4F46E5',
  },
  {
    grade: 'B+',
    gradePoint: 7,
    description: 'Good',
    minMarks: 60,
    maxMarks: 69,
    badgeBg: '#FEF3C7',
    badgeColor: '#D97706',
  },
  {
    grade: 'B',
    gradePoint: 6,
    description: 'Above Average',
    minMarks: 55,
    maxMarks: 59,
    badgeBg: '#FFF7ED',
    badgeColor: '#EA580C',
  },
  {
    grade: 'C',
    gradePoint: 5,
    description: 'Average',
    minMarks: 50,
    maxMarks: 54,
    badgeBg: '#F3E8FF',
    badgeColor: '#9333EA',
  },
  {
    grade: 'P',
    gradePoint: 4,
    description: 'Pass',
    minMarks: 40,
    maxMarks: 49,
    badgeBg: '#F1F5F9',
    badgeColor: '#475569',
  },
  {
    grade: 'F',
    gradePoint: 0,
    description: 'Fail',
    minMarks: 0,
    maxMarks: 39,
    badgeBg: '#FEE2E2',
    badgeColor: '#DC2626',
  },
];

export interface SubjectGrade {
  id: string;
  name: string;
  code: string;
  credits: number;
  grade: string;
  gradePoint: number;
  marks?: number;
}

export interface SemesterRecord {
  semester: number;
  sgpa: number;
  credits: number;
  isCompleted: boolean;
  subjects?: SubjectGrade[];
}

export interface AcademicRecordData {
  semesters: SemesterRecord[];
  currentCgpa: number;
  targetCgpa: number;
  totalCreditsEarned: number;
}
