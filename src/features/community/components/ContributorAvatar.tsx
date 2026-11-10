import React, { useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Contributor } from '../types/community.types';

interface ContributorAvatarProps {
  contributor: Contributor;
  size?: number;
}

export const ContributorAvatar: React.FC<ContributorAvatarProps> = ({
  contributor,
  size = 36,
}) => {
  const [imageError, setImageError] = useState(false);

  const initials = contributor?.name
    ? contributor.name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  const isTopContributor = contributor?.reputationBadge === 'VTU Top Contributor';
  const showImage = Boolean(contributor?.avatarUrl && !imageError);

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      {showImage ? (
        <Image
          source={{ uri: contributor.avatarUrl }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
          onError={() => setImageError(true)}
        />
      ) : (
        <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.initials, { fontSize: Math.max(10, size * 0.38) }]}>{initials}</Text>
        </View>
      )}

      {isTopContributor && (
        <View style={styles.badgeRing} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    backgroundColor: '#E2E8F0',
  },
  fallback: {
    backgroundColor: '#0745E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  badgeRing: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F59E0B',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
