import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Header } from '@/shared/components';
import { useAcademicRecordStore } from '../store/useAcademicRecordStore';
import { useAuthStore } from '@/store';
import { useAttendanceStore } from '@/features/attendance/store/useAttendanceStore';

const { width: screenWidth } = Dimensions.get('window');
const CARD_GAP = 14;
const HORIZONTAL_PADDING = 20;
const CARD_WIDTH = (screenWidth - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;

export const ToolsScreen: React.FC = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { currentCgpa, loadAcademicRecords } = useAcademicRecordStore();
  const { subjects, getOverallStats } = useAttendanceStore();
  const { overallPercentage } = getOverallStats();

  useEffect(() => {
    loadAcademicRecords();
  }, []);

  const tools = [
    {
      id: 'cgpa',
      title: 'CGPA Calc',
      subtitle: 'All Semesters',
      badge: currentCgpa > 0 ? `${currentCgpa.toFixed(2)} CGPA` : 'VTU Scale',
      icon: 'bar-chart-2' as const,
      color: '#0745E8',
      bgColor: '#EEF2FF',
      badgeBg: '#E0E7FF',
      route: '/calculators/cgpa' as const,
    },
    {
      id: 'sgpa',
      title: 'SGPA Calc',
      subtitle: 'Course Grades',
      badge: `Sem ${user?.semester || 5} Active`,
      icon: 'cpu' as const,
      color: '#7C3AED',
      bgColor: '#F5F3FF',
      badgeBg: '#EDE9FE',
      route: '/calculators/sgpa' as const,
    },
    {
      id: 'attendance',
      title: 'Attendance',
      subtitle: 'Safe Bunk Calc',
      badge: subjects.length > 0 ? `${overallPercentage}% Avg` : '85% Target',
      icon: 'calendar' as const,
      color: '#059669',
      bgColor: '#ECFDF5',
      badgeBg: '#D1FAE5',
      route: '/calculators/attendance' as const,
    },
    {
      id: 'predictor',
      title: 'Grade Predictor',
      subtitle: 'What-If Simulator',
      badge: user?.targetCgpa ? `Goal ${user.targetCgpa}` : 'Roadmap',
      icon: 'target' as const,
      color: '#D97706',
      bgColor: '#FFFBEB',
      badgeBg: '#FEF3C7',
      route: '/calculators/goal-planner' as const,
    },
  ];

  return (
    <View style={styles.rootContainer}>
      <Header title="Calculators & Tools" showBack={false} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section Intro Pill */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Academic Utilities</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>4 Modular Tools</Text>
          </View>
        </View>

        {/* 2x2 Square Grid Container */}
        <View style={styles.gridContainer}>
          {tools.map((tool) => (
            <TouchableOpacity
              key={tool.id}
              activeOpacity={0.82}
              style={[styles.squareCard, { width: CARD_WIDTH }]}
              onPress={() => router.push(tool.route as any)}
            >
              {/* Card Top Row: Icon + Badge */}
              <View style={styles.cardTopRow}>
                <View style={[styles.iconBox, { backgroundColor: tool.bgColor }]}>
                  <Feather name={tool.icon} size={22} color={tool.color} />
                </View>
                <View style={[styles.pillBadge, { backgroundColor: tool.badgeBg }]}>
                  <Text style={[styles.pillBadgeText, { color: tool.color }]} numberOfLines={1}>
                    {tool.badge}
                  </Text>
                </View>
              </View>

              {/* Card Bottom Content */}
              <View style={styles.cardBottom}>
                <Text style={styles.toolTitle} numberOfLines={1}>
                  {tool.title}
                </Text>
                <Text style={styles.toolSubtitle} numberOfLines={1}>
                  {tool.subtitle}
                </Text>
              </View>

              {/* Bottom Subtle Corner Accent */}
              <View style={styles.cardArrowRow}>
                <View style={[styles.accentDot, { backgroundColor: tool.color }]} />
                <Feather name="arrow-up-right" size={16} color={tool.color} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Academic Overview Quick Snapshot Banner */}
        <View style={styles.snapshotBanner}>
          <View style={styles.snapshotHeader}>
            <View style={styles.snapshotTitleRow}>
              <Feather name="shield" size={18} color="#0745E8" />
              <Text style={styles.snapshotTitle}>Academic Status Snapshot</Text>
            </View>
            <Text style={styles.snapshotSemBadge}>
              Semester {user?.semester || 5} • {user?.branchCode || 'CSE'}
            </Text>
          </View>

          <View style={styles.snapshotStatsRow}>
            <View style={styles.snapshotStat}>
              <Text style={styles.statLabel}>Current CGPA</Text>
              <Text style={styles.statValue}>
                {currentCgpa > 0 ? currentCgpa.toFixed(2) : '—'}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.snapshotStat}>
              <Text style={styles.statLabel}>Target CGPA</Text>
              <Text style={styles.statValue}>
                {user?.targetCgpa ? Number(user.targetCgpa).toFixed(2) : '9.00'}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.snapshotStat}>
              <Text style={styles.statLabel}>Avg Attendance</Text>
              <Text
                style={[
                  styles.statValue,
                  { color: overallPercentage >= 75 ? '#059669' : '#DC2626' },
                ]}
              >
                {subjects.length > 0 ? `${overallPercentage}%` : '85%'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 12,
    paddingBottom: 40,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  countBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: CARD_GAP,
    marginBottom: 24,
  },
  squareCard: {
    aspectRatio: 1.0,
    minHeight: 156,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    maxWidth: '52%',
  },
  pillBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  cardBottom: {
    marginTop: 8,
  },
  toolTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 3,
  },
  toolSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  cardArrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  accentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  snapshotBanner: {
    backgroundColor: '#F8FAFC',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    gap: 14,
  },
  snapshotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  snapshotTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  snapshotTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  snapshotSemBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  snapshotStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  snapshotStat: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
});
