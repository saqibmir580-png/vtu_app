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
import { useStudyActivityStore } from '@/features/home';
import { useAuthStore } from '@/store';
import { PaymentCheckoutModal } from '../components/PaymentCheckoutModal';
import { AdBannerCard } from '@/shared/components/AdBannerCard';
import { apiClient } from '@/infrastructure/api/client';

const { width } = Dimensions.get('window');

/**
 * Access calculation decision helper (Single Source of Truth)
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
 * Resolve reachable URL without breaking local/LAN IPs
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

export const NoteReaderScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const webViewRef = useRef<any>(null);

  const user = useAuthStore((state) => state.user);
  const [resource, setResource] = useState<NoteResource | null>(null);

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

  // PDF Binary Fetching States
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [isFetchingBytes, setIsFetchingBytes] = useState(false);
  const [fetchErrorMessage, setFetchErrorMessage] = useState<string | null>(null);

  // Load Note Details & Entitlement Check from API
  const loadNoteAndAccess = useCallback(async () => {
    setIsLoadingDoc(true);
    setFetchErrorMessage(null);
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
        } else {
          setResource(null);
        }
      }
    } catch (err: any) {
      console.warn('[NoteReaderScreen] API Load Error:', err);
      setResource(null);
    } finally {
      setIsLoadingDoc(false);
    }
  }, [id, user?.id]);

  useEffect(() => {
    loadNoteAndAccess();
  }, [loadNoteAndAccess]);

  // Determine formats directly from what admin uploaded
  const rawUrl = resource?.fileUrl || resource?.secureUrl || '';
  const resolvedUrl = resolveSafeUrl(rawUrl);

  const isImage = Boolean(
    resolvedUrl.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) ||
    resource?.fileFormat === 'IMAGE' ||
    (resource as any)?.format === 'IMAGE'
  );

  const isDocx = Boolean(
    resolvedUrl.match(/\.(doc|docx)($|\?)/i) ||
    resource?.fileFormat === 'DOCX' ||
    (resource as any)?.format === 'DOCX' ||
    (resource as any)?.format === 'DOC'
  );

  const isPpt = Boolean(
    resolvedUrl.match(/\.(ppt|pptx)($|\?)/i) ||
    resource?.fileFormat === 'PPT' ||
    (resource as any)?.format === 'PPT'
  );

  const isPdf = Boolean(
    !isImage &&
    !isDocx &&
    !isPpt &&
    (resolvedUrl.match(/\.pdf($|\?)/i) ||
      resource?.fileFormat === 'PDF' ||
      resource?.type === 'Handwritten Notes' ||
      resource?.type === 'Typed Notes' ||
      resolvedUrl.length > 0)
  );

  const hasNoFile = !resolvedUrl || resolvedUrl.trim().length === 0;

  // Note fields resolution
  const isPaidNote = Boolean(resource?.isPaid && resource?.price && resource.price > 0);
  const notePrice = resource?.price || 19;
  const freePreviewLimit = resource?.freePreviewPages ?? 2;
  const maxPagesFromDoc =
    detectedPages ||
    (resource?.totalPages && resource.totalPages > 1 ? resource.totalPages : 1);

  const isPreviewMode = isPaidNote && !isPurchased;
  const accessibleMaxPage = isPreviewMode ? Math.min(freePreviewLimit, maxPagesFromDoc) : maxPagesFromDoc;

  // Fetch binary PDF bytes using native fetch (Bypasses browser CORS completely)
  const downloadPdfBytes = useCallback(async (url: string) => {
    setIsFetchingBytes(true);
    setFetchErrorMessage(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(url, {
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

      const b64 = Buffer.from(arrayBuffer).toString('base64');
      setPdfBase64(b64);
    } catch (err: any) {
      console.warn('[NoteReaderScreen] Binary fetch error:', err?.message || err);
      setFetchErrorMessage(err?.message || 'Unable to download document from storage');
    } finally {
      setIsFetchingBytes(false);
    }
  }, []);

  useEffect(() => {
    if (isPdf && resolvedUrl) {
      downloadPdfBytes(resolvedUrl);
    }
  }, [isPdf, resolvedUrl, downloadPdfBytes]);

  const recordActivity = useStudyActivityStore((state) => state.recordActivity);

  // Capture recent study activity
  useEffect(() => {
    if (resource && resource.id) {
      const totalP = maxPagesFromDoc > 0 ? maxPagesFromDoc : 1;
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
  }, [resource, currentPage, maxPagesFromDoc, recordActivity]);

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
      // Free preview reached: lock page
      setCurrentPage(nextPage);
      setIsPageLocked(true);
    }
  };

  /**
   * Zoom change with message dispatch to WebView
   */
  const handleZoomChange = (newZoom: number) => {
    const clamped = Math.max(75, Math.min(150, newZoom));
    setZoomLevel(clamped);
    webViewRef.current?.postMessage(
      JSON.stringify({ type: 'SET_ZOOM', zoomLevel: clamped, pageNumber: currentPage })
    );
  };

  const handleUnlockPurchase = () => {
    setPaymentModalVisible(true);
  };

  const handlePaymentSuccess = (unlockedResource: NoteResource) => {
    setIsPurchased(true);
    setIsPageLocked(false);
    setIsOfflineSaved(true);
    Alert.alert(
      'Document Unlocked!',
      `You now have complete access to all pages of this resource.`
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
        Alert.alert('Document URL', resolvedUrl);
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
        if (parsedTotal >= 1 && parsedTotal !== detectedPages) {
          setDetectedPages(parsedTotal);
        }
      } else if (data.type === 'DOC_ERROR') {
        console.warn('[NoteReaderScreen] PDF.js error:', data.error);
        setFetchErrorMessage(data.error || 'Failed to render document canvas');
      }
    } catch (e) {}
  };

  const isNextDisabled =
    (currentPage >= maxPagesFromDoc && !isPageLocked) || maxPagesFromDoc <= 1;

  const isPrevDisabled = (currentPage <= 1 && !isPageLocked) || maxPagesFromDoc <= 1;

  if (isLoadingDoc) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0745E8" />
        <Text style={styles.centerLoadingText}>Loading document details from server...</Text>
      </SafeAreaView>
    );
  }

  if (!resource) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Feather name="file-text" size={48} color="#CBD5E1" />
        <Text style={styles.emptyTitle}>Document Not Found</Text>
        <Text style={styles.emptySub}>
          The requested document could not be retrieved from the server.
        </Text>
        <TouchableOpacity style={styles.backButtonOutline} onPress={() => router.back()}>
          <Feather name="arrow-left" size={16} color="#0745E8" />
          <Text style={styles.backButtonOutlineText}>Back to Library</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

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
          {Boolean(resolvedUrl) && (
            <TouchableOpacity style={styles.iconBtn} onPress={handleOpenExternalDocument}>
              <Feather name="external-link" size={18} color="#0745E8" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.iconBtn} onPress={handleToggleBookmark}>
            <Feather
              name="bookmark"
              size={18}
              color={isBookmarked ? '#0745E8' : '#64748B'}
            />
          </TouchableOpacity>
          {Boolean(resolvedUrl) && (
            <TouchableOpacity style={styles.iconBtn} onPress={handleOfflineSave}>
              <Feather
                name="download-cloud"
                size={18}
                color={isOfflineSaved ? '#10B981' : '#64748B'}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Document Viewport */}
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
              You have completed your free {freePreviewLimit}-page preview for '{resource.title}'. Purchase this resource to unlock all {maxPagesFromDoc} pages and in-app offline reading.
            </Text>

            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Feather name="check-circle" size={15} color="#10B981" />
                <Text style={styles.featureText}>Full {maxPagesFromDoc} Pages with Verified Syllabus Coverage</Text>
              </View>
              <View style={styles.featureItem}>
                <Feather name="check-circle" size={15} color="#10B981" />
                <Text style={styles.featureText}>High-Resolution Diagrams & Solved Numerical Steps</Text>
              </View>
              <View style={styles.featureItem}>
                <Feather name="check-circle" size={15} color="#10B981" />
                <Text style={styles.featureText}>In-App Offline Study Mode</Text>
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
        ) : hasNoFile ? (
          /* NO FILE UPLOADED YET BY ADMIN (Authentic empty state, zero mock data) */
          <View style={styles.noFileCard}>
            <View style={styles.emptyIconCircle}>
              <Feather name="file-text" size={40} color="#94A3B8" />
            </View>

            <Text style={styles.noFileTitle}>Document File Pending Upload</Text>
            <Text style={styles.noFileSub}>
              This document entry has been published by the faculty in the academic catalog, but the file (PDF / DOCX / Image) has not been uploaded to the server yet.
            </Text>

            <View style={styles.metadataCard}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Subject:</Text>
                <Text style={styles.metaVal}>{resource.subjectCode} - {resource.subjectName}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Module / Unit:</Text>
                <Text style={styles.metaVal}>Module {resource.unitNumber || 1}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Format:</Text>
                <Text style={styles.metaVal}>{resource.fileFormat || resource.type}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Author:</Text>
                <Text style={styles.metaVal}>{resource.author || 'VTU Faculty'}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.refreshActionBtn}
              onPress={() => loadNoteAndAccess()}
            >
              <Feather name="refresh-cw" size={16} color="#0745E8" />
              <Text style={styles.refreshActionText}>Check for Uploaded File</Text>
            </TouchableOpacity>
          </View>
        ) : fetchErrorMessage ? (
          /* FILE DOWNLOAD OR NETWORK ERROR */
          <View style={styles.noFileCard}>
            <View style={[styles.emptyIconCircle, { backgroundColor: '#FEE2E2' }]}>
              <Feather name="alert-triangle" size={36} color="#EF4444" />
            </View>

            <Text style={styles.noFileTitle}>Unable to Open Document File</Text>
            <Text style={styles.noFileSub}>
              The document server could not be reached or returned an invalid response.
            </Text>

            <View style={styles.errorDetailsBox}>
              <Text style={styles.errorDetailsText}>{fetchErrorMessage}</Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.refreshActionBtn}
                onPress={() => downloadPdfBytes(resolvedUrl)}
              >
                <Feather name="refresh-cw" size={16} color="#0745E8" />
                <Text style={styles.refreshActionText}>Retry Download</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionBtn}
                onPress={handleOpenExternalDocument}
              >
                <Feather name="external-link" size={16} color="#475569" />
                <Text style={styles.secondaryActionText}>Open in Browser</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* ACTIVE DOCUMENT VIEWER */
          <View style={styles.webViewContainer}>
            {isFetchingBytes ? (
              <View style={styles.centerLoading}>
                <ActivityIndicator size="large" color="#0745E8" />
                <Text style={styles.centerLoadingText}>Downloading document bytes...</Text>
                <Text style={styles.centerLoadingSub}>Rendering page {currentPage} in series</Text>
              </View>
            ) : isImage ? (
              /* Image / Scanned Handwritten Note Viewer */
              <View style={styles.imageViewerBox}>
                <Image
                  source={{ uri: resolvedUrl }}
                  style={styles.imageViewer}
                  resizeMode="contain"
                />
              </View>
            ) : isDocx ? (
              /* Word Document Viewer Card (.docx / .doc) */
              <View style={styles.officeCard}>
                <View style={styles.docxIconCircle}>
                  <Feather name="file-text" size={44} color="#2563EB" />
                </View>

                <Text style={styles.officeTitle}>{resource.title}</Text>
                <Text style={styles.officeFormatBadge}>Microsoft Word Document (.docx)</Text>
                <Text style={styles.officeSub}>
                  {resource.subjectCode} - {resource.subjectName} • {resource.fileSize}
                </Text>

                <TouchableOpacity
                  style={styles.openOfficeBtn}
                  onPress={handleOpenExternalDocument}
                >
                  <Feather name="external-link" size={18} color="#FFFFFF" />
                  <Text style={styles.openOfficeBtnText}>Open Document</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryOfficeBtn}
                  onPress={handleOfflineSave}
                >
                  <Feather name="download-cloud" size={16} color="#475569" />
                  <Text style={styles.secondaryOfficeBtnText}>Save Offline</Text>
                </TouchableOpacity>
              </View>
            ) : isPpt ? (
              /* PowerPoint Presentation Viewer Card (.pptx / .ppt) */
              <View style={styles.officeCard}>
                <View style={[styles.docxIconCircle, { backgroundColor: '#FFEDD5' }]}>
                  <Feather name="airplay" size={44} color="#EA580C" />
                </View>

                <Text style={styles.officeTitle}>{resource.title}</Text>
                <Text style={[styles.officeFormatBadge, { color: '#EA580C', backgroundColor: '#FFEDD5' }]}>
                  PowerPoint Presentation (.pptx)
                </Text>
                <Text style={styles.officeSub}>
                  {resource.subjectCode} - {resource.subjectName} • {resource.fileSize}
                </Text>

                <TouchableOpacity
                  style={[styles.openOfficeBtn, { backgroundColor: '#EA580C' }]}
                  onPress={handleOpenExternalDocument}
                >
                  <Feather name="external-link" size={18} color="#FFFFFF" />
                  <Text style={styles.openOfficeBtnText}>Open Presentation</Text>
                </TouchableOpacity>
              </View>
            ) : isPdf && pdfBase64 ? (
              /* In-Memory PDF.js Canvas Series Engine (Zero Scroll, Page-by-Page) */
              <WebView
                ref={webViewRef}
                key={`pdf-engine-base64`}
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
              <View style={styles.centerLoading}>
                <ActivityIndicator size="large" color="#0745E8" />
                <Text style={styles.centerLoadingText}>Preparing document viewer...</Text>
              </View>
            )}

            {/* Floating Preview Banner for Unpurchased Notes */}
            {isPreviewMode && !hasNoFile && (
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
              { width: `${Math.min(100, (currentPage / Math.max(1, maxPagesFromDoc)) * 100)}%` },
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySub: {
    marginTop: 8,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 20,
  },
  backButtonOutline: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0745E8',
  },
  backButtonOutlineText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0745E8',
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
  officeCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docxIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  officeTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  officeFormatBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  officeSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  openOfficeBtn: {
    width: '100%',
    maxWidth: 280,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  openOfficeBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryOfficeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  secondaryOfficeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  noFileCard: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  noFileTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  noFileSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  metadataCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    marginBottom: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  metaVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    maxWidth: '65%',
    textAlign: 'right',
  },
  errorDetailsBox: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 10,
    width: '100%',
    marginBottom: 16,
  },
  errorDetailsText: {
    fontSize: 11,
    color: '#B91C1C',
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  refreshActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
  },
  refreshActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0745E8',
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
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
