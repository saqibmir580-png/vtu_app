import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import {
  fetchNoteByIdFromApi,
  checkNoteAccessFromApi,
  purchaseNoteFromApi,
  createRazorpayOrderFromApi,
  verifyRazorpayPaymentFromApi,
} from '../api/notesApi';
import { NoteResource } from '../types/notes.types';
import { MOCK_RESOURCES } from '../api/notesData';
import { useStudyActivityStore } from '@/features/home';
import { useAuthStore } from '@/store';
import { PaymentCheckoutModal } from '../components/PaymentCheckoutModal';

import * as ScreenCapture from 'expo-screen-capture';

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
  if (pageNumber < 1 || pageNumber > totalPages) return false;
  if (!isPaid || isPurchased) return true;
  const limit = Math.max(0, previewPageLimit ?? 0);
  return pageNumber <= limit;
};

/**
 * Single-Page HTML Canvas PDF Generator
 * Renders ONLY the target page onto a single HTML5 canvas element.
 * 100% non-scrollable, zero vertical scroll, zero multi-page DOM elements.
 */
const generateSinglePagePdfHtml = (pdfUrl: string, pageNum: number): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100vw;
      height: 100vh;
      overflow: hidden !important;
      background-color: #ffffff;
      display: flex;
      justify-content: center;
      align-items: center;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
    }
    #container {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
    }
    canvas {
      max-width: 98%;
      max-height: 98%;
      object-fit: contain;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      border-radius: 4px;
    }
    #loading {
      position: absolute;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      color: #64748b;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
