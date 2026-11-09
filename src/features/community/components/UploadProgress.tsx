import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { UploadStatus } from '../types/community.types';

interface UploadProgressProps {
  status: UploadStatus;
  progressPercent: number;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  status,
  progressPercent,
}) => {
  let title = 'Uploading Document...';
  let subtitle = 'Encrypted upload to VTU Community Storage';
  let color = '#0745E8';

  if (status === 'processing') {
    title = 'Processing & Verifying File...';
    subtitle = 'Checking virus scan, page indexing & readability';
    color = '#0284C7';
  } else if (status === 'pending_review') {
    title = 'Pending Moderation Review';
    subtitle = 'Submitted! Our team is verifying syllabus alignment.';
    color = '#D97706';
  } else if (status === 'published') {
    title = 'Published Successfully!';
    subtitle = 'Your notes are now live on the VTU Community feed.';
    color = '#059669';
  } else if (status === 'rejected') {
    title = 'Submission Moderated';
    subtitle = 'File requires revisions before publishing.';
    color = '#DC2626';
  }

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
          <Feather
            name={status === 'published' ? 'check-circle' : 'loader'}
            size={20}
            color={color}
          />
        </View>
        <View style={styles.textWrapper}>
          <Text style={[styles.title, { color }]}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <Text style={[styles.percent, { color }]}>{progressPercent}%</Text>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progressPercent}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrapper: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  percent: {
    fontSize: 14,
    fontWeight: '800',
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
