import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { DatePicker } from '@/components/ui/DatePicker';
import { storageService } from '@/infrastructure/storage/storage.service';
import { useAuth } from '../hooks/useAuth';
import {
  getCollegesApiFunction,
  getBranchesApiFunction,
  getSchemesApiFunction,
  getSemestersApiFunction,
  saveStudentProfileApiFunction,
} from '../apifunction/apiFunction';

// Default Master Data Fallbacks
const DEFAULT_COLLEGES = [
  { code: '1VA', name: 'Sai Vidya Institute of Technology', region: 'Bengaluru' },
  { code: '1RV', name: 'RV College of Engineering', region: 'Bengaluru' },
  { code: '1BMS', name: 'BMS Institute of Technology', region: 'Bengaluru' },
  { code: '1MS', name: 'MS Ramaiah Institute of Technology', region: 'Bengaluru' },
];

const DEFAULT_BRANCHES = [
  { code: 'CSE', name: 'Computer Science & Engg' },
  { code: 'ECE', name: 'Electronics & Comm.' },
  { code: 'ISE', name: 'Information Science' },
  { code: 'AIML', name: 'AI & Machine Learning' },
  { code: 'ME', name: 'Mechanical Engg' },
  { code: 'CV', name: 'Civil Engineering' },
];

const DEFAULT_SCHEMES = [
  { schemeYear: '2022', name: 'NEP 2022 Scheme' },
  { schemeYear: '2021', name: 'CBCS 2021 Scheme' },
  { schemeYear: '2018', name: 'CBCS 2018 Scheme' },
];

