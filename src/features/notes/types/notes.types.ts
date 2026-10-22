export type ResourceType =
  | 'PDF'
  | 'PPT'
  | 'Handwritten Notes'
  | 'Typed Notes'
  | 'Short Notes'
  | 'Revision Notes';

export interface Subject {
  id: string;
  code: string; // e.g. '21CS52'
  name: string; // e.g. 'Computer Networks'
  semester: number;
  branch: string;
  unitCount: number;
  resourceCount: number;
  progress: number; // 0 - 100
  iconName: string;
  iconColor: string;
  iconBg: string;
}

export interface Unit {
  id: string;
  unitNumber: number;
  title: string; // e.g. 'Application Layer & Socket Programming'
  resourceCount: number;
  progress: number;
}

export interface NoteResource {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  unitNumber: number;
  unitTitle: string;
  type: ResourceType;
  fileFormat: 'PDF' | 'PPTX' | 'ZIP';
  fileSize: string;
  author: string;
  downloadsCount: number;
  isBookmarked: boolean;
  isDownloaded: boolean;
  downloadProgress?: number; // 0 - 100
  description: string;
  totalPages?: number;
  tableOfContents?: string[];
  isPaid?: boolean;
  price?: number;
  freePreviewPages?: number;
  isPurchased?: boolean;
  hasAccess?: boolean;
  fileUrl?: string;
  secureUrl?: string;
}
