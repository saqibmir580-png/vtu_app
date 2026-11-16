import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import { Buffer } from 'buffer';
import { QuestionPaper } from '../types/paper.types';
import { usePaperStore } from '../store/usePaperStore';
import * as ScreenCapture from 'expo-screen-capture';
import { getBaseUrl } from '@/infrastructure/api/client';

/**
 * Resolve reachable URL without breaking local/LAN IPs, S3 schemes, or relative paths
 */
const resolvePaperUrl = (url?: string): string => {
  if (!url) return '';
  const trimmed = url.trim();

  let baseUrl = '';
  try {
    baseUrl = getBaseUrl();
  } catch {
    baseUrl = 'http://localhost:5000/api/v1';
  }
  const hostRoot = baseUrl.replace(/\/api\/v1\/?$/, '');

  if (
    trimmed.startsWith('s3://') ||
    (!trimmed.startsWith('http://') &&
      !trimmed.startsWith('https://') &&
      !trimmed.startsWith('data:') &&
      trimmed.length > 0)
  ) {
    return `${baseUrl}/storage/stream?url=${encodeURIComponent(trimmed)}`;
  }

  if (trimmed.startsWith('/api/v1') || trimmed.startsWith('/uploads')) {
    return `${hostRoot}${trimmed}`;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (!trimmed.includes('/storage/stream')) {
      return `${baseUrl}/storage/stream?url=${encodeURIComponent(trimmed)}`;
    }
  }

  if (trimmed.includes('localhost') || trimmed.includes('127.0.0.1')) {
    const lanHostMatch = hostRoot.match(/https?:\/\/([^:/]+)/);
    if (
      lanHostMatch &&
      lanHostMatch[1] &&
      lanHostMatch[1] !== 'localhost' &&
      lanHostMatch[1] !== '127.0.0.1'
    ) {
      return trimmed
        .replace('localhost', lanHostMatch[1])
        .replace('127.0.0.1', lanHostMatch[1]);
    }
  }

  return trimmed;
};

/**
 * Single-Page In-Memory HTML Canvas PDF Generator for Question Papers
 * Renders directly from in-memory Base64 bytes (0 CORS issues, 0 network blocks, 0 Google Docs dependency)
 */
