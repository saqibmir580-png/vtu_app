import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  forgotPasswordApiFunction,
  verifyOtpApiFunction,
  resetPasswordApiFunction,
} from '../apifunction/apiFunction';

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  visible,
  onClose,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const scrollViewRef = useRef<ScrollView>(null);

  // Monitor keyboard open and close events across iOS & Android
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      const height = e.endCoordinates ? e.endCoordinates.height : 280;
      setKeyboardHeight(height);
      // Auto-scroll so active inputs and buttons are immediately visible above keypad
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Reset internal state when modal closes
  const handleClose = () => {
    Keyboard.dismiss();
    setErrorMsg(null);
    onClose();
  };

  const handleRequestOtp = async () => {
    setErrorMsg(null);
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid student email address.');
      return;
    }

    setLoading(true);
    try {
      await forgotPasswordApiFunction(email.trim().toLowerCase());
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to send OTP. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMsg(null);
    if (!otp || otp.trim().length < 4) {
      setErrorMsg('Please enter the 6-digit OTP code sent to your email.');
      return;
    }

    setLoading(true);
    try {
      await verifyOtpApiFunction(email, otp.trim());
      setStep(3);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setErrorMsg(null);
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await resetPasswordApiFunction(email, otp, newPassword);
      Alert.alert('Password Reset', 'Your password has been reset successfully! You can now log in.');
      setStep(1);
      setEmail('');
      setOtp('');
      setNewPassword('');
      handleClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const isKeyboardOpen = keyboardHeight > 0;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.backdrop}>
          <KeyboardAvoidingView
            style={styles.keyboardAvoiding}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={[
                styles.scrollContainer,
                isKeyboardOpen
                  ? {
                      justifyContent: 'flex-start',
                      paddingTop: Platform.OS === 'ios' ? 70 : 50,
                      paddingBottom: keyboardHeight + 60,
                    }
                  : {
                      justifyContent: 'center',
                      paddingTop: 20,
                      paddingBottom: 40,
                    },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.card}>
                  <View style={styles.header}>
                    <Text style={styles.title}>
                      {step === 1 && 'Forgot Password'}
                      {step === 2 && 'Verify Email OTP'}
                      {step === 3 && 'Set New Password'}
                    </Text>
                    <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                      <Feather name="x" size={20} color="#0F172A" />
                    </TouchableOpacity>
                  </View>

                  {errorMsg ? (
                    <View style={styles.errorBox}>
                      <Feather name="alert-circle" size={16} color="#DC2626" />
                      <Text style={styles.errorText}>{errorMsg}</Text>
                    </View>
                  ) : null}

                  {step === 1 && (
                    <>
                      <Text style={styles.subtitle}>
                        Enter your registered VTU student email address. We will dispatch a 6-digit OTP code.
                      </Text>
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                          style={styles.input}
                          value={email}
                          onChangeText={setEmail}
                          placeholder="student@vtu.ac.in"
                          placeholderTextColor="#94A3B8"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          onFocus={() => {
                            setTimeout(() => {
                              scrollViewRef.current?.scrollToEnd({ animated: true });
                            }, 120);
                          }}
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.submitBtn}
                        onPress={handleRequestOtp}
                        disabled={loading}
                      >
                        {loading ? (
                          <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                          <Text style={styles.submitText}>Send OTP Code ➔</Text>
                        )}
                      </TouchableOpacity>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <Text style={styles.subtitle}>
                        Enter the 6-digit verification code sent to{' '}
                        <Text style={{ fontWeight: '800' }}>{email}</Text>.
                      </Text>
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>6-Digit OTP Code</Text>
                        <TextInput
                          style={styles.input}
                          value={otp}
                          onChangeText={setOtp}
                          placeholder="e.g. 123456"
                          placeholderTextColor="#94A3B8"
                          keyboardType="number-pad"
                          maxLength={6}
                          onFocus={() => {
                            setTimeout(() => {
                              scrollViewRef.current?.scrollToEnd({ animated: true });
                            }, 120);
                          }}
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.submitBtn}
                        onPress={handleVerifyOtp}
                        disabled={loading}
                      >
                        {loading ? (
                          <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                          <Text style={styles.submitText}>Verify OTP ➔</Text>
                        )}
                      </TouchableOpacity>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <Text style={styles.subtitle}>
                        Create a strong new password for your student account.
                      </Text>
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>New Password</Text>
                        <TextInput
                          style={styles.input}
                          secureTextEntry
                          value={newPassword}
                          onChangeText={setNewPassword}
                          placeholder="At least 6 characters"
                          placeholderTextColor="#94A3B8"
                          onFocus={() => {
                            setTimeout(() => {
                              scrollViewRef.current?.scrollToEnd({ animated: true });
                            }, 120);
                          }}
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.submitBtn}
                        onPress={handleResetPassword}
                        disabled={loading}
                      >
                        {loading ? (
                          <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                          <Text style={styles.submitText}>Reset Password 🚀</Text>
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </TouchableWithoutFeedback>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  keyboardAvoiding: {
    flex: 1,
    width: '100%',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    gap: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  closeBtn: {
    padding: 6,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  input: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#0F172A',
  },
  submitBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#0745E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
