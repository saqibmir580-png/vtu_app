import React, { useState } from 'react';
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
import { SubjectGrade, VTU_GRADE_SCALE } from '../types/calculator.types';
import { useAuthStore } from '@/store';

interface DefaultSubjectTemplate {
  name: string;
  code: string;
  credits: number;
}

const SEMESTER_TEMPLATES: Record<number, DefaultSubjectTemplate[]> = {
  5: [
    { name: 'Automata Theory & Computability', code: '21CS51', credits: 4 },
    { name: 'Computer Networks', code: '21CS52', credits: 4 },
    { name: 'Database Management Systems', code: '21CS53', credits: 4 },
    { name: 'Artificial Intelligence & Machine Learning', code: '21CS54', credits: 3 },
    { name: 'Research Methodology & IPR', code: '21RMI56', credits: 3 },
    { name: 'Environmental Studies', code: '21CIV57', credits: 1 },
    { name: 'DBMS Laboratory with Mini Project', code: '21CSL55', credits: 2 },
  ],
  6: [
    { name: 'Software Engineering & Project Mgmt', code: '21CS61', credits: 4 },
    { name: 'Full Stack Development', code: '21CS62', credits: 4 },
    { name: 'Cloud Computing', code: '21CS63', credits: 3 },
    { name: 'Professional Elective 2', code: '21CS64X', credits: 3 },
    { name: 'Open Elective 1', code: '21CS65X', credits: 3 },
    { name: 'Full Stack Web Dev Lab', code: '21CSL66', credits: 2 },
  ],
};

const getGradeFromMarks = (marks: number): { grade: string; gradePoint: number } => {
  const match = VTU_GRADE_SCALE.find((g) => marks >= g.minMarks && marks <= g.maxMarks);
  return match ? { grade: match.grade, gradePoint: match.gradePoint } : { grade: 'F', gradePoint: 0 };
};

