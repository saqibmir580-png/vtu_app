import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useGoalPlannerStore } from '../store/useGoalPlannerStore';
import { GoalResultCard } from '../components/GoalResultCard';
import { SemesterBreakdownItem } from '../components/SemesterBreakdownItem';
import { ScenarioProjectionCard } from '../components/ScenarioProjectionCard';
import { Header } from '@/shared/components/Header';
import { StatusBar } from 'react-native';

export const GoalResultScreen: React.FC = () => {
  const router = useRouter();
  const { activeGoalResult, saveGoal } = useGoalPlannerStore();
  const [activeTab, setActiveTab] = useState<'BREAKDOWN' | 'PROJECTIONS'>('BREAKDOWN');
  const [saved, setSaved] = useState(false);

  if (!activeGoalResult) {
    router.replace('/calculators/goal-planner' as any);
    return null;
  }

  const handleSave = () => {
    saveGoal(
      `Target ${activeGoalResult.targetCgpa.toFixed(2)} CGPA Goal`,
      activeGoalResult.targetCgpa
    );
    setSaved(true);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0745E8" />
      <Header
        title={`Goal Result (${activeGoalResult.targetCgpa.toFixed(2)} CGPA)`}
        dark={true}
        showBack={true}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Result Hero Card */}
        <GoalResultCard result={activeGoalResult} />

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.tabBtn, activeTab === 'BREAKDOWN' && styles.tabBtnActive]}
            onPress={() => setActiveTab('BREAKDOWN')}
          >
            <Text style={[styles.tabText, activeTab === 'BREAKDOWN' && styles.tabTextActive]}>
              Semester Breakdown ({activeGoalResult.remainingSemesters})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.tabBtn, activeTab === 'PROJECTIONS' && styles.tabBtnActive]}
            onPress={() => setActiveTab('PROJECTIONS')}
          >
            <Text style={[styles.tabText, activeTab === 'PROJECTIONS' && styles.tabTextActive]}>
              Projections (3 Scenarios)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'BREAKDOWN' ? (
          <View style={styles.breakdownSection}>
            <Text style={styles.sectionHeader}>Required SGPA by Semester</Text>
            <Text style={styles.sectionSub}>
              Average SGPA targets needed across remaining semesters
            </Text>

            {activeGoalResult.semesterTargets.map((st) => (
              <SemesterBreakdownItem key={st.semesterNumber} item={st} />
            ))}
          </View>
        ) : (
          <ScenarioProjectionCard
            scenarios={activeGoalResult.scenarios}
            targetCgpa={activeGoalResult.targetCgpa}
          />
        )}
      </ScrollView>

      {/* Footer Actions */}
      <SafeAreaView edges={['bottom']} style={styles.footerSafeArea}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.stickyCtaBtn}
          onPress={() => {
            if (!saved) handleSave();
            router.push('/calculators/goal-planner/saved' as any);
          }}
        >
          <Feather name="bookmark" size={18} color="#FFFFFF" />
          <Text style={styles.stickyCtaText}>
            {saved ? 'View Saved Roadmaps' : 'Save Goal Roadmap'}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
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
    fontSize: 12,
    color: '#64748B',
  },
  saveHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  saveHeaderBtnDisabled: {
    backgroundColor: '#D1FAE5',
  },
  saveHeaderBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0745E8',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0745E8',
    fontWeight: '800',
  },
  breakdownSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  footerSafeArea: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  stickyCtaBtn: {
    height: 48,
    borderRadius: 16,
    backgroundColor: '#0745E8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stickyCtaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
