import React from 'react';
import { Stack } from 'expo-router';

export default function CommunityLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 250,
        contentStyle: { backgroundColor: '#F8FAFC' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'VTU Community' }} />
      <Stack.Screen name="search" options={{ title: 'Search Notes' }} />
      <Stack.Screen name="filters" options={{ title: 'Filters' }} />
      <Stack.Screen name="feed" options={{ title: 'Community Feed' }} />
      <Stack.Screen name="subject/[id]" options={{ title: 'Subject Community' }} />
      <Stack.Screen name="resource/[id]" options={{ title: 'Note Details' }} />
      <Stack.Screen name="contributor/[id]" options={{ title: 'Contributor Profile' }} />
      <Stack.Screen name="upload/index" options={{ title: 'Upload Notes' }} />
      <Stack.Screen name="upload/details" options={{ title: 'Upload Details' }} />
      <Stack.Screen name="upload/preview" options={{ title: 'Upload Preview' }} />
      <Stack.Screen name="upload/status/[id]" options={{ title: 'Upload Status' }} />
      <Stack.Screen name="my-contributions" options={{ title: 'My Contributions' }} />
      <Stack.Screen name="downloads" options={{ title: 'Community Downloads' }} />
      <Stack.Screen name="report/[id]" options={{ title: 'Report Content' }} />
      <Stack.Screen name="rating/[id]" options={{ title: 'Rate Note' }} />
      <Stack.Screen name="trending" options={{ title: 'Trending Notes' }} />
      <Stack.Screen name="empty" options={{ title: 'No Content' }} />
      <Stack.Screen name="unavailable/[id]" options={{ title: 'Resource Unavailable' }} />
    </Stack>
  );
}

