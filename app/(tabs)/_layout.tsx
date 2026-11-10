import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';

interface CenterHomeButtonProps {
  onPress?: (e: any) => void;
  accessibilityState?: { selected?: boolean };
}

const CenterHomeButton: React.FC<CenterHomeButtonProps> = ({
  onPress,
  accessibilityState,
}) => {
  const isSelected = accessibilityState?.selected;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.centerButtonWrapper}
    >
      <View
        style={[
          styles.centerButtonCircle,
          isSelected && styles.centerButtonActive,
        ]}
      >
        <Feather name="home" size={24} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );
};

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0745E8',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      {/* 1. Library */}
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, size }) => (
            <Feather name="book-open" size={size || 22} color={color} />
          ),
        }}
      />

      {/* 2. Tools & Calculators */}
      <Tabs.Screen
        name="tools"
        options={{
          title: 'Calculators',
          tabBarIcon: ({ color, size }) => (
            <Feather name="cpu" size={size || 22} color={color} />
          ),
        }}
      />

      {/* 3. Centerpiece Elevated Home Button */}
      <Tabs.Screen
        name="home"
        options={{
          title: '',
          tabBarButton: (props) => <CenterHomeButton {...props} />,
        }}
      />

      {/* 4. Community */}
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, size }) => (
            <Feather name="message-square" size={size || 22} color={color} />
          ),
        }}
      />

      {/* 5. Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size || 22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerButtonWrapper: {
    top: -18,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  centerButtonCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0745E8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3.5,
    borderColor: '#FFFFFF',
    shadowColor: '#0745E8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  centerButtonActive: {
    backgroundColor: '#0534B3',
    borderColor: '#EFF6FF',
    transform: [{ scale: 1.05 }],
  },
});