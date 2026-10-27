import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Alert, Platform } from 'react-native';

// Ensure completed auth session dismisses the browser cleanly on both iOS & Android
WebBrowser.maybeCompleteAuthSession();

/**
 * Returns true if running inside the Expo Go client app
 */
export const isExpoGo = (): boolean => {
  try {
    return (
      Constants.appOwnership === 'expo' ||
      Constants.executionEnvironment === ExecutionEnvironment.StoreClient
    );
  } catch {
    return false;
  }
};

/**
 * Derives iOS reversed client ID scheme:
 * e.g. "170442859744-xxxx.apps.googleusercontent.com" -> "com.googleusercontent.apps.170442859744-xxxx"
 */
export const getReversedClientIdScheme = (clientId: string): string => {
  const prefix = clientId.replace(/\.apps\.googleusercontent\.com$/, '');
  return `com.googleusercontent.apps.${prefix}`;
};

/**
 * Returns the correct Google Client ID based on runtime platform
 */
export const getGoogleClientId = (): string => {
  if (Platform.OS === 'android' && process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID?.trim()) {
    return process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID.trim();
  }
  if (Platform.OS === 'ios' && process.env.EXPO_PUBLIC_IOS_CLIENT_ID?.trim()) {
    return process.env.EXPO_PUBLIC_IOS_CLIENT_ID.trim();
  }
  return (process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '').trim();
};

/**
 * Dynamically resolves the OAuth redirect URI for:
 * 1. Explicit override (EXPO_PUBLIC_GOOGLE_REDIRECT_URI)
 * 2. Web browser (localhost / web origin)
 * 3. Expo Go (Expo Auth Proxy: https://auth.expo.io/@...)
 * 4. Standalone iOS (Reversed Client ID scheme: com.googleusercontent.apps.<id>:/oauthredirect)
 * 5. Standalone Android (Custom scheme: vtuapp://oauthredirect)
 */
export const getGoogleRedirectUri = (): string => {
  if (process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI?.trim()) {
    return process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI.trim();
  }

  if (Platform.OS === 'web') {
    return AuthSession.makeRedirectUri({ preferLocalhost: true });
  }

  // Inside Expo Go, custom schemes are not registered natively; use Expo Auth Proxy
  if (isExpoGo()) {
    return AuthSession.makeRedirectUri();
  }

  // iOS Standalone: Google expects the reversed client ID URL scheme
  if (Platform.OS === 'ios' && process.env.EXPO_PUBLIC_IOS_CLIENT_ID?.trim()) {
    const scheme = getReversedClientIdScheme(process.env.EXPO_PUBLIC_IOS_CLIENT_ID.trim());
    return `${scheme}:/oauthredirect`;
  }

  // Android Standalone / Development Build
  return AuthSession.makeRedirectUri({
    scheme: 'vtuapp',
    path: 'oauthredirect',
  });
};

export const performGoogleSignInSession = async (): Promise<{ idToken: string | null; cancelled?: boolean }> => {
  const googleClientId = getGoogleClientId();

  // Validate Client ID
  const isInvalidClientId =
    !googleClientId ||
    googleClientId.includes('placeholder') ||
    googleClientId.includes('your_google_client_id');

  if (isInvalidClientId) {
    Alert.alert(
      'Google Client ID Required',
      'Google Sign-In requires a valid Client ID from Google Cloud Console.\n\nPlease check EXPO_PUBLIC_GOOGLE_CLIENT_ID in your mobile .env file.',
      [{ text: 'OK' }]
    );
    return { idToken: null, cancelled: true };
  }

  const googleRedirectUri = getGoogleRedirectUri();
  console.log('[Google Auth] Platform:', Platform.OS);
  console.log('[Google Auth] In Expo Go:', isExpoGo());
  console.log('[Google Auth] Using Client ID:', googleClientId);
  console.log('[Google Auth] Resolved Redirect URI:', googleRedirectUri);

  const nonce = Crypto.randomUUID();

  // OpenID Connect compliant Google OAuth URL with prompt=select_account & nonce
  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(googleClientId)}` +
    `&redirect_uri=${encodeURIComponent(googleRedirectUri)}` +
    `&response_type=id_token` +
    `&scope=${encodeURIComponent('openid email profile')}` +
    `&nonce=${encodeURIComponent(nonce)}` +
    `&prompt=select_account`;

  try {
    const res = await WebBrowser.openAuthSessionAsync(authUrl, googleRedirectUri);

    if (res.type === 'cancel' || res.type === 'dismiss') {
      return { idToken: null, cancelled: true };
    }

    if (res.type === 'success' && res.url) {
      // Parse id_token from either URL hash (#id_token=...) or query param (?id_token=...)
      const hashMatch = res.url.match(/[#?&]id_token=([^&]+)/);
      if (hashMatch && hashMatch[1]) {
        return { idToken: decodeURIComponent(hashMatch[1]) };
      }

      // Check for error returned in callback URL
      const errorMatch = res.url.match(/[#?&]error=([^&]+)/);
      if (errorMatch && errorMatch[1]) {
        const errorMsg = decodeURIComponent(errorMatch[1]);
        console.error('[Google Auth Callback Error]:', errorMsg);
        Alert.alert('Google Sign-In Failed', `Google returned: ${errorMsg}`);
        return { idToken: null, cancelled: true };
      }
    }

    return { idToken: null, cancelled: true };
  } catch (err: any) {
    console.warn('[Google Auth Session Error]:', err);
    Alert.alert('Google Sign-In Error', err?.message || 'Failed to open Google authentication session.');
    return { idToken: null, cancelled: true };
  }
};
