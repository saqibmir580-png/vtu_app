import { create } from 'zustand';
import { AcademicEvent, EventCategory, FilterState } from '../types/calendar.types';
import { MOCK_ACADEMIC_EVENTS } from '../api/mockEvents';
import { useAuthStore } from '@/store';
import { apiClient } from '@/infrastructure/api/client';

const mapBackendCategory = (backendCat?: string): EventCategory => {
  switch (backendCat) {
    case 'INTERNAL_EXAM':
    case 'Internals':
      return 'Internals';
    case 'THEORY_EXAM':
    case 'Exams':
      return 'Exams';
    case 'LAB_EXAM':
    case 'Lab Exams':
      return 'Lab Exams';
    case 'HOLIDAY':
    case 'Holidays':
      return 'Holidays';
    case 'RESULT_DECLARATION':
    case 'Results':
      return 'Results';
    case 'SEMESTER_START':
    case 'Semester Dates':
      return 'Semester Dates';
    default:
      return 'Other';
  }
};

const mapBackendToAcademicEvent = (item: any): AcademicEvent => {
  const semNum = item.semester === 'ALL' || !item.semester ? 0 : Number(item.semester) || 0;
  return {
    id: item.id || `evt-${Math.random()}`,
    title: item.title || 'Academic Event',
    category: mapBackendCategory(item.category),
    date: item.startDate ? item.startDate.split('T')[0] : '2026-10-20',
    time: item.time || '10:00 AM - 01:00 PM',
    semester: semNum,
    branch: item.branchId || 'ALL',
    scheme: item.schemeId || 'ALL',
    description: item.description || '',
    venue: item.venue || 'VTU Campus / Respective Colleges',
    isImportant: item.isImportant ?? true,
  };
};

interface CalendarStoreState {
  events: AcademicEvent[];
  isLoading: boolean;
  selectedDate: string; // "YYYY-MM-DD" e.g. "2026-09-16"
  activeMonthYear: { year: number; month: number }; // 0-indexed month (8 = Sep)
  activeCategory: EventCategory | 'All';
  remindersMap: Record<string, boolean>;

  // Actions
  fetchAcademicEvents: () => Promise<void>;
  setSelectedDate: (dateStr: string) => void;
  setMonthYear: (year: number, month: number) => void;
  setActiveCategory: (cat: EventCategory | 'All') => void;
  toggleReminder: (eventId: string) => void;
  getFilteredEvents: () => AcademicEvent[];
  getNextUpcomingEvent: () => AcademicEvent | null;
  getEventsForDate: (dateStr: string) => AcademicEvent[];
}

export const useCalendarStore = create<CalendarStoreState>((set, get) => ({
  events: MOCK_ACADEMIC_EVENTS,
  isLoading: false,
  selectedDate: '2026-09-16',
  activeMonthYear: { year: 2026, month: 8 }, // September 2026
  activeCategory: 'All',
  remindersMap: { 'evt-ia1': true },

  fetchAcademicEvents: async () => {
    set({ isLoading: true });
    try {
      const res: any = await apiClient.get('/academic/events');
      let rawList: any[] = [];
      const d = res.data !== undefined ? res.data : res;
      if (Array.isArray(d)) {
        rawList = d;
      } else if (d?.data && Array.isArray(d.data)) {
        rawList = d.data;
      } else if (d?.items && Array.isArray(d.items)) {
        rawList = d.items;
      }

      if (rawList && rawList.length > 0) {
        const mapped = rawList.map(mapBackendToAcademicEvent);
        set({ events: mapped, isLoading: false });
        return;
      }
      set({ isLoading: false });
    } catch (e) {
      // Keep mock events as graceful offline fallback
      set({ isLoading: false });
    }
  },

  setSelectedDate: (dateStr) => set({ selectedDate: dateStr }),

  setMonthYear: (year, month) => set({ activeMonthYear: { year, month } }),

  setActiveCategory: (cat) => set({ activeCategory: cat }),

  toggleReminder: (eventId) =>
    set((state) => ({
      remindersMap: {
        ...state.remindersMap,
        [eventId]: !state.remindersMap[eventId],
      },
    })),

  getFilteredEvents: () => {
    const { events, activeCategory } = get();
    const user = useAuthStore.getState().user;
    const userSem = user?.semester || 5;

    return events.filter((evt) => {
      const matchCategory = activeCategory === 'All' || evt.category === activeCategory;
      const matchSem = evt.semester === userSem || evt.semester === 0;
      return matchCategory && matchSem;
    });
  },

  getNextUpcomingEvent: () => {
    const { events } = get();
    const sorted = [...events].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const todayStr = new Date().toISOString().split('T')[0];
    return sorted.find((e) => e.date >= todayStr) || sorted[0];
  },

  getEventsForDate: (dateStr) => {
    const { events } = get();
    return events.filter((e) => e.date === dateStr);
  },
}));
