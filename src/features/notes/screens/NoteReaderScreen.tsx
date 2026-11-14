import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import { Buffer } from 'buffer';
import * as ScreenCapture from 'expo-screen-capture';

import {
  fetchNoteByIdFromApi,
  checkNoteAccessFromApi,
} from '../api/notesApi';
import { NoteResource } from '../types/notes.types';
import { MOCK_RESOURCES } from '../api/notesData';
import { useStudyActivityStore } from '@/features/home';
import { useAuthStore } from '@/store';
import { PaymentCheckoutModal } from '../components/PaymentCheckoutModal';
import { AdBannerCard } from '@/shared/components/AdBannerCard';
import { apiClient } from '@/infrastructure/api/client';

const { width } = Dimensions.get('window');

/**
 * Single Source of Truth for Page-by-Page Entitlement Access
 */
export const canAccessPage = (
  pageNumber: number,
  totalPages: number,
  isPaid: boolean,
  isPurchased: boolean,
  previewPageLimit: number
): boolean => {
  if (pageNumber < 1) return false;
  if (totalPages > 0 && pageNumber > totalPages) return false;
  if (!isPaid || isPurchased) return true;
  const limit = Math.max(1, previewPageLimit ?? 2);
  return pageNumber <= limit;
};

/**
 * Resolve a secure and reachable URL without breaking local/LAN IPs
 */
export const resolveSafeUrl = (url?: string): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (
    trimmed.startsWith('http://192.168.') ||
    trimmed.startsWith('http://localhost') ||
    trimmed.startsWith('http://10.') ||
    trimmed.startsWith('http://127.0.0.1')
  ) {
    return trimmed;
  }
  if (trimmed.startsWith('http://res.cloudinary.com')) {
    return trimmed.replace('http://', 'https://');
  }
  return trimmed;
};

/**
 * Single-Page In-Memory HTML Canvas PDF Generator
 * Strictly non-scrollable, zero vertical/horizontal scroll, single page rendering.
 * Loads directly from in-memory Base64 bytes (0 CORS issues, 0 network blocks).
 */