const generatePaperPdfHtml = (
  pdfBase64: string,
  initialPage: number,
  zoomLevel: number
): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100vw;
      height: 100vh;
      overflow: hidden !important;
      background-color: #F8FAFC;
      display: flex;
      justify-content: center;
      align-items: center;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
    }
    #viewport-container {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
      overflow: hidden;
    }
    canvas {
      display: none;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.12);
      border-radius: 6px;
      background: #FFFFFF;
    }
    #status-overlay {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      color: #64748B;
      font-weight: 600;
      text-align: center;
      padding: 20px;
    }
    .spinner {
      width: 28px;
      height: 28px;
      border: 3px solid #E2E8F0;
      border-top-color: #0745E8;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
</head>
<body>
  <div id="viewport-container">
    <div id="status-overlay">
      <div class="spinner"></div>
      <div id="status-text">Rendering Page ${initialPage}...</div>
    </div>
    <canvas id="pdf-canvas"></canvas>
  </div>
  <script>
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
    }

    var base64Data = ${JSON.stringify(pdfBase64)};
    var currentPageNum = ${initialPage};
    var currentZoom = ${zoomLevel};
    var canvas = document.getElementById('pdf-canvas');
    var ctx = canvas.getContext('2d');
    var statusOverlay = document.getElementById('status-overlay');
    var statusText = document.getElementById('status-text');
    var pdfDoc = null;
    var currentRenderTask = null;

    function postToReactNative(obj) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(obj));
      }
    }

    function renderPage(pageNum) {
      if (!pdfDoc) return;
      var targetPage = Math.min(Math.max(1, pageNum), pdfDoc.numPages);
      currentPageNum = targetPage;

      statusOverlay.style.display = 'flex';
      statusText.innerText = 'Rendering Page ' + targetPage + ' of ' + pdfDoc.numPages + '...';
      canvas.style.display = 'none';

      pdfDoc.getPage(targetPage).then(function(page) {
        var containerWidth = window.innerWidth || 360;
        var containerHeight = window.innerHeight || 600;
        var unscaledViewport = page.getViewport({ scale: 1.0 });

        var padding = 16;
        var availW = Math.max(100, containerWidth - padding);
        var availH = Math.max(100, containerHeight - padding);

        var scaleX = availW / unscaledViewport.width;
        var scaleY = availH / unscaledViewport.height;
        var fitScale = Math.min(scaleX, scaleY);

        var zoomFactor = (currentZoom || 100) / 100;
        var finalScale = fitScale * zoomFactor;
        var dpr = window.devicePixelRatio || 2;

        var viewport = page.getViewport({ scale: finalScale * dpr });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = (viewport.width / dpr) + 'px';
        canvas.style.height = (viewport.height / dpr) + 'px';

        var renderContext = {
          canvasContext: ctx,
          viewport: viewport
        };

        if (currentRenderTask) {
          try { currentRenderTask.cancel(); } catch(e) {}
        }

        currentRenderTask = page.render(renderContext);
        currentRenderTask.promise.then(function() {
          statusOverlay.style.display = 'none';
          canvas.style.display = 'block';
        }).catch(function(err) {
          if (err && err.name === 'RenderingCancelledException') return;
          statusText.innerText = 'Render issue: ' + (err && err.message ? err.message : 'Unknown');
        });
      }).catch(function(err) {
        statusText.innerText = 'Error loading page ' + targetPage;
      });
    }

    function initPdf() {
      if (typeof pdfjsLib === 'undefined') {
        postToReactNative({ type: 'DOC_ERROR', error: 'PDF engine could not be loaded' });
        return;
      }

      try {
        var raw = atob(base64Data);
        var uint8 = new Uint8Array(raw.length);
        for (var i = 0; i < raw.length; i++) {
          uint8[i] = raw.charCodeAt(i);
        }

        pdfjsLib.getDocument({ data: uint8 }).promise.then(function(pdf) {
          pdfDoc = pdf;
          postToReactNative({
            type: 'DOC_LOADED',
            totalPages: pdf.numPages
          });
          renderPage(currentPageNum);
        }).catch(function(err) {
          postToReactNative({
            type: 'DOC_ERROR',
            error: err && err.message ? err.message : 'Invalid document format'
          });
        });
      } catch (err) {
        postToReactNative({
          type: 'DOC_ERROR',
          error: err && err.message ? err.message : 'Base64 decode failed'
        });
      }
    }

    function handleRNMessage(event) {
      try {
        var rawData = event.data;
        var msg = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        if (msg.type === 'GOTO_PAGE') {
          renderPage(msg.pageNumber);
        } else if (msg.type === 'SET_ZOOM') {
          currentZoom = msg.zoomLevel;
          renderPage(msg.pageNumber || currentPageNum);
        }
      } catch (e) {}
    }

    window.addEventListener('message', handleRNMessage);
    document.addEventListener('message', handleRNMessage);

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      initPdf();
    } else {
      window.onload = initPdf;
    }
  </script>
