import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface ResourcePreviewProps {
  title: string;
  pageCount: number;
  subjectCode: string;
  previewPages?: string[];
}

export const ResourcePreview: React.FC<ResourcePreviewProps> = ({
  title,
  pageCount,
  subjectCode,
  previewPages = [],
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <View style={styles.container}>
      <View style={styles.paper}>
        <View style={styles.headerRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{subjectCode} COMMUNITY NOTE</Text>
          </View>
          <Text style={styles.pageMeta}>Page {currentPage} of {pageCount}</Text>
        </View>

        <Text style={styles.paperTitle}>{title}</Text>
        <View style={styles.divider} />

        <ScrollView style={styles.pageContent}>
          <Text style={styles.sectionTitle}>Preview Content (Sample Page {currentPage})</Text>
          <Text style={styles.bodyText}>
            {previewPages[currentPage - 1] ||
              'Handwritten & typed notes covering syllabus concepts, solved question patterns, formulas, and state diagrams.'}
          </Text>

          <View style={styles.sampleBox}>
            <Feather name="edit-3" size={20} color="#0745E8" />
            <Text style={styles.sampleText}>Verified handwritten class notes from VTU toppers</Text>
          </View>
        </ScrollView>
      </View>

      <View style={styles.pageControls}>
        <TouchableOpacity
          disabled={currentPage === 1}
          style={[styles.navBtn, currentPage === 1 && styles.disabled]}
          onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
        >
          <Feather name="chevron-left" size={18} color={currentPage === 1 ? '#94A3B8' : '#0F172A'} />
        </TouchableOpacity>

        <Text style={styles.indicatorText}>{currentPage} / {pageCount}</Text>

        <TouchableOpacity
          disabled={currentPage === pageCount}
          style={[styles.navBtn, currentPage === pageCount && styles.disabled]}
          onPress={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
        >
          <Feather name="chevron-right" size={18} color={currentPage === pageCount ? '#94A3B8' : '#0F172A'} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  paper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    minHeight: 260,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0745E8',
  },
  pageMeta: {
    fontSize: 11,
    color: '#64748B',
  },
  paperTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  pageContent: {
    maxHeight: 160,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0745E8',
    marginBottom: 6,
  },
  bodyText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  },
  sampleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FAF5FF',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  sampleText: {
    fontSize: 11,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  pageControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 10,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  indicatorText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
});
