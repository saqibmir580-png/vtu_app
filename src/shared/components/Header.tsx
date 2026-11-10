import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useNavigation } from 'expo-router';
import { Feather } from '@expo/vector-icons';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightElement?: React.ReactNode;
  dark?: boolean;
  style?: ViewStyle;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = true,
  onBackPress,
  rightElement,
  dark = false,
  style,
}) => {
  const router = useRouter();
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
      return;
    }

    try {
      // 1. Walk up the navigation hierarchy to find any stack or parent that can go back
      let currentNav: any = navigation;
      while (currentNav) {
        if (typeof currentNav.canGoBack === 'function' && currentNav.canGoBack()) {
          currentNav.goBack();
          return;
        }
        currentNav = currentNav.getParent ? currentNav.getParent() : null;
      }
    } catch {
      // Continue to next fallback
    }

    // 2. Try router.back() if router has back history
    try {
      if (typeof router.canGoBack === 'function' && router.canGoBack()) {
        router.back();
        return;
      }
    } catch {
      // Continue
    }

    // 3. Safe fallback: navigate back to Home tab without triggering unhandled GO_BACK
    try {
      router.replace('/(tabs)/home' as any);
    } catch {
      try {
        router.push('/(tabs)/home' as any);
      } catch {
        // Safe no-op
      }
    }
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={[
        styles.headerSafeArea,
        dark && styles.darkHeaderSafeArea,
        style,
      ]}
    >
      <View style={[styles.headerContainer, dark && styles.darkHeaderContainer]}>
        <View style={styles.leftSlot}>
          {showBack ? (
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.backButton, dark && styles.darkBackButton]}
              onPress={handleBack}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Feather name="chevron-left" size={24} color={dark ? '#FFFFFF' : '#0745E8'} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        {title ? (
          <View style={styles.titleSlot}>
            <Text style={[styles.headerTitle, dark && styles.darkTitle]} numberOfLines={1}>
              {title}
            </Text>
          </View>
        ) : (
          <View style={styles.titleSlot} />
        )}

        <View style={styles.rightSlot}>
          {rightElement || <View style={{ width: 40 }} />}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerSafeArea: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 20,
  },
  darkHeaderSafeArea: {
    backgroundColor: '#0745E8',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderBottomWidth: 0,
    shadowColor: '#0745E8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 20,
  },
  headerContainer: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 4,
    backgroundColor: 'transparent',
  },
  darkHeaderContainer: {
    backgroundColor: 'transparent',
  },
  leftSlot: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkBackButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  titleSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  darkTitle: {
    color: '#FFFFFF',
  },
  rightSlot: {
    minWidth: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