export const SgpaCalculatorScreen: React.FC = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { saveSemesterSubjects, semesters } = useAcademicRecordStore();

  const userSem = user?.semester || 5;
  const [selectedSemester, setSelectedSemester] = useState<number>(userSem);

  const createInitialSubjects = (semNum: number): SubjectGrade[] => {
    const template = SEMESTER_TEMPLATES[semNum] || [
      { name: 'Core Subject 1', code: 'SUB1', credits: 4 },
      { name: 'Core Subject 2', code: 'SUB2', credits: 4 },
      { name: 'Core Subject 3', code: 'SUB3', credits: 3 },
      { name: 'Elective Subject', code: 'SUB4', credits: 3 },
      { name: 'Laboratory 1', code: 'LAB1', credits: 2 },
      { name: 'Laboratory 2', code: 'LAB2', credits: 2 },
    ];

    return template.map((item, idx) => ({
      id: `sub-${idx}-${Date.now()}`,
      name: item.name,
      code: item.code,
      credits: item.credits,
      grade: 'A',
      gradePoint: 8,
    }));
  };

  const [subjects, setSubjects] = useState<SubjectGrade[]>(() =>
    createInitialSubjects(selectedSemester)
  );
  const [toastVisible, setToastVisible] = useState(false);

  // Switch Semester
  const handleSelectSemester = (sem: number) => {
    setSelectedSemester(sem);
    const existing = semesters.find((s) => s.semester === sem);
    if (existing && existing.subjects && existing.subjects.length > 0) {
      setSubjects(existing.subjects);
    } else {
      setSubjects(createInitialSubjects(sem));
    }
  };

  // Add subject
  const handleAddSubject = () => {
    const newSub: SubjectGrade = {
      id: `sub-${Date.now()}`,
      name: `Subject ${subjects.length + 1}`,
      code: `21CS${selectedSemester}${subjects.length + 1}`,
      credits: 3,
      grade: 'A',
      gradePoint: 8,
    };
    setSubjects([...subjects, newSub]);
  };

  // Remove subject
  const handleRemoveSubject = (id: string) => {
    if (subjects.length <= 1) {
      Alert.alert('Cannot Remove', 'At least one subject is required for SGPA calculation.');
      return;
    }
    setSubjects(subjects.filter((s) => s.id !== id));
  };

  // Update subject grade
  const handleGradeChange = (id: string, grade: string, gradePoint: number) => {
    setSubjects(
      subjects.map((s) => (s.id === id ? { ...s, grade, gradePoint, marks: undefined } : s))
    );
  };

  // Update subject credits
  const handleCreditsChange = (id: string, credits: number) => {
    setSubjects(subjects.map((s) => (s.id === id ? { ...s, credits } : s)));
  };

  // Update subject marks (auto converts to VTU grade)
  const handleMarksChange = (id: string, text: string) => {
    const marks = parseInt(text, 10);
    if (isNaN(marks)) {
      setSubjects(subjects.map((s) => (s.id === id ? { ...s, marks: undefined } : s)));
      return;
    }
    const { grade, gradePoint } = getGradeFromMarks(Math.min(100, Math.max(0, marks)));
    setSubjects(
      subjects.map((s) =>
        s.id === id ? { ...s, marks, grade, gradePoint } : s
      )
    );
  };

  // Calculate SGPA
  const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);
  const totalPoints = subjects.reduce((sum, s) => sum + s.credits * s.gradePoint, 0);
  const calculatedSgpa = totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : 0;
  const equivalentPercentage =
    calculatedSgpa > 0.75 ? Math.min(100, (calculatedSgpa - 0.75) * 10).toFixed(2) : '0.00';

  // Save to academic profile
  const handleSaveToProfile = () => {
    saveSemesterSubjects(selectedSemester, subjects, calculatedSgpa, totalCredits);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 2500);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>SGPA Calculator</Text>
            <Text style={styles.headerSub}>Semester Grade Point Average</Text>
          </View>
          <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSaveToProfile}>
            <Feather name="check" size={16} color="#FFFFFF" />
            <Text style={styles.saveHeaderBtnText}>Save</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Toast Notification */}
      {toastVisible && (
        <View style={styles.toastBanner}>
          <Feather name="check-circle" size={16} color="#16A34A" />
          <Text style={styles.toastText}>
            Semester {selectedSemester} SGPA saved! Profile & CGPA updated.
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Semester Selector Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.semSelectorContainer}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
            <TouchableOpacity
              key={`chip-sem-${sem}`}
              activeOpacity={0.8}
              style={[
                styles.semChip,
                selectedSemester === sem && styles.semChipActive,
              ]}
              onPress={() => handleSelectSemester(sem)}
            >
              <Text
                style={[
                  styles.semChipText,
                  selectedSemester === sem && styles.semChipTextActive,
                ]}
              >
                Sem {sem}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Hero Result Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroSubLabel}>
                Semester {selectedSemester} Calculated SGPA
              </Text>
              <Text style={styles.heroValue}>{calculatedSgpa.toFixed(2)}</Text>
            </View>
            <View style={styles.percentageBadge}>
              <Text style={styles.percentageText}>{equivalentPercentage}%</Text>
              <Text style={styles.percentageSub}>Equivalent</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total Credits</Text>
              <Text style={styles.statVal}>{totalCredits}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Grade Points (Σ C×G)</Text>
              <Text style={styles.statVal}>{totalPoints.toFixed(0)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Subjects</Text>
              <Text style={styles.statVal}>{subjects.length}</Text>
            </View>
          </View>
        </View>

        {/* Subjects List Section */}
        <View style={styles.subjectsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Courses & Grading</Text>
            <TouchableOpacity
              style={styles.addSubjectHeaderBtn}
              onPress={handleAddSubject}
            >
              <Feather name="plus-circle" size={16} color="#0745E8" />
              <Text style={styles.addSubjectHeaderText}>Add Subject</Text>
            </TouchableOpacity>
          </View>

          {subjects.map((sub, index) => (
            <View key={sub.id} style={styles.subjectCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.subjectIndexBadge}>
                  <Text style={styles.subjectIndexText}>{index + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.subjectNameText} numberOfLines={1}>
                    {sub.name}
                  </Text>
                  <Text style={styles.subjectCodeText}>{sub.code}</Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleRemoveSubject(sub.id)}
                >
                  <Feather name="trash-2" size={16} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {/* Credits & Marks Input Row */}
              <View style={styles.creditsMarksRow}>
                {/* Credit Pills */}
                <View style={styles.creditPillsWrapper}>
                  <Text style={styles.fieldLabel}>Credits:</Text>
                  <View style={styles.creditsButtonGroup}>
                    {[1, 2, 3, 4, 5].map((cr) => (
                      <TouchableOpacity
                        key={`cr-${cr}`}
                        style={[
                          styles.creditPill,
                          sub.credits === cr && styles.creditPillActive,
                        ]}
                        onPress={() => handleCreditsChange(sub.id, cr)}
                      >
                        <Text
                          style={[
                            styles.creditPillText,
                            sub.credits === cr && styles.creditPillTextActive,
                          ]}
                        >
                          {cr}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Marks Optional Input */}
                <View style={styles.marksInputWrapper}>
                  <Text style={styles.fieldLabel}>Marks (0-100):</Text>
                  <TextInput
                    style={styles.marksInput}
                    keyboardType="numeric"
                    placeholder="Auto"
                    placeholderTextColor="#94A3B8"
                    maxLength={3}
                    value={sub.marks !== undefined ? String(sub.marks) : ''}
                    onChangeText={(t) => handleMarksChange(sub.id, t)}
                  />
                </View>
              </View>

              {/* VTU Grade Picker Chips */}
              <Text style={styles.fieldLabel}>Grade Awarded (VTU 10-Point Scale):</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.gradeChipsRow}
              >
                {VTU_GRADE_SCALE.map((g) => {
                  const isSelected = sub.grade === g.grade;
                  return (
                    <TouchableOpacity
                      key={`g-${g.grade}`}
                      activeOpacity={0.7}
                      style={[
                        styles.gradeChip,
                        isSelected && {
                          backgroundColor: g.badgeBg,
                          borderColor: g.badgeColor,
                        },
                      ]}
                      onPress={() => handleGradeChange(sub.id, g.grade, g.gradePoint)}
                    >
                      <Text
                        style={[
                          styles.gradeChipText,
                          isSelected && { color: g.badgeColor, fontWeight: '800' },
                        ]}
                      >
                        {g.grade} ({g.gradePoint})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ))}
        </View>

        {/* Add Another Subject Action Button */}
        <TouchableOpacity
          style={styles.addMoreBtn}
          activeOpacity={0.8}
          onPress={handleAddSubject}
        >
          <Feather name="plus" size={18} color="#0745E8" />
          <Text style={styles.addMoreBtnText}>Add Another Course / Laboratory</Text>
        </TouchableOpacity>

        {/* Save to Profile Primary Action */}
        <TouchableOpacity
          style={styles.bigSaveBtn}
          activeOpacity={0.85}
          onPress={handleSaveToProfile}
        >
          <Feather name="bookmark" size={18} color="#FFFFFF" />
          <Text style={styles.bigSaveBtnText}>Save Sem {selectedSemester} to Academic Profile</Text>
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
  semSelectorContainer: {
    gap: 8,
    marginBottom: 16,
  },
  semChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  semChipActive: {
    backgroundColor: '#0745E8',
    borderColor: '#0745E8',
  },
  semChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  semChipTextActive: {
    color: '#FFFFFF',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
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
  percentageBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  percentageText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0745E8',
  },
  percentageSub: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statBox: {
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
  statVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  subjectsSection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  addSubjectHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addSubjectHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0745E8',
  },
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  subjectIndexBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectIndexText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0745E8',
  },
  subjectNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  subjectCodeText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  deleteBtn: {
    padding: 4,
  },
  creditsMarksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  creditPillsWrapper: {
    flex: 1,
  },
  creditsButtonGroup: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  creditPill: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditPillActive: {
    backgroundColor: '#0745E8',
  },
  creditPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  creditPillTextActive: {
    color: '#FFFFFF',
  },
  marksInputWrapper: {
    width: 90,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  marksInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginTop: 4,
  },
  gradeChipsRow: {
    gap: 6,
  },
  gradeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gradeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  addMoreBtnText: {
    color: '#0745E8',
    fontSize: 14,
    fontWeight: '700',
  },
  bigSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0745E8',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    marginTop: 16,
    shadowColor: '#0745E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  bigSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
