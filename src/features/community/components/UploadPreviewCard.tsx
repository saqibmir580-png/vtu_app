import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { UploadFormData } from '../types/community.types';
import { ResourceTypeBadge } from './ResourceTypeBadge';
import { CommunityBadge } from './CommunityBadge';

interface UploadPreviewCardProps {
  formData: UploadFormData;
}

export const UploadPreviewCard: React.FC<UploadPreviewCardProps> = ({ formData }) => {
  return (
    <View style={styles.card}>
      <View style={styles.topBadges}>
        <CommunityBadge isOfficial={false} isVerified={true} size="small" />
        <ResourceTypeBadge type={formData.resourceType} size="small" />
      </View>

      <Text style={styles.title}>{formData.title || 'Untitled Community Note'}</Text>

      <View style={styles.metaBox}>
        <Text style={styles.metaText}>
          {formData.subjectCode} - {formData.subjectName}
        </Text>
        <Text style={styles.subMetaText}>
          Unit {formData.unitNumber} • {formData.branch} • Sem {formData.semester} • {formData.scheme} Scheme
        </Text>
      </View>

      <View style={styles.fileStrip}>
        <Feather name="file-text" size={18} color="#0745E8" />
        <View style={styles.fileTextWrapper}>
          <Text style={styles.fileName}>{formData.fileName || 'lecture_notes_module.pdf'}</Text>
          <Text style={styles.fileSize}>{formData.fileSize || '3.5 MB'} • {formData.pageCount || 18} Pages</Text>
        </View>
      </View>

      {formData.description ? (
        <View style={styles.descBox}>
          <Text style={styles.descTitle}>Description:</Text>
          <Text style={styles.descBody}>{formData.description}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginVertical: 12,
  },
  topBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 23,
    marginBottom: 10,
  },
  metaBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0745E8',
  },
  subMetaText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  fileStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  fileTextWrapper: {
    flex: 1,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  fileSize: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  descBox: {
    backgroundColor: '#FAF5FF',
    padding: 12,
    borderRadius: 12,
    borderColor: '#F3E8FF',
    borderWidth: 1,
  },
  descTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0745E8',
    marginBottom: 2,
  },
  descBody: {
    fontSize: 12,
    color: '#0A2540',
    lineHeight: 17,
  },
});
