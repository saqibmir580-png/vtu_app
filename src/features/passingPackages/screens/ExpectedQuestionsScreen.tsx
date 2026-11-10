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
import { ExpectedQuestionCard } from '../components/ExpectedQuestionCard';
import { QuestionPriority } from '../types/passingPackages.types';
import { Header } from '@/shared/components/Header';

export const ExpectedQuestionsScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    getPackageById,
    getPackagesForCurrentStudent,
    bookmarkedQuestionIds,
    toggleQuestionBookmark,
  } = usePassingPackageStore();

  const pkg = getPackageById(id || '') || getPackagesForCurrentStudent()[0];
  const [activePriorityTab, setActivePriorityTab] = useState<QuestionPriority | 'All'>('All');

  if (!pkg) {
    return (
      <View style={styles.errorRoot}>
        <Text>Package Not Found</Text>
      </View>
    );
  }

  const filteredQuestions = pkg.expectedQuestions.filter((q) => {
    if (activePriorityTab !== 'All' && q.priority !== activePriorityTab) return false;
    return true;
  });

  const priorityTabs: (QuestionPriority | 'All')[] = [
    'All',
    'Very High Priority',
    'High Priority',
    'Medium Priority',
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0745E8" />
      <Header
        title="Most Expected Questions"
        dark={true}
        showBack={true}
      />

      <View style={styles.tabsWrapper}>
        {/* Priority Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {priorityTabs.map((p) => {
            const isSelected = activePriorityTab === p;
            return (
              <TouchableOpacity
                key={p}
                activeOpacity={0.8}
                style={[styles.tab, isSelected && styles.tabSelected]}
                onPress={() => setActivePriorityTab(p)}
              >
                <Text style={[styles.tabText, isSelected && styles.tabTextSelected]}>
                  {p}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Responsible Disclaimer Header */}
        <View style={styles.disclaimerCard}>
          <Feather name="shield" size={18} color="#0745E8" />
          <View style={styles.disclaimerTextWrapper}>
            <Text style={styles.disclaimerTitle}>Suggested Focus Areas</Text>
            <Text style={styles.disclaimerSub}>
              Curated by analyzing module blueprint trends and recent VTU schemes. Never guaranteed, but highly recommended for thorough revision.
            </Text>
          </View>
        </View>

        {filteredQuestions.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No questions in this priority tier</Text>
          </View>
        ) : (
          filteredQuestions.map((q) => (
            <ExpectedQuestionCard
              key={q.id}
              question={q}
              isBookmarked={bookmarkedQuestionIds.includes(q.id)}
              onToggleBookmark={() => toggleQuestionBookmark(q.id)}
              onPressQuestion={() =>
                router.push(`/passing-packages/question/${q.id}?pkgId=${pkg.id}` as any)
              }
            />
          ))
        )}
      </ScrollView>
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
  tabsWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingTop: 10,
  },
  tabsRow: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  tab: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tabSelected: {
    backgroundColor: '#0745E8',
    borderColor: '#0745E8',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  tabTextSelected: {
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
  },
  disclaimerCard: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  disclaimerTextWrapper: {
    flex: 1,
  },
  disclaimerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0745E8',
  },
  disclaimerSub: {
    fontSize: 12,
    color: '#1E40AF',
    marginTop: 2,
    lineHeight: 16,
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    color: '#64748B',
  },
});
