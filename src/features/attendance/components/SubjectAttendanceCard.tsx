import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SubjectAttendance } from '../types/attendance.types';
import { AttendanceProgress } from './AttendanceProgress';
import { AttendanceStatusBadge } from './AttendanceStatusBadge';
import { calculateStatus, useAttendanceStore } from '../store/useAttendanceStore';

interface SubjectAttendanceCardProps {
  subject: SubjectAttendance;
  onPress: (subject: SubjectAttendance) => void;
}

export const SubjectAttendanceCard: React.FC<SubjectAttendanceCardProps> = ({
  subject,
  onPress,
}) => {
  const percentage =
    subject.conductedClasses > 0
      ? (subject.attendedClasses / subject.conductedClasses) * 100
      : 0;
  const status = calculateStatus(percentage, subject.targetAttendance);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.card}
      onPress={() => onPress(subject)}
    >
      <View style={styles.topRow}>
        <View style={styles.iconSubjectRow}>
          <View style={[styles.iconBox, { backgroundColor: subject.iconBg || '#EEF2FF' }]}>
            <Feather
              name={(subject.iconName as any) || 'book'}
              size={18}
              color="#0745E8"
            />
          </View>
          <View style={styles.nameCol}>
            <Text style={styles.subjectCode}>{subject.subjectCode}</Text>
            <Text style={styles.subjectName} numberOfLines={1}>
              {subject.subjectName}
            </Text>
          </View>
        </View>

        <AttendanceStatusBadge status={status} size="small" />
      </View>

      {/* Progress & Percent Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.percentTextRow}>
          <Text style={styles.percentText}>{percentage.toFixed(1)}%</Text>
          <Text style={styles.classesText}>
            {subject.attendedClasses} / {subject.conductedClasses} Attended
          </Text>
        </View>

        <AttendanceProgress
          percentage={percentage}
          target={subject.targetAttendance}
          height={6}
        />
      </View>

      {/* Quick Action Steppers */}
      <View style={styles.quickActionRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.quickPresentBtn}
          onPress={() =>
            useAttendanceStore
              .getState()
              .updateAttendance(subject.id, subject.attendedClasses + 1, subject.conductedClasses + 1)
          }
        >
          <Feather name="check" size={14} color="#16A34A" />
          <Text style={styles.quickPresentText}>+1 Present</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.quickMissedBtn}
          onPress={() =>
            useAttendanceStore
              .getState()
              .updateAttendance(subject.id, subject.attendedClasses, subject.conductedClasses + 1)
          }
        >
          <Feather name="x" size={14} color="#DC2626" />
          <Text style={styles.quickMissedText}>+1 Missed</Text>
        </TouchableOpacity>

        <View style={styles.chevronWrapper}>
          <Text style={styles.detailsText}>Analytics</Text>
          <Feather name="chevron-right" size={16} color="#0745E8" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconSubjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameCol: {
    flex: 1,
  },
  subjectCode: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0745E8',
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  progressContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  percentTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  percentText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  classesText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 8,
  },
  quickPresentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  quickPresentText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#16A34A',
  },
  quickMissedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  quickMissedText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },
  targetInfo: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  chevronWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 'auto',
  },
  detailsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0745E8',
  },
});
