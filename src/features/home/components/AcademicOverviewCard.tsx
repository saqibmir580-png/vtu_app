import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AcademicSummary } from '../types/home.types';

interface AcademicOverviewCardProps {
  summary: AcademicSummary;
}

export const AcademicOverviewCard: React.FC<AcademicOverviewCardProps> = ({ summary }) => {
  const router = useRouter();
  const isEligible = summary.attendancePercentage >= 75;

  return (
    <View style={styles.container}>
      {/* Compact Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Academic Overview</Text>
        <View style={styles.semBadge}>
          <Text style={styles.semBadgeText}>Sem {summary.currentSemester}</Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        {/* CGPA Metric Box */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.metricBox}
          onPress={() => router.push('/calculators/cgpa')}
        >
          <View style={styles.metricTopRow}>
            <View style={[styles.iconCircle, { backgroundColor: '#EEF2FF' }]}>
              <Feather name="bar-chart-2" size={15} color="#0745E8" />
            </View>
            <View style={styles.trendBadge}>
              <Feather name="trending-up" size={10} color="#16A34A" />
              <Text style={styles.trendText}>{summary.cgpaTrend}</Text>
            </View>
          </View>

          <View style={styles.metricBottomCol}>
            <Text style={styles.metricValue}>{summary.cgpa.toFixed(2)}</Text>
            <Text style={styles.metricLabel}>Current CGPA</Text>
          </View>
        </TouchableOpacity>

        {/* Attendance Metric Box */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.metricBox}
          onPress={() => router.push('/calculators/attendance')}
        >
          <View style={styles.metricTopRow}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: isEligible ? '#ECFDF5' : '#FEF2F2' },
              ]}
            >
              <Feather
                name={isEligible ? 'check-circle' : 'alert-circle'}
                size={15}
                color={isEligible ? '#16A34A' : '#EF4444'}
              />
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: isEligible ? '#DCFCE7' : '#FEE2E2' },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: isEligible ? '#16A34A' : '#EF4444' },
                ]}
              >
                {summary.attendanceStatus}
              </Text>
            </View>
          </View>

          <View style={styles.metricBottomCol}>
            <Text style={styles.metricValue}>{summary.attendancePercentage}%</Text>
            <Text style={styles.metricLabel}>Attendance</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginHorizontal: 20,
    marginBottom: 16,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    shadowColor: '#0745E8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  semBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  semBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0745E8',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderColor: '#F1F5F9',
    borderWidth: 1,
  },
  metricTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  metricBottomCol: {
    marginTop: 2,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 22,
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
});
