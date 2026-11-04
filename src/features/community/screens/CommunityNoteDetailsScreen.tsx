import React, { useState } from 'react';
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
import { ResourceInfoCard } from '../components/ResourceInfoCard';
import { ResourcePreview } from '../components/ResourcePreview';
import { ResourceActionBar } from '../components/ResourceActionBar';
import { ContributorMiniCard } from '../components/ContributorMiniCard';
import { ReportBottomSheet } from '../components/ReportBottomSheet';

export const CommunityNoteDetailsScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getResourceById, resources } = useCommunityStore();
  const { items, toggleBookmark, toggleDownload } = useSavedStore();

  const resource = getResourceById(id || '') || resources[0];
  const [reportSheetVisible, setReportSheetVisible] = useState(false);

  if (!resource) {
    return (
      <View style={styles.errorRoot}>
        <Text>Resource details not found</Text>
      </View>
    );
  }

  const savedItem = items.find((i) => i.id === resource.id);
  const isDownloaded = savedItem ? savedItem.isDownloaded : false;
  const isBookmarked = savedItem ? savedItem.isBookmarked : false;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={20} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle} numberOfLines={1}>{resource.title}</Text>
            <Text style={styles.headerSub}>{resource.subjectCode} Community Resource</Text>
          </View>

          <TouchableOpacity
            style={styles.rateBtn}
            onPress={() => router.push(`/community/rating/${resource.id}` as any)}
          >
            <Feather name="star" size={18} color="#F59E0B" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Contributor Header */}
        <ContributorMiniCard
          contributor={resource.contributor}
          uploadedAt={resource.uploadedAt}
          onPress={() => router.push(`/community/contributor/${resource.contributor.id}` as any)}
        />

        {/* Embedded Document Preview */}
        <ResourcePreview
          title={resource.title}
          pageCount={resource.pageCount}
          subjectCode={resource.subjectCode}
          previewPages={resource.previewPages}
        />

        {/* Comprehensive Resource Info Card */}
        <ResourceInfoCard resource={resource} />

        {/* Related Links */}
        <View style={styles.relatedLinksCard}>
          <Text style={styles.relatedTitle}>Explore Related Resources</Text>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.push(`/notes` as any)}
          >
            <Feather name="book-open" size={16} color="#0745E8" />
            <Text style={styles.linkText}>View Official Module Notes for {resource.subjectCode}</Text>
            <Feather name="chevron-right" size={16} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.push(`/papers` as any)}
          >
            <Feather name="file-text" size={16} color="#7C3AED" />
            <Text style={styles.linkText}>View Previous Year Papers for {resource.subjectCode}</Text>
            <Feather name="chevron-right" size={16} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.push(`/passing-packages` as any)}
          >
            <Feather name="zap" size={16} color="#DC2626" />
            <Text style={styles.linkText}>View Passing Package Exam Focus Guide</Text>
            <Feather name="chevron-right" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Action Bar */}
      <ResourceActionBar
        isDownloaded={isDownloaded}
        isBookmarked={isBookmarked}
        onToggleDownload={() => toggleDownload(resource.id)}
        onToggleBookmark={() => toggleBookmark(resource.id)}
        onPressReadNotes={() => {
          router.push({
            pathname: '/notes/[id]',
            params: { id: resource.id, view: 'reader', title: resource.title },
          } as any);
        }}
        onPressReport={() => setReportSheetVisible(true)}
      />

      <ReportBottomSheet
        visible={reportSheetVisible}
        onClose={() => setReportSheetVisible(false)}
        onSubmitReport={(reason, details) =>
          router.push(`/community/report/${resource.id}?reason=${reason}` as any)
        }
      />
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
    flex: 1,
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  rateBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  relatedLinksCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  relatedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
});
