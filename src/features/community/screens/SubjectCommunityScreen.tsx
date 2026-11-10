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
import { CommunityResourceCard } from '../components/CommunityResourceCard';

export const SubjectCommunityScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { resources, toggleUsefulVote } = useCommunityStore();
  const { items, toggleBookmark } = useSavedStore();

  const subjectCode = id || '21CS52';
  const subjectResources = resources.filter((r) => r.subjectCode === subjectCode);
  const subjectName = subjectResources[0]?.subjectName || 'Computer Networks & Security';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={20} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <View style={styles.codeBadge}>
              <Text style={styles.codeBadgeText}>{subjectCode}</Text>
            </View>
            <Text style={styles.headerSubject} numberOfLines={1}>{subjectName}</Text>
          </View>

          <TouchableOpacity
            style={styles.uploadIconBtn}
            onPress={() => router.push('/community/upload' as any)}
          >
            <Feather name="plus" size={18} color="#0745E8" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.infoBanner}>
          <Feather name="users" size={18} color="#0745E8" />
          <Text style={styles.infoBannerText}>
            Community Notes contributed by VTU students for {subjectCode}
          </Text>
        </View>

        {subjectResources.map((res) => {
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
    flex: 1,
    marginHorizontal: 8,
  },
  codeBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 2,
  },
  codeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0745E8',
  },
  headerSubject: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  uploadIconBtn: {
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3E8FF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  infoBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
    flex: 1,
  },
});
