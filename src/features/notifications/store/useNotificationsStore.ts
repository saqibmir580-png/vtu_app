import { create } from 'zustand';
import {
  VTUNotification,
  NotificationCategory,
  NotificationPreferencesState,
} from '../types/notifications.types';
import { MOCK_NOTIFICATIONS } from '../api/mockNotifications';
import { apiClient } from '@/infrastructure/api/client';

interface NotificationsStoreState {
  notifications: VTUNotification[];
  activeCategory: NotificationCategory | 'All';
  permissionGranted: boolean;
  activeInAppBanner: VTUNotification | null;
  preferences: NotificationPreferencesState;
  isLoading: boolean;

  // Actions
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  setActiveCategory: (cat: NotificationCategory | 'All') => void;
  togglePreference: (key: keyof NotificationPreferencesState) => void;
  setPermissionGranted: (granted: boolean) => void;
  showInAppBanner: (notification: VTUNotification) => void;
  dismissInAppBanner: () => void;
  getUnreadCount: () => number;
  getFilteredNotifications: () => VTUNotification[];
}

function mapCategory(rawCat?: string, rawType?: string): NotificationCategory {
  if (!rawCat && !rawType) return 'Academic';
  const val = (rawCat || rawType || '').toUpperCase();
  if (val.includes('EXAM')) return 'Exams';
  if (val.includes('RESULT')) return 'Results';
  if (val.includes('NOTE') || val.includes('PAPER') || val.includes('STUDY') || val.includes('PASSING')) return 'Study';
  if (val.includes('APP') || val.includes('SYSTEM')) return 'App';
  return 'Academic';
}

export const useNotificationsStore = create<NotificationsStoreState>((set, get) => ({
  notifications: MOCK_NOTIFICATIONS,
  activeCategory: 'All',
  permissionGranted: false,
  activeInAppBanner: null,
  isLoading: false,
  preferences: {
    examReminders: true,
    academicUpdates: true,
    resultUpdates: true,
    calendarUpdates: true,
    newNotes: true,
    newQuestionPapers: true,
    appUpdates: true,
    importantAnnouncements: true,
  },

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const res: any = await apiClient.get('/notifications');
      const body = res.data?.data || res.data || res;
      const rawItems = Array.isArray(body) ? body : body.items || body.data || [];

      if (Array.isArray(rawItems) && rawItems.length > 0) {
        const mapped: VTUNotification[] = rawItems.map((item: any) => ({
          id: item.id,
          title: item.title,
          shortMessage: item.shortMessage || item.body || '',
          fullMessage: item.fullMessage || item.body || '',
          category: mapCategory(item.category, item.type),
          priority: item.priority === 'High' ? 'High' : 'Normal',
          timestamp: item.timestamp || 'Just now',
          date: item.date || (item.createdAt ? item.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
          isRead: Boolean(item.isRead),
          targetRoute: item.targetRoute || item.actionUrl || undefined,
          targetLabel: item.targetLabel || (item.resourceType ? 'Open Resource' : undefined),
          relatedContext: item.resourceType
            ? {
                subjectCode: item.resourceId,
                circularRef: item.attachmentUrl,
              }
            : undefined,
        }));

        set({ notifications: mapped });
      }
    } catch (err) {
      console.warn('Could not fetch notifications from API, retaining cached state:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
    }));

    try {
      await apiClient.patch(`/notifications/${id}/read`);
    } catch (err) {
      // Ignore network error silently
    }
  },

  markAllAsRead: async () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
    }));

    try {
      await apiClient.post('/notifications/mark-all-read');
    } catch (err) {
      // Ignore network error silently
    }
  },

  setActiveCategory: (cat) => set({ activeCategory: cat }),

  togglePreference: (key) =>
    set((state) => ({
      preferences: {
        ...state.preferences,
        [key]: !state.preferences[key],
      },
    })),

  setPermissionGranted: (granted) => set({ permissionGranted: granted }),

  showInAppBanner: (notif) => set({ activeInAppBanner: notif }),

  dismissInAppBanner: () => set({ activeInAppBanner: null }),

  getUnreadCount: () => {
    return get().notifications.filter((n) => !n.isRead).length;
  },

  getFilteredNotifications: () => {
    const { notifications, activeCategory } = get();
    if (activeCategory === 'All') return notifications;
    return notifications.filter((n) => n.category === activeCategory);
  },
}));
