import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { AppProvider } from '@/core/providers/AppProvider';
import { colors } from '@/core/theme';
import { useAuthStore } from '@/store';

// Prevent default auto hide so we control transition smoothly
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    initAuth();
    // Hide native splash screen immediately on mount
    SplashScreen.hideAsync().catch(() => {});
  }, [initAuth]);


  return (
    <AppProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FFFFFF' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="notes" options={{ headerShown: false }} />
        <Stack.Screen name="papers" options={{ headerShown: false }} />
        <Stack.Screen name="passing-packages" options={{ headerShown: false }} />
        <Stack.Screen name="community" options={{ headerShown: false }} />
        <Stack.Screen name="calculators" options={{ headerShown: false }} />
        <Stack.Screen name="videos" options={{ headerShown: false }} />
      </Stack>
    </AppProvider>
  );
}
