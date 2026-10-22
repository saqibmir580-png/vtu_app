import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Dimensions,
  Alert,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/store';
import { NoteResource } from '../types/notes.types';
import {
  createRazorpayOrderFromApi,
  verifyRazorpayPaymentFromApi,
} from '../api/notesApi';

interface PaymentCheckoutModalProps {
  visible: boolean;
  onClose: () => void;
  resource: NoteResource | null;
  onPaymentSuccess: (resource: NoteResource) => void;
}

const { width, height } = Dimensions.get('window');

export const PaymentCheckoutModal: React.FC<PaymentCheckoutModalProps> = ({
  visible,
  onClose,
  resource,
  onPaymentSuccess,
}) => {
  const user = useAuthStore((state) => state.user);

  // States: 'CONFIRM' | 'LAUNCHING_GATEWAY' | 'RAZORPAY_CHECKOUT' | 'VERIFYING' | 'SUCCESS'
  const [stage, setStage] = useState<
    'CONFIRM' | 'LAUNCHING_GATEWAY' | 'RAZORPAY_CHECKOUT' | 'VERIFYING' | 'SUCCESS'
  >('CONFIRM');
  const [razorpayOrder, setRazorpayOrder] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!resource) return null;

  const price = resource.price || 19;
  const originalPrice = Math.round(price * 2.5);

  const resetModal = () => {
    setStage('CONFIRM');
    setRazorpayOrder(null);
    setErrorMessage(null);
  };

  const handleModalClose = () => {
    if (stage !== 'LAUNCHING_GATEWAY' && stage !== 'VERIFYING') {
      resetModal();
      onClose();
    }
  };

  // 1. Launch Gateway: Call backend to create Razorpay Order
  const handleProceedToPay = async () => {
    setStage('LAUNCHING_GATEWAY');
    setErrorMessage(null);

    try {
      const orderRes = await createRazorpayOrderFromApi(resource.id, user?.id);

      if (!orderRes || !orderRes.success) {
        throw new Error(orderRes?.message || 'Could not initiate payment order.');
      }

      // If the resource was already purchased/unlocked by student, fulfill immediately
      if (orderRes.alreadyPurchased) {
        setStage('SUCCESS');
        setTimeout(() => {
          onPaymentSuccess(resource);
          resetModal();
          onClose();
        }, 1200);
        return;
      }

      if (!orderRes.orderId) {
        throw new Error('Payment gateway did not provide a valid order ID.');
      }

      setRazorpayOrder(orderRes);
      // Move to Razorpay WebView Checkout
      setStage('RAZORPAY_CHECKOUT');
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment initiation error.');
      setStage('CONFIRM');
      Alert.alert('Payment Initialization Failed', err.message || 'Could not create payment order.');
    }
  };

  // 2. Handle WebView postMessage from Razorpay Checkout SDK
  const handleWebViewMessage = async (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      if (message.type === 'PAYMENT_SUCCESS') {
        setStage('VERIFYING');

        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = message.data;

        // Verify with backend
        const verifyRes = await verifyRazorpayPaymentFromApi({
          razorpayOrderId: razorpayOrderId || razorpayOrder.orderId,
          razorpayPaymentId,
          razorpaySignature,
          noteId: resource.id,
          userId: user?.id,
        });

        if (verifyRes && verifyRes.success) {
          setStage('SUCCESS');
          setTimeout(() => {
            onPaymentSuccess(resource);
            resetModal();
            onClose();
          }, 1500);
        } else {
          setStage('CONFIRM');
          Alert.alert('Verification Failed', 'Payment completed but could not be verified.');
        }
      } else if (message.type === 'PAYMENT_DISMISSED') {
        // User closed the Razorpay popup
        setStage('CONFIRM');
      } else if (message.type === 'PAYMENT_FAILED') {
        setStage('CONFIRM');
        Alert.alert('Payment Failed', message.error || 'The transaction was declined.');
      }
    } catch {
      setStage('CONFIRM');
    }
  };

  // Handle UPI app deep links (e.g., phonepe://, upi://, gpay://, paytmmp://)
  const handleShouldStartLoadWithRequest = (request: { url: string }) => {
    const { url } = request;

    // Standard web protocols continue inside WebView
    if (
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('about:blank') ||
      url.startsWith('data:')
    ) {
      return true;
    }

    // Intercept custom app schemes: phonepe://, upi://, paytmmp://, etc.
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert(
            'UPI App Not Installed',
            'PhonePe / UPI application is not installed on this device.\n\nTip: In Razorpay Test Mode, you can choose "Netbanking", "Test Card", or enter "success@razorpay" for an instant test payment.',
            [{ text: 'Got It' }]
          );
        }
      })
      .catch(() => {
        Alert.alert(
          'Unable to Open App',
          'Could not launch the external UPI app. Please choose Netbanking or Card in Razorpay test options.',
          [{ text: 'OK' }]
        );
      });

    // Return false to prevent WebView from attempting to navigate and throwing ERR_UNKNOWN_URL_SCHEME
    return false;
  };

  // Generate Razorpay Standard Checkout HTML for WebView
  const generateRazorpayHtml = () => {
    if (!razorpayOrder) return '';

    const keyId = razorpayOrder.keyId || process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_Rd8nnVbetyBN2Z';
    const amountInPaise = Number(razorpayOrder.amount) || price * 100;
    const orderId = razorpayOrder.orderId;
    const cleanTitle = (resource.title || 'Course Notes').replace(/["'\\]/g, '');
    const studentName = (user?.name || 'VTU Student').replace(/["'\\]/g, '');
    const studentEmail = (user?.email || 'student@vtuapp.in').replace(/["'\\]/g, '');

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
      background: #0F172A;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #FFFFFF;
      overflow: hidden;
    }
    .spinner {
      width: 44px;
      height: 44px;
      border: 3.5px solid rgba(255,255,255,0.15);
      border-top-color: #0745E8;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 16px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .status-text {
      font-size: 14px;
      font-weight: 600;
      color: #94A3B8;
      text-align: center;
      letter-spacing: 0.3px;
    }
    .test-badge {
      display: inline-block;
      margin-top: 10px;
      background: rgba(234, 88, 12, 0.2);
      color: #FB923C;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
  </style>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</head>
<body>
  <div class="spinner"></div>
  <div class="status-text">Connecting to Razorpay Test Gateway...</div>
  <div class="test-badge">SECURE TEST CHECKOUT</div>

  <script>
    window.onerror = function(msg, url, line) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'PAYMENT_FAILED',
          error: 'Gateway Error: ' + msg
        }));
      }
      return false;
    };

    window.onload = function() {
      var options = {
        key: "${keyId}",
        amount: ${amountInPaise},
        currency: "INR",
        name: "VTU Student Super App",
        description: "${cleanTitle}",
        order_id: "${orderId}",
        prefill: {
          name: "${studentName}",
          email: "${studentEmail}",
          contact: "9876543210"
        },
        theme: {
          color: "#0745E8"
        },
        modal: {
          ondismiss: function() {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'PAYMENT_DISMISSED'
              }));
            }
          }
        },
        handler: function(response) {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'PAYMENT_SUCCESS',
              data: {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              }
            }));
          }
        }
      };

      try {
        var rzp = new Razorpay(options);
        rzp.on('payment.failed', function(response) {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'PAYMENT_FAILED',
              error: response.error ? response.error.description : 'Payment Declined'
            }));
          }
        });
        rzp.open();
      } catch (err) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'PAYMENT_FAILED',
            error: err.message
          }));
        }
      }
    };
  </script>
