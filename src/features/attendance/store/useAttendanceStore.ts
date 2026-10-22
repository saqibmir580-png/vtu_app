import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SubjectAttendance,
  AttendanceHistoryLog,
  AttendanceStatus,
  CalculationResult,
  CalculatorMode,
} from '../types/attendance.types';

const ATTENDANCE_STORAGE_KEY = 'vtu_mobile_attendance_store_data';

interface AttendanceStoreState {
  subjects: SubjectAttendance[];
  historyLogs: AttendanceHistoryLog[];
  selectedSubjectId: string | null;
  globalTarget: number;

  // Actions
  setSelectedSubjectId: (id: string | null) => void;
  setGlobalTarget: (target: number) => void;
  addSubject: (subject: Omit<SubjectAttendance, 'id'>) => void;
  updateAttendance: (id: string, attended: number, conducted: number) => void;
  deleteSubject: (id: string) => void;
  loadAttendance: () => Promise<void>;
  calculateAttendanceResult: (
    attended: number,
    conducted: number,
    target: number,
    mode: CalculatorMode
  ) => CalculationResult;
  getOverallStats: () => {
    totalAttended: number;
    totalConducted: number;
    overallPercentage: number;
    overallStatus: AttendanceStatus;
  };
}

const INITIAL_SUBJECTS: SubjectAttendance[] = [
  {
    id: 'att-cn',
    subjectName: 'Computer Networks',
    subjectCode: '21CS52',
    attendedClasses: 28,
    conductedClasses: 32,
    targetAttendance: 85,
    iconName: 'wifi',
    iconBg: '#EEF2FF',
  },
  {
    id: 'att-dbms',
    subjectName: 'Database Management Systems',
    subjectCode: '21CS53',
    attendedClasses: 32,
    conductedClasses: 36,
    targetAttendance: 85,
    iconName: 'database',
    iconBg: '#F0FDF4',
  },
  {
    id: 'att-atc',
    subjectName: 'Automata Theory & Computability',
    subjectCode: '21CS51',
    attendedClasses: 20,
    conductedClasses: 28,
    targetAttendance: 85,
    iconName: 'cpu',
    iconBg: '#FAF5FF',
  },
  {
    id: 'att-se',
    subjectName: 'Software Engineering & Project Mgmt',
    subjectCode: '21CS54',
    attendedClasses: 26,
    conductedClasses: 28,
    targetAttendance: 85,
    iconName: 'code',
    iconBg: '#FFF7ED',
  },
];

const INITIAL_HISTORY: AttendanceHistoryLog[] = [
  {
    id: 'log-1',
    subjectId: 'att-cn',
    subjectName: 'Computer Networks',
    subjectCode: '21CS52',
    type: 'ATTENDED',
    classesCount: 2,
    timestamp: 'Today, 10:30 AM',
  },
  {
    id: 'log-2',
    subjectId: 'att-atc',
    subjectName: 'Automata Theory & Computability',
    subjectCode: '21CS51',
    type: 'MISSED',
    classesCount: 1,
    timestamp: 'Yesterday, 02:00 PM',
  },
];

export const calculateStatus = (percentage: number, target: number): AttendanceStatus => {
  if (percentage >= target) return 'Safe';
  if (percentage >= target - 10) return 'Near Target';
  return 'Low';
};

