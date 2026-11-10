import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/store';
import { usePaperStore } from '../store/usePaperStore';
import { PaperCard } from '../components/PaperCard';
import { PaperFilterSheet } from '../components/PaperFilterSheet';
import { PaperPreviewModal } from '../components/PaperPreviewModal';
import { DownloadProgressModal } from '../components/DownloadProgressModal';
import { PaperSkeleton } from '../components/PaperSkeleton';
import { QuestionPaper } from '../types/paper.types';
import { Header } from '@/shared/components/Header';

export const PapersHomeScreen: React.FC = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const {
    activeFilters,
    setFilters,
    initFiltersFromProfile,
    getFilteredPapers,
    startDownload,
    downloadedIds,
    bookmarkedIds,
    papers,
    loadPapersFromBackend,
  } = usePaperStore();

  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [selectedPreviewPaper, setSelectedPreviewPaper] = useState<QuestionPaper | null>(null);
  const [downloadModalPaper, setDownloadModalPaper] = useState<QuestionPaper | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeChip, setActiveChip] = useState('All');

  useEffect(() => {
    loadPapersFromBackend();
    if (user) {
      initFiltersFromProfile({
        branch: user.branch,
        semester: user.semester,
        scheme: user.scheme,
      });
    }
  }, [user]);

  const quickFilterChips = ['All', 'Regular', 'Makeup', 'Model', '2022 Scheme', 'Saved'];

  const handleChipSelect = (chip: string) => {
    setActiveChip(chip);
    if (chip === 'All') {
      setFilters({ paperType: 'All', scheme: 'All' });
      usePaperStore.getState().setActiveTab('All');
    } else if (chip === 'Saved') {
      router.push('/papers/saved' as any);
    } else if (chip === '2022 Scheme') {
      setFilters({ scheme: '2022' });
    } else {
      setFilters({ paperType: chip });
    }
  };

  const filteredPapers = getFilteredPapers();
  const recentPapers = papers.slice(0, 3);

  const handleDownloadTrigger = (paper: QuestionPaper) => {
    startDownload(paper.id);
    setDownloadModalPaper(paper);
  };

  const handlePaperPress = (paper: QuestionPaper) => {
    router.push({
      pathname: '/papers/[id]',
      params: { id: paper.id },
    });
  };

  const countActiveFilters = () => {
    let c = 0;
    if (activeFilters.scheme !== 'All') c++;
    if (activeFilters.branch !== 'All') c++;
    if (activeFilters.semester !== 'All') c++;
    if (activeFilters.paperType !== 'All') c++;
    if (activeFilters.year !== 'All') c++;
    return c;
  };
  const activeFilterCount = countActiveFilters();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0745E8" />

      {/* Unified Custom Header */}
      <Header
        title="Question Papers"
        dark={true}
        showBack={true}
        rightElement={
          <View style={styles.headerActions}>
            {/* Saved Papers Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.headerIconBtn}
              onPress={() => router.push('/papers/saved' as any)}
            >
              <Feather name="folder" size={18} color="#FFFFFF" />
              {downloadedIds.length > 0 && <View style={styles.badgeDot} />}
            </TouchableOpacity>

            {/* Filter Drawer Launcher */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.headerIconBtn, activeFilterCount > 0 && styles.activeFilterIconBtn]}
              onPress={() => setFilterSheetVisible(true)}
            >
              <Feather
                name="sliders"
                size={18}
                color="#FFFFFF"
              />
              {activeFilterCount > 0 && (
                <View style={styles.filterCountBadge}>
                  <Text style={styles.filterCountText}>{activeFilterCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        }
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={18} color="#64748B" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by subject name, code (e.g. 21CS52)..."
          placeholderTextColor="#94A3B8"
          value={activeFilters.searchQuery}
          onChangeText={(text) => setFilters({ searchQuery: text })}
        />
        {activeFilters.searchQuery !== '' && (
          <TouchableOpacity onPress={() => setFilters({ searchQuery: '' })}>
            <Feather name="x-circle" size={16} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Student Profile Default Banner */}
        <View style={styles.profileBanner}>
          <View style={styles.profileBannerLeft}>
            <View style={styles.profileBadgeIcon}>
              <Feather name="shield" size={18} color="#0745E8" />
            </View>
            <View style={styles.profileBannerTextGroup}>
              <Text style={styles.profileBannerTitle}>
                Filtered for Sem {user?.semester || 5} {user?.branch || 'CSE'}
              </Text>
              <Text style={styles.profileBannerSub}>
                {user?.scheme || '2022'} Scheme • Tailored to your active syllabus
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editFilterBtn}
            onPress={() => setFilterSheetVisible(true)}
          >
            <Text style={styles.editFilterText}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Filter Chips Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {quickFilterChips.map((chip) => {
            const isSelected = activeChip === chip;
            return (
              <TouchableOpacity
                key={chip}
                activeOpacity={0.8}
                style={[styles.quickChip, isSelected && styles.quickChipActive]}
                onPress={() => handleChipSelect(chip)}
              >
                <Text style={[styles.quickChipText, isSelected && styles.quickChipTextActive]}>
                  {chip}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Recently Viewed / Downloaded Quick Cards */}
        {recentPapers.length > 0 && activeFilters.searchQuery === '' && (
          <View style={styles.sectionWrapper}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Question Papers</Text>
              <TouchableOpacity onPress={() => router.push('/papers/saved' as any)}>
                <Text style={styles.viewAllText}>View Saved</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentScroll}
            >
              {recentPapers.map((paper) => (
                <TouchableOpacity
                  key={paper.id}
                  activeOpacity={0.85}
                  style={styles.recentCard}
                  onPress={() => setSelectedPreviewPaper(paper)}
                >
                  <View style={styles.recentCardTop}>
                    <Text style={styles.recentCode}>{paper.subjectCode}</Text>
                    <View style={styles.recentTypeBadge}>
                      <Text style={styles.recentTypeText}>{paper.paperType}</Text>
                    </View>
                  </View>
                  <Text style={styles.recentSubject} numberOfLines={1}>
                    {paper.subjectName}
                  </Text>
                  <Text style={styles.recentYear}>{paper.month} {paper.year}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Main Feed Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            Question Papers ({filteredPapers.length})
          </Text>
          {activeFilterCount > 0 && (
            <TouchableOpacity onPress={() => usePaperStore.getState().resetFilters(user || undefined)}>
              <Text style={styles.clearFiltersText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <>
            <PaperSkeleton />
            <PaperSkeleton />
            <PaperSkeleton />
          </>
        ) : filteredPapers.length === 0 ? (
          /* Empty State */
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Feather name="file-text" size={32} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>No Question Papers Found</Text>
            <Text style={styles.emptySub}>
              Try clearing search terms or selecting different filters in the bottom sheet.
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.emptyResetBtn}
              onPress={() => usePaperStore.getState().resetFilters(user || undefined)}
            >
              <Text style={styles.emptyResetBtnText}>Reset All Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Papers Cards List */
          filteredPapers.map((paper) => (
            <PaperCard
              key={paper.id}
              paper={paper}
              onPreview={(p) => setSelectedPreviewPaper(p)}
              onDownload={(p) => handleDownloadTrigger(p)}
              onPressCard={(p) => handlePaperPress(p)}
            />
          ))
        )}
      </ScrollView>

      {/* Filter Bottom Sheet */}
      <PaperFilterSheet
        visible={filterSheetVisible}
        onClose={() => setFilterSheetVisible(false)}
      />

      {/* Interactive Document Preview Modal */}
      <PaperPreviewModal
        paper={selectedPreviewPaper}
        visible={!!selectedPreviewPaper}
        onClose={() => setSelectedPreviewPaper(null)}
        onDownload={(p) => handleDownloadTrigger(p)}
      />

      {/* Offline Download Progress Dialog */}
      <DownloadProgressModal
        paper={downloadModalPaper}
        visible={!!downloadModalPaper}
        onClose={() => setDownloadModalPaper(null)}
        onViewOffline={(p) => setSelectedPreviewPaper(p)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerSafeArea: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
  activeFilterIconBtn: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  badgeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
  },
  filterCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#0745E8',
    borderRadius: 9,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    height: 44,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
  },
  profileBanner: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  profileBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  profileBadgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  profileBannerTextGroup: {
    flex: 1,
  },
  profileBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  profileBannerSub: {
    fontSize: 11,
    color: '#475569',
    marginTop: 1,
  },
  editFilterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  editFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0745E8',
  },
  chipsRow: {
    gap: 8,
    marginBottom: 20,
  },
  quickChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickChipActive: {
    backgroundColor: '#0745E8',
    borderColor: '#0745E8',
  },
  quickChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  quickChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionWrapper: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0745E8',
  },
  clearFiltersText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },
  recentScroll: {
    gap: 12,
  },
  recentCard: {
    width: 160,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recentCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  recentCode: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0745E8',
  },
  recentTypeBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recentTypeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  recentSubject: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  recentYear: {
    fontSize: 11,
    color: '#64748B',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 10,
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
  emptyResetBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#0745E8',
    borderRadius: 12,
  },
  emptyResetBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
