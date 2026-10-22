import React from 'react';
import { Stack } from 'expo-router';

export default function CalculatorsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Stack.Screen name="sgpa" options={{ title: 'SGPA Calculator', headerShown: false }} />
      <Stack.Screen name="cgpa" options={{ title: 'CGPA Calculator', headerShown: false }} />
      <Stack.Screen name="attendance" options={{ headerShown: false }} />
      <Stack.Screen name="goal-planner" options={{ headerShown: false }} />
    </Stack>
  );
}