</body>
</html>
    `;
  };

  return (
    <Modal
      visible={visible}
      transparent={stage !== 'RAZORPAY_CHECKOUT'}
      animationType="fade"
      onRequestClose={handleModalClose}
    >
      {stage === 'RAZORPAY_CHECKOUT' ? (
        /* Full-Screen Razorpay Standard Checkout in WebView */
        <View style={styles.fullScreenWebViewContainer}>
          {/* Header Bar */}
          <View style={styles.webViewHeader}>
            <View style={styles.webViewHeaderLeft}>
              <View style={styles.dotIndicator} />
              <Text style={styles.webViewHeaderTitle}>Razorpay Test Gateway</Text>
            </View>
            <TouchableOpacity
              style={styles.webViewCloseBtn}
              onPress={() => setStage('CONFIRM')}
            >
              <Feather name="x" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Authentic Razorpay SDK Loaded in WebView */}
          <WebView
            source={{
              html: generateRazorpayHtml(),
              baseUrl: 'https://checkout.razorpay.com',
            }}
            originWhitelist={['*']}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            mixedContentMode="always"
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
            javaScriptCanOpenWindowsAutomatically={true}
            setSupportMultipleWindows={false}
            onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
            onMessage={handleWebViewMessage}
            style={styles.webView}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.webViewLoading}>
                <ActivityIndicator size="large" color="#0745E8" />
                <Text style={styles.webViewLoadingText}>Loading Razorpay Gateway...</Text>
              </View>
            )}
          />
        </View>
      ) : (
        /* Bottom-Sheet Confirmation / Status Flow */
        <TouchableWithoutFeedback onPress={handleModalClose}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.sheetContainer}>
                <View style={styles.handleBar} />

                {stage === 'SUCCESS' ? (
                  /* Verified Success Animation */
                  <View style={styles.successContainer}>
                    <View style={styles.successIconCircle}>
                      <Feather name="check" size={38} color="#059669" />
                    </View>
                    <Text style={styles.successTitle}>Payment Verified! 🎉</Text>
                    <Text style={styles.successSub}>
                      All pages unlocked with lifetime student access.
                    </Text>
                    <ActivityIndicator size="small" color="#0745E8" style={{ marginTop: 18 }} />
                  </View>
                ) : stage === 'VERIFYING' ? (
                  /* Cryptographic Verification State */
                  <View style={styles.successContainer}>
                    <ActivityIndicator size="large" color="#0745E8" style={{ marginBottom: 16 }} />
                    <Text style={styles.successTitle}>Verifying Payment...</Text>
                    <Text style={styles.successSub}>
                      Confirming signature with Razorpay & granting access.
                    </Text>
                  </View>
                ) : (
                  /* Standard Confirmation Card */
                  <>
                    {/* Header */}
                    <View style={styles.headerRow}>
                      <View style={styles.headerLeft}>
                        <View style={styles.lockBadge}>
                          <Feather name="shield" size={16} color="#0745E8" />
                        </View>
                        <View>
                          <Text style={styles.headerTitle}>Unlock Note Access</Text>
                          <Text style={styles.headerSub}>Instant Full Document Reader</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.closeBtn}
                        onPress={handleModalClose}
                        disabled={stage === 'LAUNCHING_GATEWAY'}
                      >
                        <Feather name="x" size={18} color="#64748B" />
                      </TouchableOpacity>
                    </View>

                    {/* Resource Preview */}
                    <View style={styles.resourceCard}>
                      <View style={styles.resourcePillRow}>
                        <View style={styles.codePill}>
                          <Text style={styles.codePillText}>{resource.subjectCode || 'VTU'}</Text>
                        </View>
                        <View style={styles.modPill}>
                          <Text style={styles.modPillText}>
                            {resource.unitTitle || (resource.unitNumber ? `Module ${resource.unitNumber}` : 'Module Notes')}
                          </Text>
                        </View>
                        <View style={styles.testModePill}>
                          <Text style={styles.testModePillText}>TEST MODE</Text>
                        </View>
                      </View>
                      <Text style={styles.resourceTitle} numberOfLines={2}>
                        {resource.title}
                      </Text>
                      <Text style={styles.resourceAuthor}>
                        By {resource.author || 'VTU Faculty'} • {resource.totalPages || 20} Pages
                      </Text>
                    </View>

                    {/* Price Breakdown */}
                    <View style={styles.priceContainer}>
                      <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Standard Note Price</Text>
                        <Text style={styles.priceOriginal}>₹{originalPrice}</Text>
                      </View>
                      <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Student Academic Discount</Text>
                        <Text style={styles.priceDiscount}>-₹{originalPrice - price}</Text>
                      </View>
                      <View style={styles.divider} />
                      <View style={styles.totalRow}>
                        <View>
                          <Text style={styles.totalLabel}>Payable via Razorpay</Text>
                          <Text style={styles.totalSub}>Lifetime access • UPI / Cards / NetBanking</Text>
                        </View>
                        <Text style={styles.totalAmount}>₹{price}</Text>
                      </View>
                    </View>

                    {/* Trust Row */}
                    <View style={styles.trustRow}>
                      <Feather name="lock" size={12} color="#059669" />
                      <Text style={styles.trustText}>Razorpay 256-Bit SSL Encrypted Checkout</Text>
                    </View>

                    {/* Actions */}
                    <View style={styles.actionsContainer}>
                      <TouchableOpacity
                        activeOpacity={0.88}
                        style={[
                          styles.payBtn,
                          stage === 'LAUNCHING_GATEWAY' && styles.payBtnDisabled,
                        ]}
                        onPress={handleProceedToPay}
                        disabled={stage === 'LAUNCHING_GATEWAY'}
                      >
                        {stage === 'LAUNCHING_GATEWAY' ? (
                          <View style={styles.processingRow}>
                            <ActivityIndicator size="small" color="#FFFFFF" />
                            <Text style={styles.payBtnText}>Launching Razorpay...</Text>
                          </View>
                        ) : (
                          <>
                            <Feather name="zap" size={16} color="#FFFFFF" />
                            <Text style={styles.payBtnText}>Proceed to Pay ₹{price}</Text>
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.cancelBtn}
                        onPress={handleModalClose}
                        disabled={stage === 'LAUNCHING_GATEWAY'}
                      >
                        <Text style={styles.cancelBtnText}>Maybe Later</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 34,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 14,
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lockBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  resourcePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  codePill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  codePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0745E8',
  },
  modPill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  testModePill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  testModePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  resourceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 20,
    marginBottom: 4,
  },
  resourceAuthor: {
    fontSize: 11,
    color: '#64748B',
  },
  priceContainer: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  priceLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  priceOriginal: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  priceDiscount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  totalSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0745E8',
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 18,
  },
  trustText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  actionsContainer: {
    gap: 10,
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0745E8',
    height: 50,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#0745E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  payBtnDisabled: {
    opacity: 0.75,
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
  },
  cancelBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  successSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  fullScreenWebViewContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  webViewHeader: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  webViewHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  webViewHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  webViewCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webView: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  webViewLoadingText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
});
