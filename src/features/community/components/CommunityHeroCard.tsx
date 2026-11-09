import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

interface CommunityHeroCardProps {
  onPressUpload: () => void;
  onPressExplore: () => void;
}

export const CommunityHeroCard: React.FC<CommunityHeroCardProps> = ({
  onPressUpload,
  onPressExplore,
}) => {
  return (
    <LinearGradient
      colors={['#0745E8', '#1D4ED8', '#0A2540']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.topBadge}>
        <Feather name="users" size={12} color="#F472B6" />
        <Text style={styles.topBadgeText}>VTU STUDENT COMMUNITY</Text>
      </View>

      <Text style={styles.title}>Learn together.{'\n'}Share your notes.</Text>
      <Text style={styles.subtitle}>
        Access verified handwritten notes, module summaries, and solved papers contributed by VTU engineering peers.
      </Text>

      <View style={styles.btnRow}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.primaryBtn}
          onPress={onPressUpload}
        >
          <Feather name="upload-cloud" size={16} color="#0A2540" />
          <Text style={styles.primaryBtnText}>Upload Notes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.secondaryBtn}
          onPress={onPressExplore}
        >
          <Text style={styles.secondaryBtnText}>Explore Feed</Text>
          <Feather name="arrow-right" size={14} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 22,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: '#0745E8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  topBadgeText: {
    color: '#F472B6',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 28,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.88)',
    lineHeight: 18,
    marginBottom: 16,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  primaryBtnText: {
    color: '#0A2540',
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  secondaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
