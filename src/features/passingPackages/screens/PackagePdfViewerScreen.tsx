import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { usePassingPackageStore } from '../store/usePassingPackageStore';
import { useSavedStore } from '@/features/saved/store/useSavedStore';
import { DownloadButton } from '../components/DownloadButton';
import { BookmarkButton } from '../components/BookmarkButton';
import * as ScreenCapture from 'expo-screen-capture';

export const PackagePdfViewerScreen: React.FC = () => {
  const router = useRouter();
  const { id, pkgId } = useLocalSearchParams<{ id: string; pkgId?: string }>();
  const {
    getRevisionResourceById,
    getPackageById,
    getPackagesForCurrentStudent,
  } = usePassingPackageStore();
  const { items, toggleBookmark, toggleDownload } = useSavedStore();

  const currentPkg = getPackageById(pkgId || '') || getPackagesForCurrentStudent()[0];
  const resResult = getRevisionResourceById(currentPkg?.id || '', id || '');

  const resource = resResult?.resource || currentPkg?.revisionResources[0];
  const pkg = resResult?.pkg || currentPkg;

  const [currentPage, setCurrentPage] = useState(1);

  React.useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync().catch(() => {});
    return () => {
      ScreenCapture.allowScreenCaptureAsync().catch(() => {});
    };
  }, []);

  if (!resource || !pkg) {
    return (
      <View style={styles.errorRoot}>
        <Text>PDF Resource not found</Text>
      </View>
    );
  }

  const savedItem = items.find((i) => i.id === resource.id);
  const isDownloaded = savedItem ? savedItem.isDownloaded : !!resource.isDownloaded;
  const isBookmarked = savedItem ? savedItem.isBookmarked : !!resource.isBookmarked;

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
            <Text style={styles.headerSub}>Page {currentPage} of {resource.pageCount}</Text>
          </View>

          <View style={styles.headerActions}>
            <BookmarkButton
              isBookmarked={isBookmarked}
              onPress={() => toggleBookmark(resource.id)}
              size={18}
            />
            <DownloadButton
              isDownloaded={isDownloaded}
              onPress={() => toggleDownload(resource.id)}
              size={16}
            />
          </View>
        </View>
      </SafeAreaView>

      {/* Simulated Document Viewer Canvas */}
      <ScrollView contentContainerStyle={styles.viewerContainer}>
        <View style={styles.pdfPaperCard}>
          <View style={styles.pdfPaperHeader}>
            <View style={styles.vtuPill}>
              <Text style={styles.vtuPillText}>VTU PASSING PACKAGE REVISION SHEET</Text>
            </View>
            <Text style={styles.pdfTitle}>{resource.title}</Text>
            <Text style={styles.pdfSubject}>{pkg.subjectCode} - {pkg.subjectName} ({pkg.scheme} Scheme)</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.pageBody}>
            <Text style={styles.sectionHeading}>Module {resource.unitNumber || 1} Revision Key Points</Text>

            <View style={styles.conceptBox}>
              <Text style={styles.conceptTitle}>1. Core Concept Overview</Text>
              <Text style={styles.conceptBody}>
                {resource.previewSnippet ||
                  'Essential high-yield formulas, state diagrams, and protocol handshakes expected in upcoming semester examinations.'}
              </Text>
            </View>

            <View style={styles.conceptBox}>
              <Text style={styles.conceptTitle}>2. Solved Numerical Steps</Text>
              <Text style={styles.conceptBody}>
                • Step 1: Write given parameters & equation formula clearly in answer script.{'\n'}
                • Step 2: Draw required block diagram (4 Marks guaranteed).{'\n'}
                • Step 3: Show intermediate calculation steps to claim step marks.
              </Text>
            </View>

            {resource.type === 'Important Diagrams' && (
              <View style={styles.diagramMock}>
                <Feather name="image" size={32} color="#059669" />
                <Text style={styles.diagramMockText}>High-Resolution Vector Diagram Placeholder</Text>
              </View>
            )}
          </View>

          <View style={styles.pageFooter}>
            <Text style={styles.pageFooterText}>Page {currentPage} of {resource.pageCount}</Text>
          </View>
        </View>
      </ScrollView>

      {/* PDF Controls Floating Bar */}
      <View style={styles.controlsBar}>
        <TouchableOpacity
          disabled={currentPage === 1}
          style={[styles.pageNavBtn, currentPage === 1 && styles.pageNavDisabled]}
          onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
        >
          <Feather name="chevron-left" size={20} color={currentPage === 1 ? '#CBD5E1' : '#0F172A'} />
          <Text style={[styles.pageNavText, currentPage === 1 && styles.textDisabled]}>Prev</Text>
        </TouchableOpacity>

        <View style={styles.pageIndicator}>
          <Text style={styles.pageIndicatorText}>{currentPage} / {resource.pageCount}</Text>
        </View>

        <TouchableOpacity
          disabled={currentPage === resource.pageCount}
          style={[styles.pageNavBtn, currentPage === resource.pageCount && styles.pageNavDisabled]}
          onPress={() => setCurrentPage((p) => Math.min(resource.pageCount, p + 1))}
        >
          <Text style={[styles.pageNavText, currentPage === resource.pageCount && styles.textDisabled]}>Next</Text>
          <Feather name="chevron-right" size={20} color={currentPage === resource.pageCount ? '#CBD5E1' : '#0F172A'} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#64748B',
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
    flex: 1,
    alignItems: 'center',
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewerContainer: {
    padding: 16,
    paddingBottom: 90,
  },
  pdfPaperCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    minHeight: 520,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  pdfPaperHeader: {
    alignItems: 'center',
  },
  vtuPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  vtuPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0745E8',
    letterSpacing: 0.5,
  },
  pdfTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  pdfSubject: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  pageBody: {
    flex: 1,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  conceptBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderColor: '#E2E8F0',
    borderWidth: 1,
  },
  conceptTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0745E8',
    marginBottom: 4,
  },
  conceptBody: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  },
  diagramMock: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 10,
  },
  diagramMockText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '700',
  },
  pageFooter: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  pageFooterText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  controlsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  pageNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  pageNavDisabled: {
    opacity: 0.5,
  },
  pageNavText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  textDisabled: {
    color: '#CBD5E1',
  },
  pageIndicator: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pageIndicatorText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0745E8',
  },
});
