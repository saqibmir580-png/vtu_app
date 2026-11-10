import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAttendanceStore } from '../store/useAttendanceStore';
import { SubjectSelector } from '../components/SubjectSelector';
import { EmptyState } from '../components/EmptyState';
import { CalculatorMode } from '../types/attendance.types';
import { Header } from '@/shared/components/Header';

export const AttendanceCalculatorScreen: React.FC = () => {
  const router = useRouter();
  const { subjects, selectedSubjectId, calculateAttendanceResult, setSelectedSubjectId } =
    useAttendanceStore();

  const selectedSubject =
    subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  const [mode, setMode] = useState<CalculatorMode>('REACH_TARGET');
  const [target, setTarget] = useState(selectedSubject?.targetAttendance || 85);
  const [selectorVisible, setSelectorVisible] = useState(false);

  if (!selectedSubject) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor="#0745E8" />
        <Header title="Attendance Calculator" dark={true} showBack={true} />
        <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
          <EmptyState
            title="No Subjects Enrolled"
            subTitle="Add your VTU semester subjects to calculate attendance targets, required classes, and safe margins."
            onAddPress={() => router.push('/calculators/attendance' as any)}
          />
        </View>
      </View>
    );
  }

  const result = calculateAttendanceResult(
    selectedSubject.attendedClasses,
    selectedSubject.conductedClasses,
    target,
    mode
  );

  const currPct = result.currentPercentage;
  const isShortage = currPct < 75;
  const isSafe = currPct >= 85;

  const statusColor = isSafe ? '#059669' : isShortage ? '#DC2626' : '#D97706';
  const statusBg = isSafe ? '#DCFCE7' : isShortage ? '#FEE2E2' : '#FEF3C7';
  const statusLabel = isSafe ? 'Safe (Above 85%)' : isShortage ? 'Critical Shortage (<75%)' : 'Borderline (75-84%)';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0745E8" />
      <Header title="Attendance Calculator" dark={true} showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* TOP SNAPSHOT: Circular Gauge & Visual Graphical Threshold Indicator */}
        <View style={styles.gaugeCard}>
          <View style={styles.gaugeHeaderRow}>
            <View style={styles.gaugeRing}>
              <Text style={[styles.gaugePctText, { color: statusColor }]}>{currPct}%</Text>
              <Text style={styles.gaugeSubText}>Current Attendance</Text>
            </View>

            <View style={styles.gaugeHeaderMeta}>
              <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
                <Text style={[styles.statusPillText, { color: statusColor }]}>
                  {statusLabel}
                </Text>
              </View>
              <Text style={styles.selectedSubjectHeading} numberOfLines={1}>
                {selectedSubject.subjectCode} - {selectedSubject.subjectName}
              </Text>
              <Text style={styles.gaugeFormulaSub}>
                Formula: ({selectedSubject.attendedClasses} / {selectedSubject.conductedClasses}) × 100
              </Text>
            </View>
          </View>

          {/* Graphical Threshold Progress Bar */}
          <View style={styles.graphicalBarSection}>
            <View style={styles.graphicalBarLabels}>
              <Text style={styles.barMarkerText}>0%</Text>
              <Text style={[styles.barMarkerText, { color: '#DC2626', fontWeight: '800' }]}>75% (Min)</Text>
              <Text style={[styles.barMarkerText, { color: '#059669', fontWeight: '800' }]}>85% (Safe)</Text>
              <Text style={styles.barMarkerText}>100%</Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${Math.min(100, Math.max(0, currPct))}%`,
                    backgroundColor: statusColor,
                  },
                ]}
              />
              {/* VTU Minimum Marker at 75% */}
              <View style={[styles.barThresholdLine, { left: '75%' }]} />
              {/* Safe Buffer Marker at 85% */}
              <View style={[styles.barThresholdLine, { left: '85%' }]} />
            </View>
          </View>

          {/* Quick Stats Strip */}
          <View style={styles.statsStrip}>
            <View style={styles.statTile}>
              <Text style={styles.statVal}>{selectedSubject.attendedClasses}</Text>
              <Text style={styles.statLbl}>Attended</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statTile}>
              <Text style={styles.statVal}>{selectedSubject.conductedClasses}</Text>
              <Text style={styles.statLbl}>Conducted</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statTile}>
              <Text style={[styles.statVal, { color: '#0745E8' }]}>{target}%</Text>
              <Text style={styles.statLbl}>Target Goal</Text>
            </View>
          </View>
        </View>

        {/* Modular Subject Switcher Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.subjectCard}
          onPress={() => setSelectorVisible(true)}
        >
          <View style={styles.subjectLeft}>
            <View style={styles.subjectIconBox}>
              <Feather name="book-open" size={20} color="#0745E8" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.subjectCodeRow}>
                <Text style={styles.subjectCode}>{selectedSubject.subjectCode}</Text>
                <Text style={styles.changeSubjectBadge}>Change Subject</Text>
              </View>
              <Text style={styles.subjectName} numberOfLines={1}>
                {selectedSubject.subjectName}
              </Text>
            </View>
          </View>

          <Feather name="chevron-down" size={18} color="#64748B" />
        </TouchableOpacity>

        {/* Target Percentage Quick Steppers */}
        <View style={styles.targetSection}>
          <Text style={styles.sectionLabel}>Select Target Goal:</Text>
          <View style={styles.targetPillsRow}>
            {[75, 80, 85, 90].map((tVal) => {
              const isSelected = target === tVal;
              return (
                <TouchableOpacity
                  key={`target-${tVal}`}
                  activeOpacity={0.8}
                  style={[styles.targetPill, isSelected && styles.targetPillActive]}
                  onPress={() => setTarget(tVal)}
                >
                  <Text style={[styles.targetPillText, isSelected && styles.targetPillTextActive]}>
                    {tVal}% {tVal === 75 ? 'VTU' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Modular Mode Switcher (2 Tabs) */}
        <View style={styles.modeTabs}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.modeTab, mode === 'REACH_TARGET' && styles.modeTabActive]}
            onPress={() => setMode('REACH_TARGET')}
          >
            <Feather
              name="trending-up"
              size={16}
              color={mode === 'REACH_TARGET' ? '#0745E8' : '#64748B'}
            />
            <Text style={[styles.modeTabText, mode === 'REACH_TARGET' && styles.modeTabTextActive]}>
              Classes to Attend
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.modeTab, mode === 'CAN_MISS' && styles.modeTabActive]}
            onPress={() => setMode('CAN_MISS')}
          >
            <Feather
              name="coffee"
              size={16}
              color={mode === 'CAN_MISS' ? '#059669' : '#64748B'}
            />
            <Text style={[styles.modeTabText, mode === 'CAN_MISS' && { color: '#059669' }]}>
              Can I Bunk?
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hero Dynamic Projection Result Card */}
        {mode === 'REACH_TARGET' ? (
          <View style={styles.projectionHeroCard}>
            <View style={styles.projectionHeader}>
              <View style={[styles.projectionIconBox, { backgroundColor: '#EEF2FF' }]}>
                <Feather name="calendar" size={24} color="#0745E8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.projSubLabel}>REQUIRED LECTURES</Text>
                <Text style={styles.projHeroValue}>
                  {result.requiredClassesToReachTarget} Classes Needed
                </Text>
              </View>
            </View>

            <View style={styles.projExplanationBox}>
              <Text style={styles.projExplanationText}>
                {result.requiredClassesToReachTarget === 0
                  ? `You already have ${currPct}%, which meets or exceeds your ${target}% target!`
                  : `Attend the next ${result.requiredClassesToReachTarget} consecutive classes without missing to reach your ${target}% target.`}
              </Text>
            </View>

            <View style={styles.projFooterRow}>
              <Text style={styles.projFooterLabel}>Projected Percentage:</Text>
              <Text style={styles.projFooterVal}>{result.projectedPercentage}%</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.projectionHeroCard, { borderColor: '#A7F3D0' }]}>
            <View style={styles.projectionHeader}>
              <View style={[styles.projectionIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Feather name="coffee" size={24} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.projSubLabel, { color: '#059669' }]}>SAFE BUNK ALLOWANCE</Text>
                <Text style={[styles.projHeroValue, { color: result.missableClassesCount > 0 ? '#059669' : '#DC2626' }]}>
                  {result.missableClassesCount} Bunk{result.missableClassesCount === 1 ? '' : 's'} Safe
                </Text>
              </View>
            </View>

            <View style={styles.projExplanationBox}>
              <Text style={styles.projExplanationText}>
                {result.missableClassesCount > 0
                  ? `You can safely skip up to ${result.missableClassesCount} classes and still stay above your ${target}% threshold.`
                  : `You cannot afford to miss any classes right now without dropping below your target!` }
              </Text>
            </View>

            <View style={styles.projFooterRow}>
              <Text style={styles.projFooterLabel}>Outcome if Missed:</Text>
              <Text style={[styles.projFooterVal, { color: '#059669' }]}>
                {result.projectedPercentage}%
              </Text>
            </View>
          </View>
        )}

        {/* Calculation Rule Explainer */}
        <View style={styles.breakdownCard}>
          <View style={styles.breakdownTitleRow}>
            <Feather name="info" size={15} color="#0745E8" />
            <Text style={styles.breakdownTitle}>VTU Attendance Regulations</Text>
          </View>
          <Text style={styles.breakdownText}>
            • Minimum 75% attendance in each course is required to be eligible for VTU End Semester Examinations.
          </Text>
          <Text style={styles.breakdownText}>
            • Maintaining 85% ensures a safe buffer against unexpected medical or personal emergencies.
          </Text>
        </View>
      </ScrollView>

      {/* Subject Selector Sheet */}
      <SubjectSelector
        visible={selectorVisible}
        subjects={subjects}
        selectedSubjectId={selectedSubject.id}
        onSelect={(sub) => {
          setSelectedSubjectId(sub.id);
          setTarget(sub.targetAttendance);
        }}
        onClose={() => setSelectorVisible(false)}
      />
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
  gaugeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    marginBottom: 16,
    gap: 16,
    shadowColor: '#0745E8',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  gaugeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  gaugeRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#FFFFFF',
    borderWidth: 5,
    borderColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0745E8',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  gaugePctText: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  gaugeSubText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  gaugeHeaderMeta: {
    flex: 1,
    gap: 4,
  },
  selectedSubjectHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  gaugeFormulaSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  graphicalBarSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  graphicalBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  barMarkerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  barTrack: {
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    position: 'relative',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  barThresholdLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#FFFFFF',
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statTile: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLbl: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  subjectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  subjectIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  subjectCode: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0745E8',
  },
  changeSubjectBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  subjectName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  targetSection: {
    marginBottom: 16,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  targetPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  targetPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  targetPillActive: {
    backgroundColor: '#0745E8',
    borderColor: '#0745E8',
  },
  targetPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  targetPillTextActive: {
    color: '#FFFFFF',
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
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
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  modeTabTextActive: {
    color: '#0745E8',
  },
  projectionHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    padding: 18,
    marginBottom: 16,
    gap: 14,
    shadowColor: '#0745E8',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  projectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  projectionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projSubLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0745E8',
    letterSpacing: 0.5,
  },
  projHeroValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  projExplanationBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  projExplanationText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
    fontWeight: '500',
  },
  projFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  projFooterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  projFooterVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0745E8',
  },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 6,
  },
  breakdownTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  breakdownTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  breakdownText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
});
