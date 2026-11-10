import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Modal,
  TouchableWithoutFeedback,
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
  1: [
    { name: 'Mathematics-I for CSE', code: '21MAT11', credits: 4 },
    { name: 'Applied Physics', code: '21PHY12', credits: 4 },
    { name: 'Basic Electrical Engg', code: '21ELE13', credits: 3 },
    { name: 'Elements of Civil Engg', code: '21CIV14', credits: 3 },
    { name: 'Engg Graphics / CAD Lab', code: '21EGDL15', credits: 3 },
    { name: 'Applied Physics Lab', code: '21PHYL16', credits: 1 },
    { name: 'Basic Electrical Lab', code: '21ELEL17', credits: 1 },
    { name: 'Communicative English', code: '21EGH18', credits: 1 },
  ],
  2: [
    { name: 'Mathematics-II for CSE', code: '21MAT21', credits: 4 },
    { name: 'Applied Chemistry', code: '21CHE22', credits: 4 },
    { name: 'Computer Programming in C', code: '21PSP23', credits: 3 },
    { name: 'Basic Electronics Engg', code: '21ELN24', credits: 3 },
    { name: 'C Programming Lab', code: '21CPL25', credits: 2 },
    { name: 'Chemistry Lab', code: '21CHEL26', credits: 1 },
    { name: 'Professional Writing Skills', code: '21EGH28', credits: 1 },
  ],
  3: [
    { name: 'Transform Calculus & Stat', code: '21MAT31', credits: 4 },
    { name: 'Data Structures & Applications', code: '21CS32', credits: 4 },
    { name: 'Analog & Digital Electronics', code: '21CS33', credits: 4 },
    { name: 'Computer Organization & Arch', code: '21CS34', credits: 3 },
    { name: 'Data Structures Lab', code: '21CSL35', credits: 2 },
    { name: 'Constitution of India & Ethics', code: '21CIP37', credits: 1 },
  ],
  4: [
    { name: 'Mathematical Foundations for Computing', code: '21MAT41', credits: 4 },
    { name: 'Design & Analysis of Algorithms', code: '21CS42', credits: 4 },
    { name: 'Microprocessors & Microcontrollers', code: '21CS43', credits: 4 },
    { name: 'Operating Systems', code: '21CS44', credits: 3 },
    { name: 'Algorithms Laboratory', code: '21CSL45', credits: 2 },
    { name: 'Universal Human Values', code: '21UH49', credits: 1 },
  ],
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
  7: [
    { name: 'Internet of Things (IoT)', code: '21CS71', credits: 4 },
    { name: 'Information and Network Security', code: '21CS72', credits: 4 },
    { name: 'Professional Elective 3', code: '21CS73X', credits: 3 },
    { name: 'Open Elective 2', code: '21CS74X', credits: 3 },
    { name: 'Project Work Phase - 1', code: '21CSP75', credits: 2 },
  ],
  8: [
    { name: 'Project Work Phase - 2', code: '21CSP81', credits: 8 },
    { name: 'Technical Seminar', code: '21CSS82', credits: 2 },
    { name: 'Internship / Professional Practice', code: '21CSI83', credits: 6 },
  ],
};

