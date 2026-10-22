import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import { QuestionPaper } from '../types/paper.types';
import { usePaperStore } from '../store/usePaperStore';
import * as ScreenCapture from 'expo-screen-capture';

interface PaperPreviewModalProps {
  paper: QuestionPaper | null;
  visible: boolean;
  onClose: () => void;
  onDownload?: (paper: QuestionPaper) => void;
}

export const PaperPreviewModal: React.FC<PaperPreviewModalProps> = ({
  paper,
  visible,
  onClose,
  onDownload,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomScale, setZoomScale] = useState(1);
  const [showSolutionKey, setShowSolutionKey] = useState(false);
  const [viewMode, setViewMode] = useState<'TEMPLATE' | 'DOCUMENT'>('TEMPLATE');
  const { bookmarkedIds, downloadedIds, toggleBookmark } = usePaperStore();

  useEffect(() => {
    if (visible) {
      ScreenCapture.preventScreenCaptureAsync().catch(() => {});
    } else {
      ScreenCapture.allowScreenCaptureAsync().catch(() => {});
    }
    return () => {
      ScreenCapture.allowScreenCaptureAsync().catch(() => {});
    };
  }, [visible]);

  if (!paper) return null;

  const isBookmarked = bookmarkedIds.includes(paper.id);
  const isDownloaded = downloadedIds.includes(paper.id);
  const totalPages = paper.pageCount || 4;

  const handleZoomIn = () => setZoomScale((prev) => Math.min(prev + 0.2, 1.6));
  const handleZoomOut = () => setZoomScale((prev) => Math.max(prev - 0.2, 0.8));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Modal Navigation Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
            <Feather name="x" size={20} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.navTitleContainer}>
            <Text style={styles.navTitle} numberOfLines={1}>
              {paper.subjectCode} - {paper.subjectName}
            </Text>
            <Text style={styles.navSub}>
              {paper.paperType} Paper • {paper.scheme} Scheme ({paper.year})
            </Text>
          </View>

          <View style={styles.navRightActions}>
            <TouchableOpacity
              onPress={() => toggleBookmark(paper.id)}
              style={styles.iconBtn}
            >
              <Feather
                name="bookmark"
                size={20}
                color={isBookmarked ? '#0745E8' : '#64748B'}
              />
            </TouchableOpacity>
            {onDownload && (
              <TouchableOpacity
                onPress={() => onDownload(paper)}
                style={[styles.iconBtn, isDownloaded && styles.downloadedIconBtn]}
              >
                <Feather
                  name={isDownloaded ? 'check-circle' : 'download'}
                  size={20}
                  color={isDownloaded ? '#059669' : '#0745E8'}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* View Mode Switcher */}
        <View style={styles.tabSwitcherRow}>
          <TouchableOpacity
            style={[styles.tabButton, viewMode === 'TEMPLATE' && styles.tabButtonActive]}
            onPress={() => setViewMode('TEMPLATE')}
          >
            <Feather
              name="layout"
              size={14}
              color={viewMode === 'TEMPLATE' ? '#0745E8' : '#64748B'}
            />
            <Text
              style={[
                styles.tabButtonText,
                viewMode === 'TEMPLATE' && styles.tabButtonTextActive,
              ]}
            >
              VTU Question Template
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, viewMode === 'DOCUMENT' && styles.tabButtonActive]}
            onPress={() => setViewMode('DOCUMENT')}
          >
            <Feather
              name="file-text"
              size={14}
              color={viewMode === 'DOCUMENT' ? '#0745E8' : '#64748B'}
            />
            <Text
              style={[
                styles.tabButtonText,
                viewMode === 'DOCUMENT' && styles.tabButtonTextActive,
              ]}
            >
              Uploaded Document
            </Text>
          </TouchableOpacity>
        </View>

        {viewMode === 'TEMPLATE' ? (
          <>
            {/* Toolbar with Zoom, Page & Solution Toggle */}
            <View style={styles.zoomControlBar}>
              <TouchableOpacity onPress={handleZoomOut} style={styles.zoomBtn}>
                <Feather name="minus" size={16} color="#0F172A" />
              </TouchableOpacity>
              <Text style={styles.zoomText}>{Math.round(zoomScale * 100)}%</Text>
              <TouchableOpacity onPress={handleZoomIn} style={styles.zoomBtn}>
                <Feather name="plus" size={16} color="#0F172A" />
              </TouchableOpacity>

              <View style={styles.verticalDivider} />

              <Text style={styles.pageIndicatorText}>
                Page {currentPage} of {totalPages}
              </Text>

              {/* Solution Toggle Button */}
              {paper.hasSolutionKey && (
                <TouchableOpacity
                  onPress={() => setShowSolutionKey(!showSolutionKey)}
                  style={[
                    styles.solutionToggleBtn,
                    showSolutionKey && styles.solutionToggleBtnActive,
                  ]}
                >
                  <Feather
                    name={showSolutionKey ? 'check-circle' : 'file-text'}
                    size={14}
                    color={showSolutionKey ? '#FFFFFF' : '#7E22CE'}
                  />
                  <Text
                    style={[
                      styles.solutionToggleText,
                      showSolutionKey && styles.solutionToggleTextActive,
                    ]}
                  >
                    {showSolutionKey ? 'Key Active' : 'Solutions'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Paper Canvas View */}
            <ScrollView
              style={styles.canvasScroll}
              contentContainerStyle={styles.canvasContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={[styles.paperSheet, { transform: [{ scale: zoomScale }] }]}>
                {/* VTU Header Stamp */}
                <View style={styles.sheetHeader}>
                  <Text style={styles.vtuHeaderTitle}>VISVESVARAYA TECHNOLOGICAL UNIVERSITY</Text>
                  <Text style={styles.vtuHeaderSub}>BELAGAVI, KARNATAKA</Text>

                  <View style={styles.examBannerRow}>
                    <Text style={styles.examBannerText}>
                      Fifth Semester B.E. Degree Examination, {paper.month} {paper.year}
                    </Text>
                  </View>

                  {/* USN Table Header */}
                  <View style={styles.usnSection}>
                    <Text style={styles.usnTitle}>USN</Text>
                    <View style={styles.usnBoxesRow}>
                      {Array.from({ length: 10 }).map((_, idx) => (
                        <View key={idx} style={styles.usnBoxCell} />
                      ))}
                    </View>
                  </View>

                  <Text style={styles.subjectNameHeader}>
                    {paper.subjectCode} - {paper.subjectName.toUpperCase()}
                  </Text>

                  <View style={styles.timeMarksRow}>
                    <Text style={styles.timeMarksText}>Time: {paper.durationHours || 3} hrs.</Text>
                    <Text style={styles.timeMarksText}>Max. Marks: {paper.maxMarks || 100}</Text>
                  </View>

                  <View style={styles.dividerLine} />

                  <Text style={styles.instructionsText}>
                    Note: 1. Answer any FIVE full questions, choosing ONE full question from each module.
                    {'\n'}2. Any missing data may be suitably assumed.
                  </Text>
                </View>

                {/* Questions List Page View */}
                <View style={styles.modulesContainer}>
                  {paper.modules.map((mod) => (
                    <View key={mod.moduleNumber} style={styles.moduleBlock}>
                      <View style={styles.moduleBadge}>
                        <Text style={styles.moduleBadgeText}>MODULE {mod.moduleNumber}</Text>
                        <Text style={styles.moduleTitleText}>{mod.title}</Text>
                      </View>

                      {/* Main Questions with Choices or Simple list */}
                      {mod.mainQuestions && mod.mainQuestions.length > 0 ? (
                        mod.mainQuestions.map((mq) => (
                          <View key={mq.questionNumber} style={{ gap: 8 }}>
                            {mq.choices.map((choice) => (
                              <View key={choice.choiceId} style={{ gap: 6 }}>
                                {choice.isOrOption && (
                                  <View style={styles.orDividerRow}>
                                    <View style={styles.orLine} />
                                    <Text style={styles.orText}>OR</Text>
                                    <View style={styles.orLine} />
                                  </View>
                                )}
                                {choice.subQuestions.map((sub) => (
                                  <View key={sub.subCode} style={styles.questionItem}>
                                    <View style={styles.qNumCol}>
                                      <Text style={styles.qNumText}>
                                        {choice.choiceId} ({sub.subCode})
                                      </Text>
                                    </View>
                                    <View style={styles.qTextCol}>
                                      <Text style={styles.qText}>{sub.text}</Text>

                                      {/* Inline Faculty Verified Solution */}
                                      {showSolutionKey && sub.solution && (
                                        <View style={styles.solutionBox}>
                                          <Text style={styles.solutionHeader}>
                                            ✓ Verified Solution Key:
                                          </Text>
                                          <Text style={styles.solutionText}>
                                            {sub.solution}
                                          </Text>
                                        </View>
                                      )}
                                    </View>
                                    <View style={styles.qMarksCol}>
                                      <Text style={styles.qMarksText}>({sub.marks} Marks)</Text>
                                      {sub.bloomLevel && (
                                        <Text style={styles.qBloomText}>[{sub.bloomLevel}]</Text>
                                      )}
                                    </View>
                                  </View>
                                ))}
                              </View>
                            ))}
                          </View>
                        ))
                      ) : (
                        mod.questions?.map((q, idx) => (
                          <View key={idx} style={styles.questionItem}>
                            <View style={styles.qNumCol}>
                              <Text style={styles.qNumText}>{q.questionNumber}</Text>
                            </View>
                            <View style={styles.qTextCol}>
                              <Text style={styles.qText}>{q.questionText}</Text>
                              {showSolutionKey && q.solution && (
                                <View style={styles.solutionBox}>
                                  <Text style={styles.solutionHeader}>
                                    ✓ Verified Solution Key:
                                  </Text>
                                  <Text style={styles.solutionText}>{q.solution}</Text>
                                </View>
                              )}
                            </View>
                            <View style={styles.qMarksCol}>
                              <Text style={styles.qMarksText}>({q.marks} Marks)</Text>
                              {q.bloomLevel && (
                                <Text style={styles.qBloomText}>[{q.bloomLevel}]</Text>
                              )}
                            </View>
                          </View>
                        ))
                      )}
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Page Stepper Navigation Bar */}
            <View style={styles.pageNavBar}>
              <TouchableOpacity
                disabled={currentPage === 1}
                style={[styles.pageStepBtn, currentPage === 1 && styles.pageStepBtnDisabled]}
                onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <Feather name="chevron-left" size={20} color={currentPage === 1 ? '#94A3B8' : '#0F172A'} />
                <Text style={[styles.pageStepText, currentPage === 1 && styles.pageStepTextDisabled]}>
                  Previous
                </Text>
              </TouchableOpacity>

              <View style={styles.pagesDotsRow}>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.pageDot, currentPage === i + 1 && styles.pageDotActive]}
                    onPress={() => setCurrentPage(i + 1)}
                  />
                ))}
              </View>

              <TouchableOpacity
                disabled={currentPage === totalPages}
                style={[styles.pageStepBtn, currentPage === totalPages && styles.pageStepBtnDisabled]}
                onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                <Text style={[styles.pageStepText, currentPage === totalPages && styles.pageStepTextDisabled]}>
                  Next
                </Text>
                <Feather name="chevron-right" size={20} color={currentPage === totalPages ? '#94A3B8' : '#0F172A'} />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.documentViewerContainer}>
            {paper.pdfUrl ? (
              <>
                <View style={styles.docHeaderBar}>
                  <View style={styles.docInfoCol}>
                    <Text style={styles.docNameText} numberOfLines={1}>
                      {paper.pdfUrl.split('/').pop() || 'Question_Paper_Document'}
                    </Text>
                    <Text style={styles.docMetaText}>
                      Size: {paper.fileSize || 'Standard'} • Format: {paper.pdfUrl.split('.').pop()?.toUpperCase() || 'DOCUMENT'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.openExternalBtn}
                    onPress={() => WebBrowser.openBrowserAsync(paper.pdfUrl!)}
                  >
                    <Feather name="external-link" size={14} color="#0745E8" />
                    <Text style={styles.openExternalText}>Open External</Text>
                  </TouchableOpacity>
                </View>
                <WebView
                  source={{
                    uri: paper.pdfUrl.toLowerCase().endsWith('.pdf')
                      ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(paper.pdfUrl)}`
                      : paper.pdfUrl,
                  }}
                  style={{ flex: 1 }}
                  startInLoadingState
                  renderLoading={() => (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#0745E8" />
                      <Text style={styles.loadingText}>Rendering document preview...</Text>
                    </View>
                  )}
                />
              </>
            ) : (
              <View style={styles.noDocContainer}>
                <Feather name="info" size={40} color="#94A3B8" />
                <Text style={styles.noDocTitle}>Template-Created Paper</Text>
                <Text style={styles.noDocText}>
                  This paper was composed directly using the interactive VTU Question Paper Template in the Admin Panel. Switch to the "VTU Question Template" tab to view all modules, choices, marks, and verified solutions.
                </Text>
                <TouchableOpacity
                  style={styles.switchTemplateBtn}
                  onPress={() => setViewMode('TEMPLATE')}
                >
                  <Text style={styles.switchTemplateBtnText}>Switch to Template View</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadedIconBtn: {
    backgroundColor: '#D1FAE5',
  },
  navTitleContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  navTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  navSub: {
    fontSize: 11,
    color: '#64748B',
  },
  navRightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  zoomControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    elevation: 1,
  },
  zoomBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  zoomText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    minWidth: 38,
    textAlign: 'center',
  },
  verticalDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#CBD5E1',
  },
  pageIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  solutionToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 4,
  },
  solutionToggleBtnActive: {
    backgroundColor: '#059669',
  },
  solutionToggleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7E22CE',
  },
  solutionToggleTextActive: {
    color: '#FFFFFF',
  },
  canvasScroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  canvasContent: {
    alignItems: 'center',
    paddingBottom: 30,
  },
  paperSheet: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  sheetHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  vtuHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  vtuHeaderSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  examBannerRow: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    marginVertical: 4,
  },
  examBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
  usnSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    gap: 8,
  },
  usnTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  usnBoxesRow: {
    flexDirection: 'row',
    gap: 3,
  },
  usnBoxCell: {
    width: 14,
    height: 18,
    borderWidth: 1,
    borderColor: '#64748B',
    borderRadius: 2,
  },
  subjectNameHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0745E8',
    marginTop: 4,
    marginBottom: 4,
  },
  timeMarksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
    marginVertical: 4,
  },
  timeMarksText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  dividerLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#0F172A',
    marginVertical: 8,
  },
  instructionsText: {
    fontSize: 10,
    color: '#64748B',
    fontStyle: 'italic',
    lineHeight: 14,
    textAlign: 'center',
  },
  modulesContainer: {
    gap: 16,
  },
  moduleBlock: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#FAF5FF',
  },
  moduleBadge: {
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E9D5FF',
  },
  moduleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7E22CE',
  },
  moduleTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    gap: 8,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#CBD5E1',
  },
  orText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 1,
  },
  questionItem: {
    flexDirection: 'row',
    marginVertical: 6,
    gap: 8,
  },
  qNumCol: {
    width: 60,
  },
  qNumText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  qTextCol: {
    flex: 1,
  },
  qText: {
    fontSize: 12,
    color: '#1E293B',
    lineHeight: 18,
  },
  solutionBox: {
    marginTop: 6,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  solutionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
    marginBottom: 2,
  },
  solutionText: {
    fontSize: 11,
    color: '#065F46',
    lineHeight: 15,
  },
  qMarksCol: {
    alignItems: 'flex-end',
    width: 65,
  },
  qMarksText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0745E8',
  },
  qBloomText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
  },
  pageNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  pageStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pageStepBtnDisabled: {
    opacity: 0.5,
  },
  pageStepText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  pageStepTextDisabled: {
    color: '#94A3B8',
  },
  pagesDotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  pageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
  },
  pageDotActive: {
    width: 16,
    backgroundColor: '#0745E8',
  },
  tabSwitcherRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 4,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabButtonTextActive: {
    color: '#0745E8',
    fontWeight: '700',
  },
  documentViewerContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  docHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  docInfoCol: {
    flex: 1,
    marginRight: 12,
  },
  docNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  docMetaText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  openExternalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  openExternalText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0745E8',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  noDocContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  noDocTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 14,
    marginBottom: 6,
  },
  noDocText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  switchTemplateBtn: {
    backgroundColor: '#0745E8',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  switchTemplateBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
