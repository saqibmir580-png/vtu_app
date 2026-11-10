import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useNotificationsStore } from '../store/useNotificationsStore';
import { NotificationPreferenceRow } from '../components/NotificationPreferenceRow';
import { Header } from '@/shared/components/Header';

export const NotificationPreferencesScreen: React.FC = () => {
  const { preferences, togglePreference } = useNotificationsStore();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0745E8" />
      <Header title="Push Preferences" dark={true} showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Academic & Examinations</Text>

          <NotificationPreferenceRow
            title="Exam & IA Reminders"
            description="Receive timely alerts before internal assessment tests and SEE theory exams."
            value={preferences.examReminders}
            onValueChange={() => togglePreference('examReminders')}
          />

          <NotificationPreferenceRow
            title="Academic Updates"
            description="Official VTU circulars, syllabus updates, and scheme notifications."
            value={preferences.academicUpdates}
            onValueChange={() => togglePreference('academicUpdates')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Study & Community</Text>

          <NotificationPreferenceRow
            title="Community Activity"
            description="Replies to your questions, upvotes on notes, and faculty answers."
            value={preferences.communityActivity}
            onValueChange={() => togglePreference('communityActivity')}
          />

          <NotificationPreferenceRow
            title="Low Attendance Warnings"
            description="Proactive warnings when attendance falls below 75% or 85% safe margin."
            value={preferences.attendanceAlerts}
            onValueChange={() => togglePreference('attendanceAlerts')}
          />

          <NotificationPreferenceRow
            title="Results & Revaluation"
            description="Instant push notifications when semester VTU results are announced."
            value={preferences.resultsAnnouncements}
            onValueChange={() => togglePreference('resultsAnnouncements')}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
});
