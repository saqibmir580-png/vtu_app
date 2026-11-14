import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

export default function CalculatorsCalendarRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/calendar' as any);
  }, [router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
      <ActivityIndicator size="large" color="#0745E8" />
    </View>
  );
}

