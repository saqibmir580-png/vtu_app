import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useCalendarStore } from '../store/useCalendarStore';
import { EventTypeChip } from '../components/EventTypeChip';
import { UpcomingEventCard } from '../components/UpcomingEventCard';
import { CalendarFilterSheet } from '../components/CalendarFilterSheet';
import { EmptyState } from '../components/EmptyState';
import { AcademicEvent, EventCategory } from '../types/calendar.types';
import { Header } from '@/shared/components/Header';
import { StatusBar } from 'react-native';

const CATEGORIES: Array<EventCategory | 'All'> = [
  'All',
  'Internals',
  'Exams',
  'Lab Exams',
  'Holidays',
  'Results',
];

export const UpcomingEventsScreen: React.FC = () => {
  const router = useRouter();
  const {
    activeCategory,
    setActiveCategory,
    getFilteredEvents,
  } = useCalendarStore();

  const [search, setSearch] = useState('');
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);

  const filteredEvents = getFilteredEvents().filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase()) ||
      (e.vtuCircularRef && e.vtuCircularRef.toLowerCase().includes(search.toLowerCase()))
  );

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
        title="Upcoming Events"
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
        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color="#64748B" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events, exams, VTU circulars..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x-circle" size={16} color="#64748B" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Horizontal Category Chips */}
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

        {/* Events Feed or Empty State */}
        {filteredEvents.length === 0 ? (
          <EmptyState
            title="No Matching Events"
            subTitle="No events match your current search criteria or category filter."
          />
        ) : (
          filteredEvents.map((evt) => (
            <UpcomingEventCard key={evt.id} event={evt} onPress={handleEventPress} />
          ))
        )}
      </ScrollView>

      {/* Category Filter Sheet */}
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  chipsRow: {
    gap: 8,
    marginBottom: 16,
  },
});
