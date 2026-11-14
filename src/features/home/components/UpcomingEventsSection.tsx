import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AcademicEvent } from '../types/home.types';

interface UpcomingEventsSectionProps {
  events: AcademicEvent[];
}

export const UpcomingEventsSection: React.FC<UpcomingEventsSectionProps> = ({ events }) => {
  const router = useRouter();

  if (events.length === 0) return null;

  const getTypeStyle = (type: AcademicEvent['type']) => {
    switch (type) {
      case 'Internal Test':
        return { bg: '#EFF6FF', text: '#2563EB', icon: 'file-text' as const };
      case 'Lab Exam':
        return { bg: '#F3E8FF', text: '#9333EA', icon: 'cpu' as const };
      case 'Assignment':
        return { bg: '#FEF3C7', text: '#D97706', icon: 'edit-3' as const };
      default:
        return { bg: '#DCFCE7', text: '#16A34A', icon: 'calendar' as const };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/calendar/upcoming' as any)}
        >
          <Text style={styles.sectionTitle}>Upcoming Academic Events</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/calendar/upcoming' as any)}
        >
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.eventsList}>
        {events.map((event) => {
          const style = getTypeStyle(event.type);
          const handlePress = () => {
            if (event.targetRoute && !event.targetRoute.includes('/calculators/calendar')) {
              router.push(event.targetRoute as any);
            } else if (event.id) {
              router.push({
                pathname: '/calendar/detail',
                params: { id: event.id },
              } as any);
            } else {
              router.push('/calendar/upcoming' as any);
            }
          };

          return (
            <TouchableOpacity
              key={event.id}
              activeOpacity={0.8}
              style={styles.eventCard}
              onPress={handlePress}
            >
              <View style={[styles.iconBox, { backgroundColor: style.bg }]}>
                <Feather name={style.icon} size={20} color={style.text} />
              </View>

              <View style={styles.infoWrapper}>
                <View style={styles.typeBadgeRow}>
                  <View style={[styles.typeBadge, { backgroundColor: style.bg }]}>
                    <Text style={[styles.typeBadgeText, { color: style.text }]}>
                      {event.type}
                    </Text>
                  </View>
                  <Text style={styles.timeText}>{event.time}</Text>
                </View>
                <Text style={styles.subjectText}>{event.subject}</Text>
                <Text style={styles.dateText}>📅 {event.date} {event.venue ? `• ${event.venue}` : ''}</Text>
              </View>

              <Feather name="chevron-right" size={18} color="#94A3B8" />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0745E8',
  },
  eventsList: {
    gap: 12,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoWrapper: {
    flex: 1,
  },
  typeBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  subjectText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
  },
});
