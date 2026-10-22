import React from 'react';
import { Stack } from 'expo-router';

export default function PapersLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Question Papers', headerShown: false }} />
      <Stack.Screen name="saved" options={{ title: 'Saved Papers', headerShown: false }} />
      <Stack.Screen name="preview" options={{ title: 'Paper Preview', headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: 'Paper Details', headerShown: false }} />
    </Stack>
  );
}
