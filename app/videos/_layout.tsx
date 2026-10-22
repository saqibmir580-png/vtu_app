import React from 'react';
import { Stack } from 'expo-router';

export default function VideosLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Video Lectures', headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: 'Course Details', headerShown: false }} />
    </Stack>
  );
}
