import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Header } from '@/shared/components';
import { MOCK_SUBJECTS, MOCK_UNITS } from '../api/notesData';

export const SubjectOverviewScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const subject = MOCK_SUBJECTS.find((s) => s.id === id) || MOCK_SUBJECTS[1];

  return (
    <View style={styles.rootContainer}>
      <Header title={subject.code} showBack />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Subject Header Card */}
        <View style={styles.subjectCard}>
          <View style={styles.topRow}>
            <View style={[styles.iconBox, { backgroundColor: subject.iconBg }]}>
              <Feather name={subject.iconName as any} size={24} color={subject.iconColor} />
            </View>
            <View style={styles.badgeRow}>
              <View style={styles.codeBadge}>
                <Text style={styles.codeBadgeText}>{subject.code}</Text>
              </View>
              <View style={styles.semBadge}>
                <Text style={styles.semBadgeText}>Sem {subject.semester}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.subjectName}>{subject.name}</Text>

          {/* Quick Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{subject.unitCount}</Text>
              <Text style={styles.statLbl}>Units</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{subject.resourceCount}</Text>
              <Text style={styles.statLbl}>Resources</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{subject.progress}%</Text>
              <Text style={styles.statLbl}>Completed</Text>
            </View>
          </View>

          {/* Overall Progress Bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${subject.progress}%` }]} />
          </View>
        </View>

        {/* Units List Section */}
        <Text style={styles.sectionTitle}>Syllabus Units ({MOCK_UNITS.length})</Text>

        <View style={styles.unitsList}>
          {MOCK_UNITS.map((unit) => (
            <TouchableOpacity
              key={unit.id}
              activeOpacity={0.8}
              style={styles.unitCard}
              onPress={() => router.push(`/notes/unit/${unit.id}?subjectId=${subject.id}` as any)}
            >
              <View style={styles.unitHeader}>
                <View style={styles.unitNumberCircle}>
                  <Text style={styles.unitNumberText}>{unit.unitNumber}</Text>
                </View>
                <View style={styles.unitInfo}>
                  <Text style={styles.unitTitle}>Unit {unit.unitNumber}</Text>
                  <Text style={styles.unitResourceCount}>{unit.resourceCount} Notes & PDFs</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#94A3B8" />
              </View>

              <Text style={styles.unitSubtitle}>{unit.title}</Text>

              <View style={styles.unitProgressRow}>
                <View style={styles.unitProgressTrack}>
                  <View style={[styles.unitProgressFill, { width: `${unit.progress}%` }]} />
                </View>
                <Text style={styles.unitProgressText}>{unit.progress}%</Text>
              </View>
            </TouchableOpacity>
          ))}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  subjectCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  codeBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  codeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0745E8',
  },
  semBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  semBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  subjectName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
    lineHeight: 26,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 16,
    borderColor: '#F1F5F9',
    borderWidth: 1,
  },
  statBox: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLbl: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0745E8',
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  unitsList: {
    gap: 12,
  },
  unitCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  unitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  unitNumberCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0745E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  unitNumberText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  unitInfo: {
    flex: 1,
  },
  unitTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  unitResourceCount: {
    fontSize: 12,
    color: '#64748B',
  },
  unitSubtitle: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 12,
  },
  unitProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  unitProgressTrack: {
    flex: 1,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  unitProgressFill: {
    height: '100%',
    backgroundColor: '#0745E8',
    borderRadius: 2.5,
  },
  unitProgressText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
});
