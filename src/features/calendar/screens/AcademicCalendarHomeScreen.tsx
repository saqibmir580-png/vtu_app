import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useCalendarStore } from '../store/useCalendarStore';
import { AcademicCalendarHeader } from '../components/AcademicCalendarHeader';
import { NextEventHero } from '../components/NextEventHero';
import { MonthNavigator } from '../components/MonthNavigator';
import { CalendarGrid } from '../components/CalendarGrid';
import { CalendarLegend } from '../components/CalendarLegend';
import { EventTypeChip } from '../components/EventTypeChip';
import { UpcomingEventCard } from '../components/UpcomingEventCard';
import { CalendarFilterSheet } from '../components/CalendarFilterSheet';
import { EventReminderButton } from '../components/EventReminderButton';
import { AcademicEvent, EventCategory } from '../types/calendar.types';

const CATEGORIES: Array<EventCategory | 'All'> = [
  'All',
  'Internals',
  'Exams',
  'Lab Exams',
  'Holidays',
  'Results',
];

export const AcademicCalendarHomeScreen: React.FC = () => {
  const router = useRouter();
  const {
    selectedDate,
    activeMonthYear,
    activeCategory,
    setSelectedDate,
    setMonthYear,
    setActiveCategory,
    getFilteredEvents,
    getNextUpcomingEvent,
    fetchAcademicEvents,
  } = useCalendarStore();

  const [filterSheetVisible, setFilterSheetVisible] = useState(false);

  useEffect(() => {
    fetchAcademicEvents();
  }, []);

  const nextEvent = getNextUpcomingEvent();
  const filteredEvents = getFilteredEvents();

  const handlePrevMonth = () => {
    if (activeMonthYear.month === 0) {
      setMonthYear(activeMonthYear.year - 1, 11);
    } else {
      setMonthYear(activeMonthYear.year, activeMonthYear.month - 1);
    }
  };

  const handleNextMonth = () => {
    if (activeMonthYear.month === 11) {
      setMonthYear(activeMonthYear.year + 1, 0);
    } else {
      setMonthYear(activeMonthYear.year, activeMonthYear.month + 1);
    }
  };

  const handleEventPress = (evt: AcademicEvent) => {
    router.push({
      pathname: '/calendar/detail',
      params: { id: evt.id },
    } as any);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <AcademicCalendarHeader
        title="Academic Calendar"
        onFilterPress={() => setFilterSheetVisible(true)}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Next Event Hero Card */}
        {nextEvent && (
          <NextEventHero
            event={nextEvent}
            onPress={handleEventPress}
            onReminderPress={handleEventPress}
          />
        )}

        {/* Timeline Banner Link */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.timelineBanner}
          onPress={() => router.push('/calendar/timeline' as any)}
        >
          <View style={styles.timelineIconBox}>
            <Feather name="git-commit" size={20} color="#0745E8" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.timelineTitle}>View Academic Timeline</Text>
            <Text style={styles.timelineSub}>
              Track 5th Semester roadmap from start to SEE Exams
            </Text>
          </View>

          <Feather name="chevron-right" size={18} color="#0745E8" />
        </TouchableOpacity>

        {/* Month Calendar Section */}
        <View style={styles.monthHeaderRow}>
          <MonthNavigator
            year={activeMonthYear.year}
            month={activeMonthYear.month}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onTodayPress={() => {
              setMonthYear(2026, 8);
              setSelectedDate('2026-09-16');
            }}
          />
          <TouchableOpacity onPress={() => router.push('/calendar/month' as any)}>
            <Text style={styles.fullMonthLink}>Full Screen</Text>
          </TouchableOpacity>
        </View>

        <CalendarGrid
          year={activeMonthYear.year}
          month={activeMonthYear.month}
          selectedDate={selectedDate}
          events={filteredEvents}
          onSelectDate={setSelectedDate}
        />

        <CalendarLegend />

        {/* Category Filter Chips */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Event Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {CATEGORIES.map((cat) => (
              <EventTypeChip
                key={cat}
                category={cat}
                selected={activeCategory === cat}
                onPress={() => setActiveCategory(cat)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Upcoming Events Feed */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Upcoming Events ({filteredEvents.length})</Text>
          <TouchableOpacity onPress={() => router.push('/calendar/upcoming' as any)}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {filteredEvents.map((evt) => (
          <UpcomingEventCard key={evt.id} event={evt} onPress={handleEventPress} />
        ))}
      </ScrollView>

      {/* Filter Bottom Sheet */}
      <CalendarFilterSheet
        visible={filterSheetVisible}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        onClose={() => setFilterSheetVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  timelineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    marginBottom: 20,
  },
  timelineIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  timelineSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fullMonthLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0745E8',
    marginBottom: 10,
  },
  filterSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  chipsRow: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0745E8',
  },
});
