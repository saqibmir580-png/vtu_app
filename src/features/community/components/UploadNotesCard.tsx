import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface UploadNotesCardProps {
  onPressUpload: () => void;
}

export const UploadNotesCard: React.FC<UploadNotesCardProps> = ({ onPressUpload }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={styles.card}
      onPress={onPressUpload}
    >
      <View style={styles.iconCircle}>
        <Feather name="upload-cloud" size={24} color="#0745E8" />
      </View>

      <View style={styles.textWrapper}>
        <Text style={styles.title}>Have handwritten notes?</Text>
        <Text style={styles.subtitle}>
          Help fellow VTU students & earn contributor badges on your profile.
        </Text>
      </View>

      <View style={styles.uploadBtn}>
        <Text style={styles.uploadBtnText}>Upload</Text>
        <Feather name="plus" size={14} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    borderColor: '#DDD6FE',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrapper: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#5B21B6',
  },
  subtitle: {
    fontSize: 11,
    color: '#1D4ED8',
    marginTop: 2,
    lineHeight: 15,
  },
  uploadBtn: {
    backgroundColor: '#0745E8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  uploadBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
