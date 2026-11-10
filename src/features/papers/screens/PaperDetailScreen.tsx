import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { usePaperStore } from '../store/usePaperStore';
import { DocumentThumbnail } from '../components/DocumentThumbnail';
import { PaperPreviewModal } from '../components/PaperPreviewModal';
import { DownloadProgressModal } from '../components/DownloadProgressModal';
import { QuestionPaper } from '../types/paper.types';
import { Header } from '@/shared/components/Header';
import { StatusBar } from 'react-native';

export const PaperDetailScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { papers, bookmarkedIds, downloadedIds, toggleBookmark, startDownload } =
    usePaperStore();

  const paper = papers.find((p) => p.id === id) || papers[0];

  const [previewVisible, setPreviewVisible] = useState(false);
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);

  const isBookmarked = bookmarkedIds.includes(paper.id);
  const isDownloaded = downloadedIds.includes(paper.id);

  const handleDownload = () => {
    startDownload(paper.id);
    setDownloadModalVisible(true);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0745E8" />
      <Header
        title={`${paper.subjectCode} Paper`}
        dark={true}
        showBack={true}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Document Hero Banner */}
        <View style={styles.heroCard}>
          <View style={styles.thumbnailContainer}>
            <DocumentThumbnail
              subjectCode={paper.subjectCode}
              scheme={paper.scheme}
              paperType={paper.paperType}
              pageCount={paper.pageCount}
              bgAccent={paper.thumbnailBg}
              size="large"
            />
          </View>

          <View style={styles.heroInfo}>
            <View style={styles.badgeRow}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{paper.paperType} Paper</Text>
              </View>
              <Text style={styles.schemeTag}>{paper.scheme} Scheme</Text>
            </View>

            <Text style={styles.subjectName}>{paper.subjectName}</Text>
            <Text style={styles.subjectCode}>{paper.subjectCode}</Text>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                {paper.branch} • Sem {paper.semester} • {paper.year}
              </Text>
            </View>

            {/* Offline Badge */}
            {isDownloaded && (
              <View style={styles.offlineBadge}>
                <Feather name="check-circle" size={14} color="#059669" />
                <Text style={styles.offlineBadgeText}>Saved & Available Offline</Text>
              </View>
            )}
          </View>
        </View>

        {/* Specifications Grid */}
        <Text style={styles.sectionHeader}>Document Specifications</Text>
        <View style={styles.specGrid}>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Scheme</Text>
            <Text style={styles.specValue}>{paper.scheme} Scheme</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Branch</Text>
            <Text style={styles.specValue}>{paper.branch}</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Semester</Text>
            <Text style={styles.specValue}>Semester {paper.semester}</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Exam Session</Text>
            <Text style={styles.specValue}>{paper.month} {paper.year}</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>File Size</Text>
            <Text style={styles.specValue}>{paper.fileSize}</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Page Count</Text>
            <Text style={styles.specValue}>{paper.pageCount} Pages</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Total Views</Text>
            <Text style={styles.specValue}>{paper.viewsCount.toLocaleString()}</Text>
          </View>
          <View style={styles.specItem}>
            <Text style={styles.specLabel}>Downloads</Text>
            <Text style={styles.specValue}>{paper.downloadsCount.toLocaleString()}</Text>
          </View>
        </View>

        {/* Syllabus / Module Question Outline */}
        <Text style={styles.sectionHeader}>Question Paper Outline</Text>
        <View style={styles.outlineCard}>
          {paper.modules.map((mod) => (
            <View key={mod.moduleNumber} style={styles.moduleOutlineRow}>
              <View style={styles.moduleNumBadge}>
                <Text style={styles.moduleNumText}>M{mod.moduleNumber}</Text>
              </View>
              <View style={styles.moduleOutlineTextCol}>
                <Text style={styles.moduleTitle}>{mod.title}</Text>
                <Text style={styles.questionCountText}>
                  {mod.questions ? mod.questions.length : (mod.mainQuestions ? mod.mainQuestions.length : 0)} Exam Questions Included
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Fixed Action Footer */}
      <SafeAreaView edges={['bottom']} style={styles.footerSafeArea}>
        <View style={styles.footerRow}>
          {/* Bookmark Action */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.bookmarkBtn}
            onPress={() => toggleBookmark(paper.id)}
          >
            <Feather
              name="bookmark"
              size={20}
              color={isBookmarked ? '#0745E8' : '#64748B'}
            />
          </TouchableOpacity>

          {/* Download Action */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.downloadBtn, isDownloaded && styles.downloadedBtn]}
            onPress={handleDownload}
          >
            <Feather
              name={isDownloaded ? 'check-circle' : 'download'}
              size={18}
              color={isDownloaded ? '#059669' : '#0F172A'}
            />
            <Text style={[styles.downloadBtnText, isDownloaded && styles.downloadedBtnText]}>
              {isDownloaded ? 'Saved Offline' : 'Download PDF'}
            </Text>
          </TouchableOpacity>

          {/* Primary Action: Preview */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.previewBtn}
            onPress={() => setPreviewVisible(true)}
          >
            <Feather name="eye" size={18} color="#FFFFFF" />
            <Text style={styles.previewBtnText}>Preview Paper</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Interactive Paper Previewer Modal */}
      <PaperPreviewModal
        paper={paper}
        visible={previewVisible}
        onClose={() => setPreviewVisible(false)}
        onDownload={handleDownload}
      />

      {/* Offline Download Progress Dialog */}
      <DownloadProgressModal
        paper={paper}
        visible={downloadModalVisible}
        onClose={() => setDownloadModalVisible(false)}
        onViewOffline={() => setPreviewVisible(true)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  thumbnailContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInfo: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  typeBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0745E8',
  },
  schemeTag: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  subjectName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  subjectCode: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0745E8',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  offlineBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  specItem: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  specLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  specValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  outlineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  moduleOutlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  moduleNumBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleNumText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0745E8',
  },
  moduleOutlineTextCol: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  questionCountText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  footerSafeArea: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  bookmarkBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  downloadBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  downloadedBtn: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  downloadedBtnText: {
    color: '#059669',
  },
  previewBtn: {
    flex: 1.2,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#0745E8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  previewBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
  },
});
