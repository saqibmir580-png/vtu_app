import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useCalendarStore } from '../store/useCalendarStore';
import { EventDetailsCard } from '../components/EventDetailsCard';
import { EventReminderButton } from '../components/EventReminderButton';
import { Header } from '@/shared/components/Header';

export const EventDetailScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { events, isLoading, fetchAcademicEvents } = useCalendarStore();

  useEffect(() => {
    if (events.length === 0) {
      fetchAcademicEvents();
    }
  }, [events.length, fetchAcademicEvents]);

  const event = events.find((e) => e.id === id) || (events.length > 0 ? events[0] : null);

  const handleShare = async () => {
    if (!event) return;
    try {
      await Share.share({
        message: `VTU Academic Event: ${event.title}\nDate: ${event.date}\nCategory: ${event.category}\nRef: ${event.vtuCircularRef || 'VTU Super App'}`,
      });
    } catch (err) {
      console.log(err);
    }
  };

  if (isLoading && !event) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor="#0745E8" />
        <Header title="Event Details" dark={true} showBack={true} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0745E8" />
          <Text style={styles.loadingText}>Loading event details...</Text>
        </View>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor="#0745E8" />
        <Header title="Event Details" dark={true} showBack={true} />
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconCircle}>
            <Feather name="calendar" size={32} color="#0745E8" />
          </View>
          <Text style={styles.emptyTitle}>Event Not Found</Text>
          <Text style={styles.emptySub}>
            This academic event is not currently scheduled or has been removed.
          </Text>
          <TouchableOpacity
            style={styles.backCalendarBtn}
            onPress={() => router.replace('/calendar' as any)}
          >
            <Feather name="arrow-left" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.backCalendarBtnText}>Open Academic Calendar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0745E8" />
      <Header
        title="Event Details"
        dark={true}
        showBack={true}
        rightElement={
          <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
            <Feather name="share-2" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Details Card */}
        <EventDetailsCard event={event} />

        {/* Reminder Config Component */}
        <EventReminderButton event={event} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  backCalendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0745E8',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  backCalendarBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
