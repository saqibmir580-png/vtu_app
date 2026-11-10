import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAttendanceStore } from '../store/useAttendanceStore';
import { AttendanceHistoryItem } from '../components/AttendanceHistoryItem';
import { Header } from '@/shared/components/Header';

export const AttendanceHistoryScreen: React.FC = () => {
  const historyLogs = useAttendanceStore((state) => state.historyLogs);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0745E8" />
      <Header title="Attendance History" dark={true} showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {historyLogs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="clock" size={32} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Activity Logs Yet</Text>
            <Text style={styles.emptySub}>
              Attendance updates, attended lectures, and missed classes will appear here.
            </Text>
          </View>
        ) : (
          historyLogs.map((log) => <AttendanceHistoryItem key={log.id} item={log} />)
        )}
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
    paddingBottom: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});
