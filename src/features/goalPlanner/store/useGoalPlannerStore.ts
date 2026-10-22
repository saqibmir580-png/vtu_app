import { create } from 'zustand';
import {
  AcademicData,
  SavedGoal,
  GoalResult,
  FeasibilityStatus,
  SemesterTarget,
  ProjectionScenario,
} from '../types/goalPlanner.types';
import { useAuthStore } from '@/store';

interface GoalPlannerStoreState {
  academicData: AcademicData;
  savedGoals: SavedGoal[];
  activeGoalResult: GoalResult | null;

  // Actions
  setAcademicData: (data: Partial<AcademicData>) => void;
  syncProfileData: () => void;
  calculateGoal: (targetCgpa: number) => GoalResult;
  saveGoal: (title: string, targetCgpa: number) => void;
  deleteGoal: (id: string) => void;
}

const INITIAL_SAVED_GOALS: SavedGoal[] = [
  {
    id: 'goal-fcd',
    title: 'First Class with Distinction',
    targetCgpa: 8.50,
    startingCgpa: 8.00,
    completedSemesters: 4,
    requiredSgpa: 9.00,
    feasibilityStatus: 'Achievable',
    createdAt: 'Sep 2026',
  },
  {
    id: 'goal-honors',
    title: 'VTU Honors Degree Target',
    targetCgpa: 9.00,
    startingCgpa: 8.00,
    completedSemesters: 4,
    requiredSgpa: 10.00,
    feasibilityStatus: 'Challenging',
    createdAt: 'Aug 2026',
  },
];

export const calculateFeasibility = (
  requiredSgpa: number,
  targetCgpa: number,
  currentCgpa: number
): FeasibilityStatus => {
  if (targetCgpa <= currentCgpa) return 'Already Achieved';
  if (requiredSgpa <= 9.20) return 'Achievable';
  if (requiredSgpa <= 10.00) return 'Challenging';
  return 'Unrealistic';
};

export const computeGoalResult = (
  data: AcademicData,
  targetCgpa: number
): GoalResult => {
  const { currentCgpa, completedSemesters, totalSemesters } = data;
  const remainingSemesters = Math.max(1, totalSemesters - completedSemesters);

  const neededPoints = totalSemesters * targetCgpa - completedSemesters * currentCgpa;
  const rawRequiredSgpa = neededPoints / remainingSemesters;
  const requiredAverageSgpa = Math.round(rawRequiredSgpa * 100) / 100;

  const feasibilityStatus = calculateFeasibility(
    requiredAverageSgpa,
    targetCgpa,
    currentCgpa
  );

  const progressPercentage = Math.min(
    100,
    Math.max(0, Math.round((currentCgpa / targetCgpa) * 100))
  );

  let explanation = '';
  if (feasibilityStatus === 'Already Achieved') {
    explanation = `Your current CGPA of ${currentCgpa.toFixed(2)} already exceeds your target of ${targetCgpa.toFixed(2)}. Aim for a higher milestone!`;
  } else if (feasibilityStatus === 'Achievable') {
    explanation = `To achieve a final CGPA of ${targetCgpa.toFixed(2)}, you need to maintain an average SGPA of ${requiredAverageSgpa.toFixed(2)} in your remaining ${remainingSemesters} semesters.`;
  } else if (feasibilityStatus === 'Challenging') {
    explanation = `Targeting ${targetCgpa.toFixed(2)} requires an average SGPA of ${requiredAverageSgpa.toFixed(2)} across all remaining ${remainingSemesters} semesters. This is near top performance.`;
  } else {
    explanation = `Achieving ${targetCgpa.toFixed(2)} requires an average SGPA of ${requiredAverageSgpa.toFixed(2)}, which exceeds the maximum possible SGPA of 10.00. Consider adjusting your goal.`;
  }

  // Semester breakdown
  const semesterTargets: SemesterTarget[] = [];
  for (let sem = completedSemesters + 1; sem <= totalSemesters; sem++) {
    semesterTargets.push({
      semesterNumber: sem,
      requiredSgpa: Math.min(10.00, Math.max(0, requiredAverageSgpa)),
      label: `Semester ${sem}`,
    });
  }

  // Scenarios
  const conservativeFinal =
    (completedSemesters * currentCgpa + remainingSemesters * currentCgpa) /
    totalSemesters;

  const expectedSgpa = Math.min(10.00, currentCgpa + 0.30);
  const expectedFinal =
    (completedSemesters * currentCgpa + remainingSemesters * expectedSgpa) /
    totalSemesters;

  const goalFinal = targetCgpa;

  const scenarios: ProjectionScenario[] = [
    {
      name: 'Conservative',
      description: 'Maintain current performance (same SGPA)',
      assumedSgpa: Math.round(currentCgpa * 100) / 100,
      projectedFinalCgpa: Math.round(conservativeFinal * 100) / 100,
      differenceFromTarget: Math.round((conservativeFinal - targetCgpa) * 100) / 100,
    },
    {
      name: 'Expected',
      description: 'Moderate boost (+0.30 SGPA in remaining semesters)',
      assumedSgpa: Math.round(expectedSgpa * 100) / 100,
      projectedFinalCgpa: Math.round(expectedFinal * 100) / 100,
      differenceFromTarget: Math.round((expectedFinal - targetCgpa) * 100) / 100,
    },
    {
      name: 'Goal Scenario',
      description: 'Hit required SGPA targets in every semester',
      assumedSgpa: Math.round(Math.min(10.00, requiredAverageSgpa) * 100) / 100,
      projectedFinalCgpa: Math.round(goalFinal * 100) / 100,
      differenceFromTarget: 0,
    },
  ];

  return {
    currentCgpa,
    targetCgpa,
    completedSemesters,
    remainingSemesters,
    requiredAverageSgpa,
    feasibilityStatus,
    progressPercentage,
    explanation,
    semesterTargets,
    scenarios,
  };
};

