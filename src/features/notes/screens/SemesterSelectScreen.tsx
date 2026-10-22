import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Header } from '@/shared/components';
import { useAuthStore } from '@/store';

export const SemesterSelectScreen: React.FC = () => {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const currentSem = user?.semester || 5;

  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  const handleSelectSemester = (sem: number) => {
    if (user) {
      setAuth(
        {
          ...user,
          semester: sem,
        },
        'mock_token_123'
      );
    }
    router.back();
  };

  return (
    <View style={styles.rootContainer}>
      <Header title="Select Semester" showBack />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerSubtitle}>
          Choose a semester to view department curriculum notes and syllabus.
        </Text>

        <View style={styles.grid}>
          {semesters.map((sem) => {
            const isCurrent = sem === currentSem;
            return (
              <TouchableOpacity
                key={sem}
                activeOpacity={0.8}
                style={[styles.semCard, isCurrent && styles.activeSemCard]}
                onPress={() => handleSelectSemester(sem)}
              >
                <View style={styles.semHeaderRow}>
                  <View style={[styles.semIconBox, isCurrent && styles.activeSemIconBox]}>
                    <Feather name="book-open" size={20} color={isCurrent ? '#FFFFFF' : '#0745E8'} />
                  </View>
                  {isCurrent && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>Current</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.semTitle, isCurrent && styles.activeSemTitle]}>
                  Semester {sem}
                </Text>
                <Text style={[styles.semSub, isCurrent && styles.activeSemSub]}>
                  {sem <= 2 ? 'Physics / Chemistry Cycle' : 'Core Branch Subjects'}
                </Text>

                <View style={styles.cardFooter}>
                  <Text style={[styles.resourceCount, isCurrent && styles.activeResourceCount]}>
                    5 Subjects
                  </Text>
                  <Feather
                    name="chevron-right"
                    size={16}
                    color={isCurrent ? '#FFFFFF' : '#94A3B8'}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
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
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 20,
    lineHeight: 18,
  },
  grid: {
    gap: 14,
  },
  semCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  activeSemCard: {
    backgroundColor: '#0745E8',
    borderColor: '#0745E8',
    shadowColor: '#0745E8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  semHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  semIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeSemIconBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  activeBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0745E8',
  },
  semTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  activeSemTitle: {
    color: '#FFFFFF',
  },
  semSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },
  activeSemSub: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
  },
  resourceCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  activeResourceCount: {
    color: 'rgba(255, 255, 255, 0.9)',
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
});
