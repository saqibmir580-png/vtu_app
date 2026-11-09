import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useCommunityStore } from '../store/useCommunityStore';
import { useSavedStore } from '@/features/saved/store/useSavedStore';
import { CommunityResourceCard } from '../components/CommunityResourceCard';
import { CommunityFilterChips } from '../components/CommunityFilterChips';
import { CommunityFilterSheet } from '../components/CommunityFilterSheet';

export const CommunityResourceFeedScreen: React.FC = () => {
  const router = useRouter();
  const {
    filterOptions,
    setFilterOptions,
    resetFilters,
    getFilteredResources,
    toggleUsefulVote,
  } = useCommunityStore();
  const { items, toggleBookmark } = useSavedStore();

  const [refreshing, setRefreshing] = useState(false);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);

  const resources = getFilteredResources();

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={20} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>Community Feed</Text>
            <Text style={styles.headerSub}>Sorted by {filterOptions.sortBy}</Text>
          </View>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setFilterSheetVisible(true)}
          >
            <Feather name="sliders" size={18} color="#0745E8" />
          </TouchableOpacity>
        </View>

        <CommunityFilterChips
          selectedResourceType={filterOptions.selectedResourceType || 'All'}
          onSelectType={(type) => setFilterOptions({ selectedResourceType: type })}
        />
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0745E8']} />
        }
      >
        <Text style={styles.countText}>{resources.length} Student Notes Available</Text>

        {resources.map((res) => {
          const savedItem = items.find((i) => i.id === res.id);
          const isBookmarked = savedItem ? savedItem.isBookmarked : false;

          return (
            <CommunityResourceCard
              key={res.id}
              resource={res}
              isBookmarked={isBookmarked}
              onToggleBookmark={() => toggleBookmark(res.id)}
              onToggleUseful={() => toggleUsefulVote(res.id)}
              onPressCard={() => router.push(`/community/resource/${res.id}` as any)}
              onPressContributor={() =>
                router.push(`/community/contributor/${res.contributor.id}` as any)
              }
            />
          );
        })}
      </ScrollView>

      <CommunityFilterSheet
        visible={filterSheetVisible}
        filters={filterOptions}
        onClose={() => setFilterSheetVisible(false)}
        onApplyFilters={(updated) => setFilterOptions(updated)}
        onReset={resetFilters}
      />
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
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 12,
  },
});
