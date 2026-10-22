import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SemesterRecord, SubjectGrade, VTU_GRADE_SCALE } from '../types/calculator.types';
import { useAuthStore } from '@/store';

const ACADEMIC_STORAGE_KEY = 'vtu_mobile_academic_record_data';

// Default VTU NEP 2020 / 2022 Scheme Credit Distributions
const DEFAULT_SEMESTERS: SemesterRecord[] = [
  { semester: 1, sgpa: 8.50, credits: 20, isCompleted: true },
  { semester: 2, sgpa: 8.60, credits: 20, isCompleted: true },
  { semester: 3, sgpa: 8.80, credits: 24, isCompleted: true },
  { semester: 4, sgpa: 8.95, credits: 24, isCompleted: true },
  { semester: 5, sgpa: 8.70, credits: 25, isCompleted: false },
  { semester: 6, sgpa: 0.00, credits: 24, isCompleted: false },
  { semester: 7, sgpa: 0.00, credits: 20, isCompleted: false },
  { semester: 8, sgpa: 0.00, credits: 18, isCompleted: false },
];

export const computeCgpaFromRecords = (records: SemesterRecord[]): { cgpa: number; totalCredits: number } => {
  const completed = records.filter((r) => r.isCompleted && r.sgpa > 0);
  if (completed.length === 0) {
    return { cgpa: 0, totalCredits: 0 };
  }

  const totalPoints = completed.reduce((sum, r) => sum + r.sgpa * r.credits, 0);
  const totalCredits = completed.reduce((sum, r) => sum + r.credits, 0);

  const cgpa = totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : 0;
  return { cgpa, totalCredits };
};

interface AcademicRecordState {
  semesters: SemesterRecord[];
  currentCgpa: number;
  targetCgpa: number;
  totalCreditsEarned: number;
  isLoaded: boolean;

  // Actions
  updateSemesterSgpa: (semesterNum: number, sgpa: number, credits?: number, isCompleted?: boolean) => void;
  saveSemesterSubjects: (semesterNum: number, subjects: SubjectGrade[], computedSgpa: number, totalCredits: number) => void;
  setDirectCgpa: (cgpa: number) => void;
  setTargetCgpa: (target: number) => void;
  saveToStudentProfile: () => void;
  loadAcademicRecords: () => Promise<void>;
  resetToDefaults: () => void;
}

const initialComputed = computeCgpaFromRecords(DEFAULT_SEMESTERS);

export const useAcademicRecordStore = create<AcademicRecordState>((set, get) => ({
  semesters: DEFAULT_SEMESTERS,
  currentCgpa: initialComputed.cgpa,
  targetCgpa: 9.00,
  totalCreditsEarned: initialComputed.totalCredits,
  isLoaded: false,

  updateSemesterSgpa: (semesterNum, sgpa, credits, isCompleted = true) => {
    const updated = get().semesters.map((s) => {
      if (s.semester === semesterNum) {
        return {
          ...s,
          sgpa: Math.min(10, Math.max(0, sgpa)),
          credits: credits !== undefined ? credits : s.credits,
          isCompleted,
        };
      }
      return s;
    });

    const { cgpa, totalCredits } = computeCgpaFromRecords(updated);

    set({
      semesters: updated,
      currentCgpa: cgpa,
      totalCreditsEarned: totalCredits,
    });

    // Auto-sync with student profile and AsyncStorage
    get().saveToStudentProfile();
  },

  saveSemesterSubjects: (semesterNum, subjects, computedSgpa, totalCredits) => {
    const updated = get().semesters.map((s) => {
      if (s.semester === semesterNum) {
        return {
          ...s,
          sgpa: Math.round(computedSgpa * 100) / 100,
          credits: totalCredits,
          isCompleted: true,
          subjects,
        };
      }
      return s;
    });

    const { cgpa, totalCredits: totalEarned } = computeCgpaFromRecords(updated);

    set({
      semesters: updated,
      currentCgpa: cgpa,
      totalCreditsEarned: totalEarned,
    });

    get().saveToStudentProfile();
  },

  setDirectCgpa: (cgpa) => {
    const rounded = Math.round(cgpa * 100) / 100;
    set({ currentCgpa: rounded });
    get().saveToStudentProfile();
  },

  setTargetCgpa: (target) => {
    const rounded = Math.round(target * 100) / 100;
    set({ targetCgpa: rounded });
    useAuthStore.getState().updateProfile({ targetCgpa: rounded });
  },

  saveToStudentProfile: () => {
    const { currentCgpa, targetCgpa, totalCreditsEarned, semesters } = get();

    // 1. Update active Auth Profile store so Dashboard and Profile screens react immediately
    useAuthStore.getState().updateProfile({
      currentCgpa,
      targetCgpa,
      earnedCredits: totalCreditsEarned,
    });

    // 2. Persist breakdown to local storage
    AsyncStorage.setItem(
      ACADEMIC_STORAGE_KEY,
      JSON.stringify({
        semesters,
        currentCgpa,
        targetCgpa,
        totalCreditsEarned,
      })
    ).catch((err) => console.warn('[useAcademicRecordStore] Failed to persist', err));
  },

  loadAcademicRecords: async () => {
    try {
      const stored = await AsyncStorage.getItem(ACADEMIC_STORAGE_KEY);
      const user = useAuthStore.getState().user;

      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.semesters)) {
          const effectiveCgpa = user?.currentCgpa ?? parsed.currentCgpa;
          const effectiveTarget = user?.targetCgpa ?? parsed.targetCgpa ?? 9.0;
          set({
            semesters: parsed.semesters,
            currentCgpa: effectiveCgpa,
            targetCgpa: effectiveTarget,
            totalCreditsEarned: parsed.totalCreditsEarned || 0,
            isLoaded: true,
          });
          return;
        }
      }

      // If user profile already has a CGPA, honor it
      if (user && user.currentCgpa) {
        set({
          currentCgpa: user.currentCgpa,
          targetCgpa: user.targetCgpa || 9.0,
          isLoaded: true,
        });
        return;
      }
    } catch (e) {
      console.warn('[useAcademicRecordStore] Error loading academic records', e);
    }
    set({ isLoaded: true });
  },

  resetToDefaults: () => {
    const { cgpa, totalCredits } = computeCgpaFromRecords(DEFAULT_SEMESTERS);
    set({
      semesters: DEFAULT_SEMESTERS,
      currentCgpa: cgpa,
      totalCreditsEarned: totalCredits,
    });
    get().saveToStudentProfile();
  },
}));
