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
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { usePassingPackageStore } from '../store/usePassingPackageStore';
import { useSavedStore } from '@/features/saved/store/useSavedStore';
import { Header } from '@/shared/components/Header';
import { ImportantQuestionCard } from '../components/ImportantQuestionCard';
import { RevisionResourceCard } from '../components/RevisionResourceCard';

export const SavedPackagesScreen: React.FC = () => {
  const router = useRouter();
  const {
    getPackagesForCurrentStudent,
    bookmarkedQuestionIds,
    toggleQuestionBookmark,
  } = usePassingPackageStore();
  const { items, toggleBookmark, toggleDownload } = useSavedStore();

  const [activeTab, setActiveTab] = useState<'Bookmarked Qs' | 'Offline PDFs'>('Bookmarked Qs');

  const packages = getPackagesForCurrentStudent();
  const allQuestions = packages.flatMap((p) => [
    ...p.importantQuestions,
    ...p.repeatedQuestions,
    ...p.expectedQuestions,
  ]);

  const bookmarkedQuestions = allQuestions.filter((q) =>
    bookmarkedQuestionIds.includes(q.id)
  );

  const downloadedResources = packages.flatMap((p) =>
    p.revisionResources.filter((r) => {
      const item = items.find((i) => i.id === r.id);
      return item ? item.isDownloaded : r.isDownloaded;
    })
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0745E8" />
      <Header title="Saved Packages" dark={true} showBack={true} />

      <View style={styles.tabWrapper}>
        {/* Tab Switcher */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.tab, activeTab === 'Bookmarked Qs' && styles.tabActive]}
            onPress={() => setActiveTab('Bookmarked Qs')}
          >
            <Text style={[styles.tabText, activeTab === 'Bookmarked Qs' && styles.tabTextActive]}>
              Bookmarked Qs ({bookmarkedQuestions.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.tab, activeTab === 'Offline PDFs' && styles.tabActive]}
            onPress={() => setActiveTab('Offline PDFs')}
          >
            <Text style={[styles.tabText, activeTab === 'Offline PDFs' && styles.tabTextActive]}>
              Offline Revision PDFs ({downloadedResources.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'Bookmarked Qs' ? (
          bookmarkedQuestions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Feather name="bookmark" size={32} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Bookmarked Questions Yet</Text>
              <Text style={styles.emptySub}>
                Bookmark high-priority questions while studying to quickly review them before your exam.
              </Text>
            </View>
          ) : (
            bookmarkedQuestions.map((q) => (
              <ImportantQuestionCard
                key={q.id}
                question={q}
                isBookmarked={true}
                onToggleBookmark={() => toggleQuestionBookmark(q.id)}
                onPressQuestion={() =>
                  router.push(`/passing-packages/question/${q.id}` as any)
                }
              />
            ))
          )
        ) : downloadedResources.length === 0 ? (
          <View style={styles.emptyCard}>
            <Feather name="download-cloud" size={32} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Offline Revision PDFs</Text>
            <Text style={styles.emptySub}>
              Download formula cheat-sheets and last-minute revision PDFs to access them offline without internet.
            </Text>
          </View>
        ) : (
          downloadedResources.map((res) => {
            const savedItem = items.find((i) => i.id === res.id);
            const isDownloaded = savedItem ? savedItem.isDownloaded : !!res.isDownloaded;
            const isBookmarked = savedItem ? savedItem.isBookmarked : !!res.isBookmarked;

            return (
              <RevisionResourceCard
                key={res.id}
                resource={res}
                isDownloaded={isDownloaded}
                isBookmarked={isBookmarked}
                onToggleDownload={() => toggleDownload(res.id)}
                onToggleBookmark={() => toggleBookmark(res.id)}
                onPress={() =>
                  router.push(`/passing-packages/pdf/${res.id}` as any)
                }
              />
            );
          })
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
  tabWrapper: {
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
  },
  tabActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#0745E8',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  tabTextActive: {
    color: '#0745E8',
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 30,
    alignItems: 'center',
    marginTop: 30,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
