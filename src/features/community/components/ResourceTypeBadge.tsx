import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ResourceType } from '../types/community.types';

interface ResourceTypeBadgeProps {
  type: ResourceType;
  size?: 'small' | 'medium';
}

export const ResourceTypeBadge: React.FC<ResourceTypeBadgeProps> = ({
  type,
  size = 'medium',
}) => {
  let bgColor = '#F1F5F9';
  let textColor = '#475569';

  switch (type) {
    case 'Handwritten Notes':
      bgColor = '#EEF2FF';
      textColor = '#0745E8';
      break;
    case 'Formula Sheet':
      bgColor = '#FEF3C7';
      textColor = '#B45309';
      break;
    case 'Solved Question Bank':
      bgColor = '#F3E8FF';
      textColor = '#1D4ED8';
      break;
    case 'Typed PDF':
      bgColor = '#E0F2FE';
      textColor = '#0369A1';
      break;
    case 'Lab Record':
      bgColor = '#ECFDF5';
      textColor = '#047857';
      break;
    case 'Revision Mindmap':
      bgColor = '#FCE7F3';
      textColor = '#BE185D';
      break;
  }

  const isSmall = size === 'small';

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }, isSmall && styles.badgeSmall]}>
      <Text style={[styles.text, { color: textColor }, isSmall && styles.textSmall]}>
        {type}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
  textSmall: {
    fontSize: 10,
  },
});
