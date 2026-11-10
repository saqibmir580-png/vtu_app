import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store';

interface SettingsSectionProps {
  onOpenEditProfile: () => void;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  onOpenEditProfile,
}) => {
  const router = useRouter();
  const { user, updateProfile, logout } = useAuthStore();

  const [notificationsOn, setNotificationsOn] = useState(
    user?.notificationsEnabled ?? true
  );

  const handleNotificationToggle = (val: boolean) => {
    setNotificationsOn(val);
    updateProfile({ notificationsEnabled: val });
  };

  const handleLogoutPrompt = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of your VTU account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Reset Password Link Sent',
      `A password reset link has been dispatched to ${user?.email || 'your email'}.`
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeaderTitle}>Account & App Preferences</Text>

      <View style={styles.menuGroup}>
        {/* Edit Profile */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.menuItem}
          onPress={onOpenEditProfile}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#EEF2FF' }]}>
            <Feather name="user" size={18} color="#0745E8" />
          </View>
          <View style={styles.menuTextGroup}>
            <Text style={styles.menuTitle}>Edit Academic Identity</Text>
            <Text style={styles.menuSub}>Update Name, USN, Branch & Scheme</Text>
          </View>
          <Feather name="chevron-right" size={18} color="#94A3B8" />
        </TouchableOpacity>

        {/* Offline Storage Hub */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.menuItem}
          onPress={() => router.push('/saved' as any)}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#D1FAE5' }]}>
            <Feather name="download-cloud" size={18} color="#059669" />
          </View>
          <View style={styles.menuTextGroup}>
            <Text style={styles.menuTitle}>Offline Downloads & Saved</Text>
            <Text style={styles.menuSub}>Manage storage, clear cache & bookmarks</Text>
          </View>
          <Feather name="chevron-right" size={18} color="#94A3B8" />
        </TouchableOpacity>

        {/* Exam Notifications Toggle */}
        <View style={styles.menuItem}>
          <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
            <Feather name="bell" size={18} color="#D97706" />
          </View>
          <View style={styles.menuTextGroup}>
            <Text style={styles.menuTitle}>VTU Exam & Circular Alerts</Text>
            <Text style={styles.menuSub}>Instant updates for timetables & tests</Text>
          </View>
          <Switch
            value={notificationsOn}
            onValueChange={handleNotificationToggle}
            trackColor={{ false: '#CBD5E1', true: '#0745E8' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Change Password */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.menuItem}
          onPress={handleChangePassword}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#F3E8FF' }]}>
            <Feather name="lock" size={18} color="#9333EA" />
          </View>
          <View style={styles.menuTextGroup}>
            <Text style={styles.menuTitle}>Security & Password</Text>
            <Text style={styles.menuSub}>Send password reset email</Text>
          </View>
          <Feather name="chevron-right" size={18} color="#94A3B8" />
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.menuItem, styles.logoutMenuItem]}
          onPress={handleLogoutPrompt}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#FEF2F2' }]}>
            <Feather name="log-out" size={18} color="#EF4444" />
          </View>
          <View style={styles.menuTextGroup}>
            <Text style={styles.logoutTitle}>Sign Out</Text>
            <Text style={styles.menuSub}>Safely disconnect session</Text>
          </View>
          <Feather name="chevron-right" size={18} color="#FCA5A5" />
        </TouchableOpacity>
      </View>

      {/* App Footprint Footer */}
      <View style={styles.appFooter}>
        <Text style={styles.appVersionText}>VTU Ultima v1.0.0</Text>
        <Text style={styles.appSubText}>VTU Ultima • Engineering Academic Suite</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  menuGroup: {
    gap: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  logoutMenuItem: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTextGroup: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  logoutTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EF4444',
  },
  menuSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  appFooter: {
    alignItems: 'center',
    marginTop: 28,
    paddingBottom: 20,
  },
  appVersionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  appSubText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
});
