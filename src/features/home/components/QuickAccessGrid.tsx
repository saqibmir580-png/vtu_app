import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface QuickActionItem {
  id: string;
  label: string;
  route: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  bgColor: string;
}

const QUICK_ACTIONS: QuickActionItem[] = [
  {
    id: 'notes',
    label: 'Notes',
    route: '/(tabs)/library',
    icon: 'book-open',
    color: '#2563EB',
    bgColor: '#EFF6FF',
  },
  {
    id: 'papers',
    label: 'Papers',
    route: '/papers',
    icon: 'file-text',
    color: '#9333EA',
    bgColor: '#FAF5FF',
  },
  {
    id: 'packages',
    label: 'Passing',
    route: '/passing-packages',
    icon: 'zap',
    color: '#DC2626',
    bgColor: '#FEF2F2',
  },
  {
    id: 'videos',
    label: 'Videos',
    route: '/videos',
    icon: 'video',
    color: '#E11D48',
    bgColor: '#FFF1F2',
  },
  {
    id: 'calculators',
    label: 'Calculators',
    route: '/(tabs)/tools',
    icon: 'cpu',
    color: '#059669',
    bgColor: '#ECFDF5',
  },
  {
    id: 'calendar',
    label: 'Calendar',
    route: '/calendar',
    icon: 'calendar',
    color: '#0745E8',
    bgColor: '#EEF2FF',
  },
  {
    id: 'saved',
    label: 'Saved',
    route: '/saved',
    icon: 'bookmark',
    color: '#D97706',
    bgColor: '#FFFBEB',
  },
  {
    id: 'attendance',
    label: 'Attendance',
    route: '/calculators/attendance',
    icon: 'check-circle',
    color: '#0891B2',
    bgColor: '#ECFEFF',
  },
  {
    id: 'cgpa',
    label: 'CGPA',
    route: '/calculators/cgpa',
    icon: 'bar-chart-2',
    color: '#7C3AED',
    bgColor: '#F5F3FF',
  },
];

export const QuickAccessGrid: React.FC = () => {
  const router = useRouter();

  return (
    <View style={styles.outerContainer}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/library')}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal Scrollable Container */}
      <View style={styles.containerCard}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollList}
        >
          {QUICK_ACTIONS.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.75}
              style={styles.actionItem}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[styles.iconBox, { backgroundColor: item.bgColor }]}>
                <Feather name={item.icon} size={22} color={item.color} />
              </View>
              <Text style={styles.itemLabel} numberOfLines={1}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0745E8',
  },
  containerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  scrollList: {
    paddingHorizontal: 14,
    gap: 16,
    alignItems: 'center',
  },
  actionItem: {
    alignItems: 'center',
    width: 64,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  itemLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
});
