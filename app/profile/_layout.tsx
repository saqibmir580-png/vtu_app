import React from 'react';
import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Stack.Screen name="academic" options={{ title: 'Academic Profile' }} />
      <Stack.Screen name="edit" options={{ title: 'Edit Academic Profile' }} />
      <Stack.Screen name="about" options={{ title: 'About & Legal' }} />
    </Stack>
  );
}
