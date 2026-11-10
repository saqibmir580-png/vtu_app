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
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAcademicRecordStore } from '../store/useAcademicRecordStore';
import { useAuthStore } from '@/store';
import { SemesterRecord } from '../types/calculator.types';

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
  const [showFormulaInfo, setShowFormulaInfo] = useState(false);

  // Edit Modal State for Modular Progressive Disclosure
  const [editingSemester, setEditingSemester] = useState<SemesterRecord | null>(null);
  const [modalSgpa, setModalSgpa] = useState('');
  const [modalCredits, setModalCredits] = useState('20');

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

  // Open Edit Modal for a specific semester
  const openEditModal = (sem: SemesterRecord) => {
    setEditingSemester(sem);
    setModalSgpa(sem.sgpa > 0 ? String(sem.sgpa) : '');
    setModalCredits(String(sem.credits || 20));
  };

  // Save changes from Edit Modal
  const handleSaveModal = () => {
    if (!editingSemester) return;
    const parsedSgpa = parseFloat(modalSgpa);
    const parsedCredits = parseInt(modalCredits, 10);

    if (isNaN(parsedSgpa) || parsedSgpa < 0 || parsedSgpa > 10) {
      Alert.alert('Invalid SGPA', 'Please enter an SGPA value between 0.00 and 10.00');
      return;
    }

    const credits = isNaN(parsedCredits) || parsedCredits <= 0 ? 20 : parsedCredits;
    updateSemesterSgpa(editingSemester.semester, parsedSgpa, credits, true);
    setEditingSemester(null);
    triggerSuccessFeedback();
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

  const completedCount = semesters.filter((s) => s.isCompleted && s.sgpa > 0).length;

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
            CGPA saved! Academic overview updated.
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Dynamic Hero Scorecard */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroSubLabel}>Cumulative Grade Point Average</Text>
              <View style={styles.cgpaValueRow}>
                <Text style={styles.heroValue}>{currentCgpa.toFixed(2)}</Text>
                <Text style={styles.heroMax}>/ 10.00</Text>
              </View>
            </View>
            <View style={[styles.classificationBadge, { backgroundColor: classification.bg }]}>
              <Text style={[styles.classificationText, { color: classification.color }]}>
                {classification.label}
              </Text>
            </View>
          </View>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatItem}>
              <Text style={styles.statLabel}>Equivalent %</Text>
              <Text style={styles.statValue}>{equivalentPercentage}%</Text>
              <Text style={styles.statFormula}>Formula: (CGPA - 0.75) × 10</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.heroStatItem}>
              <Text style={styles.statLabel}>Completed Credits</Text>
              <Text style={styles.statValue}>{totalCreditsEarned} cr</Text>
              <Text style={styles.statFormula}>{completedCount} of 8 Semesters</Text>
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
              Semester Breakdown ({completedCount}/8)
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
              Quick Direct Entry
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mode 1: Semester Breakdown (Modular Accordion / Cards) */}
        {calcMode === 'SEMESTER' ? (
          <View style={styles.semesterListSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Semesters Breakdown</Text>
              <TouchableOpacity
                style={styles.calcCoursesLink}
                onPress={() => router.push('/calculators/sgpa')}
              >
                <Text style={styles.calcCoursesText}>Calculate SGPA ➔</Text>
              </TouchableOpacity>
            </View>

            {semesters.map((sem) => {
              const isDone = sem.isCompleted && sem.sgpa > 0;
              const isCurrent = sem.semester === (user?.semester || 5);

              return (
                <View
                  key={`sem-${sem.semester}`}
                  style={[
                    styles.modularSemCard,
                    isDone && styles.modularSemCardActive,
                  ]}
                >
                  {/* Left: Sem Number & Status */}
                  <TouchableOpacity
                    style={styles.semLeftGroup}
                    onPress={() => toggleSemesterCompleted(sem.semester)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        isDone && styles.checkboxChecked,
                      ]}
                    >
                      {isDone && <Feather name="check" size={13} color="#FFFFFF" />}
                    </View>
                    <View>
                      <View style={styles.semTitleRow}>
                        <Text style={styles.semTitleText}>Semester {sem.semester}</Text>
                        {isCurrent && (
                          <View style={styles.currentSemBadge}>
                            <Text style={styles.currentSemText}>Current</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.semSubText}>
                        {isDone
                          ? `${sem.credits} Credits • ${(sem.sgpa * sem.credits).toFixed(0)} Points`
                          : 'Not completed yet'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Right: SGPA Value & Edit Action */}
                  <View style={styles.semRightGroup}>
                    {isDone ? (
                      <View style={styles.scorePill}>
                        <Text style={styles.scorePillValue}>{sem.sgpa.toFixed(2)}</Text>
                        <Text style={styles.scorePillLabel}>SGPA</Text>
                      </View>
                    ) : null}

                    <TouchableOpacity
                      style={[styles.editSemBtn, !isDone && styles.addSemBtn]}
                      onPress={() => openEditModal(sem)}
                      activeOpacity={0.8}
                    >
                      <Feather
                        name={isDone ? 'edit-2' : 'plus'}
                        size={14}
                        color={isDone ? '#0745E8' : '#059669'}
                      />
                      <Text style={[styles.editSemText, !isDone && { color: '#059669' }]}>
                        {isDone ? 'Edit' : 'Add'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          /* Mode 2: Direct Entry */
          <View style={styles.directEntrySection}>
            <View style={styles.directCard}>
              <View style={styles.directHeaderRow}>
                <View style={styles.directIconBox}>
                  <Feather name="check-circle" size={20} color="#0745E8" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.directTitle}>Direct CGPA Input</Text>
                  <Text style={styles.directSub}>
                    Enter your official VTU provisional CGPA score below:
                  </Text>
                </View>
              </View>

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

              <View style={styles.directLiveFeedback}>
                <Text style={styles.feedbackLabel}>Equivalent Percentage:</Text>
                <Text style={styles.feedbackValue}>
                  {parseFloat(directInput) > 0.75
                    ? `${((parseFloat(directInput) - 0.75) * 10).toFixed(2)}%`
                    : '0.00%'}
                </Text>
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

        {/* Collapsible VTU Formula Explainer */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.formulaCollapsible}
          onPress={() => setShowFormulaInfo(!showFormulaInfo)}
        >
          <View style={styles.formulaTitleRow}>
            <Feather name="help-circle" size={16} color="#0745E8" />
            <Text style={styles.formulaTitle}>How is VTU CGPA & Percentage calculated?</Text>
          </View>
          <Feather
            name={showFormulaInfo ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#64748B"
          />
        </TouchableOpacity>

        {showFormulaInfo && (
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              • <Text style={{ fontWeight: '700' }}>CGPA Formula:</Text> CGPA = Σ(Credit_i × SGPA_i) / Σ(Credit_i)
            </Text>
            <Text style={styles.infoText}>
              • <Text style={{ fontWeight: '700' }}>Equivalent Percentage:</Text> % = (CGPA - 0.75) × 10
            </Text>
            <Text style={styles.infoText}>
              • <Text style={{ fontWeight: '700' }}>First Class with Distinction:</Text> Minimum 7.75 CGPA without active backlogs.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modular Focused Score Edit Modal */}
      {editingSemester && (
        <Modal
          visible={!!editingSemester}
          animationType="fade"
          transparent={true}
          statusBarTranslucent={true}
          onRequestClose={() => setEditingSemester(null)}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalBackdrop}>
              <KeyboardAvoidingView
                style={{ width: '100%' }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              >
                <View style={styles.modalCard}>
                  <View style={styles.modalHeader}>
                    <View>
                      <Text style={styles.modalTitle}>
                        Semester {editingSemester.semester} Score
                      </Text>
                      <Text style={styles.modalSubtitle}>
                        Enter SGPA & total completed credits
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setEditingSemester(null)}
                      style={styles.modalCloseBtn}
                    >
                      <Feather name="x" size={20} color="#0F172A" />
                    </TouchableOpacity>
                  </View>

                  {/* SGPA Input Field */}
                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalLabel}>SGPA (0.00 – 10.00)</Text>
                    <TextInput
                      style={styles.modalInput}
                      keyboardType="numeric"
                      placeholder="e.g. 8.60"
                      placeholderTextColor="#94A3B8"
                      value={modalSgpa}
                      onChangeText={setModalSgpa}
                      autoFocus
                    />
                  </View>

                  {/* Quick SGPA Stepper Pills */}
                  <View style={styles.quickPillsRow}>
                    {['7.50', '8.00', '8.50', '9.00', '9.50'].map((val) => (
                      <TouchableOpacity
                        key={val}
                        style={[
                          styles.quickPill,
                          modalSgpa === val && styles.quickPillActive,
                        ]}
                        onPress={() => setModalSgpa(val)}
                      >
                        <Text
                          style={[
                            styles.quickPillText,
                            modalSgpa === val && styles.quickPillTextActive,
                          ]}
                        >
                          {val}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Credits Input Field */}
                  <View style={styles.modalInputGroup}>
                    <Text style={styles.modalLabel}>Semester Credits</Text>
                    <View style={styles.creditsSelectorRow}>
                      {[18, 20, 22, 24, 25].map((cr) => (
                        <TouchableOpacity
                          key={cr}
                          style={[
                            styles.creditOption,
                            modalCredits === String(cr) && styles.creditOptionActive,
                          ]}
                          onPress={() => setModalCredits(String(cr))}
                        >
                          <Text
                            style={[
                              styles.creditOptionText,
                              modalCredits === String(cr) && styles.creditOptionTextActive,
                            ]}
                          >
                            {cr}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.modalActionsRow}>
                    <TouchableOpacity
                      style={styles.modalCancelBtn}
                      onPress={() => setEditingSemester(null)}
                    >
                      <Text style={styles.modalCancelText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.modalSaveBtn}
                      onPress={handleSaveModal}
                    >
                      <Feather name="check" size={16} color="#FFFFFF" />
                      <Text style={styles.modalSaveText}>Save Semester</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
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
    fontSize: 11,
    color: '#64748B',
  },
  saveHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0745E8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  saveHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#86EFAC',
  },
  toastText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    marginBottom: 16,
    gap: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroSubLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cgpaValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  heroValue: {
    fontSize: 38,
    fontWeight: '900',
    color: '#0745E8',
    letterSpacing: -1,
  },
  heroMax: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94A3B8',
  },
  classificationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    maxWidth: '52%',
  },
  classificationText: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'right',
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  statFormula: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E2E8F0',
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
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
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  modeTabTextActive: {
    color: '#0745E8',
  },
  semesterListSection: {
    gap: 10,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  calcCoursesLink: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  calcCoursesText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0745E8',
  },
  modularSemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  modularSemCardActive: {
    borderColor: '#C7D2FE',
    backgroundColor: '#FAFCFF',
  },
  semLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0745E8',
    borderColor: '#0745E8',
  },
  semTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  semTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  currentSemBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentSemText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0745E8',
  },
  semSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  semRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scorePill: {
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  scorePillValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0745E8',
  },
  scorePillLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6366F1',
  },
  editSemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addSemBtn: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  editSemText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0745E8',
  },
  directEntrySection: {
    marginBottom: 16,
  },
  directCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    gap: 14,
  },
  directHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  directIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  directTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  directSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  directInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#0745E8',
    paddingHorizontal: 16,
    height: 58,
  },
  directInputField: {
    flex: 1,
    fontSize: 26,
    fontWeight: '900',
    color: '#0745E8',
  },
  directInputMax: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94A3B8',
  },
  directLiveFeedback: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  feedbackLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  feedbackValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
  saveDirectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0745E8',
    borderRadius: 14,
    height: 48,
  },
  saveDirectBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  formulaCollapsible: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formulaTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  formulaTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  infoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalInputGroup: {
    gap: 6,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  modalInput: {
    height: 50,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  quickPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  quickPill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  quickPillActive: {
    backgroundColor: '#0745E8',
  },
  quickPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  quickPillTextActive: {
    color: '#FFFFFF',
  },
  creditsSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  creditOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  creditOptionActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#0745E8',
  },
  creditOptionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
  },
  creditOptionTextActive: {
    color: '#0745E8',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  modalSaveBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#0745E8',
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});