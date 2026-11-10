import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { usePassingPackageStore } from '../store/usePassingPackageStore';
import { NightBeforeCard } from '../components/NightBeforeCard';
import { Header } from '@/shared/components/Header';
import { QuickRevisionList } from '../components/QuickRevisionList';

export const NightBeforeExamScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPackageById, getPackagesForCurrentStudent } = usePassingPackageStore();

  const pkg = getPackageById(id || '') || getPackagesForCurrentStudent()[0];
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  if (!pkg) {
    return (
      <View style={styles.errorRoot}>
        <Text>Package Not Found</Text>
      </View>
    );
  }

  const toggleComplete = (qId: string) => {
    setCompletedIds((prev) =>
      prev.includes(qId) ? prev.filter((item) => item !== qId) : [...prev, qId]
    );
  };

  const sequence = pkg.nightBeforeSequence && pkg.nightBeforeSequence.length > 0
    ? pkg.nightBeforeSequence
    : pkg.importantQuestions || [];
  const progressPercent = sequence.length > 0
    ? Math.round((completedIds.length / sequence.length) * 100)
    : 0;

  const handleStartOrContinue = () => {
    const nextQuestion = sequence.find((q) => !completedIds.includes(q.id)) || sequence[0];
    if (nextQuestion) {
      router.push(`/passing-packages/question/${nextQuestion.id}?pkgId=${pkg.id}` as any);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <Header
        title="1-Night-Before-Exam"
        dark={true}
        showBack={true}
        rightElement={
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setCompletedIds([])}
            accessibilityLabel="Reset revision progress"
          >
            <Feather name="refresh-cw" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Night Before Hero Card */}
        <NightBeforeCard
          highYieldCount={sequence.length}
          estimatedMinutes={Math.max(30, sequence.length * 8)}
          onPressStart={handleStartOrContinue}
        />

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Revision Completion</Text>
            <Text style={styles.progressValue}>
              {completedIds.length}/{sequence.length} Questions ({progressPercent}%)
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        {/* Revision Step Sequence */}
        <View style={styles.sequenceHeader}>
          <Text style={styles.sequenceTitle}>Focused Revision Sequence</Text>
          <Text style={styles.sequenceSub}>Tap questions to mark as revised</Text>
        </View>

        {sequence.length > 0 ? (
          <QuickRevisionList
            questions={sequence}
            completedIds={completedIds}
            onToggleComplete={toggleComplete}
            onPressQuestion={(q) =>
              router.push(`/passing-packages/question/${q.id}?pkgId=${pkg.id}` as any)
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Feather name="book-open" size={36} color="#64748B" />
            <Text style={styles.emptyText}>No high-yield questions found for this package.</Text>
          </View>
        )}
      </ScrollView>

      {/* Floating CTA */}
      {sequence.length > 0 && (
        <View style={styles.floatingBar}>
          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.floatingCta}
            onPress={handleStartOrContinue}
          >
            <Feather name="play" size={18} color="#0F172A" />
            <Text style={styles.floatingCtaText}>
              {completedIds.length > 0 && completedIds.length < sequence.length
                ? 'Continue Revision Sequence'
                : 'Start Quick Revision Sequence'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  errorRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  progressContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#1E293B',
    padding: 14,
    borderRadius: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#34D399',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#334155',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34D399',
    borderRadius: 4,
  },
  sequenceHeader: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sequenceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sequenceSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  floatingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  floatingCta: {
    backgroundColor: '#34D399',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  floatingCtaText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
