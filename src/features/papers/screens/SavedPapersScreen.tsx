import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { usePaperStore } from '../store/usePaperStore';
import { PaperCard } from '../components/PaperCard';
import { PaperPreviewModal } from '../components/PaperPreviewModal';
import { QuestionPaper } from '../types/paper.types';
import { Header } from '@/shared/components/Header';
import { StatusBar } from 'react-native';

export const SavedPapersScreen: React.FC = () => {
  const router = useRouter();
  const {
    papers,
    bookmarkedIds,
    downloadedIds,
    activeTab,
    setActiveTab,
    removeDownload,
  } = usePaperStore();

  const [previewPaper, setPreviewPaper] = useState<QuestionPaper | null>(null);

  const downloadedPapers = papers.filter((p) => downloadedIds.includes(p.id));
  const bookmarkedPapers = papers.filter((p) => bookmarkedIds.includes(p.id));

  let displayPapers: QuestionPaper[] = [];
  if (activeTab === 'Downloaded') {
    displayPapers = downloadedPapers;
  } else if (activeTab === 'Bookmarked') {
    displayPapers = bookmarkedPapers;
  } else {
    // All saved (Downloaded + Bookmarked merged)
    const combinedIds = [...new Set([...downloadedIds, ...bookmarkedIds])];
    displayPapers = papers.filter((p) => combinedIds.includes(p.id));
  }

  // Calculated storage size for downloaded papers
  const totalStorageMb = downloadedPapers.length * 2.4;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0745E8" />
      <Header title="Saved Papers" dark={true} showBack={true} />

      <View style={styles.subHeaderContainer}>
        {/* Storage Footprint Banner */}
        <View style={styles.storageCard}>
          <View style={styles.storageLeft}>
            <View style={styles.storageIconBox}>
              <Feather name="hard-drive" size={18} color="#059669" />
            </View>
            <View>
              <Text style={styles.storageTitle}>
                {downloadedPapers.length} Papers Saved Offline
              </Text>
              <Text style={styles.storageSub}>
                {totalStorageMb.toFixed(1)} MB storage used • Accessible without internet
              </Text>
            </View>
          </View>
        </View>

        {/* Tab Segment Selector */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.tabItem, activeTab === 'All' && styles.tabItemActive]}
            onPress={() => setActiveTab('All')}
          >
            <Text style={[styles.tabText, activeTab === 'All' && styles.tabTextActive]}>
              All Saved ({downloadedIds.length + bookmarkedIds.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.tabItem, activeTab === 'Downloaded' && styles.tabItemActive]}
            onPress={() => setActiveTab('Downloaded')}
          >
            <Text style={[styles.tabText, activeTab === 'Downloaded' && styles.tabTextActive]}>
              Downloaded ({downloadedIds.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.tabItem, activeTab === 'Bookmarked' && styles.tabItemActive]}
            onPress={() => setActiveTab('Bookmarked')}
          >
            <Text style={[styles.tabText, activeTab === 'Bookmarked' && styles.tabTextActive]}>
              Bookmarked ({bookmarkedIds.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {displayPapers.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Feather name="folder-minus" size={32} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>No Saved Papers Yet</Text>
            <Text style={styles.emptySub}>
              Download question papers to study offline or bookmark them for quick exam preparation.
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.browseBtn}
              onPress={() => router.push('/papers')}
            >
              <Text style={styles.browseBtnText}>Browse Question Papers</Text>
            </TouchableOpacity>
          </View>
        ) : (
          displayPapers.map((paper) => (
            <PaperCard
              key={paper.id}
              paper={paper}
              onPreview={(p) => setPreviewPaper(p)}
              onDownload={(p) => setPreviewPaper(p)}
              onPressCard={(p) => setPreviewPaper(p)}
            />
          ))
        )}
      </ScrollView>

      {/* Paper Previewer Modal */}
      <PaperPreviewModal
        paper={previewPaper}
        visible={!!previewPaper}
        onClose={() => setPreviewPaper(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  subHeaderContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerSafeArea: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
  },
  storageCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  storageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  storageIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storageTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  storageSub: {
    fontSize: 11,
    color: '#047857',
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0745E8',
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  browseBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#0745E8',
    borderRadius: 12,
  },
  browseBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