const VTU_GRADES = [
  { grade: 'O', label: 'Outstanding', point: 10, color: '#16A34A', bg: '#DCFCE7' },
  { grade: 'A+', label: 'Excellent', point: 9, color: '#059669', bg: '#ECFDF5' },
  { grade: 'A', label: 'Very Good', point: 8, color: '#0284C7', bg: '#E0F2FE' },
  { grade: 'B+', label: 'Good', point: 7, color: '#4F46E5', bg: '#EEF2FF' },
  { grade: 'B', label: 'Above Average', point: 6, color: '#D97706', bg: '#FEF3C7' },
  { grade: 'C', label: 'Average', point: 5, color: '#EA580C', bg: '#FFEDD5' },
  { grade: 'P', label: 'Pass', point: 4, color: '#64748B', bg: '#F1F5F9' },
  { grade: 'F', label: 'Fail / Arrear', point: 0, color: '#DC2626', bg: '#FEE2E2' },
];

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

  // Grade Picker Sheet State
  const [activeGradeSubjectId, setActiveGradeSubjectId] = useState<string | null>(null);

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

  // Add custom subject
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

  // Reset to syllabus template
  const handleResetTemplate = () => {
    setSubjects(createInitialSubjects(selectedSemester));
  };

  // Remove subject
  const handleRemoveSubject = (id: string) => {
    if (subjects.length <= 1) {
      Alert.alert('Cannot Remove', 'At least one subject is required for SGPA calculation.');
      return;
    }
    setSubjects(subjects.filter((s) => s.id !== id));
  };

  // Cycle Credits: 1 -> 2 -> 3 -> 4 -> 5 -> 1
  const handleCycleCredits = (id: string, current: number) => {
    const nextCredit = current >= 5 ? 1 : current + 1;
    setSubjects(subjects.map((s) => (s.id === id ? { ...s, credits: nextCredit } : s)));
  };

  // Apply Grade from Sheet
  const handleSelectGrade = (grade: string, point: number) => {
    if (!activeGradeSubjectId) return;
    setSubjects(
      subjects.map((s) =>
        s.id === activeGradeSubjectId
          ? { ...s, grade, gradePoint: point, marks: undefined }
          : s
      )
    );
    setActiveGradeSubjectId(null);
  };

  // Calculations
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

  const activeSubject = subjects.find((s) => s.id === activeGradeSubjectId);

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
            <Text style={styles.headerSub}>Semester {selectedSemester} Course Grading</Text>
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
        {/* Semester Selector Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.semCarousel}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
            const isSelected = selectedSemester === sem;
            return (
              <TouchableOpacity
                key={`sem-tab-${sem}`}
                activeOpacity={0.8}
                style={[styles.semTab, isSelected && styles.semTabActive]}
                onPress={() => handleSelectSemester(sem)}
              >
                <Text style={[styles.semTabText, isSelected && styles.semTabTextActive]}>
                  Sem {sem}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Floating SGPA Meter Card */}
        <View style={styles.heroMeterCard}>
          <View style={styles.meterTopRow}>
            <View>
              <Text style={styles.meterSubLabel}>Semester {selectedSemester} SGPA</Text>
              <View style={styles.sgpaNumberRow}>
                <Text style={styles.meterValue}>{calculatedSgpa.toFixed(2)}</Text>
                <Text style={styles.meterMax}>/ 10.00</Text>
              </View>
            </View>

            <View style={styles.equivalentBadge}>
              <Text style={styles.equivalentText}>{equivalentPercentage}%</Text>
              <Text style={styles.equivalentSub}>Equivalent</Text>
            </View>
          </View>

          <View style={styles.meterStatsRow}>
            <View style={styles.meterStat}>
              <Text style={styles.mStatLabel}>Total Credits</Text>
              <Text style={styles.mStatVal}>{totalCredits} cr</Text>
            </View>
            <View style={styles.meterDivider} />
            <View style={styles.meterStat}>
              <Text style={styles.mStatLabel}>Grade Points (Σ C×G)</Text>
              <Text style={styles.mStatVal}>{totalPoints.toFixed(0)} pts</Text>
            </View>
            <View style={styles.meterDivider} />
            <View style={styles.meterStat}>
              <Text style={styles.mStatLabel}>Courses</Text>
              <Text style={styles.mStatVal}>{subjects.length}</Text>
            </View>
          </View>
        </View>

        {/* Courses Section Header */}
        <View style={styles.coursesSectionHeader}>
          <Text style={styles.coursesTitle}>Course Grades</Text>
          <View style={styles.actionPillsRow}>
            <TouchableOpacity style={styles.resetActionBtn} onPress={handleResetTemplate}>
              <Feather name="rotate-ccw" size={12} color="#64748B" />
              <Text style={styles.resetActionText}>Syllabus Preset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addActionBtn} onPress={handleAddSubject}>
              <Feather name="plus" size={13} color="#0745E8" />
              <Text style={styles.addActionText}>Add Course</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Streamlined Modular Course Rows */}
        <View style={styles.coursesList}>
          {subjects.map((sub, index) => {
            const gradeInfo =
              VTU_GRADES.find((g) => g.grade === sub.grade) || VTU_GRADES[2];

            return (
              <View key={sub.id} style={styles.courseRow}>
                {/* Left: Index + Subject Info */}
                <View style={styles.courseLeft}>
                  <View style={styles.courseIndexBox}>
                    <Text style={styles.courseIndexText}>{index + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.courseCode}>{sub.code}</Text>
                    <Text style={styles.courseName} numberOfLines={1}>
                      {sub.name}
                    </Text>
                  </View>
                </View>

                {/* Middle: Cycle Credits Pill */}
                <TouchableOpacity
                  style={styles.creditsPill}
                  activeOpacity={0.7}
                  onPress={() => handleCycleCredits(sub.id, sub.credits)}
                >
                  <Text style={styles.creditsPillText}>{sub.credits} cr</Text>
                  <Feather name="refresh-cw" size={10} color="#64748B" />
                </TouchableOpacity>

                {/* Right: VTU Grade Badge Dropdown */}
                <TouchableOpacity
                  style={[styles.gradeBadgeBtn, { backgroundColor: gradeInfo.bg }]}
                  activeOpacity={0.8}
                  onPress={() => setActiveGradeSubjectId(sub.id)}
                >
                  <Text style={[styles.gradeBadgeText, { color: gradeInfo.color }]}>
                    {sub.grade} ({sub.gradePoint})
                  </Text>
                  <Feather name="chevron-down" size={14} color={gradeInfo.color} />
                </TouchableOpacity>

                {/* Delete Icon */}
                <TouchableOpacity
                  style={styles.rowDeleteBtn}
                  onPress={() => handleRemoveSubject(sub.id)}
                >
                  <Feather name="x" size={16} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Bottom Save Button */}
        <TouchableOpacity
          style={styles.saveBottomCta}
          activeOpacity={0.85}
          onPress={handleSaveToProfile}
        >
          <Feather name="check-circle" size={18} color="#FFFFFF" />
          <Text style={styles.saveBottomCtaText}>
            Save Semester {selectedSemester} SGPA ({calculatedSgpa.toFixed(2)})
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Grade Selector Modal */}
      {activeGradeSubjectId && (
        <Modal
          visible={!!activeGradeSubjectId}
          animationType="fade"
          transparent={true}
          statusBarTranslucent={true}
          onRequestClose={() => setActiveGradeSubjectId(null)}
        >
          <TouchableWithoutFeedback onPress={() => setActiveGradeSubjectId(null)}>
            <View style={styles.modalBackdrop}>
              <View style={styles.gradeModalCard}>
                <View style={styles.gradeModalHeader}>
                  <View>
                    <Text style={styles.gradeModalTitle}>Select Course Grade</Text>
                    <Text style={styles.gradeModalSub}>
                      {activeSubject?.code} • {activeSubject?.name}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setActiveGradeSubjectId(null)}
                    style={styles.modalCloseBtn}
                  >
                    <Feather name="x" size={20} color="#0F172A" />
                  </TouchableOpacity>
                </View>

                {/* Official VTU 10-Point Grade Grid */}
                <View style={styles.gradesList}>
                  {VTU_GRADES.map((g) => {
                    const isSelected = activeSubject?.grade === g.grade;
                    return (
                      <TouchableOpacity
                        key={g.grade}
                        style={[
                          styles.gradeOptionRow,
                          isSelected && styles.gradeOptionRowActive,
                        ]}
                        activeOpacity={0.7}
                        onPress={() => handleSelectGrade(g.grade, g.point)}
                      >
                        <View style={[styles.gradePillLeft, { backgroundColor: g.bg }]}>
                          <Text style={[styles.gradePillLetter, { color: g.color }]}>
                            {g.grade}
                          </Text>
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={styles.gradeLabelText}>{g.label}</Text>
                          <Text style={styles.gradePointText}>
                            Grade Point: {g.point} / 10
                          </Text>
                        </View>

                        {isSelected ? (
                          <Feather name="check" size={18} color="#0745E8" />
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
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
    paddingTop: 12,
    paddingBottom: 40,
  },
  semCarousel: {
    gap: 8,
    paddingBottom: 14,
  },
  semTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  semTabActive: {
    backgroundColor: '#0745E8',
    borderColor: '#0745E8',
  },
  semTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  semTabTextActive: {
    color: '#FFFFFF',
  },
  heroMeterCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    marginBottom: 20,
    gap: 14,
  },
  meterTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  meterSubLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sgpaNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  meterValue: {
    fontSize: 38,
    fontWeight: '900',
    color: '#0745E8',
    letterSpacing: -1,
  },
  meterMax: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94A3B8',
  },
  equivalentBadge: {
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  equivalentText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0745E8',
  },
  equivalentSub: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6366F1',
    marginTop: 1,
  },
  meterStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  meterStat: {
    flex: 1,
    alignItems: 'center',
  },
  mStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  mStatVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  meterDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  coursesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  coursesTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  actionPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  resetActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  resetActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  addActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  addActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0745E8',
  },
  coursesList: {
    gap: 8,
    marginBottom: 20,
  },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 10,
  },
  courseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  courseIndexBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseIndexText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  courseCode: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0745E8',
  },
  courseName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  creditsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  creditsPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  gradeBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  gradeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  rowDeleteBtn: {
    padding: 4,
  },
  saveBottomCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0745E8',
    height: 52,
    borderRadius: 16,
    shadowColor: '#0745E8',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBottomCtaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  gradeModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    gap: 16,
    maxHeight: '80%',
  },
  gradeModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  gradeModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  gradeModalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  gradesList: {
    gap: 8,
  },
  gradeOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gradeOptionRowActive: {
    borderColor: '#0745E8',
    backgroundColor: '#EEF2FF',
  },
  gradePillLeft: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradePillLetter: {
    fontSize: 16,
    fontWeight: '900',
  },
  gradeLabelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  gradePointText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
});