export const useAttendanceStore = create<AttendanceStoreState>((set, get) => ({
  subjects: INITIAL_SUBJECTS,
  historyLogs: INITIAL_HISTORY,
  selectedSubjectId: 'att-cn',
  globalTarget: 85,

  setSelectedSubjectId: (id) => set({ selectedSubjectId: id }),

  setGlobalTarget: (target) => set({ globalTarget: target }),

  addSubject: (newSub) => {
    const id = `att-${Date.now()}`;
    const item: SubjectAttendance = { ...newSub, id };
    const newLogs: AttendanceHistoryLog[] = [
      {
        id: `log-${Date.now()}`,
        subjectId: id,
        subjectName: item.subjectName,
        subjectCode: item.subjectCode,
        type: 'ADDED',
        classesCount: item.conductedClasses,
        timestamp: 'Just now',
      },
      ...get().historyLogs,
    ];
    const newSubjects = [...get().subjects, item];
    set({ subjects: newSubjects, historyLogs: newLogs });
    AsyncStorage.setItem(
      ATTENDANCE_STORAGE_KEY,
      JSON.stringify({ subjects: newSubjects, historyLogs: newLogs, globalTarget: get().globalTarget })
    ).catch(() => {});
  },

  updateAttendance: (id, attended, conducted) => {
    const sub = get().subjects.find((s) => s.id === id);
    if (!sub) return;

    const diffAttended = attended - sub.attendedClasses;
    const newSubjects = get().subjects.map((s) =>
      s.id === id ? { ...s, attendedClasses: attended, conductedClasses: conducted } : s
    );
    const newLogs: AttendanceHistoryLog[] = [
      {
        id: `log-${Date.now()}`,
        subjectId: id,
        subjectName: sub.subjectName,
        subjectCode: sub.subjectCode,
        type: diffAttended > 0 ? 'ATTENDED' : 'EDITED',
        classesCount: Math.abs(diffAttended) || 1,
        timestamp: 'Just now',
      },
      ...get().historyLogs,
    ];

    set({ subjects: newSubjects, historyLogs: newLogs });
    AsyncStorage.setItem(
      ATTENDANCE_STORAGE_KEY,
      JSON.stringify({ subjects: newSubjects, historyLogs: newLogs, globalTarget: get().globalTarget })
    ).catch(() => {});
  },

  deleteSubject: (id) => {
    const newSubjects = get().subjects.filter((s) => s.id !== id);
    set({
      subjects: newSubjects,
      selectedSubjectId: get().selectedSubjectId === id ? null : get().selectedSubjectId,
    });
    AsyncStorage.setItem(
      ATTENDANCE_STORAGE_KEY,
      JSON.stringify({ subjects: newSubjects, historyLogs: get().historyLogs, globalTarget: get().globalTarget })
    ).catch(() => {});
  },

  loadAttendance: async () => {
    try {
      const stored = await AsyncStorage.getItem(ATTENDANCE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.subjects)) {
          set({
            subjects: parsed.subjects,
            historyLogs: parsed.historyLogs || get().historyLogs,
            globalTarget: parsed.globalTarget || 85,
          });
        }
      }
    } catch {
      // Ignore read errors
    }
  },

  calculateAttendanceResult: (attended, conducted, target, mode) => {
    const currentPercentage = conducted > 0 ? (attended / conducted) * 100 : 0;
    const roundCurrent = Math.round(currentPercentage * 10) / 10;

    let requiredClassesToReachTarget = 0;
    let missableClassesCount = 0;
    let projectedPercentage = roundCurrent;
    let explanation = '';

    if (mode === 'REACH_TARGET') {
      if (currentPercentage >= target) {
        requiredClassesToReachTarget = 0;
        explanation = `You are already meeting your target of ${target}%. Keep it up!`;
      } else {
        // Required = ceil((Target * C - 100 * A) / (100 - Target))
        const req = Math.ceil((target * conducted - 100 * attended) / (100 - target));
        requiredClassesToReachTarget = Math.max(1, req);
        const newAttended = attended + requiredClassesToReachTarget;
        const newConducted = conducted + requiredClassesToReachTarget;
        projectedPercentage = Math.round((newAttended / newConducted) * 1000) / 10;
        explanation = `Attend the next ${requiredClassesToReachTarget} consecutive classes without missing to reach your ${target}% target (projected: ${projectedPercentage}%).`;
      }
    } else {
      // CAN_MISS mode
      if (currentPercentage < target) {
        missableClassesCount = 0;
        explanation = `Your attendance (${roundCurrent}%) is currently below your target of ${target}%. You cannot afford to miss any classes.`;
      } else {
        // Missable = floor((100 * A - Target * C) / Target)
        const miss = Math.floor((100 * attended - target * conducted) / target);
        missableClassesCount = Math.max(0, miss);
        const newConducted = conducted + missableClassesCount;
        projectedPercentage = Math.round((attended / newConducted) * 1000) / 10;
        if (missableClassesCount === 0) {
          explanation = `You are exactly on track at ${roundCurrent}%. Missing the next class will drop your attendance below ${target}%.`;
        } else {
          explanation = `You can safely miss the next ${missableClassesCount} class${missableClassesCount > 1 ? 'es' : ''}. Your attendance will remain at ${projectedPercentage}%.`;
        }
      }
    }

    return {
      currentPercentage: roundCurrent,
      targetPercentage: target,
      requiredClassesToReachTarget,
      missableClassesCount,
      projectedPercentage,
      explanation,
    };
  },

  getOverallStats: () => {
    const { subjects, globalTarget } = get();
    const totalAttended = subjects.reduce((sum, s) => sum + s.attendedClasses, 0);
    const totalConducted = subjects.reduce((sum, s) => sum + s.conductedClasses, 0);
    const overallPercentage =
      totalConducted > 0 ? Math.round((totalAttended / totalConducted) * 1000) / 10 : 0;
    const overallStatus = calculateStatus(overallPercentage, globalTarget);

    return {
      totalAttended,
      totalConducted,
      overallPercentage,
      overallStatus,
    };
  },
}));
