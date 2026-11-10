import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface CommunityBadgeProps {
  isOfficial?: boolean;
  isVerified?: boolean;
  size?: 'small' | 'medium';
}

export const CommunityBadge: React.FC<CommunityBadgeProps> = ({
  isOfficial = false,
  isVerified = true,
  size = 'medium',
}) => {
  const isSmall = size === 'small';

  if (isOfficial) {
    return (
      <View style={[styles.badge, styles.officialBadge, isSmall && styles.badgeSmall]}>
        <Feather name="shield" size={isSmall ? 10 : 12} color="#0745E8" />
        <Text style={[styles.text, styles.officialText, isSmall && styles.textSmall]}>
          OFFICIAL VTU NOTE
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.badge, styles.communityBadge, isSmall && styles.badgeSmall]}>
      <Feather name="users" size={isSmall ? 10 : 12} color="#0745E8" />
      <Text style={[styles.text, styles.communityText, isSmall && styles.textSmall]}>
        STUDENT COMMUNITY {isVerified ? '• VERIFIED' : ''}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  officialBadge: {
    backgroundColor: '#EEF2FF',
  },
  officialText: {
    color: '#0745E8',
  },
  communityBadge: {
    backgroundColor: '#F3E8FF',
  },
  communityText: {
    color: '#0745E8',
  },
  text: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  textSmall: {
    fontSize: 9,
  },
});
