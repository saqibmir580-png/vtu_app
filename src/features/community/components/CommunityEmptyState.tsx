import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface CommunityEmptyStateProps {
  title?: string;
  description?: string;
  onPressUpload?: () => void;
  onPressReset?: () => void;
}

export const CommunityEmptyState: React.FC<CommunityEmptyStateProps> = ({
  title = 'No Community Notes Found',
  description = 'Be the first student to upload handwritten notes or formula sheets for this subject!',
  onPressUpload,
  onPressReset,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Feather name="users" size={32} color="#0745E8" />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {onPressUpload && (
        <TouchableOpacity activeOpacity={0.85} style={styles.primaryBtn} onPress={onPressUpload}>
          <Feather name="upload-cloud" size={16} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>Upload Notes Now</Text>
        </TouchableOpacity>
      )}

      {onPressReset && (
        <TouchableOpacity activeOpacity={0.8} style={styles.secondaryBtn} onPress={onPressReset}>
          <Feather name="refresh-cw" size={14} color="#0745E8" />
          <Text style={styles.secondaryBtnText}>Reset Filter Options</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 16,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
    paddingHorizontal: 10,
  },
  primaryBtn: {
    backgroundColor: '#0745E8',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  secondaryBtnText: {
    color: '#0745E8',
    fontSize: 13,
    fontWeight: '700',
  },
});
