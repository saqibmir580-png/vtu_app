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
import { usePassingPackageStore } from '../store/usePassingPackageStore';
import { useSavedStore } from '@/features/saved/store/useSavedStore';
import { RevisionResourceCard } from '../components/RevisionResourceCard';
import { Header } from '@/shared/components/Header';

export const LastMinuteRevisionScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPackageById, getPackagesForCurrentStudent } = usePassingPackageStore();
  const { items, toggleBookmark, toggleDownload } = useSavedStore();

  const pkg = getPackageById(id || '') || getPackagesForCurrentStudent()[0];

  if (!pkg) {
    return (
      <View style={styles.errorRoot}>
        <Text>Package Not Found</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0745E8" />
      <Header title="Last-Minute Revision" dark={true} showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.banner}>
          <Feather name="zap" size={22} color="#D97706" />
          <View style={styles.bannerTextWrapper}>
            <Text style={styles.bannerTitle}>Fast Visual Recall</Text>
            <Text style={styles.bannerSub}>
              Condensed cheat-sheets designed to read 30 minutes before stepping into the exam hall.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Available Revision Resources ({pkg.revisionResources.length})</Text>

        {pkg.revisionResources.map((res) => {
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
                router.push(`/passing-packages/pdf/${res.id}?pkgId=${pkg.id}` as any)
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
  errorRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  scrollContent: {
    padding: 16,
  },
  banner: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  bannerTextWrapper: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#B45309',
  },
  bannerSub: {
    fontSize: 12,
    color: '#92400E',
    marginTop: 2,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
});
