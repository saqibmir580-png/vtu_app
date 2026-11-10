import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGoalPlannerStore } from '../store/useGoalPlannerStore';
import { ScenarioProjectionCard } from '../components/ScenarioProjectionCard';
import { Header } from '@/shared/components/Header';

export const SemesterProjectionScreen: React.FC = () => {
  const router = useRouter();
  const activeGoalResult = useGoalPlannerStore((state) => state.activeGoalResult);

  if (!activeGoalResult) {
    router.replace('/calculators/goal-planner' as any);
    return null;
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0745E8" />
      <Header title="Performance Scenarios" dark={true} showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ScenarioProjectionCard
          scenarios={activeGoalResult.scenarios}
          targetCgpa={activeGoalResult.targetCgpa}
        />
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
    paddingBottom: 40,
  },
});
