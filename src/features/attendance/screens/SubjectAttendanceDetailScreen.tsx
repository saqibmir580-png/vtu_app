import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAttendanceStore, calculateStatus } from '../store/useAttendanceStore';
import { AttendanceProgress } from '../components/AttendanceProgress';
import { AttendanceStatusBadge } from '../components/AttendanceStatusBadge';
import { AttendanceInsightCard } from '../components/AttendanceInsightCard';
import { EditAttendanceModal } from './EditAttendanceModal';
import { ConfirmationBottomSheet } from '../components/ConfirmationBottomSheet';
import { Header } from '@/shared/components/Header';
import { StatusBar } from 'react-native';

export const SubjectAttendanceDetailScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { subjects, deleteSubject, setSelectedSubjectId } = useAttendanceStore();
  const subject = subjects.find((s) => s.id === id) || subjects[0];

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteSheetVisible, setDeleteSheetVisible] = useState(false);

  if (!subject) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor="#0745E8" />
        <Header title="Subject Attendance" dark={true} showBack={true} />
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' }}>
          <Feather name="alert-circle" size={42} color="#94A3B8" />
          <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A', marginTop: 12 }}>
            Subject Not Available
          </Text>
          <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 6, marginBottom: 20 }}>
            This subject attendance record is not found or has been removed.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: '#0745E8', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 }}
            onPress={() => router.back()}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Back to Attendance</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const percentage =
    subject.conductedClasses > 0
      ? (subject.attendedClasses / subject.conductedClasses) * 100
      : 0;
  const status = calculateStatus(percentage, subject.targetAttendance);
  const missedClasses = Math.max(0, subject.conductedClasses - subject.attendedClasses);

  const handleDelete = () => {
    deleteSubject(subject.id);
    router.back();
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0745E8" />
      <Header
        title={subject.subjectCode ? `${subject.subjectCode} Attendance` : 'Subject Attendance'}
        dark={true}
        showBack={true}
        rightElement={
          <TouchableOpacity
            onPress={() => setDeleteSheetVisible(true)}
            style={styles.deleteHeaderBtn}
          >
            <Feather name="trash-2" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Large Percentage Metric Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <Text style={styles.heroLabel}>CURRENT ATTENDANCE</Text>
            <AttendanceStatusBadge status={status} size="large" />
          </View>

          <Text style={styles.heroPercentText}>{percentage.toFixed(1)}%</Text>

          <AttendanceProgress
            percentage={percentage}
            target={subject.targetAttendance}
            height={10}
          />

          <View style={styles.heroSubRow}>
            <Text style={styles.heroSubText}>
              Target: <Text style={styles.bold}>{subject.targetAttendance}%</Text>
            </Text>
            <Text style={styles.heroSubText}>
              Requirement: <Text style={styles.bold}>{status === 'Safe' ? 'On Track' : 'Needs Action'}</Text>
            </Text>
          </View>
        </View>

        {/* 3 Metrics Cards Grid */}
        <View style={styles.gridRow}>
          {/* Attended */}
          <View style={[styles.gridTile, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
            <Feather name="check-circle" size={18} color="#059669" />
            <Text style={[styles.gridVal, { color: '#059669' }]}>{subject.attendedClasses}</Text>
            <Text style={styles.gridLabel}>Attended</Text>
          </View>

          {/* Conducted */}
          <View style={[styles.gridTile, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}>
            <Feather name="book-open" size={18} color="#0745E8" />
            <Text style={[styles.gridVal, { color: '#0745E8' }]}>{subject.conductedClasses}</Text>
            <Text style={styles.gridLabel}>Conducted</Text>
          </View>

          {/* Missed */}
          <View style={[styles.gridTile, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
            <Feather name="x-circle" size={18} color="#EF4444" />
            <Text style={[styles.gridVal, { color: '#EF4444' }]}>{missedClasses}</Text>
            <Text style={styles.gridLabel}>Missed</Text>
          </View>
        </View>

        {/* Smart Attendance Insight */}
        <AttendanceInsightCard subject={subject} />

        {/* Primary Action Buttons */}
        <View style={styles.actionsGroup}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.editBtn}
            onPress={() => setEditModalVisible(true)}
          >
            <Feather name="edit-2" size={18} color="#0745E8" />
            <Text style={styles.editBtnText}>Edit Attendance Counts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.calcBtn}
            onPress={() => {
              setSelectedSubjectId(subject.id);
              router.push('/calculators/attendance/calculator' as any);
            }}
          >
            <Feather name="cpu" size={18} color="#FFFFFF" />
            <Text style={styles.calcBtnText}>Calculate Goal Classes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Attendance Modal */}
      <EditAttendanceModal
        visible={editModalVisible}
        subject={subject}
        onClose={() => setEditModalVisible(false)}
      />

      {/* Delete Confirmation Sheet */}
      <ConfirmationBottomSheet
        visible={deleteSheetVisible}
        title="Delete Subject?"
        message={`Are you sure you want to remove ${subject.subjectCode} (${subject.subjectName}) from your attendance tracker?`}
        confirmLabel="Delete Subject"
        onConfirm={handleDelete}
        onClose={() => setDeleteSheetVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerSafeArea: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerCode: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0745E8',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  deleteHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  heroPercentText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -1,
    marginBottom: 12,
  },
  heroSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  heroSubText: {
    fontSize: 12,
    color: '#64748B',
  },
  bold: {
    fontWeight: '800',
    color: '#0F172A',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  gridTile: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  gridVal: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginTop: 2,
  },
  actionsGroup: {
    gap: 10,
  },
  editBtn: {
    height: 48,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0745E8',
  },
  calcBtn: {
    height: 48,
    borderRadius: 16,
    backgroundColor: '#0745E8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  calcBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
