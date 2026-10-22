import React from 'react';
import { Stack } from 'expo-router';

export default function NotesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Notes Library', headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: 'Note Details', headerShown: false }} />
    </Stack>
  );
}