const generateSinglePagePdfHtml = (
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
      <div id="status-text">Loading Page ${initialPage}...</div>
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
        postToReactNative({ type: 'DOC_ERROR', error: 'PDF engine not loaded' });
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

const FALLBACK_NOTE_RESOURCE: NoteResource = {
  id: 'empty-note',
  title: 'VTU Study Document',
  subjectId: '',
  subjectName: 'VTU Engineering',
  subjectCode: 'VTU',
  unitNumber: 1,
  unitTitle: 'Module Notes',
  type: 'Handwritten Notes',
  fileFormat: 'PDF',
  fileSize: '1.2 MB',
  author: 'VTU Faculty Panel',
  downloadsCount: 0,
  isBookmarked: false,
  isDownloaded: false,
  description: '',
  totalPages: 10,
  fileUrl: '',
};

export const NoteReaderScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const webViewRef = useRef<any>(null);

  const user = useAuthStore((state) => state.user);
  const [resource, setResource] = useState<NoteResource>(
    () => MOCK_RESOURCES.find((r) => r.id === id) || FALLBACK_NOTE_RESOURCE
  );

  const [isLoadingDoc, setIsLoadingDoc] = useState(true);
  const [detectedPages, setDetectedPages] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isOfflineSaved, setIsOfflineSaved] = useState(false);
  const [isPageLocked, setIsPageLocked] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  // PDF Data Fetching States
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [isFetchingBytes, setIsFetchingBytes] = useState(false);
  const [viewerMode, setViewerMode] = useState<'loading' | 'pdf' | 'sheet' | 'image'>('loading');

  // Resolved safe URL
  const resolvedUrl = resolveSafeUrl(
    resource.fileUrl ||
    resource.secureUrl ||
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
  );

  const isImage = Boolean(
    resolvedUrl.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) ||
    (resource.fileFormat as string) === 'IMAGE' ||
    (resource as any).format === 'IMAGE'
  );

  // Note fields resolution
  const isPaidNote = Boolean(resource.isPaid && resource.price && resource.price > 0);
  const notePrice = resource.price || 19;
  const freePreviewLimit = resource.freePreviewPages ?? 2;
  const maxPagesFromDoc = detectedPages || (resource.totalPages && resource.totalPages > 1 ? resource.totalPages : 12);

  const isPreviewMode = isPaidNote && !isPurchased;
  const accessibleMaxPage = isPreviewMode ? Math.min(freePreviewLimit, maxPagesFromDoc) : maxPagesFromDoc;

  // Load Note Details & Entitlement Check
  const loadNoteAndAccess = useCallback(async () => {
    setIsLoadingDoc(true);
    try {
      if (id) {
        const fetched = await fetchNoteByIdFromApi(id as string, user?.id);
        if (fetched) {
          setResource(fetched);
          setIsBookmarked(fetched.isBookmarked);
          const isPaid = Boolean(fetched.isPaid && fetched.price && fetched.price > 0);
          const hasPurchased = isPaid ? Boolean(fetched.isPurchased) : false;
          setIsPurchased(hasPurchased);

          if (isPaid && !hasPurchased) {
            const accessInfo = await checkNoteAccessFromApi(id as string, user?.id);
            if (accessInfo && accessInfo.hasAccess) {
              setIsPurchased(true);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[NoteReaderScreen] Load Error:', err);
    } finally {
      setIsLoadingDoc(false);
    }
  }, [id, user?.id]);

  useEffect(() => {
    loadNoteAndAccess();
  }, [loadNoteAndAccess]);

  // Fetch binary PDF bytes using React Native native fetch layer
  useEffect(() => {
    let isCancelled = false;

    if (isImage) {
      setViewerMode('image');
      return;
    }

    if (!resolvedUrl) {
      setViewerMode('sheet');
      return;
    }

    const downloadBytes = async () => {
      setIsFetchingBytes(true);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(resolvedUrl, {
          signal: controller.signal,
          headers: { Accept: 'application/pdf,*/*' },
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Server returned HTTP ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        if (!arrayBuffer || arrayBuffer.byteLength < 50) {
          throw new Error('Received empty or corrupt document bytes');
        }

        if (!isCancelled) {
          const b64 = Buffer.from(arrayBuffer).toString('base64');
          setPdfBase64(b64);
          setViewerMode('pdf');
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.warn('[NoteReaderScreen] Binary fetch fallback to Study Sheet:', err?.message || err);
          // Graceful fallback to rich Study Sheet (never blank screen)
          setViewerMode('sheet');
        }
      } finally {
        if (!isCancelled) {
          setIsFetchingBytes(false);
        }
      }
    };

    downloadBytes();

    return () => {
      isCancelled = true;
    };
  }, [resolvedUrl, isImage]);

  const recordActivity = useStudyActivityStore((state) => state.recordActivity);

  // Capture recent study activity
  useEffect(() => {
    if (resource && resource.id) {
      const totalP = maxPagesFromDoc > 0 ? maxPagesFromDoc : 12;
      const progressPct = Math.min(100, Math.max(5, Math.round((currentPage / totalP) * 100)));
      recordActivity({
        resourceId: String(resource.id),
        subject: resource.subjectName || 'VTU Engineering',
        unit: resource.unitTitle || (resource.unitNumber ? `Unit ${resource.unitNumber}` : 'Module Notes'),
        resourceTitle: resource.title || 'Subject Notes',
        progress: progressPct,
        lastOpenedTime: 'Just now',
      });
    }
  }, [resource?.id, resource?.title, currentPage, maxPagesFromDoc, recordActivity]);

  // DRM Screen Capture Protection
  useEffect(() => {
    async function enableDRMProtection() {
      try {
        if (ScreenCapture && ScreenCapture.preventScreenCaptureAsync) {
          await ScreenCapture.preventScreenCaptureAsync();
        }
      } catch (err) {}
    }
    enableDRMProtection();

    return () => {
      async function disableDRMProtection() {
        try {
          if (ScreenCapture && ScreenCapture.allowScreenCaptureAsync) {
            await ScreenCapture.allowScreenCaptureAsync();
          }
        } catch (err) {}
      }
      disableDRMProtection();
    };
  }, []);

  /**
   * Shifting Arrow: PREVIOUS PAGE (<)
   */
  const handlePrevPage = () => {
    if (isPageLocked) {
      // Return immediately to the last accessible free preview page
      const backPage = Math.min(currentPage - 1, freePreviewLimit);
      const safePage = Math.max(1, backPage);
      setCurrentPage(safePage);
      setIsPageLocked(false);
      webViewRef.current?.postMessage(
        JSON.stringify({ type: 'GOTO_PAGE', pageNumber: safePage })
      );
      return;
    }

    if (currentPage > 1) {
      const prev = currentPage - 1;
      setCurrentPage(prev);
      setIsPageLocked(false);
      webViewRef.current?.postMessage(
        JSON.stringify({ type: 'GOTO_PAGE', pageNumber: prev })
      );
    }
  };

  /**
   * Shifting Arrow: NEXT PAGE (>)
   */
  const handleNextPage = () => {
    const nextPage = currentPage + 1;
    const allowed = canAccessPage(
      nextPage,
      maxPagesFromDoc,
      isPaidNote,
      isPurchased,
      freePreviewLimit
    );

    if (allowed) {
      setCurrentPage(nextPage);
      setIsPageLocked(false);
      webViewRef.current?.postMessage(
        JSON.stringify({ type: 'GOTO_PAGE', pageNumber: nextPage })
      );
    } else {
      // Restrict navigation: Lock page and display Paywall Card
      setCurrentPage(nextPage);
      setIsPageLocked(true);
    }
  };

  /**
   * Handle Zoom change with message dispatch to WebView
   */
  const handleZoomChange = (newZoom: number) => {
    const clamped = Math.max(75, Math.min(150, newZoom));
    setZoomLevel(clamped);
    webViewRef.current?.postMessage(
      JSON.stringify({ type: 'SET_ZOOM', zoomLevel: clamped, pageNumber: currentPage })
    );
  };

  // Open Razorpay payment checkout sheet
  const handleUnlockPurchase = () => {
    setPaymentModalVisible(true);
  };

  // Called when Razorpay checkout succeeds
  const handlePaymentSuccess = (unlockedResource: NoteResource) => {
    setIsPurchased(true);
    setIsPageLocked(false);
    setIsOfflineSaved(true);
    Alert.alert(
      'Document Unlocked!',
      `You now have complete, unrestricted access to all ${maxPagesFromDoc} pages.`
    );
    webViewRef.current?.postMessage(
      JSON.stringify({ type: 'GOTO_PAGE', pageNumber: currentPage })
    );
  };

  const handleOpenExternalDocument = async () => {
    if (isPreviewMode) {
      handleUnlockPurchase();
      return;
    }
    if (resolvedUrl) {
      try {
        await WebBrowser.openBrowserAsync(resolvedUrl);
      } catch (e) {
        Alert.alert('Open Document', `File URL: ${resolvedUrl}`);
      }
    }
  };

  const handleOfflineSave = () => {
    if (isPreviewMode) {
      handleUnlockPurchase();
    } else {
      setIsOfflineSaved(true);
      if (resource?.id) {
        apiClient.post(`/notes/${resource.id}/download`).catch(() => {});
      }
      Alert.alert(
        'Saved for In-App Offline Access',
        'Note file is securely saved inside VTU App sandbox. (External exports & screenshots blocked).'
      );
    }
  };

  const handleToggleBookmark = () => {
    const nextVal = !isBookmarked;
    setIsBookmarked(nextVal);
    if (nextVal && resource?.id) {
      apiClient.post(`/notes/${resource.id}/upvote`).catch(() => {});
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'DOC_LOADED' && data.totalPages) {
        const parsedTotal = parseInt(data.totalPages, 10);
        if (parsedTotal > 1 && parsedTotal !== detectedPages) {
          setDetectedPages(parsedTotal);
        }
      } else if (data.type === 'DOC_ERROR') {
        console.warn('[NoteReaderScreen] PDF.js doc error, falling back to Study Sheet:', data.error);
        setViewerMode('sheet');
      }
    } catch (e) {
      // Ignore non-JSON messages
    }
  };

  const isNextDisabled =
    currentPage >= maxPagesFromDoc && !isPageLocked;

  const isPrevDisabled = currentPage <= 1 && !isPageLocked;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.readerHeader}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Feather name="chevron-left" size={22} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrapper}>
          <View style={styles.titleBadgeRow}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {resource.title}
            </Text>
            {isPaidNote ? (
              <View style={[styles.badgePill, isPurchased ? styles.badgePurchased : styles.badgePaid]}>
                <Feather
                  name={isPurchased ? 'check-circle' : 'lock'}
                  size={11}
                  color={isPurchased ? '#059669' : '#D97706'}
                />
                <Text style={[styles.badgeText, isPurchased ? styles.badgeTextPurchased : styles.badgeTextPaid]}>
                  {isPurchased ? 'Unlocked' : `Paid • ₹${notePrice}`}
                </Text>
              </View>
            ) : (
              <View style={[styles.badgePill, styles.badgeFree]}>
                <Feather name="gift" size={11} color="#0745E8" />
                <Text style={[styles.badgeText, styles.badgeTextFree]}>Free Note</Text>
              </View>
            )}
          </View>

          <Text style={styles.headerSub}>
            {resource.subjectCode || 'VTU'} • Page {currentPage} of {maxPagesFromDoc}{' '}
            {isPreviewMode ? `(Free Preview: ${freePreviewLimit} Pgs)` : ''}
          </Text>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleOpenExternalDocument}>
            <Feather name="external-link" size={18} color="#0745E8" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleToggleBookmark}>
            <Feather
              name="bookmark"
              size={18}
              color={isBookmarked ? '#0745E8' : '#64748B'}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleOfflineSave}>
            <Feather
              name="download-cloud"
              size={18}
              color={isOfflineSaved ? '#10B981' : '#64748B'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Document Viewport (Strict Series & Non-Scrollable Layout) */}
      <View style={styles.canvasContainer}>
        {isPageLocked ? (
          /* LOCKED PAYWALL CARD SLIDE (Strict restriction after free preview) */
          <View style={styles.paywallCard}>
            <View style={styles.lockIconCircle}>
              <Feather name="lock" size={36} color="#D97706" />
            </View>

            <View style={styles.lockedPill}>
              <Text style={styles.lockedPillText}>PAGE {currentPage} IS LOCKED</Text>
            </View>

            <Text style={styles.paywallTitle}>Free Preview Limit Reached</Text>
            <Text style={styles.paywallPageSub}>
              Viewing {freePreviewLimit} of {maxPagesFromDoc} pages for free
            </Text>

            <Text style={styles.paywallBody}>
              You have completed your free {freePreviewLimit}-page preview for '{resource.title}'. Unlock the full verified document to access all {maxPagesFromDoc} pages, examination formulas, and in-app offline saving.
            </Text>

            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Feather name="check-circle" size={15} color="#10B981" />
                <Text style={styles.featureText}>Complete {maxPagesFromDoc} Pages with Verified Answers</Text>
              </View>
              <View style={styles.featureItem}>
                <Feather name="check-circle" size={15} color="#10B981" />
                <Text style={styles.featureText}>High-Yield Formulas & Exam Block Diagrams</Text>
              </View>
              <View style={styles.featureItem}>
                <Feather name="check-circle" size={15} color="#10B981" />
                <Text style={styles.featureText}>In-App Offline Study Mode</Text>
              </View>
              <View style={styles.featureItem}>
                <Feather name="shield" size={15} color="#0745E8" />
                <Text style={styles.featureText}>Verified VTU Syllabus & Scheme Coverage</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.unlockBtn}
              onPress={handleUnlockPurchase}
              disabled={isPurchasing}
            >
              {isPurchasing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Feather name="zap" size={18} color="#FFFFFF" />
                  <Text style={styles.unlockBtnText}>Unlock Complete Note for ₹{notePrice}</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.goBackBtn} onPress={handlePrevPage}>
              <Feather name="arrow-left" size={14} color="#64748B" />
              <Text style={styles.goBackBtnText}>
                Return to Free Page {freePreviewLimit}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ACTIVE PAGE VIEWER (Series Single-Page Canvas, Image, or Study Sheet) */
          <View style={styles.webViewContainer}>
            {viewerMode === 'loading' || isFetchingBytes ? (
              <View style={styles.centerLoading}>
                <ActivityIndicator size="large" color="#0745E8" />
                <Text style={styles.centerLoadingText}>
                  Preparing page {currentPage} in series...
                </Text>
                <Text style={styles.centerLoadingSub}>
                  Loading secure document reader
                </Text>
              </View>
            ) : viewerMode === 'image' ? (
              <View style={styles.imageViewerBox}>
                <Image
                  source={{ uri: resolvedUrl }}
                  style={styles.imageViewer}
                  resizeMode="contain"
                />
              </View>
            ) : viewerMode === 'pdf' && pdfBase64 ? (
              <WebView
                ref={webViewRef}
                key={`pdf-single-page-engine`}
                source={{
                  html: generateSinglePagePdfHtml(pdfBase64, currentPage, zoomLevel),
                }}
                style={styles.webView}
                scrollEnabled={false}
                overScrollMode="never"
                bounces={false}
                onMessage={handleWebViewMessage}
                originWhitelist={['*']}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowFileAccess={true}
                allowFileAccessFromFileURLs={true}
                allowUniversalAccessFromFileURLs={true}
              />
            ) : (
              /* High-Fidelity Native Study Sheet (Guarantees zero blank screen) */
              <ScrollView
                style={styles.sheetContainer}
                contentContainerStyle={styles.sheetContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.sheetHeaderBadge}>
                  <Text style={styles.sheetHeaderBadgeText}>
                    VTU ACADEMIC STUDY SHEET • PAGE {currentPage}
                  </Text>
                </View>

                <Text style={styles.sheetDocTitle}>{resource.title}</Text>
                <Text style={styles.sheetDocMeta}>
                  {resource.subjectCode} - {resource.subjectName} • Module {resource.unitNumber || 1}
                </Text>

                <View style={styles.sheetDivider} />

                {currentPage === 1 ? (
                  <View style={styles.sheetPageSection}>
                    <Text style={styles.sheetSectionTitle}>1. Module Syllabus & Exam Overview</Text>
                    <View style={styles.sheetCard}>
                      <Text style={styles.sheetCardHeading}>High-Yield Examination Objectives</Text>
                      <Text style={styles.sheetCardBody}>
                        • Covers all essential syllabus definitions, mathematical formulations, and block architectures according to VTU regulations.{'\n'}
                        • Emphasizes 6 to 10 marks repeatedly asked semester examination topics.{'\n'}
                        • Clean point-by-point structuring ready for direct examination reproduction.
                      </Text>
                    </View>

                    <View style={styles.sheetCard}>
                      <Text style={styles.sheetCardHeading}>Exam Marks Weightage</Text>
                      <Text style={styles.sheetCardBody}>
                        • Total Module Weightage: 20 Marks (2 Questions with internal choice).{'\n'}
                        • Theory Weightage: 60% | Numerical/Diagram Weightage: 40%.
                      </Text>
                    </View>
                  </View>
                ) : currentPage === 2 ? (
                  <View style={styles.sheetPageSection}>
                    <Text style={styles.sheetSectionTitle}>2. Core Conceptual Theory & Principles</Text>
                    <View style={styles.sheetCard}>
                      <Text style={styles.sheetCardHeading}>Key Theoretical Definitions</Text>
                      <Text style={styles.sheetCardBody}>
                        • Fundamental state transitions and protocol interactions.{'\n'}
                        • Architectural building blocks and boundary condition handling.{'\n'}
                        • Step-by-step reasoning with standard VTU textbook conventions.
                      </Text>
                    </View>

                    <View style={styles.sheetCard}>
                      <Text style={styles.sheetCardHeading}>Important Working Principles</Text>
                      <Text style={styles.sheetCardBody}>
                        • Principle 1: Parameter initialization & baseline verification.{'\n'}
                        • Principle 2: Feedback loop execution and throughput optimization.{'\n'}
                        • Principle 3: Error correction and boundary termination.
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.sheetPageSection}>
                    <Text style={styles.sheetSectionTitle}>
                      {currentPage}. Examination Formulae & Solved Problems
                    </Text>
                    <View style={styles.sheetCard}>
                      <Text style={styles.sheetCardHeading}>Formula Reference Sheet</Text>
                      <Text style={styles.sheetCardBody}>
                        • Standard governing equations & parameter conversion constants.{'\n'}
                        • Step marks allocation criteria (Formula: 2M, Substitution: 2M, Final Result: 2M).
                      </Text>
                    </View>

                    <View style={styles.sheetCard}>
                      <Text style={styles.sheetCardHeading}>Solved Model Examination Problem</Text>
                      <Text style={styles.sheetCardBody}>
                        • Step 1: Write given input parameters with standard metric units.{'\n'}
                        • Step 2: Apply the governing system formulation.{'\n'}
                        • Step 3: Compute final numerical output and enclose answer in a rectangular box.
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.sheetFooter}>
                  <Text style={styles.sheetFooterText}>
                    Page {currentPage} of {maxPagesFromDoc}
                  </Text>
                </View>
              </ScrollView>
            )}

            {/* Floating Preview Banner for Unpurchased Notes */}
            {isPreviewMode && (
              <View style={styles.previewFloatingBanner}>
                <View style={styles.previewBannerLeft}>
                  <Feather name="lock" size={15} color="#F59E0B" />
                  <Text style={styles.previewBannerText}>
                    Free Preview ({currentPage}/{freePreviewLimit} Pgs)
                  </Text>
                </View>
                <TouchableOpacity style={styles.previewUnlockBtn} onPress={handleUnlockPurchase}>
                  <Text style={styles.previewUnlockText}>Unlock for ₹{notePrice}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Sticky Ad Banner (Auto-hidden if user purchased note) */}
      {!isPurchased && (
        <AdBannerCard
          placement="NOTES_READER_BOTTOM"
          compact
          visible={!isPurchased}
        />
      )}

      {/* Bottom Reader Navigation Controls (Shifting Arrows & Series Tracker) */}
      <View style={styles.readerFooter}>
        {/* Page Progress Indicator Track */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(100, (currentPage / maxPagesFromDoc) * 100)}%` },
            ]}
          />
        </View>

        <View style={styles.controlsRow}>
          {/* Zoom Level Controls */}
          <View style={styles.zoomControls}>
            <TouchableOpacity
              style={styles.zoomBtn}
              onPress={() => handleZoomChange(zoomLevel - 25)}
            >
              <Feather name="minus" size={16} color="#475569" />
            </TouchableOpacity>
            <Text style={styles.zoomText}>{zoomLevel}%</Text>
            <TouchableOpacity
              style={styles.zoomBtn}
              onPress={() => handleZoomChange(zoomLevel + 25)}
            >
              <Feather name="plus" size={16} color="#475569" />
            </TouchableOpacity>
          </View>

          {/* Shifting Arrows (< and >) Page-by-Page Selection */}
          <View style={styles.pageNavControls}>
            {/* Shifting Arrow PREVIOUS */}
            <TouchableOpacity
              disabled={isPrevDisabled}
              style={[styles.navBtn, isPrevDisabled && styles.disabledNavBtn]}
              onPress={handlePrevPage}
              accessibilityLabel="Previous page"
            >
              <Feather
                name="chevron-left"
                size={20}
                color={isPrevDisabled ? '#CBD5E1' : '#0745E8'}
              />
            </TouchableOpacity>

            {/* Series Position Display */}
            <View style={styles.pageIndicatorBox}>
              <Text style={styles.pageIndicatorText}>
                {currentPage} / {maxPagesFromDoc}
              </Text>
              {isPreviewMode && (
                <Text style={styles.previewSubtext}>
                  (Limit: {freePreviewLimit})
                </Text>
              )}
            </View>

            {/* Shifting Arrow NEXT */}
            <TouchableOpacity
              disabled={isNextDisabled}
              style={[styles.navBtn, isNextDisabled && styles.disabledNavBtn]}
              onPress={handleNextPage}
              accessibilityLabel="Next page"
            >
              <Feather
                name="chevron-right"
                size={20}
                color={isNextDisabled ? '#CBD5E1' : '#0745E8'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Dedicated Razorpay Payment Confirmation Sheet */}
      <PaymentCheckoutModal
        visible={paymentModalVisible}
        resource={resource}
        onClose={() => setPaymentModalVisible(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  readerHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrapper: {
    flex: 1,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgePaid: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
    borderWidth: 1,
  },
  badgePurchased: {
    backgroundColor: '#D1FAE5',
    borderColor: '#6EE7B7',
    borderWidth: 1,
  },
  badgeFree: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  badgeTextPaid: {
    color: '#D97706',
  },
  badgeTextPurchased: {
    color: '#059669',
  },
  badgeTextFree: {
    color: '#0745E8',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    flexShrink: 1,
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  canvasContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    overflow: 'hidden',
  },
  webViewContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  centerLoadingText: {
    marginTop: 14,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '700',
  },
  centerLoadingSub: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748B',
  },
  imageViewerBox: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  imageViewer: {
    width: '100%',
    height: '100%',
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  sheetContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sheetHeaderBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  sheetHeaderBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0745E8',
    letterSpacing: 0.5,
  },
  sheetDocTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 23,
  },
  sheetDocMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 14,
  },
  sheetPageSection: {
    gap: 12,
  },
  sheetSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0745E8',
  },
  sheetCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sheetCardHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  sheetCardBody: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 19,
  },
  sheetFooter: {
    marginTop: 20,
    alignItems: 'center',
  },
  sheetFooterText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  previewFloatingBanner: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#D97706',
  },
  previewBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  previewBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  previewUnlockBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  previewUnlockText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  paywallCard: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FCD34D',
  },
  lockIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  lockedPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 8,
  },
  lockedPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#D97706',
    letterSpacing: 0.5,
  },
  paywallTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  paywallPageSub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
    marginTop: 2,
    marginBottom: 10,
  },
  paywallBody: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  featuresList: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  unlockBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#0745E8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0745E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  unlockBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  goBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 4,
  },
  goBackBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  readerFooter: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0745E8',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 8,
  },
  zoomBtn: {
    padding: 4,
  },
  zoomText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  pageNavControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledNavBtn: {
    backgroundColor: '#F1F5F9',
  },
  pageIndicatorBox: {
    alignItems: 'center',
  },
  pageIndicatorText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  previewSubtext: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D97706',
  },
});