export const OnboardingScreen: React.FC = () => {
  const router = useRouter();
  const { user, updateProfile, setAuth } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [loadingMaster, setLoadingMaster] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Master Data State
  const [colleges, setColleges] = useState<any[]>(DEFAULT_COLLEGES);
  const [branches, setBranches] = useState<any[]>(DEFAULT_BRANCHES);
  const [schemes, setSchemes] = useState<any[]>(DEFAULT_SCHEMES);
  const [semesters, setSemesters] = useState<any[]>([1, 2, 3, 4, 5, 6, 7, 8]);

  // Search & Form State
  const [collegeSearch, setCollegeSearch] = useState('');
  const [selectedCollegeCode, setSelectedCollegeCode] = useState('1VA');
  const [selectedBranchCode, setSelectedBranchCode] = useState('CSE');
  const [selectedSchemeYear, setSelectedSchemeYear] = useState('2022');
  const [selectedSemester, setSelectedSemester] = useState<number>(5);

  const [usn, setUsn] = useState(user?.usn || '');
  const [dob, setDob] = useState(user?.dob || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // Fetch Live Master Data from Admin Panel Backend
  useEffect(() => {
    const fetchMasterData = async () => {
      setLoadingMaster(true);
      try {
        const [cList, bList, sList, semList] = await Promise.all([
          getCollegesApiFunction(),
          getBranchesApiFunction(),
          getSchemesApiFunction(),
          getSemestersApiFunction(),
        ]);

        if (cList.length > 0) setColleges(cList);
        if (bList.length > 0) setBranches(bList);
        if (sList.length > 0) setSchemes(sList);
        if (semList.length > 0) {
          setSemesters(semList.map((s) => s.number || s));
        }
      } catch (err) {
        // Keep defaults if network fails
      } finally {
        setLoadingMaster(false);
      }
    };

    fetchMasterData();
  }, []);

  const filteredColleges = colleges.filter(
    (c) =>
      c.code.toLowerCase().includes(collegeSearch.toLowerCase()) ||
      c.name.toLowerCase().includes(collegeSearch.toLowerCase()) ||
      (c.region && c.region.toLowerCase().includes(collegeSearch.toLowerCase()))
  );

  const handleNextStep = () => {
    setErrorMsg(null);
    if (step === 1) {
      if (!selectedCollegeCode) {
        setErrorMsg('Please select your Engineering College to proceed.');
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!selectedBranchCode || !selectedSchemeYear) {
        setErrorMsg('Please select your Branch and VTU Scheme.');
        return;
      }
      setStep(3);
      return;
    }
  };

  const handleCompleteOnboarding = async () => {
    setErrorMsg(null);
    if (!usn || usn.trim().length < 5) {
      setErrorMsg('Please enter your valid VTU USN Number (e.g. 1VA21CS001).');
      return;
    }

    if (!dob) {
      setErrorMsg('Please select your Date of Birth.');
      return;
    }

    setSubmitting(true);
    try {
      const selectedCollegeObj = colleges.find((c) => c.code === selectedCollegeCode);
      const selectedBranchObj = branches.find((b) => b.code === selectedBranchCode);

      const payload = {
        usn: usn.toUpperCase().trim(),
        collegeCode: selectedCollegeCode,
        branchCode: selectedBranchCode,
        schemeYear: selectedSchemeYear,
        semester: selectedSemester,
        phone,
        dob,
      };

      try {
        await saveStudentProfileApiFunction(payload);
      } catch (apiErr: any) {
        console.warn('API save note:', apiErr?.message);
      }

      // Update local profile state
      updateProfile({
        usn: payload.usn,
        college: selectedCollegeObj ? selectedCollegeObj.name : selectedCollegeCode,
        collegeCode: selectedCollegeCode,
        branch: selectedBranchObj ? selectedBranchObj.name : selectedBranchCode,
        branchCode: selectedBranchCode,
        scheme: `${selectedSchemeYear} Scheme`,
        schemeYear: selectedSchemeYear,
        semester: selectedSemester,
        phone,
        dob,
        isOnboarded: true,
      });

      await storageService.setItem('vtu_onboarded', true);
      router.replace('/(tabs)/home');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save student profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0953E8" translucent />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} showsVerticalScrollIndicator={false}>
          {/* Top Royal Blue Header */}
          <LinearGradient
            colors={['#0953E8', '#0732B8', '#03176B']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.topHeader}
          >
            <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
              <View style={styles.headerTitleRow}>
                <Image source={require('../../../../assets/vtu_ultima_logo.png')} style={styles.logoImage} contentFit="contain" />
                <View>
                  <Text style={styles.headerTitle}>Academic Profile Setup</Text>
                  <Text style={styles.headerSubtitle}>Customize your VTU learning experience</Text>
                </View>
              </View>

              {/* Stepper Progress */}
              <View style={styles.stepperContainer}>
                <View style={styles.stepperRow}>
                  <View style={[styles.stepCircle, step >= 1 && styles.activeStepCircle]}>
                    <Text style={[styles.stepNumber, step >= 1 && styles.activeStepNumber]}>1</Text>
                  </View>
                  <View style={[styles.stepLine, step >= 2 && styles.activeStepLine]} />
                  <View style={[styles.stepCircle, step >= 2 && styles.activeStepCircle]}>
                    <Text style={[styles.stepNumber, step >= 2 && styles.activeStepNumber]}>2</Text>
                  </View>
                  <View style={[styles.stepLine, step >= 3 && styles.activeStepLine]} />
                  <View style={[styles.stepCircle, step >= 3 && styles.activeStepCircle]}>
                    <Text style={[styles.stepNumber, step >= 3 && styles.activeStepNumber]}>3</Text>
                  </View>
                </View>
                <View style={styles.labelsRow}>
                  <Text style={[styles.stepLabel, step >= 1 && styles.activeStepLabel]}>Select College</Text>
                  <Text style={[styles.stepLabel, step >= 2 && styles.activeStepLabel]}>Branch & Scheme</Text>
                  <Text style={[styles.stepLabel, step >= 3 && styles.activeStepLabel]}>USN & DOB</Text>
                </View>
              </View>
            </SafeAreaView>
          </LinearGradient>

          {/* Bottom Curved Sheet */}
          <View style={styles.whiteSheet}>
            {errorMsg ? (
              <View style={styles.errorBanner}>
                <Feather name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* STEP 1: Select College Master */}
            {step === 1 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Step 1: Select your Institution 🏫</Text>
                <Text style={styles.stepSub}>
                  Fetched live from VTU Admin Colleges Master Directory.
                </Text>

                <View style={styles.searchBox}>
                  <Feather name="search" size={18} color="#64748B" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search College Code or Name (e.g. 1VA, Sai Vidya)..."
                    placeholderTextColor="#94A3B8"
                    value={collegeSearch}
                    onChangeText={setCollegeSearch}
                  />
                </View>

                {loadingMaster ? (
                  <View style={styles.loadingWrapper}>
                    <ActivityIndicator size="small" color="#0745E8" />
                    <Text style={styles.loadingText}>Fetching Live Colleges Master Data...</Text>
                  </View>
                ) : (
                  <View style={styles.collegeList}>
                    {filteredColleges.map((col) => {
                      const isSelected = selectedCollegeCode === col.code;
                      return (
                        <TouchableOpacity
                          key={col.code}
                          activeOpacity={0.85}
                          style={[styles.collegeCard, isSelected && styles.activeCollegeCard]}
                          onPress={() => setSelectedCollegeCode(col.code)}
                        >
                          <View style={[styles.codeBadge, isSelected && styles.activeCodeBadge]}>
                            <Text style={[styles.codeText, isSelected && styles.activeCodeText]}>
                              {col.code}
                            </Text>
                          </View>
                          <View style={styles.collegeMeta}>
                            <Text style={[styles.collegeName, isSelected && styles.activeCollegeName]}>
                              {col.name}
                            </Text>
                            <Text style={styles.collegeRegion}>
                              📍 {col.region || 'Bengaluru Region'} • VTU Affiliated
                            </Text>
                          </View>
                          {isSelected && <Feather name="check-circle" size={20} color="#0745E8" />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                <TouchableOpacity activeOpacity={0.85} style={styles.nextButton} onPress={handleNextStep}>
                  <Text style={styles.nextButtonText}>Continue to Branch & Scheme ➔</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 2: Select Branch, Scheme & Semester */}
            {step === 2 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Step 2: Branch & Academic Scheme 🎓</Text>
                <Text style={styles.stepSub}>Select your engineering domain and active VTU regulations.</Text>

                {/* Branch Selection */}
                <View style={styles.sectionContainer}>
                  <Text style={styles.fieldLabel}>Select Engineering Branch *</Text>
                  <View style={styles.chipRow}>
                    {branches.map((b) => {
                      const isSelected = selectedBranchCode === b.code;
                      return (
                        <TouchableOpacity
                          key={b.code}
                          activeOpacity={0.8}
                          style={[styles.chip, isSelected && styles.activeChip]}
                          onPress={() => setSelectedBranchCode(b.code)}
                        >
                          <Text style={[styles.chipText, isSelected && styles.activeChipText]}>
                            {b.code}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Scheme Selection */}
                <View style={styles.sectionContainer}>
                  <Text style={styles.fieldLabel}>Select Academic Scheme *</Text>
                  <View style={styles.schemeGrid}>
                    {schemes.map((s) => {
                      const sYear = s.schemeYear || s;
                      const isSelected = selectedSchemeYear === sYear;
                      return (
                        <TouchableOpacity
                          key={sYear}
                          activeOpacity={0.8}
                          style={[styles.schemeCard, isSelected && styles.activeSchemeCard]}
                          onPress={() => setSelectedSchemeYear(sYear)}
                        >
                          <Text style={[styles.schemeTitle, isSelected && styles.activeSchemeTitle]}>
                            {sYear} Scheme
                          </Text>
                          <Text style={[styles.schemeSub, isSelected && styles.activeSchemeSub]}>
                            {sYear === '2022' ? 'NEP Syllabus' : 'CBCS Syllabus'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Semester Selection Grid */}
                <View style={styles.sectionContainer}>
                  <Text style={styles.fieldLabel}>Current Semester *</Text>
                  <View style={styles.semGrid}>
                    {semesters.map((semNum) => {
                      const isSelected = selectedSemester === semNum;
                      return (
                        <TouchableOpacity
                          key={semNum}
                          activeOpacity={0.8}
                          style={[styles.semChip, isSelected && styles.activeSemChip]}
                          onPress={() => setSelectedSemester(semNum)}
                        >
                          <Text style={[styles.semText, isSelected && styles.activeSemText]}>
                            Sem {semNum}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.backStepBtn} onPress={() => setStep(1)}>
                    <Text style={styles.backStepText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.85} style={[styles.nextButton, { flex: 1 }]} onPress={handleNextStep}>
                    <Text style={styles.nextButtonText}>Continue ➔</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* STEP 3: USN, DOB & Finalize */}
            {step === 3 && (
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Step 3: Verification & USN 🆔</Text>
                <Text style={styles.stepSub}>Provide your VTU University Seat Number & Date of Birth.</Text>

                {/* USN Field */}
                <View style={styles.inputContainer}>
                  <Text style={styles.fieldLabel}>VTU USN Number *</Text>
                  <View style={styles.inputBox}>
                    <Feather name="credit-card" size={18} color="#64748B" style={styles.icon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 1VA21CS001"
                      placeholderTextColor="#94A3B8"
                      value={usn}
                      onChangeText={(txt) => setUsn(txt.toUpperCase())}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>

                {/* Custom DatePicker for Date of Birth */}
                <DatePicker
                  label="Date of Birth *"
                  value={dob}
                  onChange={(selectedDate) => setDob(selectedDate)}
                  placeholder="Select Date of Birth"
                />

                {/* Phone Field */}
                <View style={styles.inputContainer}>
                  <Text style={styles.fieldLabel}>Mobile Phone Number (Optional)</Text>
                  <View style={styles.inputBox}>
                    <Feather name="phone" size={18} color="#64748B" style={styles.icon} />
                    <TextInput
                      style={styles.input}
                      placeholder="+91 98765 43210"
                      placeholderTextColor="#94A3B8"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.backStepBtn} onPress={() => setStep(2)}>
                    <Text style={styles.backStepText}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[styles.nextButton, { flex: 1 }]}
                    onPress={handleCompleteOnboarding}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.nextButtonText}>Complete Setup 🚀</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#0953E8',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  headerSafeArea: {
    width: '100%',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    marginBottom: 14,
  },
  logoImage: {
    width: 48,
    height: 48,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  stepperContainer: {
    marginTop: 4,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeStepCircle: {
    backgroundColor: '#FFFFFF',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  activeStepNumber: {
    color: '#0745E8',
  },
  stepLine: {
    width: 60,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  activeStepLine: {
    backgroundColor: '#FFFFFF',
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 4,
  },
  stepLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  activeStepLabel: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  whiteSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -16,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 36,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  stepContent: {
    gap: 16,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  stepSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: -10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  loadingWrapper: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
  },
  collegeList: {
    gap: 10,
  },
  collegeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1.5,
    gap: 12,
  },
  activeCollegeCard: {
    borderColor: '#0745E8',
    backgroundColor: '#EFF6FF',
  },
  codeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  activeCodeBadge: {
    backgroundColor: '#0745E8',
  },
  codeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  activeCodeText: {
    color: '#FFFFFF',
  },
  collegeMeta: {
    flex: 1,
  },
  collegeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  activeCollegeName: {
    color: '#0745E8',
  },
  collegeRegion: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  sectionContainer: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  activeChip: {
    backgroundColor: '#0745E8',
    borderColor: '#0745E8',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  activeChipText: {
    color: '#FFFFFF',
  },
  schemeGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  schemeCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  activeSchemeCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0745E8',
  },
  schemeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  activeSchemeTitle: {
    color: '#0745E8',
  },
  schemeSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  activeSchemeSub: {
    color: '#1D4ED8',
  },
  semGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  semChip: {
    width: '23%',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  activeSemChip: {
    backgroundColor: '#0745E8',
    borderColor: '#0745E8',
  },
  semText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  activeSemText: {
    color: '#FFFFFF',
  },
  inputContainer: {
    gap: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  backStepBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backStepText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  nextButton: {
    backgroundColor: '#0745E8',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0745E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
