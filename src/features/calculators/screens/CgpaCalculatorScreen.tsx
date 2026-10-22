import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAcademicRecordStore } from '../store/useAcademicRecordStore';
import { useAuthStore } from '@/store';

export const CgpaCalculatorScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    semesters,
    currentCgpa,
    totalCreditsEarned,
    updateSemesterSgpa,
    setDirectCgpa,
    saveToStudentProfile,
    loadAcademicRecords,
  } = useAcademicRecordStore();

  const [calcMode, setCalcMode] = useState<'SEMESTER' | 'DIRECT'>('SEMESTER');
  const [directInput, setDirectInput] = useState<string>(
    currentCgpa ? currentCgpa.toFixed(2) : '8.74'
  );
  const [savedToastVisible, setSavedToastVisible] = useState(false);

  useEffect(() => {
    loadAcademicRecords();
  }, []);

  useEffect(() => {
    if (currentCgpa) {
      setDirectInput(currentCgpa.toFixed(2));
    }
  }, [currentCgpa]);

  const equivalentPercentage =
    currentCgpa > 0.75 ? Math.min(100, (currentCgpa - 0.75) * 10).toFixed(2) : '0.00';

  const getClassification = (cgpa: number) => {
    if (cgpa >= 7.75) {
      return { label: 'First Class with Distinction (FCD)', color: '#16A34A', bg: '#DCFCE7' };
    }
    if (cgpa >= 6.75) {
      return { label: 'First Class (FC)', color: '#0284C7', bg: '#E0F2FE' };
    }
    if (cgpa >= 5.75) {
      return { label: 'Second Class (SC)', color: '#D97706', bg: '#FEF3C7' };
    }
    if (cgpa >= 5.00) {
      return { label: 'Pass Class', color: '#475569', bg: '#F1F5F9' };
    }
    return { label: 'Below Passing Grade', color: '#DC2626', bg: '#FEE2E2' };
  };

  const classification = getClassification(currentCgpa);

  const handleSgpaChange = (semesterNum: number, text: string) => {
    const val = parseFloat(text);
    if (isNaN(val)) {
      updateSemesterSgpa(semesterNum, 0, undefined, false);
    } else {
      const sanitized = Math.min(10, Math.max(0, val));
      updateSemesterSgpa(semesterNum, sanitized, undefined, true);
    }
  };

  const handleCreditsChange = (semesterNum: number, text: string) => {
    const credits = parseInt(text, 10);
    const existing = semesters.find((s) => s.semester === semesterNum);
    if (existing && !isNaN(credits)) {
      updateSemesterSgpa(semesterNum, existing.sgpa, Math.max(1, credits), existing.isCompleted);
    }
  };

  const toggleSemesterCompleted = (semesterNum: number) => {
    const sem = semesters.find((s) => s.semester === semesterNum);
    if (sem) {
      updateSemesterSgpa(semesterNum, sem.sgpa, sem.credits, !sem.isCompleted);
    }
  };

  const handleSaveDirect = () => {
    const parsed = parseFloat(directInput);
    if (isNaN(parsed) || parsed < 0 || parsed > 10) {
      Alert.alert('Invalid CGPA', 'Please enter a valid CGPA between 0.00 and 10.00');
      return;
    }
    setDirectCgpa(parsed);
    triggerSuccessFeedback();
  };

  const triggerSuccessFeedback = () => {
    saveToStudentProfile();
    setSavedToastVisible(true);
    setTimeout(() => {
      setSavedToastVisible(false);
    }, 2500);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header Bar */}
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>CGPA Calculator</Text>
            <Text style={styles.headerSub}>VTU Cumulative Grade Point Average</Text>
          </View>
          <TouchableOpacity
            style={styles.saveHeaderBtn}
            onPress={calcMode === 'DIRECT' ? handleSaveDirect : triggerSuccessFeedback}
          >
            <Feather name="check" size={16} color="#FFFFFF" />
            <Text style={styles.saveHeaderBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Success Notification Banner */}
      {savedToastVisible && (
        <View style={styles.toastBanner}>
          <Feather name="check-circle" size={16} color="#16A34A" />
          <Text style={styles.toastText}>
            CGPA saved! Dashboard Academic Overview has been updated.
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* CGPA Display Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroSubLabel}>Cumulative Grade Point Average</Text>
              <Text style={styles.heroValue}>{currentCgpa.toFixed(2)}</Text>
            </View>
            <View style={[styles.classificationBadge, { backgroundColor: classification.bg }]}>
              <Text style={[styles.classificationText, { color: classification.color }]}>
                {classification.label}
              </Text>
            </View>
          </View>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatItem}>
              <Text style={styles.statLabel}>VTU Equivalent %</Text>
              <Text style={styles.statValue}>{equivalentPercentage}%</Text>
              <Text style={styles.statFormula}>Formula: (CGPA - 0.75) × 10</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.statLabel}>Completed Credits</Text>
              <Text style={styles.statValue}>{totalCreditsEarned}</Text>
              <Text style={styles.statFormula}>Weighted calculation</Text>
            </View>
          </View>
        </View>

        {/* Calculation Mode Selector Tabs */}
        <View style={styles.modeTabs}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.modeTab, calcMode === 'SEMESTER' && styles.modeTabActive]}
            onPress={() => setCalcMode('SEMESTER')}
          >
            <Feather
              name="layers"
              size={16}
              color={calcMode === 'SEMESTER' ? '#0745E8' : '#64748B'}
            />
            <Text
              style={[
                styles.modeTabText,
                calcMode === 'SEMESTER' && styles.modeTabTextActive,
              ]}
            >
              Semester Breakdown
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.modeTab, calcMode === 'DIRECT' && styles.modeTabActive]}
            onPress={() => setCalcMode('DIRECT')}
          >
            <Feather
              name="edit-3"
              size={16}
              color={calcMode === 'DIRECT' ? '#0745E8' : '#64748B'}
            />
            <Text
              style={[
                styles.modeTabText,
                calcMode === 'DIRECT' && styles.modeTabTextActive,
              ]}
            >
              Direct Entry
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mode 1: Semester Breakdown */}
        {calcMode === 'SEMESTER' ? (
          <View style={styles.semesterListSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Semesters (1 - 8)</Text>
              <Text style={styles.sectionNote}>Enter SGPA & Credits for completed semesters</Text>
            </View>

            {semesters.map((sem) => (
              <View
                key={`sem-${sem.semester}`}
                style={[
                  styles.semesterCard,
                  sem.isCompleted && styles.semesterCardActive,
                ]}
              >
                <View style={styles.semCardHeader}>
                  <TouchableOpacity
                    style={styles.semToggleRow}
                    onPress={() => toggleSemesterCompleted(sem.semester)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        sem.isCompleted && styles.checkboxChecked,
                      ]}
                    >
                      {sem.isCompleted && (
                        <Feather name="check" size={14} color="#FFFFFF" />
                      )}
                    </View>
                    <Text style={styles.semNumberTitle}>Semester {sem.semester}</Text>
                    {sem.semester === (user?.semester || 5) && (
                      <View style={styles.currentSemBadge}>
                        <Text style={styles.currentSemText}>Current</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.calcSgpaBtn}
                    onPress={() => router.push('/calculators/sgpa')}
                  >
                    <Text style={styles.calcSgpaBtnText}>Calculate SGPA</Text>
                    <Feather name="chevron-right" size={12} color="#0745E8" />
                  </TouchableOpacity>
                </View>

                <View style={styles.semInputsRow}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>SGPA (0 - 10)</Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        !sem.isCompleted && styles.textInputDisabled,
                      ]}
                      keyboardType="numeric"
                      placeholder="0.00"
                      placeholderTextColor="#94A3B8"
                      value={sem.sgpa > 0 ? String(sem.sgpa) : ''}
                      onChangeText={(t) => handleSgpaChange(sem.semester, t)}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Credits</Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        !sem.isCompleted && styles.textInputDisabled,
                      ]}
                      keyboardType="numeric"
                      placeholder="20"
                      placeholderTextColor="#94A3B8"
                      value={String(sem.credits)}
                      onChangeText={(t) => handleCreditsChange(sem.semester, t)}
                    />
                  </View>

                  <View style={styles.inputGroupPoints}>
                    <Text style={styles.inputLabel}>Grade Points</Text>
                    <Text style={styles.pointsValue}>
                      {sem.isCompleted ? (sem.sgpa * sem.credits).toFixed(1) : '—'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          /* Mode 2: Direct Entry */
          <View style={styles.directEntrySection}>
            <View style={styles.directCard}>
              <Text style={styles.directTitle}>Direct CGPA Input</Text>
              <Text style={styles.directSub}>
                If you already know your official VTU CGPA from provisional results, enter it directly below to update your profile and dashboard.
              </Text>

              <View style={styles.directInputContainer}>
                <TextInput
                  style={styles.directInputField}
                  keyboardType="numeric"
                  placeholder="8.50"
                  placeholderTextColor="#94A3B8"
                  value={directInput}
                  onChangeText={setDirectInput}
                  maxLength={5}
                />
                <Text style={styles.directInputMax}>/ 10.00</Text>
              </View>

              <TouchableOpacity
                style={styles.saveDirectBtn}
                activeOpacity={0.85}
                onPress={handleSaveDirect}
              >
                <Feather name="check" size={18} color="#FFFFFF" />
                <Text style={styles.saveDirectBtnText}>Update Profile & Dashboard</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* VTU Formula Explainer */}
        <View style={styles.infoCard}>
          <View style={styles.infoTitleRow}>
            <Feather name="info" size={16} color="#0745E8" />
            <Text style={styles.infoCardTitle}>VTU CGPA & Percentage Guidelines</Text>
          </View>
          <Text style={styles.infoText}>
            • Cumulative GPA Formula:{' '}
            <Text style={{ fontWeight: '700' }}>CGPA = Σ(C_i × S_i) / Σ(C_i)</Text>
          </Text>
          <Text style={styles.infoText}>
            • Equivalent Percentage:{' '}
            <Text style={{ fontWeight: '700' }}>Percentage = (CGPA - 0.75) × 10</Text>
          </Text>
          <Text style={styles.infoText}>
            • First Class with Distinction requires a minimum CGPA of 7.75 without active backlogs.
          </Text>
        </View>

        {/* Save to Profile Sticky CTA */}
        <TouchableOpacity
          style={styles.bigSaveButton}
          activeOpacity={0.85}
          onPress={calcMode === 'DIRECT' ? handleSaveDirect : triggerSuccessFeedback}
        >
          <Feather name="bookmark" size={18} color="#FFFFFF" />
          <Text style={styles.bigSaveButtonText}>Save to Academic Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  saveHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0745E8',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  saveHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#BBF7D0',
  },
  toastText: {
    color: '#166534',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0745E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  heroSubLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroValue: {
    fontSize: 42,
    fontWeight: '900',
    color: '#0745E8',
    marginTop: 2,
  },
  classificationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    maxWidth: '50%',
  },
  classificationText: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'right',
  },
  heroStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginVertical: 2,
  },
  statFormula: {
    fontSize: 10,
    color: '#94A3B8',
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  modeTabTextActive: {
    color: '#0745E8',
    fontWeight: '800',
  },
  semesterListSection: {
    gap: 12,
  },
  sectionHeaderRow: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionNote: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  semesterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  semesterCardActive: {
    borderColor: '#C7D2FE',
    backgroundColor: '#FAFCFF',
  },
  semCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  semToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#0745E8',
    borderColor: '#0745E8',
  },
  semNumberTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  currentSemBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  currentSemText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0745E8',
  },
  calcSgpaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  calcSgpaBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0745E8',
  },
  semInputsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputGroupPoints: {
    width: 90,
    alignItems: 'flex-end',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  textInputDisabled: {
    backgroundColor: '#F1F5F9',
    color: '#94A3B8',
  },
  pointsValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0745E8',
    paddingTop: 8,
  },
  directEntrySection: {
    marginBottom: 16,
  },
  directCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  directTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  directSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  directInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#0745E8',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 20,
    width: '80%',
  },
  directInputField: {
    fontSize: 36,
    fontWeight: '900',
    color: '#0745E8',
    minWidth: 100,
    textAlign: 'center',
  },
  directInputMax: {
    fontSize: 18,
    fontWeight: '700',
    color: '#94A3B8',
    marginLeft: 6,
  },
  saveDirectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0745E8',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 8,
    width: '100%',
    justifyContent: 'center',
  },
  saveDirectBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    gap: 6,
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  infoCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0745E8',
  },
  infoText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  bigSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0745E8',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    marginTop: 20,
    shadowColor: '#0745E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  bigSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
