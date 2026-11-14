import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loginApiFunction,
  registerApiFunction,
  googleLoginApiFunction,
  logoutApiFunction,
  getCurrentUserApiFunction,
} from '../features/auth/apifunction/apiFunction';
import { UserProfile, RegisterPayload } from '../features/auth/types/type';
import { setAuthFailureHandler } from '../infrastructure/api/client';

export type { UserProfile };

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isOnboarded: boolean;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  setAuth: (user: UserProfile, token: string) => void;
  login: (email: string, password?: string) => Promise<boolean>;
  register: (payload: RegisterPayload) => Promise<boolean>;
  loginWithGoogle: (idToken: string) => Promise<boolean>;
  initAuth: () => Promise<void>;
  updateProfile: (updatedFields: Partial<UserProfile>) => void;
  setOnboarded: (status: boolean) => void;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  isOnboarded: false,
  token: null,
  isLoading: false,
  error: null,

  setAuth: (user, token) => {
    AsyncStorage.setItem('vtu_mobile_access_token', token).catch(() => {});
    AsyncStorage.setItem('vtu_mobile_user', JSON.stringify(user)).catch(() => {});
    set({ user, token, isAuthenticated: true, isOnboarded: true, isInitialized: true });
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res: any = await loginApiFunction({ email, password });
      const payload = res?.data || res;
      const user = payload?.user || res?.user;
      const accessToken = payload?.accessToken || res?.accessToken;
      const refreshToken = payload?.refreshToken || res?.refreshToken;

      const uAny = user as any;
      const sProf = uAny?.studentProfile;

      let profile: UserProfile = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl || uAny?.avatarUrl,
        usn: sProf?.usn || uAny?.usn,
        branch: sProf?.branch?.code || sProf?.branchCode || uAny?.branchCode || uAny?.branch,
        scheme: sProf?.scheme?.schemeYear || sProf?.schemeYear || uAny?.schemeYear || uAny?.scheme,
        semester: sProf?.semester || uAny?.semester || 1,
        college: sProf?.collegeCode || uAny?.collegeCode,
        collegeName: uAny?.collegeName || uAny?.college,
        currentCgpa: uAny?.currentCgpa,
        targetCgpa: uAny?.targetCgpa,
      };

      await AsyncStorage.setItem('vtu_mobile_access_token', accessToken);
      if (refreshToken) {
        await AsyncStorage.setItem('vtu_mobile_refresh_token', refreshToken);
      }

      // Try fetching full /users/me profile to get complete relations
      try {
        const fullUser: any = await getCurrentUserApiFunction();
        if (fullUser) {
          profile = {
            ...profile,
            avatarUrl: fullUser.avatarUrl || profile.avatarUrl,
            usn: fullUser.usn || fullUser.studentProfile?.usn || profile.usn,
            branch: fullUser.branchCode || fullUser.studentProfile?.branchCode || fullUser.branch || profile.branch,
            scheme: fullUser.schemeYear || fullUser.studentProfile?.schemeYear || fullUser.scheme || profile.scheme,
            semester: fullUser.semester || fullUser.studentProfile?.semester || profile.semester,
            college: fullUser.collegeCode || fullUser.studentProfile?.collegeCode || profile.college,
            collegeName: fullUser.collegeName || fullUser.college || profile.collegeName,
            currentCgpa: fullUser.currentCgpa ?? profile.currentCgpa,
            targetCgpa: fullUser.targetCgpa ?? profile.targetCgpa,
          };
        }
      } catch {
        // Fallback to returned login payload
      }

      const isOnboarded = !!(profile.usn && (profile.branch || profile.college));

      await AsyncStorage.setItem('vtu_mobile_user', JSON.stringify(profile));

      set({
        user: profile,
        token: accessToken,
        isAuthenticated: true,
        isOnboarded,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Login failed. Invalid credentials.',
      });
      return false;
    }
  },

  register: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const res: any = await registerApiFunction(payload);
      const data = res?.data || res;
      const user = data?.user || res?.user;
      const accessToken = data?.accessToken || res?.accessToken;
      const refreshToken = data?.refreshToken || res?.refreshToken;

      if (!user) {
        throw new Error('Registration failed: Invalid response from server.');
      }

      const profile: UserProfile = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'STUDENT',
        avatarUrl: user.avatarUrl,
        usn: user.usn || payload.usn,
        branch: payload.branchCode || payload.branch,
        scheme: payload.schemeYear || payload.scheme,
      };

      const isOnboarded = !!(profile.usn && (profile.branch || profile.college));

      if (accessToken) {
        await AsyncStorage.setItem('vtu_mobile_access_token', accessToken);
      }
      if (refreshToken) {
        await AsyncStorage.setItem('vtu_mobile_refresh_token', refreshToken);
      }
      await AsyncStorage.setItem('vtu_mobile_user', JSON.stringify(profile));

      set({
        user: profile,
        token: accessToken || null,
        isAuthenticated: true,
        isOnboarded,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Registration failed. Please try again.',
      });
      return false;
    }
  },

  loginWithGoogle: async (idToken) => {
    set({ isLoading: true, error: null });
    try {
      const res: any = await googleLoginApiFunction({ idToken });
      const payload = res?.data || res;
      const user = payload?.user || res?.user;
      const accessToken = payload?.accessToken || res?.accessToken;
      const refreshToken = payload?.refreshToken || res?.refreshToken;

      const profile: UserProfile = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'STUDENT',
        avatarUrl: user.avatarUrl,
        usn: user.studentProfile?.usn || user.usn,
        branch: user.studentProfile?.branch?.code || user.branchCode,
        scheme: user.studentProfile?.scheme?.schemeYear || user.schemeYear,
        semester: user.studentProfile?.semester || user.semester,
      };

      const isOnboarded = !!(profile.usn && (profile.branch || profile.college));

      if (accessToken) {
        await AsyncStorage.setItem('vtu_mobile_access_token', accessToken);
      }
      if (refreshToken) {
        await AsyncStorage.setItem('vtu_mobile_refresh_token', refreshToken);
      }
      await AsyncStorage.setItem('vtu_mobile_user', JSON.stringify(profile));

      set({
        user: profile,
        token: accessToken,
        isAuthenticated: true,
        isOnboarded,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || 'Google sign-in authentication failed.',
      });
      return false;
    }
  },

  initAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('vtu_mobile_access_token');
      const storedUserStr = await AsyncStorage.getItem('vtu_mobile_user');

      // If token is missing or a mock/demo testing token, clear cache to start fresh at Welcome
      if (!token || token === 'demo_token' || token.startsWith('mock_') || token.startsWith('token_')) {
        await AsyncStorage.removeItem('vtu_mobile_access_token');
        await AsyncStorage.removeItem('vtu_mobile_refresh_token');
        await AsyncStorage.removeItem('vtu_mobile_user');
        set({ isAuthenticated: false, user: null, token: null, isOnboarded: false, isInitialized: true });
        return;
      }

      let storedUser = storedUserStr ? JSON.parse(storedUserStr) : null;
      set({ token, user: storedUser, isAuthenticated: true, isOnboarded: true, isInitialized: true });

      try {
        const user = await getCurrentUserApiFunction();
        const profile: UserProfile = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl || storedUser?.avatarUrl,
          usn: user.studentProfile?.usn || storedUser?.usn,
          branch: user.studentProfile?.branch?.code || storedUser?.branch,
          branchCode: user.studentProfile?.branchCode || storedUser?.branchCode,
          scheme: user.studentProfile?.scheme?.schemeYear || storedUser?.scheme,
          schemeYear: user.studentProfile?.schemeYear || storedUser?.schemeYear,
          semester: user.studentProfile?.semester || storedUser?.semester,
          college: user.studentProfile?.collegeCode || storedUser?.college,
          collegeCode: user.studentProfile?.collegeCode || storedUser?.collegeCode,
          collegeName: user.collegeName || user.college || storedUser?.collegeName,
          currentCgpa: user.currentCgpa ?? storedUser?.currentCgpa,
          targetCgpa: user.targetCgpa ?? storedUser?.targetCgpa,
        };

        await AsyncStorage.setItem('vtu_mobile_user', JSON.stringify(profile));
        set({ user: profile, isAuthenticated: true, isOnboarded: true, isInitialized: true });
      } catch {
        // Keep stored user if backend is temporarily unreachable
        if (storedUser) {
          set({ user: storedUser, isAuthenticated: true, isOnboarded: true, isInitialized: true });
        }
      }
    } catch {
      await AsyncStorage.removeItem('vtu_mobile_access_token');
      await AsyncStorage.removeItem('vtu_mobile_refresh_token');
      await AsyncStorage.removeItem('vtu_mobile_user');
      set({ user: null, token: null, isAuthenticated: false, isOnboarded: false, isInitialized: true });
    } finally {
      set({ isInitialized: true });
    }
  },

  updateProfile: (updatedFields) =>
    set((state) => {
      const newUser = state.user ? { ...state.user, ...updatedFields } : ({ ...updatedFields } as UserProfile);
      if (updatedFields.currentCgpa === undefined || updatedFields.currentCgpa === null) {
        delete newUser.currentCgpa;
      }
      AsyncStorage.setItem('vtu_mobile_user', JSON.stringify(newUser)).catch(() => {});
      return { user: newUser, isOnboarded: true };
    }),

  setOnboarded: (isOnboarded) => set({ isOnboarded }),

  logout: async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('vtu_mobile_refresh_token');
      if (refreshToken) {
        await logoutApiFunction(refreshToken);
      }
    } catch {
      // Ignore logout errors
    } finally {
      await AsyncStorage.removeItem('vtu_mobile_access_token');
      await AsyncStorage.removeItem('vtu_mobile_refresh_token');
      await AsyncStorage.removeItem('vtu_mobile_user');
      await AsyncStorage.removeItem('vtu_onboarded');
      set({ user: null, token: null, isAuthenticated: false, isOnboarded: false, error: null });
    }
  },

  clearError: () => set({ error: null }),
}));

// Wire API client auth failure to clear in-memory store state synchronously
setAuthFailureHandler(() => {
  useAuthStore.setState({ user: null, token: null, isAuthenticated: false, isOnboarded: false, error: null });
});
