import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Header } from '@/shared/components';
import { StatusBar } from 'react-native';
import { fetchSubjectsFromApi, fetchNotesFromApi } from '../api/notesApi';
import { Subject } from '../types/notes.types';
import { useAuthStore } from '@/store';

export const SubjectOverviewScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const user = useAuthStore((state) => state.user);

  const [subject, setSubject] = useState<Subject | null>(null);
  const [unitCounts, setUnitCounts] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadSubjectData = async () => {
      try {
        const subjects = await fetchSubjectsFromApi({
          semester: user?.semester,
          branchCode: user?.branch,
          schemeYear: user?.scheme,
        });

        const found = subjects.find((s) => s.id === id || s.code === id) || subjects[0] || null;
        if (isMounted) {
          setSubject(found);
        }

        if (found) {
          const notes = await fetchNotesFromApi({ subjectCode: found.code });
          const counts: Record<number, number> = {};
          notes.forEach((n) => {
            const u = n.unitNumber || 1;
            counts[u] = (counts[u] || 0) + 1;
          });
          if (isMounted) {
            setUnitCounts(counts);
          }
        }
      } catch (err) {
        console.warn('[SubjectOverviewScreen] Error loading subject:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadSubjectData();
    return () => {
      isMounted = false;
    };
  }, [id, user?.semester, user?.branch, user?.scheme]);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0745E8" />
        <Header title="Subject Overview" dark={true} showBack={true} />
        <ActivityIndicator size="large" color="#0745E8" />
        <Text style={styles.loadingText}>Loading subject syllabus...</Text>
      </View>
    );
  }

  if (!subject) {
    return (
      <View style={styles.centerContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0745E8" />
        <Header title="Subject Overview" dark={true} showBack={true} />
        <Feather name="book-open" size={40} color="#CBD5E1" />
        <Text style={styles.emptyTitle}>Subject Not Found</Text>
        <Text style={styles.emptySub}>
          This subject is not currently assigned to your branch or semester master data.
        </Text>
      </View>
    );
  }

  const standardUnits = [1, 2, 3, 4, 5].map((u) => ({
    id: `unit-${u}`,
    unitNumber: u,
    title: `Module ${u}: Core Syllabus Unit`,
    resourceCount: unitCounts[u] || 0,
  }));

  const totalResources = Object.values(unitCounts).reduce((a, b) => a + b, 0);

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0745E8" />
      <Header
        title={subject.code ? `${subject.code} Overview` : 'Subject Overview'}
        dark={true}
        showBack={true}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Subject Header Card */}
        <View style={styles.subjectCard}>
          <View style={styles.topRow}>
            <View style={[styles.iconBox, { backgroundColor: subject.iconBg || '#EEF2FF' }]}>
              <Feather name="book" size={24} color={subject.iconColor || '#0745E8'} />
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
              <Text style={styles.statVal}>5</Text>
              <Text style={styles.statLbl}>Units</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{totalResources}</Text>
              <Text style={styles.statLbl}>Resources</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{subject.branch}</Text>
              <Text style={styles.statLbl}>Branch</Text>
            </View>
          </View>
        </View>

        {/* Units List Section */}
        <Text style={styles.sectionTitle}>Syllabus Units (5 Modules)</Text>

        <View style={styles.unitsList}>
          {standardUnits.map((unit) => (
            <TouchableOpacity
              key={unit.id}
              activeOpacity={0.8}
              style={styles.unitCard}
              onPress={() =>
                router.push(
                  `/notes/unit/${unit.unitNumber}?subjectId=${subject.id}&subjectCode=${subject.code}&subjectName=${encodeURIComponent(
                    subject.name
                  )}` as any
                )
              }
            >
              <View style={styles.unitHeader}>
                <View style={styles.unitNumberCircle}>
                  <Text style={styles.unitNumberText}>{unit.unitNumber}</Text>
                </View>
                <View style={styles.unitInfo}>
                  <Text style={styles.unitTitle}>Module {unit.unitNumber}</Text>
                  <Text style={styles.unitResourceCount}>
                    {unit.resourceCount} {unit.resourceCount === 1 ? 'Resource' : 'Resources'} uploaded
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color="#94A3B8" />
              </View>

              <Text style={styles.unitSubtitle}>{unit.title}</Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySub: {
    marginTop: 6,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
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
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  codeBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  codeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0745E8',
  },
  semBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  semBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  subjectName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  unitsList: {
    gap: 12,
  },
  unitCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  unitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  unitNumberCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unitNumberText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0745E8',
  },
  unitInfo: {
    flex: 1,
  },
  unitTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  unitResourceCount: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  unitSubtitle: {
    fontSize: 12,
    color: '#475569',
    marginTop: 8,
  },
});
