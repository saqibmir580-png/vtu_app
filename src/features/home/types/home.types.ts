export interface AcademicSummary {
  cgpa: number;
  cgpaTrend: string; // e.g. '+0.25'
  attendancePercentage: number;
  attendanceStatus: 'Eligible' | 'Warning' | 'Critical';
  currentSemester: number;
  totalCreditsEarned: number;
}

export interface StudyHistory {
  id: string;
  subject: string;
  unit: string;
  resourceTitle: string;
  progress: number; // 0 - 100
  lastOpenedTime: string;
  resourceId: string;
}

export interface AcademicEvent {
  id: string;
  type: 'Internal Test' | 'Lab Exam' | 'Assignment' | 'VTU Exam';
  subject: string;
  date: string;
  time: string;
  venue?: string;
  targetRoute?: string;
}

export interface NotificationItem {
  id: string;
  category: 'VTU Circular' | 'Exam Schedule' | 'Assignment' | 'System' | 'Academic' | 'Exams' | 'Results' | 'Study' | 'App' | string;
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  targetRoute?: string;
}

export interface ResourceItem {
  id: string;
  title: string;
  subject: string;
  type: 'PDF Notes' | 'Question Paper' | 'Lab Manual';
  fileSize: string;
  uploadDate: string;
  downloadsCount: number;
  branch: string;
  semester: number;
  scheme: string;
}
