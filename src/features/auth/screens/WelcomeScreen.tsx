import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Container, Button } from '@/shared/components';
import { colors } from '@/core/theme';

export const WelcomeScreen: React.FC = () => {
  const router = useRouter();

  return (
    <Container style={styles.container}>
      <View style={styles.content}>
        {/* VTU Ultima Branding Logo */}
        <View style={styles.logoWrapper}>
          <Image
            source={require('../../../../assets/vtu_ultima_logo.png')}
            style={styles.logoImage}
            contentFit="contain"
            priority="high"
          />
        </View>
        <Text style={styles.title}>VTU Ultima</Text>
        <Text style={styles.subtitle}>
          Your all-in-one companion for notes, past question papers, SGPA/CGPA calculators & VTU community.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          title="Get Started"
          variant="primary"
          onPress={() => router.push('/(auth)/register')}
          style={styles.button}
        />
        <Button
          title="I already have an account"
          variant="outline"
          onPress={() => router.push('/(auth)/login')}
          style={styles.button}
        />
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    paddingVertical: 36,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    width: 240,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text.darkPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.text.darkSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  actions: {
    gap: 12,
  },
  button: {
    width: '100%',
  },
});
