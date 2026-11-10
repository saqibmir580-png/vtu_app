import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useCalendarStore } from '../store/useCalendarStore';
import { MonthNavigator } from '../components/MonthNavigator';
import { CalendarGrid } from '../components/CalendarGrid';
import { CalendarLegend } from '../components/CalendarLegend';
import { UpcomingEventCard } from '../components/UpcomingEventCard';
import { CalendarFilterSheet } from '../components/CalendarFilterSheet';
import { Header } from '@/shared/components/Header';
import { AcademicEvent } from '../types/calendar.types';

export const FullMonthCalendarScreen: React.FC = () => {
  const router = useRouter();
  const {
    selectedDate,
    activeMonthYear,
    activeCategory,
    setSelectedDate,
    setMonthYear,
    setActiveCategory,
    getFilteredEvents,
    getEventsForDate,
  } = useCalendarStore();

  const [filterSheetVisible, setFilterSheetVisible] = useState(false);

  const filteredEvents = getFilteredEvents();
  const selectedDayEvents = getEventsForDate(selectedDate);

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
      <StatusBar barStyle="light-content" backgroundColor="#0745E8" />
      <Header
        title="Full Month Calendar"
        dark={true}
        showBack={true}
        rightElement={
          <TouchableOpacity
            onPress={() => setFilterSheetVisible(true)}
            style={styles.filterBtn}
          >
            <Feather name="sliders" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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

        <CalendarGrid
          year={activeMonthYear.year}
          month={activeMonthYear.month}
          selectedDate={selectedDate}
          events={filteredEvents}
          onSelectDate={setSelectedDate}
        />

        <CalendarLegend />

        {/* Selected Date Events Breakdown Sheet */}
        <View style={styles.selectedBreakdownBox}>
          <View style={styles.selectedHeaderRow}>
            <Text style={styles.selectedTitle}>Events on {selectedDate}</Text>
            <Text style={styles.selectedCount}>
              {selectedDayEvents.length} {selectedDayEvents.length === 1 ? 'Event' : 'Events'}
            </Text>
          </View>

          {selectedDayEvents.length === 0 ? (
            <View style={styles.emptyDayBox}>
              <Feather name="calendar" size={24} color="#94A3B8" />
              <Text style={styles.emptyDayText}>No events scheduled on this date.</Text>
            </View>
          ) : (
            selectedDayEvents.map((evt) => (
              <UpcomingEventCard key={evt.id} event={evt} onPress={handleEventPress} />
            ))
          )}
        </View>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  selectedBreakdownBox: {
    marginTop: 8,
  },
  selectedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  selectedTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  selectedCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0745E8',
  },
  emptyDayBox: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyDayText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 6,
  },
});
