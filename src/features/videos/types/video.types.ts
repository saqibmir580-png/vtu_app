export interface VideoLesson {
  id: string;
  moduleNumber: number;
  unitName: string;
  topicName?: string;
  title: string;
  description?: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  thumbnailUrl: string;
  durationText: string;
  displayOrder: number;
  status: string;
  viewsCount: number;
  relatedNoteId?: string;
  relatedPaperId?: string;
}

export interface SyllabusModule {
  moduleNumber: number;
  title: string;
  unitName: string;
  lessonsCount: number;
  lessons: VideoLesson[];
}

export interface VideoCourse {
  id: string;
  title: string;
  description: string;
  subjectCode: string;
  subjectName: string;
  branchCode: string;
  schemeYear: string;
  semester: number;
  thumbnailUrl: string;
  instructorName: string;
  channelName: string;
  youtubePlaylistUrl?: string;
  youtubePlaylistId?: string;
  status: string;
  enrolledCount: number;
  lessonsCount?: number;
  totalLessons?: number;
  modulesCount?: number;
  modules?: SyllabusModule[];
  allLessons?: VideoLesson[];
  createdAt: string;
  updatedAt: string;
}
