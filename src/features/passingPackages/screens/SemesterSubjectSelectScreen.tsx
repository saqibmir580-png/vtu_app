import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { usePassingPackageStore } from '../store/usePassingPackageStore';
import { BRANCH_LIST, SEMESTER_LIST, SCHEME_LIST } from '../api/mockPassingPackages';
import { PackageSubjectCard } from '../components/PackageSubjectCard';
import { Header } from '@/shared/components/Header';

export const SemesterSubjectSelectScreen: React.FC = () => {
  const router = useRouter();
  const {
    activeBranch,
    activeSemester,
    activeScheme,
    setActiveBranch,
    setActiveSemester,
    setActiveScheme,
    getPackagesForCurrentStudent,
  } = usePassingPackageStore();

  const [selectedBranch, setSelectedBranch] = useState(activeBranch);
  const [selectedSem, setSelectedSem] = useState(activeSemester);
  const [selectedScheme, setSelectedScheme] = useState(activeScheme);

  const packages = getPackagesForCurrentStudent();

  const handleApply = () => {
    setActiveBranch(selectedBranch);
    setActiveSemester(selectedSem);
    setActiveScheme(selectedScheme);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0745E8" />
      <Header title="Select Semester & Branch" dark={true} showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Branch Selection */}
        <Text style={styles.label}>Select Engineering Branch</Text>
        <View style={styles.branchesGrid}>
          {BRANCH_LIST.map((item) => {
            const isSelected = selectedBranch === item.code;
            return (
              <TouchableOpacity
                key={item.code}
                activeOpacity={0.8}
                style={[styles.branchTile, isSelected && styles.branchTileSelected]}
                onPress={() => setSelectedBranch(item.code)}
              >
                <Text style={[styles.branchCode, isSelected && styles.branchCodeSelected]}>
                  {item.code}
                </Text>
                <Text
                  style={[styles.branchName, isSelected && styles.branchNameSelected]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Semester Selection */}
        <Text style={styles.label}>Select Semester</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.semScroll}>
          {SEMESTER_LIST.map((sem) => {
            const isSelected = selectedSem === sem;
            return (
              <TouchableOpacity
                key={sem}
                activeOpacity={0.8}
                style={[styles.semChip, isSelected && styles.semChipSelected]}
                onPress={() => setSelectedSem(sem)}
              >
                <Text style={[styles.semText, isSelected && styles.semTextSelected]}>
                  Semester {sem}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Scheme Selection */}
        <Text style={styles.label}>VTU Scheme</Text>
        <View style={styles.schemeRow}>
          {SCHEME_LIST.map((sch) => {
            const code = sch.split(' ')[0];
            const isSelected = selectedScheme === code;
            return (
              <TouchableOpacity
                key={sch}
                activeOpacity={0.8}
                style={[styles.schemeChip, isSelected && styles.schemeChipSelected]}
                onPress={() => setSelectedScheme(code)}
              >
                <Text style={[styles.schemeText, isSelected && styles.schemeTextSelected]}>
                  {sch}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.applyBtn}
          onPress={handleApply}
        >
          <Feather name="check" size={18} color="#FFFFFF" />
          <Text style={styles.applyBtnText}>Apply Selection & Filter Packages</Text>
        </TouchableOpacity>

        {/* Results section */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            Packages for {activeBranch} • Sem {activeSemester}
          </Text>
          <Text style={styles.resultsCount}>{packages.length} Packages Found</Text>
        </View>

        {packages.length === 0 ? (
          <View style={styles.emptyCard}>
            <Feather name="info" size={24} color="#0745E8" />
            <Text style={styles.emptyTitle}>No packages for {selectedBranch} Sem {selectedSem}</Text>
            <Text style={styles.emptySub}>Try selecting 5th Semester CSE to view complete demo passing packages.</Text>
          </View>
        ) : (
          packages.map((pkg) => (
            <PackageSubjectCard
              key={pkg.id}
              pkg={pkg}
              onPress={() => router.push(`/passing-packages/overview/${pkg.id}` as any)}
            />
          ))
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollContent: {
    padding: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  branchesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  branchTile: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  branchTileSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#0745E8',
  },
  branchCode: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  branchCodeSelected: {
    color: '#0745E8',
  },
  branchName: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  branchNameSelected: {
    color: '#0745E8',
    fontWeight: '600',
  },
  semScroll: {
    gap: 8,
    marginBottom: 20,
  },
  semChip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  semChipSelected: {
    backgroundColor: '#0745E8',
    borderColor: '#0745E8',
  },
  semText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  semTextSelected: {
    color: '#FFFFFF',
  },
  schemeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  schemeChip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  schemeChipSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#0745E8',
  },
  schemeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  schemeTextSelected: {
    color: '#0745E8',
  },
  applyBtn: {
    backgroundColor: '#0745E8',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  resultsCount: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
});
