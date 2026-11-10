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
import { useCommunityStore } from '../store/useCommunityStore';
import { useSavedStore } from '@/features/saved/store/useSavedStore';
import { ContributorAvatar } from '../components/ContributorAvatar';
import { CommunityResourceCard } from '../components/CommunityResourceCard';

export const ContributorPreviewScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getContributorById, resources, toggleUsefulVote } = useCommunityStore();
  const { items, toggleBookmark } = useSavedStore();

  const contributor = getContributorById(id || '') || {
    id: 'c1',
    name: 'Ananya Sharma',
    college: 'Sai Vidya Institute of Technology',
    branch: 'CSE',
    semester: 5,
    contributionsCount: 14,
    totalUpvotes: 840,
    reputationBadge: 'VTU Top Contributor' as const,
  };

  const contributorNotes = resources.filter((r) => r.contributor.id === contributor.id);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0745E8" />

      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Feather name="arrow-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Contributor Profile</Text>
            <View style={{ width: 36 }} />
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <ContributorAvatar contributor={contributor} size={64} />
          <Text style={styles.name}>{contributor.name}</Text>

          <View style={styles.reputationBadge}>
            <Feather name="award" size={12} color="#B45309" />
            <Text style={styles.reputationText}>{contributor.reputationBadge}</Text>
          </View>

          <Text style={styles.college}>
            {contributor.branch} • Sem {contributor.semester} • {contributor.college}
          </Text>

          <View style={styles.statsStrip}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{contributor.contributionsCount}</Text>
              <Text style={styles.statLabel}>Notes Shared</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{contributor.totalUpvotes}</Text>
              <Text style={styles.statLabel}>Useful Votes</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Notes Shared by {contributor.name.split(' ')[0]} ({contributorNotes.length})
        </Text>

        {contributorNotes.map((res) => {
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
        })}
      </ScrollView>
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
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
  },
  reputationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginVertical: 6,
  },
  reputationText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  college: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#CBD5E1',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
});