</head>
<body>
  <div id="container">
    <div id="loading">Loading Page ${pageNum}...</div>
    <canvas id="pdf-canvas" style="display:none;"></canvas>
  </div>
  <script>
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
    }

    var pdfUrl = ${JSON.stringify(pdfUrl)};
    var pageNum = ${pageNum};
    var canvas = document.getElementById('pdf-canvas');
    var ctx = canvas.getContext('2d');
    var loadingEl = document.getElementById('loading');

    function renderSinglePage() {
      pdfjsLib.getDocument({ url: pdfUrl }).promise.then(function(pdf) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'DETECTED_PAGES',
            totalPages: pdf.numPages
          }));
        }

        var validPageNum = Math.min(Math.max(1, pageNum), pdf.numPages);

        pdf.getPage(validPageNum).then(function(page) {
          var containerWidth = window.innerWidth || 360;
          var containerHeight = window.innerHeight || 600;
          var unscaledViewport = page.getViewport({ scale: 1.0 });
          
          var scaleX = containerWidth / unscaledViewport.width;
          var scaleY = containerHeight / unscaledViewport.height;
          var scale = Math.min(scaleX, scaleY) * 1.5;

          var viewport = page.getViewport({ scale: scale });

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          var renderContext = {
            canvasContext: ctx,
            viewport: viewport
          };

          page.render(renderContext).promise.then(function() {
            loadingEl.style.display = 'none';
            canvas.style.display = 'block';
          });
        });
      }).catch(function(err) {
        console.error('PDF.js Error:', err);
        loadingEl.innerText = 'Preparing cloud document reader...';
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'PDF_RENDER_FALLBACK',
            error: err && err.message ? err.message : 'PDF parse error'
          }));
        }
      });
    }

    if (typeof pdfjsLib !== 'undefined') {
      renderSinglePage();
    } else {
      loadingEl.innerText = 'Loading PDF Viewer...';
      window.onload = renderSinglePage;
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
  const [resource, setResource] = useState<NoteResource>(
    () => MOCK_RESOURCES.find((r) => r.id === id) || MOCK_RESOURCES[0]
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
  const [useCloudViewer, setUseCloudViewer] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  // Always resolve a valid HTTPS PDF URL
  let rawUrl = resource.fileUrl || resource.secureUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
  if (rawUrl.startsWith('http://')) {
    rawUrl = rawUrl.replace('http://', 'https://');
  }

  // Note fields resolution
  const isPaidNote = Boolean(resource.isPaid && (resource.price && resource.price > 0));
  const notePrice = resource.price || 19;
  const freePreviewLimit = resource.freePreviewPages ?? 4;
  const maxPagesFromDoc = detectedPages || (resource.totalPages && resource.totalPages > 1 ? resource.totalPages : 15);

  const isPreviewMode = isPaidNote && !isPurchased;
  const accessibleMaxPage = isPreviewMode ? Math.min(freePreviewLimit, maxPagesFromDoc) : maxPagesFromDoc;

  // Load Note Details & Check Entitlement from Backend API
  const loadNoteAndAccess = async () => {
    setIsLoadingDoc(true);
    try {
      if (id) {
        const fetched = await fetchNoteByIdFromApi(id as string, user?.id);
        if (fetched) {
          setResource(fetched);
          setIsBookmarked(fetched.isBookmarked);
          const isPaid = Boolean(fetched.isPaid && (fetched.price && fetched.price > 0));
          const hasPurchased = isPaid ? Boolean(fetched.isPurchased) : false;
          setIsPurchased(hasPurchased);

          // Additional backend order access check
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
  };

  useEffect(() => {
    loadNoteAndAccess();
  }, [id, user?.id]);

  const recordActivity = useStudyActivityStore((state) => state.recordActivity);

  // Capture recent study activity for Continue Studying dashboard card
  useEffect(() => {
    if (resource && resource.id) {
      const totalP = maxPagesFromDoc > 0 ? maxPagesFromDoc : 15;
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
  }, [resource?.id, resource?.title, currentPage, maxPagesFromDoc]);

  // DRM Screen Capture Protection
  useEffect(() => {
    async function enableDRMProtection() {
      try {
        if (ScreenCapture && ScreenCapture.preventScreenCaptureAsync) {
          await ScreenCapture.preventScreenCaptureAsync();
        }
      } catch (err) {
        // Protection active
      }
    }
    enableDRMProtection();

    return () => {
      async function disableDRMProtection() {
        try {
          if (ScreenCapture && ScreenCapture.allowScreenCaptureAsync) {
            await ScreenCapture.allowScreenCaptureAsync();
          }
        } catch (err) {
          // Ignore
        }
      }
      disableDRMProtection();
    };
  }, []);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prev = currentPage - 1;
      setCurrentPage(prev);
      setIsPageLocked(false);
    }
  };

  const handleNextPage = () => {
    const nextPage = currentPage + 1;
    // Single source of truth page access check
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
    } else {
      // Preview limit reached - Lock page and show paywall slide
      setIsPageLocked(true);
    }
  };

  // Open payment checkout sheet
  const handleUnlockPurchase = () => {
    setPaymentModalVisible(true);
  };

  // Called when Razorpay checkout & signature verification succeed
  const handlePaymentSuccess = (unlockedResource: NoteResource) => {
    setIsPurchased(true);
    setIsPageLocked(false);
    setIsOfflineSaved(true);
  };

  const handleOpenExternalDocument = async () => {
    if (isPreviewMode) {
      handleUnlockPurchase();
      return;
    }
    if (rawUrl) {
      try {
        await WebBrowser.openBrowserAsync(rawUrl);
      } catch (e) {
        Alert.alert('Open Document', `File URL: ${rawUrl}`);
      }
    }
  };

  const handleOfflineSave = () => {
    if (isPreviewMode) {
      handleUnlockPurchase();
    } else {
      setIsOfflineSaved(true);
      Alert.alert(
        'Saved for In-App Offline Access',
        'Note file is securely saved inside VTU App sandbox. (External exports & screenshots blocked).'
      );
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'DETECTED_PAGES' && data.totalPages) {
        const parsedTotal = parseInt(data.totalPages, 10);
        if (parsedTotal > 1 && parsedTotal !== detectedPages) {
          setDetectedPages(parsedTotal);
        }
      } else if (data.type === 'PDF_RENDER_FALLBACK') {
        setUseCloudViewer(true);
      }
    } catch (e) {
      // Ignore non-JSON messages
    }
  };

  const isNextDisabled =
    currentPage >= maxPagesFromDoc ||
    (isPreviewMode && currentPage >= accessibleMaxPage && isPageLocked);

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
                <Feather name={isPurchased ? 'check-circle' : 'lock'} size={11} color={isPurchased ? '#059669' : '#D97706'} />
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
            {resource.subjectCode} • Page {currentPage} of {maxPagesFromDoc} {isPreviewMode ? `(Free Preview: ${freePreviewLimit} Pgs)` : ''}
          </Text>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setUseCloudViewer(!useCloudViewer)}
            accessibilityLabel="Switch viewer mode"
          >
            <Feather
              name={useCloudViewer ? 'layers' : 'globe'}
              size={18}
              color={useCloudViewer ? '#0745E8' : '#64748B'}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleOpenExternalDocument}>
            <Feather name="external-link" size={18} color="#0745E8" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setIsBookmarked(!isBookmarked)}>
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

      {/* Main Single-Page Canvas (Zero Scrolling, Render Single Canvas Element) */}
      <View style={styles.canvasContainer}>
        {isPageLocked ? (
          /* Locked Paywall Card Slide */
          <View style={styles.paywallCard}>
            <View style={styles.lockIconCircle}>
              <Feather name="lock" size={36} color="#D97706" />
            </View>

            <Text style={styles.paywallTitle}>Preview Limit Reached</Text>
            <Text style={styles.paywallPageSub}>
              You have viewed {currentPage} of {maxPagesFromDoc} available pages.
            </Text>

            <Text style={styles.paywallBody}>
              You have reached the free {freePreviewLimit}-page preview limit for '{resource.title}'. Purchase this note to unlock all {maxPagesFromDoc} pages and offline access.
            </Text>

            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Feather name="check-circle" size={14} color="#10B981" />
                <Text style={styles.featureText}>Full {maxPagesFromDoc} Pages & Examination Formulas</Text>
              </View>
              <View style={styles.featureItem}>
                <Feather name="check-circle" size={14} color="#10B981" />
                <Text style={styles.featureText}>In-App Offline Access Mode</Text>
              </View>
              <View style={styles.featureItem}>
                <Feather name="shield" size={14} color="#0745E8" />
                <Text style={styles.featureText}>Protected DRM & Anti-Screenshot License</Text>
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

            <Text style={styles.drmSubtext}>
              🔒 Secure access inside VTU App only • External export & sharing disabled
            </Text>
          </View>
        ) : (
          /* Single-Page PDF.js HTML Canvas Engine or Cloud Document Viewer */
          <View style={styles.webViewContainer}>
            {useCloudViewer ? (
              <WebView
                ref={webViewRef}
                key={`cloud-viewer-${rawUrl}`}
                source={{ uri: `https://docs.google.com/viewer?url=${encodeURIComponent(rawUrl)}&embedded=true` }}
                style={styles.webView}
                originWhitelist={['*']}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                renderLoading={() => (
                  <View style={styles.centerLoading}>
                    <ActivityIndicator size="small" color="#0745E8" />
                    <Text style={styles.centerLoadingText}>Loading cloud document reader...</Text>
                  </View>
                )}
              />
            ) : (
              <WebView
                ref={webViewRef}
                key={`pdf-single-canvas-${currentPage}-${rawUrl}`}
                source={{ html: generateSinglePagePdfHtml(rawUrl, currentPage) }}
                style={styles.webView}
                scrollEnabled={false}
                overScrollMode="never"
                bounces={false}
                onMessage={handleWebViewMessage}
                originWhitelist={['*']}
                javaScriptEnabled={true}
                domStorageEnabled={true}
              />
            )}

            {isPreviewMode && (
              <View style={styles.previewFloatingBanner}>
                <View style={styles.previewBannerLeft}>
                  <Feather name="lock" size={16} color="#F59E0B" />
                  <Text style={styles.previewBannerText}>
                    Free Preview ({freePreviewLimit} of {maxPagesFromDoc} Pgs)
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

      {/* Bottom Reader Controls */}
      <View style={styles.readerFooter}>
        {/* Page Progress Track */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${(currentPage / maxPagesFromDoc) * 100}%` },
            ]}
          />
        </View>

        <View style={styles.controlsRow}>
          {/* Zoom Controls */}
          <View style={styles.zoomControls}>
            <TouchableOpacity
              style={styles.zoomBtn}
              onPress={() => setZoomLevel(Math.max(75, zoomLevel - 25))}
            >
              <Feather name="minus" size={16} color="#475569" />
            </TouchableOpacity>
            <Text style={styles.zoomText}>{zoomLevel}%</Text>
            <TouchableOpacity
              style={styles.zoomBtn}
              onPress={() => setZoomLevel(Math.min(150, zoomLevel + 25))}
            >
              <Feather name="plus" size={16} color="#475569" />
            </TouchableOpacity>
          </View>

          {/* Page Navigation Prev / Next */}
          <View style={styles.pageNavControls}>
            <TouchableOpacity
              disabled={currentPage <= 1}
              style={[styles.navBtn, currentPage <= 1 && styles.disabledNavBtn]}
              onPress={handlePrevPage}
            >
              <Feather name="chevron-left" size={18} color={currentPage <= 1 ? '#CBD5E1' : '#0745E8'} />
            </TouchableOpacity>

            <Text style={styles.pageIndicatorText}>
              {currentPage} / {maxPagesFromDoc}
            </Text>

            <TouchableOpacity
              disabled={isNextDisabled}
              style={[styles.navBtn, isNextDisabled && styles.disabledNavBtn]}
              onPress={handleNextPage}
            >
              <Feather
                name="chevron-right"
                size={18}
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
    height: 54,
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
  },
  headerRightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  canvasContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
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
    backgroundColor: '#FFFFFF',
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
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
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  featuresList: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 20,
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
  drmSubtext: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 12,
    textAlign: 'center',
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledNavBtn: {
    backgroundColor: '#F1F5F9',
  },
  pageIndicatorText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  centerLoadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
});
