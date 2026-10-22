import React, { useState, useEffect } from 'react';
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
import { useAuthStore } from '@/store';
import { useAcademicRecordStore } from '@/features/calculators';
import { BranchSelector } from '../components/BranchSelector';
import { SemesterSelector } from '../components/SemesterSelector';
import { SchemeSelector } from '../components/SchemeSelector';
import { CollegeSelector } from '../components/CollegeSelector';
import { CGPAField } from '../components/CGPAField';
import { SaveButton } from '../components/SaveButton';
import { SuccessToast } from '../components/SuccessToast';

export const EditAcademicProfileScreen: React.FC = () => {
  const router = useRouter();
  const { user, updateProfile } = useAuthStore();
  const { currentCgpa, setDirectCgpa, loadAcademicRecords } = useAcademicRecordStore();

  const [college, setCollege] = useState(user?.college || 'Sai Vidya Institute of Technology');
  const [collegeCity, setCollegeCity] = useState(user?.collegeCity || 'Bengaluru');
  const [branch, setBranch] = useState(user?.branch || 'CSE');
  const [semester, setSemester] = useState(user?.semester || 5);
  const [scheme, setScheme] = useState(user?.scheme || '2022');
  const [cgpaText, setCgpaText] = useState(user?.currentCgpa ? String(user.currentCgpa) : currentCgpa ? String(currentCgpa) : '8.74');
  const [cgpaError, setCgpaError] = useState<string | null>(null);

  // Bottom sheets visibility states
  const [collegeSheetVisible, setCollegeSheetVisible] = useState(false);
  const [branchSheetVisible, setBranchSheetVisible] = useState(false);
  const [semesterSheetVisible, setSemesterSheetVisible] = useState(false);
  const [schemeSheetVisible, setSchemeSheetVisible] = useState(false);

  // Toast feedback state
  const [toastVisible, setToastVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAcademicRecords();
  }, []);

  useEffect(() => {
    if (user) {
      setCollege(user.college || 'Sai Vidya Institute of Technology');
      setCollegeCity(user.collegeCity || 'Bengaluru');
      setBranch(user.branch || 'CSE');
      setSemester(user.semester || 5);
      setScheme(user.scheme || '2022');
      const eff = user.currentCgpa || currentCgpa || 8.74;
      setCgpaText(String(eff));
    }
  }, [user, currentCgpa]);

  const handleSave = () => {
    const val = parseFloat(cgpaText);
    if (isNaN(val) || val < 0 || val > 10) {
      setCgpaError('CGPA must be a valid number between 0.00 and 10.00.');
      return;
    }
    setCgpaError(null);

    setSaving(true);
    setTimeout(() => {
      const rounded = Math.round(val * 100) / 100;
      updateProfile({
        college,
        collegeCity,
        branch,
        semester,
        scheme,
        currentCgpa: rounded,
      });
      setDirectCgpa(rounded);

      setSaving(false);
      setToastVisible(true);
      setTimeout(() => {
        router.back();
      }, 1200);
    }, 400);
  };

  return (
    <View style={styles.root}>
      <SuccessToast
        message="Academic profile updated successfully!"
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />

      {/* Header Bar */}
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>Edit Academic Profile</Text>
            <Text style={styles.headerSub}>Update College, Branch, Sem & CGPA</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* College & Location Trigger Row */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>VTU College & Location</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.selectorTrigger}
            onPress={() => setCollegeSheetVisible(true)}
          >
            <View style={styles.triggerLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
                <Feather name="map-pin" size={18} color="#0284C7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.triggerValue} numberOfLines={1}>
                  {college}
                </Text>
                <Text style={styles.triggerSub}>
                  Location: {collegeCity} • Tap to change college
                </Text>
              </View>
            </View>
            <Feather name="chevron-down" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Branch Trigger Row */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>Engineering Branch</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.selectorTrigger}
            onPress={() => setBranchSheetVisible(true)}
          >
            <View style={styles.triggerLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
                <Feather name="cpu" size={18} color="#0745E8" />
              </View>
              <View>
                <Text style={styles.triggerValue}>{branch}</Text>
                <Text style={styles.triggerSub}>Tap to change branch</Text>
              </View>
            </View>
            <Feather name="chevron-down" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Semester Trigger Row */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>Current Semester</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.selectorTrigger}
            onPress={() => setSemesterSheetVisible(true)}
          >
            <View style={styles.triggerLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#D1FAE5' }]}>
                <Feather name="book" size={18} color="#059669" />
              </View>
              <View>
                <Text style={styles.triggerValue}>Semester {semester}</Text>
                <Text style={styles.triggerSub}>Tap to select semester (1 - 8)</Text>
              </View>
            </View>
            <Feather name="chevron-down" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Scheme Trigger Row */}
        <View style={styles.fieldSection}>
          <Text style={styles.fieldLabel}>Curriculum Scheme</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.selectorTrigger}
            onPress={() => setSchemeSheetVisible(true)}
          >
            <View style={styles.triggerLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                <Feather name="layers" size={18} color="#D97706" />
              </View>
              <View>
                <Text style={styles.triggerValue}>{scheme} Scheme</Text>
                <Text style={styles.triggerSub}>Tap to select scheme</Text>
              </View>
            </View>
            <Feather name="chevron-down" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* CGPA Numeric Field */}
        <View style={styles.fieldSection}>
          <CGPAField
            value={cgpaText}
            onChangeText={(t) => {
              setCgpaText(t);
              if (cgpaError) setCgpaError(null);
            }}
            error={cgpaError}
          />
        </View>
      </ScrollView>

      {/* Sticky Save Action */}
      <SafeAreaView edges={['bottom']} style={styles.footerSafeArea}>
        <SaveButton label="Save Changes" loading={saving} onPress={handleSave} />
      </SafeAreaView>

      {/* Bottom Sheet Selectors */}
      <CollegeSelector
        visible={collegeSheetVisible}
        selectedCollege={college}
        selectedCity={collegeCity}
        onSelect={(colName, colCity) => {
          setCollege(colName);
          setCollegeCity(colCity);
        }}
        onClose={() => setCollegeSheetVisible(false)}
      />

      <BranchSelector
        visible={branchSheetVisible}
        selectedBranch={branch}
        onSelect={(b) => setBranch(b)}
        onClose={() => setBranchSheetVisible(false)}
      />

      <SemesterSelector
        visible={semesterSheetVisible}
        selectedSemester={semester}
        onSelect={(s) => setSemester(s)}
        onClose={() => setSemesterSheetVisible(false)}
      />

      <SchemeSelector
        visible={schemeSheetVisible}
        selectedScheme={scheme}
        onSelect={(sch) => setScheme(sch)}
        onClose={() => setSchemeSheetVisible(false)}
      />
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  fieldSection: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  selectorTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  triggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  triggerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  footerSafeArea: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
});
