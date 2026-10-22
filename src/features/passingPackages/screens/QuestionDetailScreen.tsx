import React from 'react';
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
import { QuestionPriorityBadge } from '../components/QuestionPriorityBadge';
import { QuestionFrequencyBadge } from '../components/QuestionFrequencyBadge';
import { BookmarkButton } from '../components/BookmarkButton';
import * as ScreenCapture from 'expo-screen-capture';

export const QuestionDetailScreen: React.FC = () => {
  const router = useRouter();
  const { id, pkgId } = useLocalSearchParams<{ id: string; pkgId?: string }>();
  const {
    getQuestionById,
    getPackageById,
    getPackagesForCurrentStudent,
    bookmarkedQuestionIds,
    toggleQuestionBookmark,
  } = usePassingPackageStore();

  React.useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync().catch(() => {});
    return () => {
      ScreenCapture.allowScreenCaptureAsync().catch(() => {});
    };
  }, []);

  const currentPkg = getPackageById(pkgId || '') || getPackagesForCurrentStudent()[0];
  const result = getQuestionById(currentPkg?.id || '', id || '');

  const question = result?.question || currentPkg?.importantQuestions[0];
  const pkg = result?.pkg || currentPkg;

  if (!question || !pkg) {
    return (
      <View style={styles.errorRoot}>
        <Text>Question details not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: '#0745E8', marginTop: 10 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isBookmarked = bookmarkedQuestionIds.includes(question.id);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={20} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>Question Analysis</Text>
            <Text style={styles.headerSub}>{pkg.subjectCode} • Unit {question.unitNumber}</Text>
          </View>

          <BookmarkButton
            isBookmarked={isBookmarked}
            onPress={() => toggleQuestionBookmark(question.id)}
            size={18}
          />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Badges Strip */}
        <View style={styles.badgeStrip}>
          <QuestionPriorityBadge priority={question.priority} />
          {question.frequency && <QuestionFrequencyBadge frequency={question.frequency} />}
          {question.marks && (
            <View style={styles.marksPill}>
              <Feather name="award" size={12} color="#0745E8" />
              <Text style={styles.marksPillText}>{question.marks} Marks</Text>
            </View>
          )}
        </View>

        {/* Full Question Statement */}
        <View style={styles.questionCard}>
          <Text style={styles.unitHeader}>Unit {question.unitNumber}: {question.unitTitle}</Text>
          <Text style={styles.questionText}>{question.questionText}</Text>
        </View>

        {/* Historical VTU Exam Occurrences */}
        {question.sourceYears && question.sourceYears.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.cardHeader}>
              <Feather name="clock" size={16} color="#7C3AED" />
              <Text style={styles.cardTitle}>VTU Exam History</Text>
            </View>
            <View style={styles.yearsGrid}>
              {question.sourceYears.map((yr, idx) => (
                <View key={idx} style={styles.yearChip}>
                  <Feather name="calendar" size={11} color="#6D28D9" />
                  <Text style={styles.yearChipText}>{yr}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Answer Structure & Solution Snippet */}
        {question.solutionSnippet && (
          <View style={styles.sectionCard}>
            <View style={styles.cardHeader}>
              <Feather name="file-text" size={16} color="#0745E8" />
              <Text style={styles.cardTitle}>Expected Answer Outline</Text>
            </View>
            <Text style={styles.snippetText}>{question.solutionSnippet}</Text>
          </View>
        )}

        {/* Key Points Checklist */}
        {question.keyPoints && question.keyPoints.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.cardHeader}>
              <Feather name="check-square" size={16} color="#059669" />
              <Text style={styles.cardTitle}>Must-Include Points in Answer</Text>
            </View>
            {question.keyPoints.map((point, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{point}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Diagram Requirement */}
        {question.diagramAvailable && (
          <View style={styles.diagramCard}>
            <View style={styles.cardHeader}>
              <Feather name="image" size={16} color="#059669" />
              <Text style={styles.cardTitle}>Mandatory Diagram</Text>
            </View>
            <Text style={styles.diagramSub}>
              {question.diagramTitle || 'Compulsory block diagram for full 10 marks allocation'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer Navigation Bar */}
      <View style={styles.bottomBar}>
        {question.relatedNoteId ? (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.actionBtnPrimary}
            onPress={() => router.push(`/notes/${question.relatedNoteId}` as any)}
          >
            <Feather name="book-open" size={16} color="#FFFFFF" />
            <Text style={styles.actionBtnPrimaryText}>Read Related Notes PDF</Text>
          </TouchableOpacity>
        ) : question.relatedPaperId ? (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.actionBtnPrimary}
            onPress={() => router.push(`/papers/${question.relatedPaperId}` as any)}
          >
            <Feather name="file-text" size={16} color="#FFFFFF" />
            <Text style={styles.actionBtnPrimaryText}>View Full PYQ Paper</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.actionBtnSecondary}
            onPress={() => router.push(`/passing-packages/revision/${pkg.id}` as any)}
          >
            <Feather name="zap" size={16} color="#0745E8" />
            <Text style={styles.actionBtnSecondaryText}>View Quick Revision Notes</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  errorRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  safeTop: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  badgeStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  marksPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  marksPillText: {
    color: '#0745E8',
    fontSize: 12,
    fontWeight: '700',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  unitHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0745E8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  questionText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 25,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  yearsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  yearChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  yearChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6D28D9',
  },
  snippetText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
    marginTop: 6,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  diagramCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  diagramSub: {
    fontSize: 13,
    color: '#047857',
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  actionBtnPrimary: {
    backgroundColor: '#0745E8',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  actionBtnSecondary: {
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnSecondaryText: {
    color: '#0745E8',
    fontSize: 15,
    fontWeight: '800',
  },
});
