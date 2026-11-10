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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Feather } from '@expo/vector-icons';
import { performGoogleSignInSession } from '../utils/googleAuth';
import { loginSchema, LoginFormData } from '../validation/auth.schema';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/core/providers/ToastProvider';
import { ForgotPasswordModal } from '../components/ForgotPasswordModal';

export const LoginScreen: React.FC = () => {
  const router = useRouter();
  const { login, loginWithGoogle, error, isLoading, clearError } = useAuth();
  const { showToast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    clearError();
    const ok = await login(data.email, data.password);
    if (ok) {
      const state = useAuthStore.getState();
      const currentUser = state.user;
      showToast(`Welcome back, ${currentUser?.name || 'Student'}!`, 'success');
      if (state.isOnboarded || currentUser?.usn || currentUser?.branch || (currentUser as any)?.branchCode) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(auth)/onboarding');
      }
    } else {
      const err = useAuthStore.getState().error || 'Login failed. Invalid credentials.';
      showToast(err, 'error');
    }
  };

  const handleGoogleLogin = async () => {
    clearError();
    const { idToken, cancelled } = await performGoogleSignInSession();
    if (cancelled || !idToken) return;

    const ok = await loginWithGoogle(idToken);
    if (ok) {
      const state = useAuthStore.getState();
      const currentUser = state.user;
      if (state.isOnboarded || currentUser?.usn || currentUser?.branch || (currentUser as any)?.branchCode) {
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
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
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
                onPress={() => router.back()}
              >
                <Feather name="chevron-left" size={22} color="#FFFFFF" />
              </TouchableOpacity>

              {/* VTU Ultima Logo Badge */}
              <View style={styles.logoWrapper}>
                <Image
                  source={require('@/../assets/vtu_ultima_logo.png')}
                  style={styles.logoImage}
                  contentFit="contain"
                />
              </View>

              <Text style={styles.headerTitle}>Welcome Back!</Text>
              <Text style={styles.headerSubtitle}>Login to continue your journey</Text>
            </SafeAreaView>
          </LinearGradient>

          {/* Bottom Curved White Sheet Container */}
          <View style={styles.whiteSheet}>
            <View style={styles.formGroup}>
              {/* Error Banner */}
              {error ? (
                <View style={{ backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 4 }}>
                  <Text style={{ color: '#DC2626', fontSize: 13, fontWeight: '600', textAlign: 'center' }}>{error}</Text>
                </View>
              ) : null}

              {/* Email Field */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.inputBox}>
                      <Feather name="mail" size={18} color="#64748B" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="youremail@gmail.com"
                        placeholderTextColor="#94A3B8"
                        value={value}
                        onChangeText={onChange}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                  )}
                />
                {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
              </View>

              {/* Password Field */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.inputBox}>
                      <Feather name="lock" size={18} color="#64748B" style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { paddingRight: 40 }]}
                        placeholder="••••••••"
                        placeholderTextColor="#94A3B8"
                        value={value}
                        onChangeText={onChange}
                        secureTextEntry={!showPassword}
                      />
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={styles.eyeButton}
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <Feather name="eye-off" size={18} color="#64748B" />
                        ) : (
                          <Feather name="eye" size={18} color="#64748B" />
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                />
                {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
              </View>

              {/* Forgot Password Link */}
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.forgotPassWrapper}
                onPress={() => setForgotPasswordVisible(true)}
              >
                <Text style={styles.forgotPassText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.loginButton}
                onPress={handleSubmit(onSubmit)}
                disabled={isLoading}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? 'Signing In...' : 'Login'}
                </Text>
              </TouchableOpacity>

              {/* OR Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Continue Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.googleButton}
                onPress={handleGoogleLogin}
              >
                <Text style={styles.googleG}>G </Text>
                <Text style={styles.googleText}>Continue with Google</Text>
              </TouchableOpacity>


              {/* Bottom Register Footer Link */}
              <View style={styles.footerRow}>
                <Text style={styles.footerNotice}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                  <Text style={styles.createAccLink}>Create Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ForgotPasswordModal
        visible={forgotPasswordVisible}
        onClose={() => setForgotPasswordVisible(false)}
      />
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
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerSafeArea: {
    width: '100%',
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  logoWrapper: {
    width: 180,
    height: 56,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
  },
  whiteSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -24,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 36,
  },
  formGroup: {
    gap: 16,
  },
  inputContainer: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
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
    padding: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
  },
  forgotPassWrapper: {
    alignSelf: 'flex-end',
    marginTop: -4,
  },
  forgotPassText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0745E8',
  },
  loginButton: {
    backgroundColor: '#0745E8',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0745E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 4,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
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
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1.5,
    paddingVertical: 14,
    borderRadius: 16,
  },
  googleG: {
    fontSize: 16,
    fontWeight: '900',
    color: '#4285F4',
  },
  googleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  footerNotice: {
    fontSize: 13,
    color: '#64748B',
  },
  createAccLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0745E8',
  },
});
