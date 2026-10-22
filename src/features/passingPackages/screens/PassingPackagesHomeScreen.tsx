import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/store';
import { usePassingPackageStore } from '../store/usePassingPackageStore';
import { PassingPackageHero } from '../components/PassingPackageHero';
import { PackageSubjectCard } from '../components/PackageSubjectCard';
import { PackageEmptyState } from '../components/PackageEmptyState';

export const PassingPackagesHomeScreen: React.FC = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const {
    activeBranch,
    activeSemester,
    activeScheme,
    getPackagesForCurrentStudent,
    loadPackagesFromBackend,
  } = usePassingPackageStore();

  const [refreshing, setRefreshing] = useState(false);

  React.useEffect(() => {
    loadPackagesFromBackend();
  }, [loadPackagesFromBackend]);

  const packages = getPackagesForCurrentStudent();

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadPackagesFromBackend();
    setRefreshing(false);
  }, [loadPackagesFromBackend]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0745E8" />
      
      {/* Top Header */}
      <View style={styles.topHeader}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.backBtn}
              onPress={() => router.back()}
            >
              <Feather name="arrow-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerTitleWrapper}>
              <Text style={styles.headerTitle}>Passing Packages</Text>
              <Text style={styles.headerSub}>Exam Focus & Revision Hub</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.headerIconBtn}
              onPress={() => router.push('/passing-packages/saved' as any)}
            >
              <Feather name="bookmark" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0745E8']} />
        }
      >
        {/* Hero Section */}
        <PassingPackageHero
          branch={activeBranch || user?.branch || 'CSE'}
          semester={activeSemester || user?.semester || 5}
          scheme={activeScheme || user?.scheme || '2022'}
          packagesCount={packages.length}
          onPressChangeBranch={() => router.push('/passing-packages/select' as any)}
          onPressNightBeforeMode={() => {
            if (packages.length > 0) {
              router.push(`/passing-packages/night-before/${packages[0].id}` as any);
            } else {
              router.push('/passing-packages/select' as any);
            }
          }}
        />

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Semester {activeSemester} Available Packages
            </Text>
            <Text style={styles.sectionSub}>
              Curated for VTU {activeBranch} • {activeScheme} Scheme
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.changeFilterBtn}
            onPress={() => router.push('/passing-packages/select' as any)}
          >
            <Feather name="sliders" size={14} color="#0745E8" />
            <Text style={styles.changeFilterText}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Packages List */}
        {packages.length === 0 ? (
          <PackageEmptyState
            onPressAction={() => router.push('/passing-packages/select' as any)}
            onPressSecondary={() => router.push('/passing-packages/empty' as any)}
          />
        ) : (
          <View style={styles.cardsList}>
            {packages.map((pkg) => (
              <PackageSubjectCard
                key={pkg.id}
                pkg={pkg}
                onPress={() => router.push(`/passing-packages/overview/${pkg.id}` as any)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    backgroundColor: '#0745E8',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrapper: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 1,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  changeFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  changeFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0745E8',
  },
  cardsList: {
    paddingHorizontal: 16,
  },
});
