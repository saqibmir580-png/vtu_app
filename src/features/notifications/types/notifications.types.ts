export type NotificationCategory =
  | 'Academic'
  | 'Exams'
  | 'Results'
  | 'Study'
  | 'App';

export type NotificationPriority = 'High' | 'Normal';

export interface VTUNotification {
  id: string;
  title: string;
  shortMessage: string;
  fullMessage: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  timestamp: string; // e.g. "10 mins ago" or "2 hours ago"
  date: string; // ISO e.g. "2026-09-03"
  isRead: boolean;
  targetRoute?: string; // e.g. "/calendar" or "/(tabs)/library"
  targetLabel?: string; // e.g. "View Exam Schedule" or "Open Notes"
  relatedContext?: {
    subjectCode?: string;
    semester?: number;
    circularRef?: string;
  };
}

export interface NotificationPreferencesState {
  examReminders: boolean;
  academicUpdates: boolean;
  resultUpdates: boolean;
  calendarUpdates: boolean;
  newNotes: boolean;
  newQuestionPapers: boolean;
  appUpdates: boolean;
  importantAnnouncements: boolean;
  communityActivity: boolean;
  attendanceAlerts: boolean;
  resultsAnnouncements: boolean;
}
