import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGoalPlannerStore } from '../store/useGoalPlannerStore';
import { SemesterBreakdownItem } from '../components/SemesterBreakdownItem';
import { Header } from '@/shared/components/Header';

export const GoalBreakdownScreen: React.FC = () => {
  const router = useRouter();
  const activeGoalResult = useGoalPlannerStore((state) => state.activeGoalResult);

  if (!activeGoalResult) {
    router.replace('/calculators/goal-planner' as any);
    return null;
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0745E8" />
      <Header
        title={`Semester Targets (${activeGoalResult.targetCgpa.toFixed(2)} CGPA)`}
        dark={true}
        showBack={true}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeader}>Remaining Semester Targets</Text>
        <Text style={styles.sectionSub}>
          Maintain these average SGPA targets in each remaining semester
        </Text>

        {activeGoalResult.semesterTargets.map((st) => (
          <SemesterBreakdownItem key={st.semesterNumber} item={st} />
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
  },
});