export const useGoalPlannerStore = create<GoalPlannerStoreState>((set, get) => ({
  academicData: {
    currentCgpa: 8.00,
    completedSemesters: 4,
    currentSemester: 5,
    totalSemesters: 8,
  },
  savedGoals: INITIAL_SAVED_GOALS,
  activeGoalResult: null,

  setAcademicData: (data) =>
    set((state) => ({
      academicData: { ...state.academicData, ...data },
    })),

  syncProfileData: () => {
    const user = useAuthStore.getState().user;
    if (user) {
      const sem = user.semester || 5;
      const completed = Math.max(1, sem - 1);
      const cgpa = user.currentCgpa || 8.00;

      set((state) => ({
        academicData: {
          ...state.academicData,
          currentCgpa: cgpa,
          currentSemester: sem,
          completedSemesters: completed,
        },
      }));
    }
  },

  calculateGoal: (targetCgpa) => {
    const { academicData } = get();
    const result = computeGoalResult(academicData, targetCgpa);
    set({ activeGoalResult: result });
    return result;
  },

  saveGoal: (title, targetCgpa) => {
    const { academicData, calculateGoal } = get();
    const result = calculateGoal(targetCgpa);

    const newGoal: SavedGoal = {
      id: `goal-${Date.now()}`,
      title: title || `Target ${targetCgpa.toFixed(2)} CGPA`,
      targetCgpa,
      startingCgpa: academicData.currentCgpa,
      completedSemesters: academicData.completedSemesters,
      requiredSgpa: result.requiredAverageSgpa,
      feasibilityStatus: result.feasibilityStatus,
      createdAt: 'Just now',
    };

    set((state) => ({
      savedGoals: [newGoal, ...state.savedGoals],
    }));

    // Persist targetCgpa to user profile
    useAuthStore.getState().updateProfile({ targetCgpa });
  },

  deleteGoal: (id) =>
    set((state) => ({
      savedGoals: state.savedGoals.filter((g) => g.id !== id),
    })),
}));
