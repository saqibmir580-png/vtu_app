import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSavedStore } from '../store/useSavedStore';
import { StorageSummaryCard } from '../components/StorageSummaryCard';
import { SavedItemCard } from '../components/SavedItemCard';
import { SavedItem, SavedTab } from '../types/saved.types';
import { PaperPreviewModal } from '@/features/papers/components/PaperPreviewModal';
import { usePaperStore } from '@/features/papers/store/usePaperStore';
import { Header } from '@/shared/components/Header';

export const SavedLibraryScreen: React.FC = () => {
  const router = useRouter();
  const {
    activeTab,
    setActiveTab,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    getFilteredItems,
    getStorageSummary,
  } = useSavedStore();

  const [selectedItemForPreview, setSelectedItemForPreview] = useState<SavedItem | null>(null);

  const filteredItems = getFilteredItems();
  const summary = getStorageSummary();

  const tabs: { label: string; value: SavedTab; count: number }[] = [
    { label: 'All Saved', value: 'All', count: summary.downloadedCount + summary.bookmarkedCount },
    { label: 'Downloaded', value: 'Downloaded', count: summary.downloadedCount },
    { label: 'Bookmarked', value: 'Bookmarked', count: summary.bookmarkedCount },
  ];

  const categories: ('All' | 'Notes' | 'Question Papers')[] = ['All', 'Notes', 'Question Papers'];

  const handleOpenOffline = (item: SavedItem) => {
    if (item.type === 'QuestionPaper') {
      setSelectedItemForPreview(item);
    } else {
      router.push(`/notes/${item.id}?view=reader` as any);
    }
  };

  const papers = usePaperStore((state) => state.papers);
  const activePaperData = selectedItemForPreview
    ? papers.find((p) => p.id === selectedItemForPreview.id.replace('paper-', '')) || null
    : null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0745E8" />
      <Header title="Bookmarks & Downloads" dark={true} showBack={true} />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={18} color="#64748B" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search saved notes, question papers..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Feather name="x-circle" size={16} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Storage Summary Gauge Card */}
        <StorageSummaryCard />

        {/* Segmented Tab Selector */}
        <View style={styles.segmentedTabBar}>
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.value;
            return (
              <TouchableOpacity
                key={tab.value}
                activeOpacity={0.8}
                style={[styles.tabItem, isSelected && styles.tabItemActive]}
                onPress={() => setActiveTab(tab.value)}
              >
                <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                  {tab.label} ({tab.count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Category Filter Chips */}
        <View style={styles.categoryRow}>
          {categories.map((cat) => {
            const isSelected = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                activeOpacity={0.8}
                style={[styles.catChip, isSelected && styles.catChipActive]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text style={[styles.catChipText, isSelected && styles.catChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Items List / Empty State */}
        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <Feather name="download-cloud" size={32} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>No Saved Items Found</Text>
            <Text style={styles.emptySub}>
              Download notes or bookmark question papers to study offline anytime without an active internet connection.
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.browseBtn}
              onPress={() => router.push('/(tabs)/library')}
            >
              <Text style={styles.browseBtnText}>Explore Library</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredItems.map((item) => (
            <SavedItemCard
              key={item.id}
              item={item}
              onOpenOffline={handleOpenOffline}
            />
          ))
        )}
      </ScrollView>

      {/* Offline Question Paper Previewer Modal */}
      <PaperPreviewModal
        paper={activePaperData}
        visible={!!selectedItemForPreview}
        onClose={() => setSelectedItemForPreview(null)}
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
    paddingTop: 16,
    paddingBottom: 40,
  },
  segmentedTabBar: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
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
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0745E8',
    fontWeight: '700',
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catChipActive: {
    backgroundColor: '#0745E8',
    borderColor: '#0745E8',
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  catChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
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
    lineHeight: 18,
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
