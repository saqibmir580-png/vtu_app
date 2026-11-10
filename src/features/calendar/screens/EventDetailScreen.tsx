import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useCalendarStore } from '../store/useCalendarStore';
import { EventDetailsCard } from '../components/EventDetailsCard';
import { EventReminderButton } from '../components/EventReminderButton';
import { Header } from '@/shared/components/Header';

export const EventDetailScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();

  const events = useCalendarStore((state) => state.events);
  const event = events.find((e) => e.id === id) || events[0];

  if (!event) return null;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `VTU Academic Event: ${event.title}\nDate: ${event.date}\nCategory: ${event.category}\nRef: ${event.vtuCircularRef || 'VTU Super App'}`,
      });
    } catch (err) {
      console.log(err);
    }
  };

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
});
