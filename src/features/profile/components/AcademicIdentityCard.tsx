import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface AcademicIdentityCardProps {
  semester: number;
  cgpa: number;
  scheme: string;
  bookmarksCount?: number;
  downloadsCount?: number;
  onPressBookmarks?: () => void;
  onPressDownloads?: () => void;
  onPressEdit?: () => void;
}

export const AcademicIdentityCard: React.FC<AcademicIdentityCardProps> = ({
  semester,
  cgpa,
  scheme,
  bookmarksCount = 0,
  downloadsCount = 0,
  onPressBookmarks,
  onPressDownloads,
  onPressEdit,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Feather name="award" size={18} color="#0745E8" />
          <Text style={styles.titleText}>Academic Snapshot</Text>
        </View>

        {onPressEdit && (
          <TouchableOpacity activeOpacity={0.8} style={styles.editBtn} onPress={onPressEdit}>
            <Text style={styles.editBtnText}>Edit</Text>
            <Feather name="chevron-right" size={14} color="#0745E8" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.metricsRow}>
        {/* Semester Metric */}
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>SEMESTER</Text>
          <Text style={styles.metricValue}>Sem {semester}</Text>
        </View>

        <View style={styles.divider} />

        {/* CGPA Metric */}
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>CGPA</Text>
          <Text style={[styles.metricValue, { color: '#0745E8' }]}>{cgpa.toFixed(2)}</Text>
        </View>

        <View style={styles.divider} />

        {/* Scheme Metric */}
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>SCHEME</Text>
          <Text style={styles.metricValue}>{scheme}</Text>
        </View>
      </View>

      {/* Bookmarks & In-App Downloads Quick Bar */}
      <View style={styles.quickBarRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.quickBadgeBtn}
          onPress={onPressBookmarks}
        >
          <View style={[styles.quickBadgeIcon, { backgroundColor: '#EEF2FF' }]}>
            <Feather name="bookmark" size={14} color="#0745E8" />
          </View>
          <View>
            <Text style={styles.quickBadgeVal}>{bookmarksCount}</Text>
            <Text style={styles.quickBadgeLabel}>Bookmarks</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.quickBarDivider} />

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.quickBadgeBtn}
          onPress={onPressDownloads}
        >
          <View style={[styles.quickBadgeIcon, { backgroundColor: '#ECFDF5' }]}>
            <Feather name="download-cloud" size={14} color="#059669" />
          </View>
          <View>
            <Text style={[styles.quickBadgeVal, { color: '#059669' }]}>{downloadsCount}</Text>
            <Text style={styles.quickBadgeLabel}>In-App Offline</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0745E8',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#CBD5E1',
  },
  quickBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  quickBadgeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quickBadgeIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBadgeVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0745E8',
  },
  quickBadgeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  quickBarDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
  },
});
