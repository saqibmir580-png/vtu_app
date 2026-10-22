import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useAuthStore } from '@/store';
import { fetchVideoCoursesFromApi } from '../api/videoApi';
import { VideoCourse } from '../types/video.types';

export const VideoCoursesScreen: React.FC = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [courses, setCourses] = useState<VideoCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('ALL');

  const loadCourses = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const data = await fetchVideoCoursesFromApi({
        branchCode: user?.branch || 'CSE',
        semester: user?.semester || 5,
        schemeYear: user?.scheme || '2022',
      });
      setCourses(data);
    } catch (err) {
      console.warn('Failed to load video courses:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const subjectPills = useMemo(() => {
    const subs = new Set<string>();
    courses.forEach((c) => {
      if (c.subjectCode) subs.add(c.subjectCode);
    });
    return ['ALL', ...Array.from(subs)];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.subjectCode.toLowerCase().includes(q) ||
        c.subjectName.toLowerCase().includes(q) ||
        c.instructorName.toLowerCase().includes(q);

      const matchSubject = selectedSubject === 'ALL' || c.subjectCode === selectedSubject;
      return matchSearch && matchSubject;
    });
  }, [courses, searchQuery, selectedSubject]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Video Learning Modules</Text>
          <Text style={styles.headerSubtitle}>Official YouTube Syllabus Lectures</Text>
        </View>
        <View style={styles.youtubeBrandBadge}>
          <FontAwesome5 name="youtube" size={14} color="#EF4444" />
          <Text style={styles.youtubeBrandText}>YouTube</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadCourses(true)}
            colors={['#EF4444']}
            tintColor="#EF4444"
          />
        }
      >
        {/* Creator Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroContent}>
            <View style={styles.heroTag}>
              <Feather name="play-circle" size={12} color="#EF4444" />
              <Text style={styles.heroTagText}>Creator Channel Integration</Text>
            </View>
            <Text style={styles.heroTitle}>Learn Direct From The Best</Text>
            <Text style={styles.heroDescription}>
              High-yield VTU lectures organized strictly by Module 1 to 5. Watch directly on YouTube with zero video lag!
            </Text>
          </View>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by topic, subject code, or faculty..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Subject Filter Pills */}
        {subjectPills.length > 2 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.pillsScroll}
            contentContainerStyle={styles.pillsContainer}
          >
            {subjectPills.map((sub) => {
              const isActive = selectedSubject === sub;
              return (
                <TouchableOpacity
                  key={sub}
                  style={[styles.pill, isActive && styles.pillActive]}
                  onPress={() => setSelectedSubject(sub)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                    {sub === 'ALL' ? 'All Subjects' : sub}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Courses List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#EF4444" />
            <Text style={styles.loadingText}>Fetching video courses...</Text>
          </View>
        ) : filteredCourses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="youtube" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Video Courses Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try clearing your search filters.' : 'Video courses for your semester will appear here soon.'}
            </Text>
          </View>
        ) : (
          <View style={styles.coursesList}>
            {filteredCourses.map((course) => (
              <TouchableOpacity
                key={course.id}
                style={styles.courseCard}
                activeOpacity={0.85}
                onPress={() => router.push(`/videos/${course.id}` as any)}
              >
                {/* Thumbnail Header */}
                <View style={styles.thumbnailContainer}>
                  <Image
                    source={{
                      uri: course.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
                    }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />
                  <View style={styles.playOverlay}>
                    <View style={styles.playButtonCircle}>
                      <FontAwesome5 name="play" size={14} color="#FFFFFF" style={{ marginLeft: 2 }} />
                    </View>
                  </View>
                  <View style={styles.subjectBadge}>
                    <Text style={styles.subjectBadgeText}>{course.subjectCode}</Text>
                  </View>
                  <View style={styles.lecturesBadge}>
                    <Feather name="layers" size={10} color="#FFFFFF" />
                    <Text style={styles.lecturesBadgeText}>
                      {course.lessonsCount || 5} Lectures • 5 Modules
                    </Text>
                  </View>
                </View>

                {/* Course Details */}
                <View style={styles.cardContent}>
                  <Text style={styles.courseTitle} numberOfLines={2}>
                    {course.title}
                  </Text>
                  <Text style={styles.courseSubtitle} numberOfLines={1}>
                    {course.subjectName}
                  </Text>

                  {/* Instructor & Channel Bar */}
                  <View style={styles.instructorBar}>
                    <View style={styles.instructorInfo}>
                      <View style={styles.avatarCircle}>
                        <Feather name="user" size={11} color="#64748B" />
                      </View>
                      <Text style={styles.instructorName} numberOfLines={1}>
                        {course.instructorName}
                      </Text>
                    </View>
                    <View style={styles.channelTag}>
                      <FontAwesome5 name="youtube" size={10} color="#EF4444" />
                      <Text style={styles.channelName} numberOfLines={1}>
                        {course.channelName || 'YouTube'}
                      </Text>
                    </View>
                  </View>

                  {/* Action Row */}
                  <View style={styles.cardFooter}>
                    <View style={styles.schemeTag}>
                      <Text style={styles.schemeText}>Scheme {course.schemeYear}</Text>
                    </View>
                    <View style={styles.viewCourseBtn}>
                      <Text style={styles.viewCourseText}>View Modules</Text>
                      <Feather name="chevron-right" size={14} color="#EF4444" />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
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
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  youtubeBrandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  youtubeBrandText: {
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
  heroBanner: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  heroContent: {
    gap: 6,
  },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  heroTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  heroDescription: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },
  pillsScroll: {
    marginBottom: 14,
  },
  pillsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 240,
  },
  coursesList: {
    gap: 16,
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  thumbnailContainer: {
    height: 150,
    width: '100%',
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  subjectBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#38BDF8',
  },
  lecturesBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lecturesBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cardContent: {
    padding: 14,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 20,
    marginBottom: 2,
  },
  courseSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
  },
  instructorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 10,
  },
  instructorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  avatarCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructorName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    flex: 1,
  },
  channelTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  channelName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  schemeTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  schemeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  viewCourseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewCourseText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EF4444',
  },
});
