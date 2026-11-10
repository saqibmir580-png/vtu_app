import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { performGoogleSignInSession } from '../utils/googleAuth';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '@/store/useAuthStore';
import { manualRegisterSchema } from '../validation/auth.schema';

export const RegisterScreen: React.FC = () => {
  const router = useRouter();
  const { register: registerUser, loginWithGoogle, error, isLoading, clearError } = useAuth();

  // Manual Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Field Level Errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleBack = () => {
    clearError();
    setFieldErrors({});
    router.back();
  };

  // Google Sign-up / Continue with Google (DIRECT SIGN IN / REGISTER)
  const handleGoogleSignup = async () => {
    clearError();
    setFieldErrors({});
    const { idToken, cancelled } = await performGoogleSignInSession();
    if (cancelled || !idToken) return;

    const ok = await loginWithGoogle(idToken);
    if (ok) {
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.usn && (currentUser?.branch || currentUser?.branchCode)) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(auth)/onboarding');
      }
    }
  };

  // Manual Form Submission
  const handleRegister = async () => {
    clearError();
    setFieldErrors({});

    // Validate Input Fields using Zod
    const result = manualRegisterSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[issue.path[0] as string] = issue.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    // Submit Registration Payload to Backend (Only clean properties accepted by RegisterDto)
    const ok = await registerUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    });

    if (ok) {
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.usn && (currentUser?.branch || currentUser?.branchCode)) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(auth)/onboarding');
      }
    }
  };

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0953E8" translucent />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Royal Blue Header */}
          <LinearGradient
            colors={['#0953E8', '#0732B8', '#03176B']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.topHeader}
          >
            <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
              {/* Back Button */}
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.backButton}
                onPress={handleBack}
              >
                <Feather name="chevron-left" size={22} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>Create Account 🚀</Text>
                <Text style={styles.headerSubtitle}>
                  Register to access VTU syllabus, notes & CGPA calculator.
                </Text>
              </View>
            </SafeAreaView>
          </LinearGradient>

          {/* Bottom Sheet Card */}
          <View style={styles.whiteSheet}>
            {/* VTU Ultima Logo */}
            <View style={styles.logoWrapper}>
              <Image
                source={require('@/../assets/vtu_ultima_logo.png')}
                style={styles.logoImage}
                contentFit="contain"
              />
            </View>

            {/* Global API Error Banner */}
            {error ? (
              <View style={styles.apiErrorBanner}>
                <Feather name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.apiErrorText}>{error}</Text>
              </View>
            ) : null}

            {/* Form Container */}
            <View style={styles.formGroup}>
              {/* Option to Continue with Google */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.googleButton}
                onPress={handleGoogleSignup}
                disabled={isLoading}
              >
                <Text style={styles.googleG}>G </Text>
                <Text style={styles.googleText}>
                  {isLoading ? 'Connecting to Google...' : 'Continue with Google'}
                </Text>
              </TouchableOpacity>

              {/* OR Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or register with email</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Full Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.fieldLabel}>Full Name *</Text>
                <View style={[styles.inputBox, !!fieldErrors.name && styles.inputBoxError]}>
                  <Feather name="user" size={18} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Rahul Sharma"
                    placeholderTextColor="#94A3B8"
                    value={name}
                    onChangeText={(txt) => {
                      setName(txt);
                      if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                    }}
                  />
                </View>
                {fieldErrors.name ? <Text style={styles.errorText}>{fieldErrors.name}</Text> : null}
              </View>

              {/* Email Address Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.fieldLabel}>Email Address *</Text>
                <View style={[styles.inputBox, !!fieldErrors.email && styles.inputBoxError]}>
                  <Feather name="mail" size={18} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="student@gmail.com"
                    placeholderTextColor="#94A3B8"
                    value={email}
                    onChangeText={(txt) => {
                      setEmail(txt);
                      if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {fieldErrors.email ? <Text style={styles.errorText}>{fieldErrors.email}</Text> : null}
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.fieldLabel}>Password *</Text>
                <View style={[styles.inputBox, !!fieldErrors.password && styles.inputBoxError]}>
                  <Feather name="lock" size={18} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { paddingRight: 40 }]}
                    placeholder="Minimum 8 characters"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={(txt) => {
                      setPassword(txt);
                      if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                    }}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>
                {fieldErrors.password ? <Text style={styles.errorText}>{fieldErrors.password}</Text> : null}
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.fieldLabel}>Confirm Password *</Text>
                <View style={[styles.inputBox, !!fieldErrors.confirmPassword && styles.inputBoxError]}>
                  <Feather name="lock" size={18} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { paddingRight: 40 }]}
                    placeholder="Re-enter password"
                    placeholderTextColor="#94A3B8"
                    value={confirmPassword}
                    onChangeText={(txt) => {
                      setConfirmPassword(txt);
                      if (fieldErrors.confirmPassword)
                        setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                    }}
                    secureTextEntry={!showPassword}
                  />
                </View>
                {fieldErrors.confirmPassword ? (
                  <Text style={styles.errorText}>{fieldErrors.confirmPassword}</Text>
                ) : null}
              </View>

              {/* Submit Registration Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.continueButton}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.continueText}>Create Account</Text>
                )}
              </TouchableOpacity>

              {/* Footer Link back to Login */}
              <View style={styles.footerRow}>
                <Text style={styles.footerNotice}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                  <Text style={styles.loginLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#0953E8',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    paddingBottom: 36,
    paddingHorizontal: 20,
  },
  headerSafeArea: {
    width: '100%',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  headerTextContainer: {
    marginTop: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 20,
  },
  whiteSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -18,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoImage: {
    width: 140,
    height: 44,
  },
  apiErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  apiErrorText: {
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  formGroup: {
    marginTop: 4,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 18,
  },
  googleG: {
    fontSize: 18,
    fontWeight: '700',
    color: '#EA4335',
  },
  googleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
  },
  inputBoxError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    padding: 6,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  continueButton: {
    backgroundColor: '#0953E8',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#0953E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerNotice: {
    fontSize: 14,
    color: '#64748B',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0953E8',
  },
});
