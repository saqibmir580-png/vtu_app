import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Container, Button, Card } from '@/shared/components';
import { colors } from '@/core/theme';
import { useAuthStore } from '@/store';
import { storageService } from '@/infrastructure/storage/storage.service';
import {
  fetchAcademicSchemes,
  fetchEngineeringBranches,
  fetchAcademicSemesters,
  fetchVTUColleges,
  updateStudentProfileApiFunction,
  AcademicScheme,
  EngineeringBranch,
  SemesterMaster,
  VTUCollege,
} from '../apifunction/apiFunction';

export const ProfileSetupScreen: React.FC = () => {
  const router = useRouter();
  const { user, updateProfile } = useAuthStore();
  const [saving, setSaving] = useState(false);

  const [usn, setUsn] = useState('');
  const [selectedCollege, setSelectedCollege] = useState<string>('');
  const [selectedScheme, setSelectedScheme] = useState<string>('2022');
  const [selectedBranch, setSelectedBranch] = useState<string>('CSE');
  const [selectedSemester, setSelectedSemester] = useState<number>(5);
  const [targetCgpa, setTargetCgpa] = useState('8.5');

  // Master Data Lists from Backend API
  const [schemes, setSchemes] = useState<AcademicScheme[]>([]);
  const [branches, setBranches] = useState<EngineeringBranch[]>([]);
  const [semesters, setSemesters] = useState<SemesterMaster[]>([]);
  const [colleges, setColleges] = useState<VTUCollege[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadMasters = async () => {
      setLoading(true);
      try {
        const [schData, brData, semData, colData] = await Promise.all([
          fetchAcademicSchemes(),
          fetchEngineeringBranches(),
          fetchAcademicSemesters(),
          fetchVTUColleges(),
        ]);
        if (isMounted) {
          setSchemes(schData);
          setBranches(brData);
          setSemesters(semData);
          setColleges(colData);
          if (schData.length > 0) setSelectedScheme(schData[0].schemeYear);
          if (brData.length > 0) setSelectedBranch(brData[0].code);
          if (colData.length > 0) setSelectedCollege(colData[0].code);
        }
      } catch (err) {
        console.log('Error loading academic masters:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadMasters();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    const cleanedUsn = usn.trim().toUpperCase() || '1RV21CS001';
    const parsedTargetCgpa = parseFloat(targetCgpa) || 8.5;

    try {
      await updateStudentProfileApiFunction({
        usn: cleanedUsn,
        collegeCode: selectedCollege,
        branchCode: selectedBranch,
        schemeYear: selectedScheme,
        semester: selectedSemester,
        targetCgpa: parsedTargetCgpa,
      });
    } catch (apiErr) {
      console.warn('[ProfileSetupScreen] Backend sync note:', apiErr);
    }

    const updatedProfileFields = {
      usn: cleanedUsn,
      college: selectedCollege,
      collegeCode: selectedCollege,
      branch: selectedBranch,
      branchCode: selectedBranch,
      scheme: selectedScheme,
      schemeYear: selectedScheme,
      semester: selectedSemester,
      targetCgpa: parsedTargetCgpa,
      isOnboarded: true,
    };

    updateProfile(updatedProfileFields);
    await storageService.setItem('vtu_onboarded', true);
    setSaving(false);
    router.replace('/(tabs)/home');
  };

  return (
    <Container safe={false} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.badge}>STEP 2 OF 2</Text>
          <Text style={styles.title}>Academic Profile Setup</Text>
          <Text style={styles.subtitle}>
            Select your registered VTU college, scheme, branch, and semester connected live to VTU academic masters.
          </Text>
        </View>

        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.loadingText}>Syncing live VTU academic masters...</Text>
          </View>
        ) : (
          <>
            {/* 1. USN & College Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. University Seat No. & College</Text>
              <Card style={styles.inputCard}>
                <Text style={styles.inputLabel}>University Seat Number (USN)</Text>
                <TextInput
                  style={styles.input}
                  value={usn}
                  onChangeText={setUsn}
                  placeholder="e.g. 1RV21CS001"
                  placeholderTextColor={colors.text.darkSecondary}
                  autoCapitalize="characters"
                />
              </Card>

              <Text style={[styles.inputLabel, { marginTop: 14, marginBottom: 8 }]}>Select VTU College</Text>
              <View style={styles.optionsGrid}>
                {colleges.map((col) => (
                  <TouchableOpacity
                    key={col.id}
                    style={[
                      styles.chip,
                      selectedCollege === col.code && styles.activeChip,
                    ]}
                    onPress={() => setSelectedCollege(col.code)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selectedCollege === col.code && styles.activeChipText,
                      ]}
                    >
                      {col.code} - {col.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 2. VTU Scheme Selector */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. Select VTU Scheme</Text>
              <View style={styles.optionsGrid}>
                {schemes.map((scheme) => (
                  <TouchableOpacity
                    key={scheme.id}
                    style={[
                      styles.chip,
                      selectedScheme === scheme.schemeYear && styles.activeChip,
                    ]}
                    onPress={() => setSelectedScheme(scheme.schemeYear)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selectedScheme === scheme.schemeYear && styles.activeChipText,
                      ]}
                    >
                      {scheme.name || `${scheme.schemeYear} Scheme`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 3. Branch Selector */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. Select Engineering Branch</Text>
              <View style={styles.optionsGrid}>
                {branches.map((branch) => (
                  <TouchableOpacity
                    key={branch.id}
                    style={[
                      styles.chip,
                      selectedBranch === branch.code && styles.activeChip,
                    ]}
                    onPress={() => setSelectedBranch(branch.code)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selectedBranch === branch.code && styles.activeChipText,
                      ]}
                    >
                      {branch.code} ({branch.name})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 4. Semester Selector */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>4. Current Semester</Text>
              <View style={styles.semGrid}>
                {semesters.map((sem) => (
                  <TouchableOpacity
                    key={sem.id}
                    style={[
                      styles.semCircle,
                      selectedSemester === sem.number && styles.activeSemCircle,
                    ]}
                    onPress={() => setSelectedSemester(sem.number)}
                  >
                    <Text
                      style={[
                        styles.semText,
                        selectedSemester === sem.number && styles.activeSemText,
                      ]}
                    >
                      Sem {sem.number}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 5. Target CGPA Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>5. Target CGPA Goal</Text>
              <Card style={styles.inputCard}>
                <Text style={styles.inputLabel}>Target CGPA (e.g. 9.0)</Text>
                <TextInput
                  style={styles.input}
                  value={targetCgpa}
                  onChangeText={setTargetCgpa}
                  keyboardType="decimal-pad"
                  placeholder="8.5"
                  placeholderTextColor={colors.text.darkSecondary}
                />
              </Card>
            </View>

            <Button
              title={saving ? 'Saving Profile...' : 'Save Profile & Launch App'}
              onPress={handleSaveProfile}
              loading={saving}
              disabled={saving}
              style={styles.submitBtn}
            />
          </>
        )}
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 56,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 24,
  },
  badge: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary[400],
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text.darkPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.darkSecondary,
    lineHeight: 22,
  },
  loaderBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: colors.text.darkSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.darkPrimary,
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    backgroundColor: colors.background.darkCard,
    borderColor: colors.background.darkCardBorder,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  activeChip: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  chipText: {
    fontSize: 13,
    color: colors.text.darkPrimary,
    fontWeight: '600',
  },
  activeChipText: {
    color: '#FFFFFF',
  },
  semGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  semCircle: {
    width: '22%',
    paddingVertical: 12,
    backgroundColor: colors.background.darkCard,
    borderColor: colors.background.darkCardBorder,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
  },
  activeSemCircle: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  semText: {
    fontSize: 13,
    color: colors.text.darkPrimary,
    fontWeight: '700',
  },
  activeSemText: {
    color: '#FFFFFF',
  },
  inputCard: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    color: colors.text.darkSecondary,
  },
  input: {
    backgroundColor: colors.background.dark,
    borderColor: colors.background.darkCardBorder,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    color: colors.text.darkPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  submitBtn: {
    marginTop: 12,
  },
});
