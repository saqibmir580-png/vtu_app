import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useNotificationsStore } from '../store/useNotificationsStore';
import { NotificationCategoryChip } from '../components/NotificationCategoryChip';
import { NotificationCard } from '../components/NotificationCard';
import { MarkAllReadButton } from '../components/MarkAllReadButton';
import { NotificationFilterSheet } from '../components/NotificationFilterSheet';
import { NotificationPermissionCard } from '../components/NotificationPermissionCard';
import { NotificationEmptyState } from '../components/NotificationEmptyState';
import { UnreadBadge } from '../components/UnreadBadge';
import { NotificationCategory, VTUNotification } from '../types/notifications.types';

const CATEGORIES: Array<NotificationCategory | 'All'> = [
  'All',
  'Academic',
  'Exams',
  'Results',
  'Study',
  'App',
];

export const NotificationCenterScreen: React.FC = () => {
  const router = useRouter();
  const {
    activeCategory,
    setActiveCategory,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    getFilteredNotifications,
    fetchNotifications,
    isLoading,
  } = useNotificationsStore();

  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  const unreadCount = getUnreadCount();
  const filteredNotifs = getFilteredNotifications();

  // Dynamic Today check
  const todayStr = new Date().toISOString().split('T')[0];
  const todayNotifs = filteredNotifs.filter((n) => n.date === todayStr);
  const earlierNotifs = filteredNotifs.filter((n) => n.date !== todayStr);

  const handleNotificationPress = (notif: VTUNotification) => {
    markAsRead(notif.id);
    router.push({
      pathname: '/notifications/detail',
      params: { id: notif.id },
    } as any);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.headerTitleGroup}>
            <View style={styles.titleWithBadge}>
              <Text style={styles.headerTitle}>Notifications</Text>
              <UnreadBadge count={unreadCount} />
            </View>
            <Text style={styles.headerSub}>VTU Academic Updates & Reminders</Text>
          </View>

          <View style={styles.headerActions}>
            <MarkAllReadButton onPress={markAllAsRead} disabled={unreadCount === 0} />
            <TouchableOpacity
              onPress={() => setFilterSheetVisible(true)}
              style={styles.filterBtn}
            >
              <Feather name="sliders" size={18} color="#0745E8" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0745E8']} />
        }
      >
        {/* Permission Callout Banner */}
        <NotificationPermissionCard />

        {/* Category Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {CATEGORIES.map((cat) => (
            <NotificationCategoryChip
              key={cat}
              category={cat}
              selected={activeCategory === cat}
              onPress={() => setActiveCategory(cat)}
            />
          ))}
        </ScrollView>

        {filteredNotifs.length === 0 ? (
          <NotificationEmptyState />
        ) : (
          <>
            {/* Today Section */}
            {todayNotifs.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>Today</Text>
                {todayNotifs.map((n) => (
                  <NotificationCard
                    key={n.id}
                    notification={n}
                    onPress={handleNotificationPress}
                  />
                ))}
              </View>
            )}

            {/* Earlier Section */}
            {earlierNotifs.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>
                  {todayNotifs.length > 0 ? 'Earlier' : 'Recent Announcements'}
                </Text>
                {earlierNotifs.map((n) => (
                  <NotificationCard
                    key={n.id}
                    notification={n}
                    onPress={handleNotificationPress}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Filter Bottom Sheet */}
      <NotificationFilterSheet
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
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  chipsRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 4,
  },
});
