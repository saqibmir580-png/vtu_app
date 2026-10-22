import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { fetchVideoCourseByIdFromApi } from '../api/videoApi';
import { VideoCourse, VideoLesson, SyllabusModule } from '../types/video.types';
import { openYouTubeVideo, openYouTubePlaylist } from '../utils/youtubeLauncher';
import { InAppYouTubePlayer } from '../components/InAppYouTubePlayer';

export const CourseDetailScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [course, setCourse] = useState<VideoCourse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
  });

  const [activeLesson, setActiveLesson] = useState<VideoLesson | null>(null);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);

  // Flat list of all lessons in module order
  const allLessonsList = useMemo(() => {
    if (!course?.modules) return [];
    return course.modules.flatMap((m) => m.lessons);
  }, [course]);

  const activeLessonIndex = useMemo(() => {
    if (!activeLesson) return -1;
    return allLessonsList.findIndex((l) => l.id === activeLesson.id);
  }, [activeLesson, allLessonsList]);

  const handlePlayLesson = (lesson: VideoLesson) => {
    setActiveLesson(lesson);
    setIsPlayerVisible(true);
  };

  const handleNextLesson = () => {
    if (activeLessonIndex >= 0 && activeLessonIndex < allLessonsList.length - 1) {
      setActiveLesson(allLessonsList[activeLessonIndex + 1]);
    }
  };

  const handlePrevLesson = () => {
    if (activeLessonIndex > 0) {
      setActiveLesson(allLessonsList[activeLessonIndex - 1]);
    }
  };

  const handlePlayHero = () => {
    if (allLessonsList.length > 0) {
      handlePlayLesson(allLessonsList[0]);
    } else if (course?.youtubePlaylistUrl) {
      openYouTubePlaylist(course.youtubePlaylistUrl);
    }
  };

  const loadCourse = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await fetchVideoCourseByIdFromApi(id);
      setCourse(data);
    } catch (err) {
      console.warn('Failed to load course detail:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  const toggleModule = (moduleNum: number) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleNum]: !prev[moduleNum],
    }));
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={22} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Course Modules</Text>
          <View style={{ width: 34 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={styles.loadingText}>Loading course syllabus modules...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!course) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={22} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Course Not Found</Text>
          <View style={{ width: 34 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Feather name="alert-circle" size={40} color="#94A3B8" />
          <Text style={styles.emptyTitle}>Course Not Available</Text>
          <Text style={styles.emptySubtitle}>The requested video course could not be loaded.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {course.subjectCode} - {course.subjectName}
          </Text>
          <Text style={styles.headerSubtitle}>Module 1 to 5 Syllabus Series</Text>
        </View>
        <View style={styles.headerBadge}>
          <FontAwesome5 name="youtube" size={13} color="#EF4444" />
          <Text style={styles.headerBadgeText}>YouTube</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Course Hero Card */}
        <View style={styles.heroCard}>
          <TouchableOpacity
            style={styles.heroImageContainer}
            activeOpacity={0.9}
            onPress={handlePlayHero}
          >
            <Image
              source={{
                uri: course.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
              }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.heroPlayOverlay}>
              <View style={styles.heroPlayBtn}>
                <FontAwesome5 name="play" size={16} color="#FFFFFF" style={{ marginLeft: 2 }} />
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.heroDetails}>
            <View style={styles.badgeRow}>
              <View style={styles.subjectTag}>
                <Text style={styles.subjectTagText}>{course.subjectCode}</Text>
              </View>
              <View style={styles.schemeTag}>
                <Text style={styles.schemeTagText}>Scheme {course.schemeYear}</Text>
              </View>
              <View style={styles.semTag}>
                <Text style={styles.semTagText}>Semester {course.semester}</Text>
              </View>
            </View>

            <Text style={styles.courseTitle}>{course.title}</Text>
            {course.description ? (
              <Text style={styles.courseDesc}>{course.description}</Text>
            ) : null}

            {/* Faculty & Channel Row */}
            <View style={styles.creatorRow}>
              <View style={styles.creatorInfo}>
                <View style={styles.creatorAvatar}>
                  <Feather name="user" size={12} color="#0745E8" />
                </View>
                <View>
                  <Text style={styles.creatorName}>{course.instructorName}</Text>
                  <Text style={styles.channelLabel}>
                    <FontAwesome5 name="youtube" size={10} color="#EF4444" /> {course.channelName || 'Official Channel'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Playlist Launch Button */}
            {course.youtubePlaylistUrl ? (
              <TouchableOpacity
                style={styles.playlistButton}
                activeOpacity={0.8}
                onPress={() => openYouTubePlaylist(course.youtubePlaylistUrl, course.youtubePlaylistId)}
              >
                <FontAwesome5 name="youtube" size={15} color="#FFFFFF" />
                <Text style={styles.playlistButtonText}>Open Complete Playlist on YouTube</Text>
                <Feather name="external-link" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Syllabus Modules Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Syllabus Breakdown</Text>
          <Text style={styles.sectionSubtitle}>
            {course.totalLessons || course.allLessons?.length || 0} Lectures Across 5 Modules
          </Text>
        </View>

        {/* Modules Accordion List */}
        <View style={styles.modulesContainer}>
          {(course.modules || []).map((mod: SyllabusModule) => {
            const isExpanded = expandedModules[mod.moduleNumber] ?? true;
            return (
              <View key={mod.moduleNumber} style={styles.moduleCard}>
                {/* Module Header Bar */}
                <TouchableOpacity
                  style={styles.moduleHeader}
                  activeOpacity={0.7}
                  onPress={() => toggleModule(mod.moduleNumber)}
                >
                  <View style={styles.moduleHeaderLeft}>
                    <View style={styles.moduleNumberBadge}>
                      <Text style={styles.moduleNumberText}>M{mod.moduleNumber}</Text>
                    </View>
                    <View style={styles.moduleTitleContainer}>
                      <Text style={styles.moduleTitle}>{mod.title}</Text>
                      <Text style={styles.moduleLessonCount}>
                        {mod.lessons.length} video {mod.lessons.length === 1 ? 'lecture' : 'lectures'}
                      </Text>
                    </View>
                  </View>
                  <Feather
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#64748B"
                  />
                </TouchableOpacity>

                {/* Module Lessons Body */}
                {isExpanded && (
                  <View style={styles.lessonsBody}>
                    {mod.lessons.length === 0 ? (
                      <View style={styles.noLessonsContainer}>
                        <Feather name="film" size={20} color="#94A3B8" />
                        <Text style={styles.noLessonsText}>Lectures for this module will be added shortly.</Text>
                      </View>
                    ) : (
                      mod.lessons.map((lesson: VideoLesson, idx: number) => (
                        <View
                          key={lesson.id}
                          style={[
                            styles.lessonItem,
                            idx < mod.lessons.length - 1 && styles.lessonItemBorder,
                          ]}
                        >
                          <TouchableOpacity
                            style={styles.lessonThumbnailWrap}
                            activeOpacity={0.8}
                            onPress={() => handlePlayLesson(lesson)}
                          >
                            <Image
                              source={{
                                uri: lesson.thumbnailUrl || `https://img.youtube.com/vi/${lesson.youtubeVideoId}/hqdefault.jpg`,
                              }}
                              style={styles.lessonThumb}
                              resizeMode="cover"
                            />
                            <View style={styles.lessonPlayOverlay}>
                              <FontAwesome5 name="play" size={11} color="#FFFFFF" style={{ marginLeft: 1 }} />
                            </View>
                            <View style={styles.durationBadge}>
                              <Text style={styles.durationText}>{lesson.durationText || '15:00'}</Text>
                            </View>
                          </TouchableOpacity>

                          <View style={styles.lessonContent}>
                            <TouchableOpacity
                              activeOpacity={0.7}
                              onPress={() => handlePlayLesson(lesson)}
                            >
                              <Text style={styles.lessonTitle} numberOfLines={2}>
                                {lesson.title}
                              </Text>
                            </TouchableOpacity>

                            {lesson.topicName ? (
                              <View style={styles.topicBadge}>
                                <Text style={styles.topicText} numberOfLines={1}>
                                  {lesson.topicName}
                                </Text>
                              </View>
                            ) : null}

                            {/* Actions: In-App Play, YouTube App, and Notes */}
                            <View style={styles.lessonActionsRow}>
                              <TouchableOpacity
                                style={styles.playInAppBtn}
                                activeOpacity={0.8}
                                onPress={() => handlePlayLesson(lesson)}
                              >
                                <FontAwesome5 name="play" size={10} color="#FFFFFF" />
                                <Text style={styles.playInAppText}>Play</Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={styles.watchYoutubeBtn}
                                activeOpacity={0.8}
                                onPress={() => openYouTubeVideo(lesson.youtubeVideoId)}
                              >
                                <FontAwesome5 name="youtube" size={11} color="#EF4444" />
                                <Text style={styles.watchYoutubeText}>YouTube</Text>
                              </TouchableOpacity>

                              {lesson.relatedNoteId ? (
                                <TouchableOpacity
                                  style={styles.notesBtn}
                                  activeOpacity={0.8}
                                  onPress={() => router.push(`/notes` as any)}
                                >
                                  <Feather name="file-text" size={11} color="#0745E8" />
                                  <Text style={styles.notesBtnText}>Notes</Text>
                                </TouchableOpacity>
                              ) : null}
                            </View>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* WhatsApp-style In-App Embedded YouTube Player */}
      <InAppYouTubePlayer
        visible={isPlayerVisible}
        lesson={activeLesson}
        courseTitle={course?.title}
        subjectCode={course?.subjectCode}
        instructorName={course?.instructorName}
        channelName={course?.channelName}
        onClose={() => {
          setIsPlayerVisible(false);
          setActiveLesson(null);
        }}
        onNextLesson={handleNextLesson}
        onPrevLesson={handlePrevLesson}
        hasNextLesson={activeLessonIndex >= 0 && activeLessonIndex < allLessonsList.length - 1}
        hasPrevLesson={activeLessonIndex > 0}
        onOpenNotes={() => {
          setIsPlayerVisible(false);
          router.push('/notes' as any);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  heroImageContainer: {
    height: 180,
    width: '100%',
    backgroundColor: '#0F172A',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlayOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroPlayBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  heroDetails: {
    padding: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  subjectTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  subjectTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0745E8',
  },
  schemeTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  schemeTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  semTag: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  semTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 24,
    marginBottom: 6,
  },
  courseDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginBottom: 12,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  creatorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  channelLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  playlistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
  },
  playlistButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modulesContainer: {
    gap: 12,
  },
  moduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  moduleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  moduleNumberBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  moduleNumberText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#EF4444',
  },
  moduleTitleContainer: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  moduleLessonCount: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  lessonsBody: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FAFAFC',
  },
  noLessonsContainer: {
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  noLessonsText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 12,
  },
  lessonItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  lessonThumbnailWrap: {
    width: 100,
    height: 65,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    position: 'relative',
  },
  lessonThumb: {
    width: '100%',
    height: '100%',
  },
  lessonPlayOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  lessonContent: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
    marginBottom: 4,
  },
  topicBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  topicText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  lessonActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playInAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0745E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  playInAppText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  watchYoutubeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  watchYoutubeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
  },
  notesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  notesBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0745E8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
});
