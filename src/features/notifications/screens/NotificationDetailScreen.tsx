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
import { useNotificationsStore } from '../store/useNotificationsStore';
import { NotificationDetailsCard } from '../components/NotificationDetailsCard';
import { Header } from '@/shared/components/Header';

export const NotificationDetailScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const notifications = useNotificationsStore((state) => state.notifications);
  const notification = notifications.find((n) => n.id === id) || notifications[0];

  if (!notification) return null;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `VTU Update: ${notification.title}\n\n${notification.fullMessage || notification.shortMessage}\nCategory: ${notification.category}\nDate: ${notification.timestamp}`,
      });
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0745E8" />
      <Header
        title="Notification Details"
        dark={true}
        showBack={true}
        rightElement={
          <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
            <Feather name="share-2" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <NotificationDetailsCard notification={notification} />
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
