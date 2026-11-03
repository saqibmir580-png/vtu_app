import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useCommunityStore } from '../store/useCommunityStore';
import { useSavedStore } from '@/features/saved/store/useSavedStore';
import { CommunityHeader } from '../components/CommunityHeader';
import { CommunityHeroCard } from '../components/CommunityHeroCard';
import { CommunitySearchBar } from '../components/CommunitySearchBar';
import { CommunityFilterChips } from '../components/CommunityFilterChips';
import { CommunityStats } from '../components/CommunityStats';
import { UploadNotesCard } from '../components/UploadNotesCard';
import { FeaturedResourceCard } from '../components/FeaturedResourceCard';
import { TrendingResourceCard } from '../components/TrendingResourceCard';
import { CommunityResourceCard } from '../components/CommunityResourceCard';
import { CommunityFilterSheet } from '../components/CommunityFilterSheet';

export const CommunityHomeScreen: React.FC = () => {
  const router = useRouter();
  const {
    filterOptions,
    setFilterOptions,
    resetFilters,
    getFilteredResources,
    getFeaturedResources,
    getTrendingResources,
    toggleUsefulVote,
    fetchCommunityResources,
    isLoading,
  } = useCommunityStore();

  const { items, toggleBookmark } = useSavedStore();

  const [refreshing, setRefreshing] = useState(false);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);

  useEffect(() => {
    fetchCommunityResources();
  }, [fetchCommunityResources]);

  const filteredResources = getFilteredResources();
  const featuredResources = getFeaturedResources();
  const trendingResources = getTrendingResources();

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchCommunityResources(true);
    setRefreshing(false);
  }, [fetchCommunityResources]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#7C3AED" />

      {/* Header */}
      <CommunityHeader
        onPressUpload={() => router.push('/community/upload' as any)}
        onPressMyUploads={() => router.push('/community/my-contributions' as any)}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7C3AED']} />
        }
      >
        {/* Community Hero */}
        <CommunityHeroCard
          onPressUpload={() => router.push('/community/upload' as any)}
          onPressExplore={() => router.push('/community/feed' as any)}
        />

        {/* Search Bar */}
        <CommunitySearchBar
          value={filterOptions.searchQuery}
          onChangeText={(text) => setFilterOptions({ searchQuery: text })}
          onPressFilter={() => setFilterSheetVisible(true)}
          onFocus={() => router.push('/community/search' as any)}
        />

        {/* Resource Category Filter Chips */}
        <CommunityFilterChips
          selectedResourceType={filterOptions.selectedResourceType || 'All'}
          onSelectType={(type) => setFilterOptions({ selectedResourceType: type })}
        />

        {/* Community Stats Strip */}
        <CommunityStats />

        {/* Upload Notes CTA Card */}
        <UploadNotesCard onPressUpload={() => router.push('/community/upload' as any)} />

        {/* Featured Resource (Top Rated) */}
        {featuredResources.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Community Note</Text>
              <Text style={styles.sectionSub}>Highest rated by VTU toppers</Text>
            </View>
            <FeaturedResourceCard
              resource={featuredResources[0]}
              onPress={() => router.push(`/community/resource/${featuredResources[0].id}` as any)}
            />
          </View>
        )}

        {/* Weekly Trending Resources */}
        {trendingResources.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Weekly Trending Notes</Text>
              <TouchableOpacity onPress={() => router.push('/community/trending' as any)}>
                <Text style={styles.viewAllText}>View Leaderboard</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.trendingList}>
              {trendingResources.map((res, index) => (
                <TrendingResourceCard
                  key={res.id}
                  resource={res}
                  rank={index + 1}
                  onPress={() => router.push(`/community/resource/${res.id}` as any)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Recent Community Contributions Feed */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Student Contributions</Text>
            <TouchableOpacity onPress={() => router.push('/community/feed' as any)}>
              <Text style={styles.viewAllText}>View Feed</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.resourcesList}>
            {filteredResources.map((res) => {
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
          </View>
        </View>
      </ScrollView>

      {/* Filter Bottom Sheet */}
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
  scrollContent: {
    paddingBottom: 30,
  },
  section: {
    marginTop: 8,
  },
  sectionHeader: {
    marginHorizontal: 16,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7C3AED',
  },
  trendingList: {
    paddingHorizontal: 16,
  },
  resourcesList: {
    paddingHorizontal: 16,
  },
});
