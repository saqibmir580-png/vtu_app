import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { usePassingPackageStore } from '../store/usePassingPackageStore';
import { UnitWeightageCard } from '../components/UnitWeightageCard';
import { Header } from '@/shared/components/Header';

export const UnitWeightageScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPackageById, getPackagesForCurrentStudent } = usePassingPackageStore();

  const pkg = getPackageById(id || '') || getPackagesForCurrentStudent()[0];

  if (!pkg) {
    return (
      <View style={styles.errorRoot}>
        <Text>Package Not Found</Text>
      </View>
    );
  }

  // Find top weightage unit
  const topUnit = [...pkg.unitsWeightage].sort(
    (a, b) => b.expectedMarks - a.expectedMarks
  )[0];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0745E8" />
      <Header title="Unit Weightage" dark={true} showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* High Yield Banner */}
        {topUnit && (
          <View style={styles.topYieldBanner}>
            <View style={styles.starCircle}>
              <Feather name="star" size={18} color="#7C3AED" />
            </View>
            <View style={styles.topYieldTextWrapper}>
              <Text style={styles.topYieldLabel}>HIGHEST WEIGHTAGE UNIT</Text>
              <Text style={styles.topYieldTitle}>Unit {topUnit.unitNumber}: {topUnit.unitTitle}</Text>
              <Text style={styles.topYieldSub}>
                Carries {topUnit.expectedMarks} Marks ({topUnit.percentageWeightage}% of total paper)
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionHeader}>Unit-wise Expected Marks Breakdown</Text>
        <Text style={styles.sectionSub}>
          Visualized weightage distribution for all 5 syllabus modules (100 Marks scale).
        </Text>

        {/* Units Cards */}
        {pkg.unitsWeightage.map((unit) => (
          <UnitWeightageCard
            key={unit.unitNumber}
            unit={unit}
            onPressUnit={(unitNum) =>
              router.push({
                pathname: `/passing-packages/important-questions/${pkg.id}`,
                params: { unit: unitNum },
              } as any)
            }
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  errorRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeTop: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
  },
  topYieldBanner: {
    backgroundColor: '#F3E8FF',
    borderColor: '#DDD6FE',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  starCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topYieldTextWrapper: {
    flex: 1,
  },
  topYieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7C3AED',
    letterSpacing: 0.5,
  },
  topYieldTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4C1D95',
    marginVertical: 2,
  },
  topYieldSub: {
    fontSize: 12,
    color: '#6D28D9',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },
});
