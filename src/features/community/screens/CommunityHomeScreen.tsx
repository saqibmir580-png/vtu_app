import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useCommunityStore } from '../store/useCommunityStore';
import { useSavedStore } from '@/features/saved/store/useSavedStore';
import { CommunitySearchBar } from '../components/CommunitySearchBar';
import { CommunityFilterChips } from '../components/CommunityFilterChips';
import { CommunityStats } from '../components/CommunityStats';
import { CommunityResourceCard } from '../components/CommunityResourceCard';
import { TrendingResourceCard } from '../components/TrendingResourceCard';
import { CommunityFilterSheet } from '../components/CommunityFilterSheet';
import { CommunityEmptyState } from '../components/CommunityEmptyState';
import { ContributorAvatar } from '../components/ContributorAvatar';
import { AdBannerCard } from '@/shared/components/AdBannerCard';
import { useAuthStore } from '@/store';

type CommunityTab = 'browse' | 'leaderboard' | 'standing';

export const CommunityHomeScreen: React.FC = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const {
    resources,
    myUploads,
    contributors,
    filterOptions,
    setFilterOptions,
    resetFilters,
    getFilteredResources,
    getTrendingResources,
    toggleUsefulVote,
    fetchCommunityResources,
    rewardProfile,
    fetchRewardProfile,
    fetchContributors,
    isLoading,
  } = useCommunityStore();

  const { items, toggleBookmark } = useSavedStore();

  const [activeTab, setActiveTab] = useState<CommunityTab>('browse');
  const [refreshing, setRefreshing] = useState(false);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);

  useEffect(() => {
    fetchCommunityResources();
    fetchRewardProfile();
    fetchContributors();
  }, [fetchCommunityResources, fetchRewardProfile, fetchContributors]);

  const filteredResources = getFilteredResources();
  const trendingResources = getTrendingResources();

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchCommunityResources(true),
      fetchRewardProfile(),
      fetchContributors(),
    ]);
    setRefreshing(false);
  }, [fetchCommunityResources, fetchRewardProfile]);

  // Active filters check
  const hasActiveFilters = useMemo(() => {
    return (
      (filterOptions.selectedBranch && filterOptions.selectedBranch !== 'All') ||
      (filterOptions.selectedSemester && String(filterOptions.selectedSemester) !== 'All') ||
      (filterOptions.selectedScheme && filterOptions.selectedScheme !== 'All') ||
      (filterOptions.selectedSubject && filterOptions.selectedSubject !== 'All') ||
      (filterOptions.selectedUnit && String(filterOptions.selectedUnit) !== 'All') ||
      (filterOptions.searchQuery && filterOptions.searchQuery.trim().length > 0)
    );
  }, [filterOptions]);

  // Reward profile fallback data
  const coins = rewardProfile?.coinsBalance ?? 350;
  const xp = rewardProfile?.totalXp ?? 750;
  const level = rewardProfile?.level ?? 3;
  const levelTitle = rewardProfile?.levelTitle ?? 'Community Scholar';
  const nextXp = rewardProfile?.nextLevelXp ?? 900;
  const badges = rewardProfile?.badges ?? ['Verified Contributor', 'Top Note Creator', 'Community Pillar'];
  const progressRatio = Math.min(1, Math.max(0, xp / nextXp));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0745E8" />

      {/* Top Header */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <View style={styles.headerTitleBox}>
              <View style={styles.badgeRow}>
                <View style={styles.liveDot} />
                <Text style={styles.badgeText}>VTU STUDENT NETWORK</Text>
              </View>
              <Text style={styles.headerTitle}>VTU Community</Text>
              <Text style={styles.headerSubtitle}>Verified peer notes & study resources</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.uploadHeaderBtn}
              onPress={() => router.push('/community/upload' as any)}
            >
              <Feather name="plus" size={16} color="#0745E8" />
              <Text style={styles.uploadHeaderBtnText}>Upload Note</Text>
            </TouchableOpacity>
          </View>

          {/* Segmented Tab Controls */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.tabItem, activeTab === 'browse' && styles.tabItemActive]}
              onPress={() => setActiveTab('browse')}
            >
              <Feather
                name="book-open"
                size={14}
                color={activeTab === 'browse' ? '#0745E8' : 'rgba(255, 255, 255, 0.75)'}
              />
              <Text style={[styles.tabText, activeTab === 'browse' && styles.tabTextActive]}>
                Browse Notes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.tabItem, activeTab === 'leaderboard' && styles.tabItemActive]}
              onPress={() => setActiveTab('leaderboard')}
            >
              <Feather
                name="award"
                size={14}
                color={activeTab === 'leaderboard' ? '#0745E8' : 'rgba(255, 255, 255, 0.75)'}
              />
              <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.tabTextActive]}>
                Leaderboard
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.tabItem, activeTab === 'standing' && styles.tabItemActive]}
              onPress={() => setActiveTab('standing')}
            >
              <Feather
                name="user"
                size={14}
                color={activeTab === 'standing' ? '#0745E8' : 'rgba(255, 255, 255, 0.75)'}
              />
              <Text style={[styles.tabText, activeTab === 'standing' && styles.tabTextActive]}>
                My Standing
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0745E8']} />
        }
      >
        {/* ==================== TAB 1: BROWSE NOTES ==================== */}
        {activeTab === 'browse' && (
          <View>
            {/* Inline Search Bar */}
            <View style={styles.searchWrapper}>
              <CommunitySearchBar
                value={filterOptions.searchQuery}
                onChangeText={(text) => setFilterOptions({ searchQuery: text })}
                onPressFilter={() => setFilterSheetVisible(true)}
                placeholder="Search notes, subject code (e.g. 21CS52), topics..."
              />
            </View>

            {/* Active Filters Pill Bar */}
            {hasActiveFilters && (
              <View style={styles.activeFilterBar}>
                <View style={styles.activeFilterPill}>
                  <Feather name="filter" size={12} color="#0745E8" />
                  <Text style={styles.activeFilterText}>
                    Filters: {[
                      filterOptions.selectedBranch !== 'All' ? filterOptions.selectedBranch : null,
                      filterOptions.selectedSemester !== 'All' ? `Sem ${filterOptions.selectedSemester}` : null,
                      filterOptions.selectedScheme !== 'All' ? `${filterOptions.selectedScheme} Scheme` : null,
                      filterOptions.searchQuery ? `"${filterOptions.searchQuery}"` : null,
                    ].filter(Boolean).join(' • ')}
                  </Text>
                </View>
                <TouchableOpacity onPress={resetFilters} style={styles.clearFilterBtn}>
                  <Text style={styles.clearFilterText}>Reset</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Resource Type Category Chips */}
            <CommunityFilterChips
              selectedResourceType={filterOptions.selectedResourceType || 'All'}
              onSelectType={(type) => setFilterOptions({ selectedResourceType: type })}
            />

            {/* Real Dynamic Stats Strip */}
            <CommunityStats />

            {/* Resource Cards Feed */}
            <View style={styles.feedHeaderRow}>
              <Text style={styles.feedTitle}>Available Student Notes</Text>
              <Text style={styles.feedCount}>{filteredResources.length} items</Text>
            </View>

            {filteredResources.length === 0 ? (
              <CommunityEmptyState
                title="No Community Notes Found"
                description="Try clearing your search query or filters to discover all student contributions."
                onPressReset={resetFilters}
                onPressUpload={() => router.push('/community/upload' as any)}
              />
            ) : (
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
            )}
          </View>
        )}

        {/* ==================== TAB 2: LEADERBOARD ==================== */}
        {activeTab === 'leaderboard' && (
          <View style={styles.tabContent}>
            {/* Scholar Ranking Banner */}
            <View style={styles.leaderboardHero}>
              <View style={styles.trophyCircle}>
                <Feather name="award" size={26} color="#D97706" />
              </View>
              <Text style={styles.leaderboardTitle}>Top Student Scholars</Text>
              <Text style={styles.leaderboardSub}>
                Ranked by genuine peer upvotes, handwritten quality, and useful downloads.
              </Text>
            </View>

            {/* Ranked Contributor List */}
            <Text style={styles.sectionHeaderTitle}>Top Contributors</Text>
            <View style={styles.contributorGrid}>
              {contributors.map((c, index) => {
                const rankColor =
                  index === 0 ? '#F59E0B' : index === 1 ? '#94A3B8' : index === 2 ? '#B45309' : '#64748B';

                return (
                  <TouchableOpacity
                    key={c.id}
                    activeOpacity={0.85}
                    style={styles.contributorRankCard}
                    onPress={() => router.push(`/community/contributor/${c.id}` as any)}
                  >
                    <View style={[styles.rankMedal, { borderColor: rankColor }]}>
                      <Text style={[styles.rankNum, { color: rankColor }]}>#{index + 1}</Text>
                    </View>

                    <ContributorAvatar contributor={c} size={44} />

                    <View style={styles.contributorInfo}>
                      <Text style={styles.contributorName} numberOfLines={1}>{c.name}</Text>
                      <Text style={styles.contributorCollege} numberOfLines={1}>
                        {c.branch} • Sem {c.semester} • {c.college}
                      </Text>
                      <View style={styles.contributorBadgeRow}>
                        <View style={styles.badgePillSmall}>
                          <Feather name="award" size={10} color="#0745E8" />
                          <Text style={styles.badgePillSmallText}>{c.reputationBadge}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.upvotesBox}>
                      <Feather name="thumbs-up" size={14} color="#059669" />
                      <Text style={styles.upvotesText}>{c.totalUpvotes}</Text>
                      <Text style={styles.upvotesSub}>votes</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Sponsored Feed Banner */}
            <View style={{ paddingHorizontal: 16, marginVertical: 6 }}>
              <AdBannerCard placement="COMMUNITY_FEED" />
            </View>

            {/* Trending Notes Section */}
            <Text style={[styles.sectionHeaderTitle, { marginTop: 24 }]}>Weekly Trending Documents</Text>
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

        {/* ==================== TAB 3: MY STANDING & UPLOADS ==================== */}
        {activeTab === 'standing' && (
          <View style={styles.tabContent}>
            {/* Contributor Standing Card */}
            <View style={styles.rewardCard}>
              <View style={styles.rewardCardHeader}>
                <View>
                  <Text style={styles.rewardGreeting}>Student Contributor</Text>
                  <Text style={styles.rewardLevelTitle}>Level {level} • {levelTitle}</Text>
                </View>
                <View style={styles.coinsBadge}>
                  <Text style={styles.coinsIcon}>🪙</Text>
                  <Text style={styles.coinsText}>{coins} Coins</Text>
                </View>
              </View>

              {/* XP Progress Bar */}
              <View style={styles.progressSection}>
                <View style={styles.progressLabels}>
                  <Text style={styles.xpText}>{xp} XP Earned</Text>
                  <Text style={styles.xpTargetText}>{nextXp} XP (Next Level)</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${progressRatio * 100}%` }]} />
                </View>
              </View>

              {/* Badges Row */}
              <View style={styles.badgesWrapper}>
                {badges.map((b, idx) => (
                  <View key={idx} style={styles.badgePill}>
                    <Feather name="award" size={12} color="#0284C7" />
                    <Text style={styles.badgePillText}>{b}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Upload Action Callout */}
            <View style={styles.ctaUploadBox}>
              <View style={styles.ctaTextCol}>
                <Text style={styles.ctaTitle}>Upload More VTU Notes</Text>
                <Text style={styles.ctaSub}>
                  Earn +50 Coins & +100 XP for every approved lecture document or solved bank.
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.ctaUploadBtn}
                onPress={() => router.push('/community/upload' as any)}
              >
                <Feather name="upload-cloud" size={16} color="#FFFFFF" />
                <Text style={styles.ctaUploadBtnText}>Upload Now</Text>
              </TouchableOpacity>
            </View>

            {/* My Uploads List */}
            {(() => {
              const validMyUploads = (myUploads || []).filter(Boolean);
              return (
                <>
                  <View style={styles.myUploadsHeaderRow}>
                    <Text style={styles.sectionHeaderTitle}>My Uploaded Notes ({validMyUploads.length})</Text>
                    <TouchableOpacity onPress={() => router.push('/community/my-contributions' as any)}>
                      <Text style={styles.viewDetailsLink}>Manage All</Text>
                    </TouchableOpacity>
                  </View>

                  {validMyUploads.length === 0 ? (
                    <View style={styles.emptyUploadsCard}>
                      <Feather name="file-text" size={32} color="#94A3B8" />
                      <Text style={styles.emptyUploadsTitle}>No Uploads Yet</Text>
                      <Text style={styles.emptyUploadsSub}>
                        Share handwritten notes from your class to help peers and unlock contributor rewards.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.resourcesList}>
                      {validMyUploads.map((res) => {
                        const status = res.uploadStatus || 'pending_review';
                        const statusColor =
                          status === 'published'
                            ? '#059669'
                            : status === 'rejected'
                            ? '#DC2626'
                            : '#D97706';

                        const statusBg =
                          status === 'published'
                            ? '#ECFDF5'
                            : status === 'rejected'
                            ? '#FEF2F2'
                            : '#FEF3C7';

                        const statusLabel =
                          status === 'published'
                            ? 'Published'
                            : status === 'rejected'
                            ? 'Rejected'
                            : 'Under Review';

                        return (
                          <TouchableOpacity
                            key={res.id}
                            activeOpacity={0.85}
                            style={styles.myNoteCard}
                            onPress={() => router.push(`/community/resource/${res.id}` as any)}
                          >
                            <View style={styles.myNoteTopRow}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                {res.contributor?.avatarUrl || user?.avatarUrl ? (
                                  <Image
                                    source={{ uri: res.contributor?.avatarUrl || user?.avatarUrl }}
                                    style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#E2E8F0' }}
                                  />
                                ) : (
                                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#0745E8', alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800' }}>
                                      {((res.contributor?.name || user?.name || 'U').slice(0, 2)).toUpperCase()}
                                    </Text>
                                  </View>
                                )}
                                <View style={styles.myNoteSubjectBadge}>
                                  <Text style={styles.myNoteSubjectCode}>{res.subjectCode || 'VTU'}</Text>
                                </View>
                              </View>
                              <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                                <Text style={[styles.statusText, { color: statusColor }]}>
                                  {statusLabel}
                                </Text>
                              </View>
                            </View>

                            <Text style={styles.myNoteTitle} numberOfLines={2}>{res.title}</Text>

                            <View style={styles.myNoteFooter}>
                              <Text style={styles.myNoteMeta}>
                                {res.resourceType || 'PDF Notes'} • {res.fileSize || '2.5 MB'}
                              </Text>
                              <View style={styles.myNoteVotes}>
                                <Feather name="thumbs-up" size={12} color="#059669" />
                                <Text style={styles.myNoteVotesText}>{res.usefulCount || 0} votes</Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </>
              );
            })()}
          </View>
        )}
      </ScrollView>

      {/* Floating Upload Action Button */}
      <TouchableOpacity
        activeOpacity={0.88}
        style={styles.fab}
        onPress={() => router.push('/community/upload' as any)}
      >
        <Feather name="plus" size={20} color="#FFFFFF" />
        <Text style={styles.fabText}>Upload</Text>
      </TouchableOpacity>

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
  header: {
    backgroundColor: '#0745E8',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#0745E8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 14,
  },
  headerTitleBox: {
    flex: 1,
    marginRight: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#4ADE80',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E9D5FF',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#E9D5FF',
    marginTop: 2,
    fontWeight: '500',
  },
  uploadHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadHeaderBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0745E8',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 12,
  },
  tabItemActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  tabTextActive: {
    color: '#0745E8',
    fontWeight: '800',
  },
  scrollContent: {
    paddingBottom: 90,
  },
  searchWrapper: {
    paddingTop: 8,
  },
  activeFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  activeFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  activeFilterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  clearFilterBtn: {
    marginLeft: 8,
  },
  clearFilterText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0745E8',
  },
  feedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 10,
  },
  feedTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  feedCount: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  resourcesList: {
    paddingHorizontal: 16,
  },
  tabContent: {
    padding: 16,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  leaderboardHero: {
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  trophyCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#92400E',
  },
  leaderboardSub: {
    fontSize: 12,
    color: '#78350F',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  contributorGrid: {
    gap: 10,
  },
  contributorRankCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  rankMedal: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNum: {
    fontSize: 12,
    fontWeight: '900',
  },
  contributorInfo: {
    flex: 1,
  },
  contributorName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  contributorCollege: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  contributorBadgeRow: {
    marginTop: 4,
  },
  badgePillSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  badgePillSmallText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0745E8',
  },
  upvotesBox: {
    alignItems: 'center',
    paddingLeft: 8,
  },
  upvotesText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
    marginTop: 2,
  },
  upvotesSub: {
    fontSize: 9,
    color: '#64748B',
  },
  trendingList: {
    gap: 10,
  },
  rewardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  rewardCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  rewardGreeting: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  rewardLevelTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  coinsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  coinsIcon: {
    fontSize: 14,
  },
  coinsText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309',
  },
  progressSection: {
    marginBottom: 14,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  xpText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0745E8',
  },
  xpTargetText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0745E8',
    borderRadius: 4,
  },
  badgesWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
  },
  ctaUploadBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  ctaTextCol: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#5B21B6',
  },
  ctaSub: {
    fontSize: 11,
    color: '#1D4ED8',
    marginTop: 2,
    lineHeight: 15,
  },
  ctaUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0745E8',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
  },
  ctaUploadBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  myUploadsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  viewDetailsLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0745E8',
  },
  emptyUploadsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyUploadsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
  },
  emptyUploadsSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  myNoteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  myNoteTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  myNoteSubjectBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  myNoteSubjectCode: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  myNoteTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 18,
    marginBottom: 8,
  },
  myNoteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  myNoteMeta: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  myNoteVotes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  myNoteVotesText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: '#0745E8',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#0745E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