</body>
</html>
  `;
};

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

  // Document PDF in-memory viewer state
  const [docPdfBase64, setDocPdfBase64] = useState<string | null>(null);
  const [isDocLoading, setIsDocLoading] = useState<boolean>(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [docCurrentPage, setDocCurrentPage] = useState<number>(1);
  const [docTotalPages, setDocTotalPages] = useState<number>(paper?.pageCount || 1);
  const [docZoom, setDocZoom] = useState<number>(100);
  const docWebViewRef = useRef<any>(null);

  const rawDocUrl = (paper?.pdfUrl || (paper as any)?.fileUrl || (paper as any)?.secureUrl || '').trim();
  const resolvedDocUrl = resolvePaperUrl(rawDocUrl);
  const isImageDoc = Boolean(resolvedDocUrl.toLowerCase().match(/\.(jpeg|jpg|png|webp|gif)($|\?)/i));
  const isPdfDoc = Boolean(
    !isImageDoc &&
      (resolvedDocUrl.toLowerCase().match(/\.pdf($|\?)/i) ||
        resolvedDocUrl.includes('/storage/stream') ||
        resolvedDocUrl.length > 0)
  );

  const fetchPdfBytes = useCallback(async (url: string) => {
    if (!url) return;
    setIsDocLoading(true);
    setDocError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/pdf,*/*' },
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      if (!arrayBuffer || arrayBuffer.byteLength < 50) {
        throw new Error('Received invalid or empty document');
      }
      const b64 = Buffer.from(arrayBuffer).toString('base64');
      setDocPdfBase64(b64);
    } catch (err: any) {
      console.warn('[PaperPreviewModal] Binary fetch error:', err?.message || err);
      setDocError(err?.message || 'Unable to download paper document');
    } finally {
      setIsDocLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible && viewMode === 'DOCUMENT' && isPdfDoc && resolvedDocUrl && !docPdfBase64) {
      fetchPdfBytes(resolvedDocUrl);
    }
  }, [visible, viewMode, isPdfDoc, resolvedDocUrl, docPdfBase64, fetchPdfBytes]);

  const handleDocPrevPage = () => {
    if (docCurrentPage > 1) {
      const prev = docCurrentPage - 1;
      setDocCurrentPage(prev);
      docWebViewRef.current?.postMessage(
        JSON.stringify({ type: 'GOTO_PAGE', pageNumber: prev })
      );
    }
  };

  const handleDocNextPage = () => {
    if (docCurrentPage < docTotalPages) {
      const next = docCurrentPage + 1;
      setDocCurrentPage(next);
      docWebViewRef.current?.postMessage(
        JSON.stringify({ type: 'GOTO_PAGE', pageNumber: next })
      );
    }
  };

  const handleDocZoomIn = () => {
    const nextZoom = Math.min(docZoom + 25, 200);
    setDocZoom(nextZoom);
    docWebViewRef.current?.postMessage(
      JSON.stringify({ type: 'SET_ZOOM', zoomLevel: nextZoom, pageNumber: docCurrentPage })
    );
  };

  const handleDocZoomOut = () => {
    const nextZoom = Math.max(docZoom - 25, 75);
    setDocZoom(nextZoom);
    docWebViewRef.current?.postMessage(
      JSON.stringify({ type: 'SET_ZOOM', zoomLevel: nextZoom, pageNumber: docCurrentPage })
    );
  };

  const handleDocWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'DOC_LOADED' && data.totalPages) {
        const total = parseInt(data.totalPages, 10);
        if (total >= 1) {
          setDocTotalPages(total);
        }
      } else if (data.type === 'DOC_ERROR') {
        console.warn('[PaperPreviewModal] PDF.js engine error:', data.error);
        setDocError(data.error || 'Failed to render document canvas');
      }
    } catch {}
  };

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
            {resolvedDocUrl ? (
              <>
                <View style={styles.docHeaderBar}>
                  <View style={styles.docInfoCol}>
                    <Text style={styles.docNameText} numberOfLines={1}>
                      {resolvedDocUrl.split('/').pop() || 'Question_Paper_Document'}
                    </Text>
                    <Text style={styles.docMetaText}>
                      Size: {paper.fileSize || 'Standard'} • Format: {isImageDoc ? 'IMAGE' : 'PDF'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.openExternalBtn}
                    onPress={() => WebBrowser.openBrowserAsync(resolvedDocUrl)}
                  >
                    <Feather name="external-link" size={14} color="#0745E8" />
                    <Text style={styles.openExternalText}>Open External</Text>
                  </TouchableOpacity>
                </View>

                {isImageDoc ? (
                  <View style={styles.imageViewerContainer}>
                    <Image
                      source={{ uri: resolvedDocUrl }}
                      style={styles.imageViewer}
                      resizeMode="contain"
                    />
                  </View>
                ) : isDocLoading ? (
                  <View style={styles.docCenterState}>
                    <ActivityIndicator size="large" color="#0745E8" />
                    <Text style={styles.docStateTitle}>Loading Document Bytes...</Text>
                    <Text style={styles.docStateSub}>Preparing PDF.js high-fidelity canvas</Text>
                  </View>
                ) : docError ? (
                  <View style={styles.docCenterState}>
                    <Feather name="alert-triangle" size={38} color="#EF4444" />
                    <Text style={[styles.docStateTitle, { color: '#EF4444' }]}>Unable to Display PDF</Text>
                    <Text style={styles.docStateSub}>{docError}</Text>
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                      <TouchableOpacity
                        style={styles.switchTemplateBtn}
                        onPress={() => fetchPdfBytes(resolvedDocUrl)}
                      >
                        <Text style={styles.switchTemplateBtnText}>Retry</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.switchTemplateBtn, { backgroundColor: '#64748B' }]}
                        onPress={() => WebBrowser.openBrowserAsync(resolvedDocUrl)}
                      >
                        <Text style={styles.switchTemplateBtnText}>Open External</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : docPdfBase64 ? (
                  <View style={{ flex: 1 }}>
                    {/* Document Toolbar: Zoom & Page Stepper */}
                    <View style={styles.docToolbarRow}>
                      <View style={styles.docToolbarGroup}>
                        <TouchableOpacity
                          onPress={handleDocZoomOut}
                          disabled={docZoom <= 75}
                          style={[styles.docToolbarBtn, docZoom <= 75 && styles.docToolbarBtnDisabled]}
                        >
                          <Feather name="minus" size={14} color="#0F172A" />
                        </TouchableOpacity>
                        <Text style={styles.docToolbarText}>{docZoom}%</Text>
                        <TouchableOpacity
                          onPress={handleDocZoomIn}
                          disabled={docZoom >= 200}
                          style={[styles.docToolbarBtn, docZoom >= 200 && styles.docToolbarBtnDisabled]}
                        >
                          <Feather name="plus" size={14} color="#0F172A" />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.docToolbarGroup}>
                        <TouchableOpacity
                          onPress={handleDocPrevPage}
                          disabled={docCurrentPage <= 1}
                          style={[styles.docToolbarBtn, docCurrentPage <= 1 && styles.docToolbarBtnDisabled]}
                        >
                          <Feather name="chevron-left" size={16} color={docCurrentPage <= 1 ? '#94A3B8' : '#0F172A'} />
                        </TouchableOpacity>
                        <Text style={styles.docToolbarText}>
                          Page {docCurrentPage} of {docTotalPages}
                        </Text>
                        <TouchableOpacity
                          onPress={handleDocNextPage}
                          disabled={docCurrentPage >= docTotalPages}
                          style={[styles.docToolbarBtn, docCurrentPage >= docTotalPages && styles.docToolbarBtnDisabled]}
                        >
                          <Feather name="chevron-right" size={16} color={docCurrentPage >= docTotalPages ? '#94A3B8' : '#0F172A'} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* PDF.js HTML Canvas (100% In-Memory Base64, 0 Network Calls) */}
                    <WebView
                      ref={docWebViewRef}
                      source={{
                        html: generatePaperPdfHtml(docPdfBase64, docCurrentPage, docZoom),
                      }}
                      style={{ flex: 1 }}
                      scrollEnabled={false}
                      overScrollMode="never"
                      bounces={false}
                      onMessage={handleDocWebViewMessage}
                      originWhitelist={['*']}
                      javaScriptEnabled={true}
                    />
                  </View>
                ) : (
                  <View style={styles.docCenterState}>
                    <ActivityIndicator size="large" color="#0745E8" />
                    <Text style={styles.docStateSub}>Initializing PDF viewer...</Text>
                  </View>
                )}
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
  imageViewerContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageViewer: {
    width: '100%',
    height: '100%',
  },
  docCenterState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  docStateTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
    marginBottom: 4,
  },
  docStateSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  docToolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  docToolbarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  docToolbarBtn: {
    padding: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  docToolbarBtnDisabled: {
    opacity: 0.35,
  },
  docToolbarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
});
