import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store';
import { storageService } from '@/infrastructure/storage/storage.service';

const { width } = Dimensions.get('window');

export const SplashScreen: React.FC = () => {
  const router = useRouter();

  const logoScale = useSharedValue(0.85);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    logoScale.value = withSpring(1, {
      damping: 10,
      stiffness: 120,
    });

    progressWidth.value = withTiming(1, {
      duration: 1800,
      easing: Easing.out(Easing.quad),
    });

    let isNavigated = false;
    let unsubscribe: (() => void) | null = null;

    const navigateWhenReady = () => {
      if (isNavigated) return;
      const state = useAuthStore.getState();
      if (!state.isInitialized) {
        // Wait for initAuth to finish hydrating
        unsubscribe = useAuthStore.subscribe((nextState) => {
          if (nextState.isInitialized && !isNavigated) {
            isNavigated = true;
            if (unsubscribe) {
              unsubscribe();
              unsubscribe = null;
            }
            if (nextState.isAuthenticated) {
              router.replace('/(tabs)/home');
            } else {
              router.replace('/(auth)/welcome');
            }
          }
        });
        return;
      }

      isNavigated = true;
      if (state.isAuthenticated) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(auth)/welcome');
      }
    };

    const timer = setTimeout(navigateWhenReady, 1800);

    return () => {
      clearTimeout(timer);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [router]);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  return (
    <LinearGradient
      colors={['#0953E8', '#0732B8', '#03176B']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.gradientContainer}
    >
      {/* Background Decorative Soft Circles */}
      <View style={styles.topBackgroundCircle} />
      <View style={styles.bottomBackgroundCircle} />

      {/* Center VTU Ultima Logo & Tagline */}
      <View style={styles.centerContent}>
        <Animated.View style={[styles.logoWrapper, animatedLogoStyle]}>
          <Image
            source={require('../../../../assets/vtu_ultima_logo.png')}
            style={styles.logoImage}
            contentFit="contain"
            priority="high"
          />
        </Animated.View>

        <Text style={styles.tagline}>Learn. Prepare. Achieve.</Text>
      </View>

      {/* Bottom Loader & Footer */}
      <View style={styles.bottomSection}>
        {/* Animated Progress Bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, animatedProgressStyle]} />
        </View>

        {/* Footer Caption */}
        <View style={styles.footerRow}>
          <Text style={styles.heartIcon}>♥ </Text>
          <Text style={styles.footerText}>Made for VTU Students</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 56,
    paddingHorizontal: 24,
  },
  topBackgroundCircle: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  bottomBackgroundCircle: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    width: 260,
    height: 110,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  tagline: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 16,
  },
  progressTrack: {
    width: width * 0.55,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 32,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heartIcon: {
    color: '#93C5FD',
    fontSize: 14,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
