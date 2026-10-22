import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/store';
import { AcademicOverviewCard } from '../components/AcademicOverviewCard';
import { ContinueStudyingCard } from '../components/ContinueStudyingCard';
import { QuickAccessGrid } from '../components/QuickAccessGrid';
import { UpcomingEventsSection } from '../components/UpcomingEventsSection';
import { LatestNotificationsSection } from '../components/LatestNotificationsSection';
import { RecentlyAddedSection } from '../components/RecentlyAddedSection';
import {
  AcademicSummary,
  StudyHistory,
  AcademicEvent,
  NotificationItem,
  ResourceItem,
} from '../types/home.types';

import { useAcademicRecordStore } from '@/features/calculators';
import { useAttendanceStore } from '@/features/attendance';
import { useStudyActivityStore } from '../store/useStudyActivityStore';
import { apiClient } from '@/infrastructure/api/client';
import { fetchNotesFromApi } from '@/features/notes/api/notesApi';
import { fetchQuestionPapersApi } from '@/features/papers/api/papersApi';
import { useNotificationsStore } from '@/features/notifications';

export const HomeScreen: React.FC = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const { currentCgpa, totalCreditsEarned, loadAcademicRecords } = useAcademicRecordStore();
  const { getOverallStats, loadAttendance } = useAttendanceStore();
  const { recentActivity, loadHistory } = useStudyActivityStore();
  const { notifications: storeNotifs, getUnreadCount, fetchNotifications } = useNotificationsStore();
  const unreadCount = getUnreadCount();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const [events, setEvents] = useState<AcademicEvent[]>([
    {
      id: 'e1',
      type: 'Internal Test',
      subject: 'Computer Networks (21CS52)',
      date: '20th Oct 2026',
      time: '10:30 AM',
      venue: 'LH-302',
      targetRoute: '/calculators/calendar',
    },
    {
      id: 'e2',
      type: 'Lab Exam',
      subject: 'DBMS Laboratory (21CSL54)',
      date: '24th Oct 2026',
      time: '02:00 PM',
      venue: 'Lab-4',
      targetRoute: '/calculators/calendar',
    },
  ]);

  const [notifications] = useState<NotificationItem[]>([
    {
      id: 'n1',
      category: 'VTU Circular',
      title: 'Revised 5th Sem Exam Timetable',
      description: 'VTU has released the final timetable for 2021 & 2022 Scheme B.E exams.',
      timestamp: '10m ago',
      isRead: false,
      targetRoute: '/(tabs)/community',
    },
    {
      id: 'n2',
      category: 'Assignment',
      title: 'Automata Theory Assignment 2',
      description: 'Submission deadline extended to Friday 5:00 PM.',
      timestamp: '2h ago',
      isRead: true,
      targetRoute: '/(tabs)/library',
    },
  ]);

  const [recentResources, setRecentResources] = useState<ResourceItem[]>([
    {
      id: 'r1',
      title: 'Module 3: Paging & Memory Management',
      subject: 'Operating Systems',
      type: 'PDF Notes',
      fileSize: '2.4 MB',
      uploadDate: 'Yesterday',
      downloadsCount: 142,
      branch: 'CSE',
      semester: 5,
      scheme: '2022',
    },
    {
      id: 'r2',
      title: 'Dec 2024 VTU Question Paper + Solutions',
      subject: 'Database Management Systems',
      type: 'Question Paper',
      fileSize: '4.1 MB',
      uploadDate: '3 days ago',
      downloadsCount: 389,
      branch: 'CSE',
      semester: 5,
      scheme: '2022',
    },
  ]);

  const loadHomeData = async () => {
    try {
      // 0. Fetch live notifications
      fetchNotifications().catch(() => {});

      // 1. Dynamic Academic Events from API
      apiClient
        .get('/academic/events')
        .then((res: any) => {
          const d = res.data?.data || res.data || [];
          const rawList = Array.isArray(d) ? d : d.items || d.data || [];
          if (rawList && rawList.length > 0) {
            const mapped: AcademicEvent[] = rawList.slice(0, 3).map((evt: any) => ({
              id: evt.id,
              type:
                evt.category === 'INTERNAL_EXAM' || evt.category === 'Internals'
                  ? 'Internal Test'
                  : evt.category === 'LAB_EXAM' || evt.category === 'Lab Exams'
                  ? 'Lab Exam'
                  : 'VTU Exam',
              subject: evt.title,
              date: evt.startDate
                ? new Date(evt.startDate).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Upcoming',
              time: evt.time || '10:00 AM',
              venue: evt.venue || 'Exam Hall',
              targetRoute: '/calculators/calendar',
            }));
            setEvents(mapped);
          }
        })
        .catch(() => {});

      // 2. Dynamic Recently Added Resources (Notes + Papers)
      Promise.allSettled([
        fetchNotesFromApi({ limit: 4 }),
        fetchQuestionPapersApi({ limit: 4 }),
      ]).then(([notesRes, papersRes]) => {
        const combined: ResourceItem[] = [];

        if (notesRes.status === 'fulfilled' && Array.isArray(notesRes.value)) {
          notesRes.value.slice(0, 2).forEach((n) => {
            combined.push({
              id: n.id,
              title: n.title,
              subject: n.subjectName,
              type: 'PDF Notes',
              fileSize: n.fileSize || '2.4 MB',
              uploadDate: 'Recently Added',
              downloadsCount: n.downloadsCount || 0,
              branch: user?.branch || 'CSE',
              semester: user?.semester || 5,
              scheme: user?.scheme || '2022',
            });
          });
        }

        if (papersRes.status === 'fulfilled' && Array.isArray(papersRes.value)) {
          papersRes.value.slice(0, 2).forEach((p) => {
            combined.push({
              id: p.id,
              title: p.title || `${p.subjectName} QP`,
              subject: p.subjectName,
              type: 'Question Paper',
              fileSize: p.fileSize || '2.5 MB',
              uploadDate: `${p.month} ${p.year}`,
              downloadsCount: p.downloadsCount || 0,
              branch: p.branch,
              semester: p.semester,
              scheme: p.scheme,
            });
          });
        }

        if (combined.length > 0) {
          setRecentResources(combined);
        }
      });
    } catch {
      // Graceful offline fallback
    }
  };

  useEffect(() => {
    loadAcademicRecords();
    loadAttendance();
    loadHistory();
    loadHomeData();
  }, []);

  // Time-aware greeting
  const getTimeAwareGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning 👋';
    if (hour < 17) return 'Good Afternoon ☀️';
    return 'Good Evening 🌙';
  };

  const attendanceStats = getOverallStats();
  const effectiveCgpa = user?.currentCgpa ?? currentCgpa ?? 8.74;
  const effectiveAttendancePct = attendanceStats.overallPercentage > 0 ? attendanceStats.overallPercentage : 85;
  const effectiveAttendanceStatus: 'Eligible' | 'Warning' | 'Critical' =
    effectiveAttendancePct >= 75 ? 'Eligible' : effectiveAttendancePct >= 65 ? 'Warning' : 'Critical';

  // Dynamic Academic Summary computed from active stores
  const academicSummary: AcademicSummary = {
    cgpa: effectiveCgpa,
    cgpaTrend: '+0.25',
    attendancePercentage: effectiveAttendancePct,
    attendanceStatus: effectiveAttendanceStatus,
    currentSemester: user?.semester || 5,
    totalCreditsEarned: totalCreditsEarned || 112,
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadAcademicRecords();
    loadAttendance();
    loadHistory();
    loadHomeData().finally(() => {
      setRefreshing(false);
    });
  }, []);

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0745E8" translucent />

      {/* Offline Banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Feather name="wifi-off" size={14} color="#FFFFFF" />
          <Text style={styles.offlineText}>You are currently offline. Showing cached dashboard data.</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0745E8']} />
        }
      >
        {/* 1. Header Section */}
        <View style={styles.headerBackground}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerTopRow}>
              {/* Left Aligned Greeting & Academic Details Pill */}
              <View style={styles.greetingWrapper}>
                <Text style={styles.greetingSub}>{getTimeAwareGreeting()}</Text>
                <Text style={styles.userName}>{user?.name || 'Fardeen'}</Text>
                <View style={styles.branchPill}>
                  <Text style={styles.branchPillText}>
                    {user?.branch || 'CSE'} • Sem {user?.semester || 5} • {user?.scheme || '2022'} Scheme
                  </Text>
                </View>
              </View>

              {/* Right Aligned Bell & Avatar */}
              <View style={styles.rightIcons}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.iconCircle}
                  onPress={() => router.push('/notifications' as any)}
                >
                  <Feather name="bell" size={18} color="#FFFFFF" />
                  {unreadCount > 0 && <View style={styles.unreadBadge} />}
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.avatarCircle}
                  onPress={() => router.push('/(tabs)/profile')}
                >
                  <Image
                    source={{
                      uri:
                        user?.avatarUrl ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
                    }}
                    style={styles.avatarImg}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </View>

        {/* Error State Banner */}
        {error && (
          <View style={styles.errorCard}>
            <Feather name="alert-triangle" size={18} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError(null)}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading State Spinner */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0745E8" />
            <Text style={styles.loadingText}>Updating Student Dashboard...</Text>
          </View>
        ) : (
          <View style={styles.bodyContent}>
            {/* 2. Academic Overview */}
            <AcademicOverviewCard summary={academicSummary} />

            {/* 3. Continue Studying */}
            <ContinueStudyingCard history={recentActivity} />

            {/* 4. Quick Access Grid */}
            <QuickAccessGrid />

            {/* 5. Upcoming Academic Events */}
            <UpcomingEventsSection events={events} />

            {/* 6. Latest Notifications */}
            <LatestNotificationsSection
              notifications={
                storeNotifs && storeNotifs.length > 0
                  ? storeNotifs.slice(0, 3).map((n) => ({
                      id: n.id,
                      category: n.category === 'Academic' ? 'VTU Circular' : n.category,
                      title: n.title,
                      description: n.shortMessage,
                      timestamp: n.timestamp,
                      isRead: n.isRead,
                      targetRoute: '/notifications',
                    }))
                  : notifications
              }
            />

            {/* 7. Recently Added Resources */}
            <RecentlyAddedSection resources={recentResources} />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  offlineBanner: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    gap: 8,
  },
  offlineText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    backgroundColor: '#FFFFFF',
  },
  headerBackground: {
    backgroundColor: '#0745E8',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  greetingWrapper: {
    flex: 1,
  },
  greetingSub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  branchPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  branchPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#0745E8',
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 21,
  },
  bodyContent: {
    paddingTop: 16,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 12,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    gap: 10,
  },
  errorText: {
    flex: 1,
    color: '#991B1B',
    fontSize: 13,
  },
  retryText: {
    color: '#0745E8',
    fontWeight: '700',
    fontSize: 13,
  },
});
