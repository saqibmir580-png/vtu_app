import React, { useEffect } from 'react';
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
import { useCommunityStore } from '../store/useCommunityStore';
import { useSavedStore } from '@/features/saved/store/useSavedStore';
import { CommunityResourceCard } from '../components/CommunityResourceCard';
import { CommunityEmptyState } from '../components/CommunityEmptyState';

export const MyContributionsScreen: React.FC = () => {
  const router = useRouter();
  const { myUploads, toggleUsefulVote, rewardProfile, fetchRewardProfile } = useCommunityStore();
  const { items, toggleBookmark } = useSavedStore();

  useEffect(() => {
    fetchRewardProfile();
  }, []);

  const totalUpvotes = myUploads.reduce((acc, curr) => acc + curr.usefulCount, 0);

  const coins = rewardProfile?.coinsBalance ?? 350;
  const xp = rewardProfile?.totalXp ?? 750;
  const level = rewardProfile?.level ?? 3;
  const levelTitle = rewardProfile?.levelTitle ?? 'Community Scholar';
  const nextXp = rewardProfile?.nextLevelXp ?? 900;
  const badges = rewardProfile?.badges ?? ['Verified Contributor', 'Top Note Creator', 'Community Pillar'];
  const progressRatio = Math.min(1, Math.max(0, xp / nextXp));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={20} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>My Contributions</Text>
            <Text style={styles.headerSub}>{myUploads.length} Shared Documents</Text>
          </View>
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={() => router.push('/community/upload' as any)}
          >
            <Feather name="plus" size={18} color="#7C3AED" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Contributor Rewards & Standing Card */}
        <View style={styles.rewardCard}>
          <View style={styles.rewardCardHeader}>
            <View>
              <Text style={styles.rewardUserGreeting}>Contributor Standing</Text>
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

        {/* Upload & Telemetry Statistics */}
        <View style={styles.statsCard}>
          <View style={styles.statTile}>
            <Text style={styles.statNum}>{rewardProfile?.uploadCount ?? myUploads.length}</Text>
            <Text style={styles.statLabel}>Uploaded Notes</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statTile}>
            <Text style={styles.statNum}>{rewardProfile?.usefulVotes ?? totalUpvotes}</Text>
            <Text style={styles.statLabel}>Helpful Votes</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statTile}>
            <Text style={styles.statNum}>{rewardProfile?.downloadsCount ?? 380}</Text>
            <Text style={styles.statLabel}>Downloads</Text>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Uploaded Resources</Text>
          <TouchableOpacity
            style={styles.sectionAction}
            onPress={() => router.push('/community/upload' as any)}
          >
            <Feather name="upload-cloud" size={14} color="#7C3AED" />
            <Text style={styles.sectionActionText}>Upload Note</Text>
          </TouchableOpacity>
        </View>

        {myUploads.length === 0 ? (
          <CommunityEmptyState
            title="No Contributions Yet"
            description="Start sharing your class notes to earn contributor badges and VTU Coins!"
            onPressUpload={() => router.push('/community/upload' as any)}
          />
        ) : (
          myUploads.map((res) => {
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
              />
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  safeTop: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
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
  headerTitleBox: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  headerSub: { fontSize: 12, color: '#64748B', marginTop: 1 },
  uploadBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { padding: 16 },

  // Reward Standing Card
  rewardCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  rewardCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  rewardUserGreeting: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rewardLevelTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 2,
  },
  coinsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  coinsIcon: {
    fontSize: 14,
  },
  coinsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FCD34D',
  },

  // XP Progress
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
    fontWeight: '600',
    color: '#38BDF8',
  },
  xpTargetText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#38BDF8',
    borderRadius: 3,
  },

  // Badges
  badgesWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 132, 199, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E0F2FE',
  },

  // Telemetry Stats
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  statTile: { alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  statLabel: { fontSize: 11, color: '#64748B', marginTop: 2 },
  divider: { width: 1, height: 28, backgroundColor: '#E2E8F0' },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7C3AED',
  },
});
