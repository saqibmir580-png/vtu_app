import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface AvatarProps {
  name: string;
  avatarUrl?: string;
  size?: number;
  showEditBadge?: boolean;
  onPressEdit?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  avatarUrl,
  size = 72,
  showEditBadge = false,
  onPressEdit,
}) => {
  const initial = name ? name.charAt(0).toUpperCase() : 'S';
  const fontSize = Math.round(size * 0.4);

  return (
    <TouchableOpacity
      activeOpacity={onPressEdit ? 0.85 : 1}
      onPress={onPressEdit}
      disabled={!onPressEdit}
      style={[styles.wrapper, { width: size, height: size }]}
    >
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={[
            styles.avatarImage,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        />
      ) : (
        <View
          style={[
            styles.circle,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Text style={[styles.initialText, { fontSize }]}>{initial}</Text>
        </View>
      )}

      {showEditBadge && (
        <View style={styles.editBadge}>
          <Feather name="edit-2" size={12} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  circle: {
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: '#C7D2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    borderWidth: 2,
    borderColor: '#C7D2FE',
  },
  initialText: {
    color: '#0745E8',
    fontWeight: '800',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0745E8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
