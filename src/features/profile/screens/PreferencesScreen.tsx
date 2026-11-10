import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/store';
import { SectionHeader } from '../components/SectionHeader';
import { Header } from '@/shared/components/Header';
import { StatusBar } from 'react-native';

export const PreferencesScreen: React.FC = () => {
  const router = useRouter();
  const { user, updateProfile } = useAuthStore();

  const [pushNotifs, setPushNotifs] = useState(true);
  const [academicAlerts, setAcademicAlerts] = useState(user?.notificationsEnabled ?? true);
  const [dataDownloads, setDataDownloads] = useState(false);
  const [accessibility, setAccessibility] = useState(false);
  const [activeTheme, setActiveTheme] = useState<'Light' | 'Dark' | 'System'>('Light');

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0745E8" />
      <Header title="Preferences" dark={true} showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Section 1: Appearance */}
        <SectionHeader title="Appearance & Theme" />
        <View style={styles.cardGroup}>
          <View style={styles.themeSelectorRow}>
            {(['Light', 'Dark', 'System'] as const).map((t) => {
              const isSelected = activeTheme === t;
              return (
                <TouchableOpacity
                  key={t}
                  activeOpacity={0.8}
                  style={[styles.themeChip, isSelected && styles.themeChipActive]}
                  onPress={() => setActiveTheme(t)}
                >
                  <Text style={[styles.themeChipText, isSelected && styles.themeChipTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section 2: Notifications */}
        <SectionHeader title="Notification Settings" />
        <View style={styles.cardGroup}>
          {/* Push Notifications */}
          <View style={styles.toggleRow}>
            <View style={styles.textCol}>
              <Text style={styles.toggleTitle}>Push Notifications</Text>
              <Text style={styles.toggleSub}>Receive study reminders & app updates</Text>
            </View>
            <Switch
              value={pushNotifs}
              onValueChange={setPushNotifs}
              trackColor={{ false: '#CBD5E1', true: '#0745E8' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          {/* Academic Alerts */}
          <View style={styles.toggleRow}>
            <View style={styles.textCol}>
              <Text style={styles.toggleTitle}>Academic & Circular Alerts</Text>
              <Text style={styles.toggleSub}>VTU exam timetable release alerts</Text>
            </View>
            <Switch
              value={academicAlerts}
              onValueChange={(v) => {
                setAcademicAlerts(v);
                updateProfile({ notificationsEnabled: v });
              }}
              trackColor={{ false: '#CBD5E1', true: '#0745E8' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Section 3: Data & Offline */}
        <SectionHeader title="Data & Downloads" />
        <View style={styles.cardGroup}>
          <View style={styles.toggleRow}>
            <View style={styles.textCol}>
              <Text style={styles.toggleTitle}>Download on Mobile Data</Text>
              <Text style={styles.toggleSub}>Allow offline PDF downloads over cellular networks</Text>
            </View>
            <Switch
              value={dataDownloads}
              onValueChange={setDataDownloads}
              trackColor={{ false: '#CBD5E1', true: '#0745E8' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Section 4: Accessibility */}
        <SectionHeader title="Accessibility" />
        <View style={styles.cardGroup}>
          <View style={styles.toggleRow}>
            <View style={styles.textCol}>
              <Text style={styles.toggleTitle}>High Contrast Mode</Text>
              <Text style={styles.toggleSub}>Enhance text contrast for better readability</Text>
            </View>
            <Switch
              value={accessibility}
              onValueChange={setAccessibility}
              trackColor={{ false: '#CBD5E1', true: '#0745E8' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
  },
  cardGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  themeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  themeChipActive: {
    backgroundColor: '#0745E8',
    borderColor: '#0745E8',
  },
  themeChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  themeChipTextActive: {
    color: '#FFFFFF',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  textCol: {
    flex: 1,
    marginRight: 12,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  toggleSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
});
