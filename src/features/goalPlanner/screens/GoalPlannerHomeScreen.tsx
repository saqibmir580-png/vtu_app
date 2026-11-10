import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useGoalPlannerStore, computeGoalResult } from '../store/useGoalPlannerStore';
import { useAcademicRecordStore } from '@/features/calculators/store/useAcademicRecordStore';
import { useAuthStore } from '@/store';
import { Header } from '@/shared/components/Header';

export const GoalPlannerHomeScreen: React.FC = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { academicData, syncProfileData, saveGoal } = useGoalPlannerStore();
  const { currentCgpa } = useAcademicRecordStore();

  const [targetInput, setTargetInput] = useState<string>(
    user?.targetCgpa ? String(user.targetCgpa) : '9.00'
  );
  const [toastVisible, setToastVisible] = useState(false);
  const [activeScenarioTab, setActiveScenarioTab] = useState<'ROADMAP' | 'SCENARIOS'>('ROADMAP');

  useEffect(() => {
    syncProfileData();
  }, []);

  const parsedTarget = parseFloat(targetInput);
  const validTarget = !isNaN(parsedTarget) && parsedTarget >= 4.0 && parsedTarget <= 10.0 ? parsedTarget : 9.0;

  // Real-time calculation of goal result based on live target
  const liveResult = computeGoalResult(
    {
      ...academicData,
      currentCgpa: currentCgpa > 0 ? currentCgpa : academicData.currentCgpa,
    },
    validTarget
  );

  const handleAdjustTarget = (delta: number) => {
    const nextVal = Math.min(10.0, Math.max(5.0, Math.round((validTarget + delta) * 100) / 100));
    setTargetInput(nextVal.toFixed(2));
  };

  const handleSelectPreset = (val: number) => {
    setTargetInput(val.toFixed(2));
  };

  const handleSaveRoadmap = () => {
    saveGoal(`Target ${validTarget.toFixed(2)} CGPA Roadmap`, validTarget);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 2500);
  };

  const feasibilityStyles = {
    'Achievable': { color: '#059669', bg: '#DCFCE7', icon: 'check-circle' as const, label: 'Achievable Target' },
    'Challenging': { color: '#D97706', bg: '#FEF3C7', icon: 'alert-triangle' as const, label: 'Challenging (High Effort)' },
    'Unrealistic': { color: '#DC2626', bg: '#FEE2E2', icon: 'slash' as const, label: 'Mathematically Impossible' },
    'Already Achieved': { color: '#0284C7', bg: '#E0F2FE', icon: 'award' as const, label: 'Target Already Achieved!' },
  }[liveResult.feasibilityStatus];

  const renderHeaderRight = () => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push('/calculators/goal-planner/saved' as any)}
      style={styles.savedHeaderBtn}
    >
      <Feather name="bookmark" size={18} color="#FFFFFF" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0745E8" />

      {/* Royal Blue Header */}
      <Header
        title="Grade & GPA Predictor"
        dark={true}
        showBack={true}
        rightElement={renderHeaderRight()}
      />

      {/* Toast Notification */}
      {toastVisible && (
        <View style={styles.toastBanner}>
          <Feather name="check-circle" size={16} color="#16A34A" />
          <Text style={styles.toastText}>
            Target {validTarget.toFixed(2)} Roadmap saved to your profile!
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Academic Status Strip */}
        <View style={styles.academicStrip}>
          <View style={styles.academicStat}>
            <Text style={styles.aStatLabel}>Current CGPA</Text>
            <Text style={styles.aStatVal}>{academicData.currentCgpa.toFixed(2)}</Text>
          </View>
          <View style={styles.aStatDivider} />
          <View style={styles.academicStat}>
            <Text style={styles.aStatLabel}>Completed</Text>
            <Text style={styles.aStatVal}>{academicData.completedSemesters} of 8 Sem</Text>
          </View>
          <View style={styles.aStatDivider} />
          <View style={styles.academicStat}>
            <Text style={styles.aStatLabel}>Remaining</Text>
            <Text style={[styles.aStatVal, { color: '#0745E8' }]}>
              {liveResult.remainingSemesters} Semesters
            </Text>
          </View>
        </View>

        {/* Interactive Target Goal Selector Dial */}
        <View style={styles.targetCard}>
          <Text style={styles.targetQuestion}>What graduation CGPA do you want to achieve?</Text>

          {/* Stepper + Input */}
          <View style={styles.stepperContainer}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.stepperBtn}
              onPress={() => handleAdjustTarget(-0.1)}
            >
              <Feather name="minus" size={22} color="#0745E8" />
            </TouchableOpacity>

            <View style={styles.targetInputBox}>
              <TextInput
                style={styles.targetInputField}
                keyboardType="numeric"
                value={targetInput}
                onChangeText={setTargetInput}
                maxLength={5}
                selectTextOnFocus
              />
              <Text style={styles.targetMax}>/ 10.00</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.stepperBtn}
              onPress={() => handleAdjustTarget(0.1)}
            >
              <Feather name="plus" size={22} color="#0745E8" />
            </TouchableOpacity>
          </View>

          {/* Preset Pills */}
          <View style={styles.presetPillsRow}>
            {[
              { label: '8.00 FC', val: 8.0 },
              { label: '8.50 FCD', val: 8.5 },
              { label: '9.00 Honors', val: 9.0 },
              { label: '9.50 Rank', val: 9.5 },
            ].map((p) => {
              const isSelected = validTarget === p.val;
              return (
                <TouchableOpacity
                  key={p.label}
                  style={[styles.presetPill, isSelected && styles.presetPillActive]}
                  onPress={() => handleSelectPreset(p.val)}
                >
                  <Text style={[styles.presetPillText, isSelected && styles.presetPillTextActive]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Live Feasibility Badge & Hero Feedback */}
        <View style={[styles.feasibilityCard, { borderColor: feasibilityStyles.color }]}>
          <View style={styles.feasibilityHeader}>
            <View style={[styles.feasibilityPill, { backgroundColor: feasibilityStyles.bg }]}>
              <Feather name={feasibilityStyles.icon} size={15} color={feasibilityStyles.color} />
              <Text style={[styles.feasibilityPillText, { color: feasibilityStyles.color }]}>
                {feasibilityStyles.label}
              </Text>
            </View>

            <Text style={styles.requiredLabel}>
              Required Avg SGPA:
              <Text style={[styles.requiredValue, { color: feasibilityStyles.color }]}>
                {' '}{liveResult.requiredAverageSgpa > 10 ? '> 10.00' : liveResult.requiredAverageSgpa.toFixed(2)}
              </Text>
            </Text>
          </View>

          <Text style={styles.explanationText}>{liveResult.explanation}</Text>
        </View>

        {/* Tab Switcher: Roadmap vs Scenarios */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.tabBtn, activeScenarioTab === 'ROADMAP' && styles.tabBtnActive]}
            onPress={() => setActiveScenarioTab('ROADMAP')}
          >
            <Feather
              name="map"
              size={15}
              color={activeScenarioTab === 'ROADMAP' ? '#0745E8' : '#64748B'}
            />
            <Text style={[styles.tabText, activeScenarioTab === 'ROADMAP' && styles.tabTextActive]}>
              Semester Roadmap ({liveResult.remainingSemesters})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.tabBtn, activeScenarioTab === 'SCENARIOS' && styles.tabBtnActive]}
            onPress={() => setActiveScenarioTab('SCENARIOS')}
          >
            <Feather
              name="sliders"
              size={15}
              color={activeScenarioTab === 'SCENARIOS' ? '#0745E8' : '#64748B'}
            />
            <Text style={[styles.tabText, activeScenarioTab === 'SCENARIOS' && styles.tabTextActive]}>
              3 What-If Scenarios
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 1: Semester Roadmap List */}
        {activeScenarioTab === 'ROADMAP' ? (
          <View style={styles.roadmapList}>
            {liveResult.semesterTargets.map((item) => (
              <View key={item.semesterNumber} style={styles.roadmapItem}>
                <View style={styles.roadmapItemLeft}>
                  <View style={styles.semNumberCircle}>
                    <Text style={styles.semNumberText}>S{item.semesterNumber}</Text>
                  </View>
                  <View>
                    <Text style={styles.semNameText}>Semester {item.semesterNumber}</Text>
                    <Text style={styles.semTargetSub}>Minimum required to hit goal</Text>
                  </View>
                </View>

                <View style={styles.semTargetPill}>
                  <Text style={styles.semTargetValue}>{item.requiredSgpa.toFixed(2)}</Text>
                  <Text style={styles.semTargetLabel}>SGPA</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          /* Tab 2: 3 What-If Scenarios */
          <View style={styles.scenariosList}>
            {liveResult.scenarios.map((sc) => (
              <View key={sc.name} style={styles.scenarioCard}>
                <View style={styles.scenarioTop}>
                  <Text style={styles.scenarioName}>{sc.name}</Text>
                  <View style={styles.projectedCgpaBadge}>
                    <Text style={styles.projectedCgpaText}>{sc.projectedFinalCgpa.toFixed(2)} CGPA</Text>
                  </View>
                </View>
                <Text style={styles.scenarioDesc}>{sc.description}</Text>
                <Text style={styles.scenarioSgpa}>
                  Assumed Remaining SGPA:{' '}
                  <Text style={{ fontWeight: '800', color: '#0745E8' }}>
                    {sc.assumedSgpa.toFixed(2)}
                  </Text>
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Save Roadmap CTA */}
        <TouchableOpacity
          style={styles.saveRoadmapBtn}
          activeOpacity={0.85}
          onPress={handleSaveRoadmap}
        >
          <Feather name="bookmark" size={18} color="#FFFFFF" />
          <Text style={styles.saveRoadmapBtnText}>
            Save Target {validTarget.toFixed(2)} Roadmap
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  savedHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
  academicStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  academicStat: {
    flex: 1,
    alignItems: 'center',
  },
  aStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  aStatVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  aStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  targetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#0745E8',
    padding: 18,
    marginBottom: 16,
    gap: 14,
    shadowColor: '#0745E8',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  targetQuestion: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetInputBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  targetInputField: {
    fontSize: 38,
    fontWeight: '900',
    color: '#0745E8',
    minWidth: 80,
    textAlign: 'center',
  },
  targetMax: {
    fontSize: 16,
    fontWeight: '700',
    color: '#94A3B8',
  },
  presetPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  presetPillActive: {
    backgroundColor: '#0745E8',
    borderColor: '#0745E8',
  },
  presetPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  presetPillTextActive: {
    color: '#FFFFFF',
  },
  feasibilityCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
    gap: 10,
  },
  feasibilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  feasibilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  feasibilityPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  requiredLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  requiredValue: {
    fontSize: 14,
    fontWeight: '900',
  },
  explanationText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0745E8',
  },
  roadmapList: {
    gap: 10,
    marginBottom: 20,
  },
  roadmapItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  roadmapItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  semNumberCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  semNumberText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0745E8',
  },
  semNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  semTargetSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  semTargetPill: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  semTargetValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0745E8',
  },
  semTargetLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  scenariosList: {
    gap: 10,
    marginBottom: 20,
  },
  scenarioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 6,
  },
  scenarioTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scenarioName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  projectedCgpaBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  projectedCgpaText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0745E8',
  },
  scenarioDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  scenarioSgpa: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  saveRoadmapBtn: {
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
  saveRoadmapBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
