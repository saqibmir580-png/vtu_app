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
import { useAcademicRecordStore } from '@/features/calculators';
import {
  getCollegesApiFunction,
  getBranchesApiFunction,
  getSchemesApiFunction,
  getSemestersApiFunction,
  saveStudentProfileApiFunction,
} from '../apifunction/apiFunction';

export const OnboardingScreen: React.FC = () => {
  const router = useRouter();
  const { user, updateProfile } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [loadingMaster, setLoadingMaster] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Master Data State (Populated dynamically from Admin Backend)
  const [colleges, setColleges] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [schemes, setSchemes] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([1, 2, 3, 4, 5, 6, 7, 8]);

  // Search & Active Selections - NONE PRE-SELECTED! User actively selects them.
  const [collegeSearch, setCollegeSearch] = useState('');
  const [selectedCollegeCode, setSelectedCollegeCode] = useState<string>('');
  const [selectedCollegeName, setSelectedCollegeName] = useState<string>('');
  const [selectedBranchCode, setSelectedBranchCode] = useState<string>('');
  const [selectedBranchName, setSelectedBranchName] = useState<string>('');
  const [selectedSchemeYear, setSelectedSchemeYear] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);

  // Custom / Manual College Form State
  const [showAddCollegeForm, setShowAddCollegeForm] = useState(false);
  const [customCollegeName, setCustomCollegeName] = useState('');
  const [customCollegeCode, setCustomCollegeCode] = useState('');
  const [customCollegeRegion, setCustomCollegeRegion] = useState('');

  // Fallback Manual Branch / Scheme Input (when admin hasn't seeded master records)
  const [showManualBranch, setShowManualBranch] = useState(false);
  const [manualBranchCode, setManualBranchCode] = useState('');
  const [showManualScheme, setShowManualScheme] = useState(false);
  const [manualSchemeYear, setManualSchemeYear] = useState('');

  // Step 3 Fields
  const [usn, setUsn] = useState(user?.usn || '');
  const [dob, setDob] = useState(user?.dob || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentCgpa, setCurrentCgpa] = useState<string>(
    user?.currentCgpa && user.currentCgpa > 0 ? String(user.currentCgpa) : ''
  );

  // Fetch Live Master Data from Admin Panel Backend
  useEffect(() => {
    let isMounted = true;
    const fetchMasterData = async () => {
      setLoadingMaster(true);
      try {
        const [cList, bList, sList, semList] = await Promise.all([
          getCollegesApiFunction(),
          getBranchesApiFunction(),
          getSchemesApiFunction(),
          getSemestersApiFunction(),
        ]);

        if (isMounted) {
          if (Array.isArray(cList) && cList.length > 0) {
            setColleges(cList);
          }
          if (Array.isArray(bList) && bList.length > 0) {
            setBranches(bList);
          }
          if (Array.isArray(sList) && sList.length > 0) {
            setSchemes(sList);
          }
          if (Array.isArray(semList) && semList.length > 0) {
            const mappedSems = semList
              .map((s: any) => (typeof s === 'number' ? s : s?.number || Number(s)))
              .filter((n: any) => typeof n === 'number' && !isNaN(n));
            if (mappedSems.length > 0) {
              setSemesters(mappedSems);
            }
          }
        }
      } catch (err) {
        console.warn('Master data fetch note:', err);
      } finally {
        if (isMounted) setLoadingMaster(false);
      }
    };

    fetchMasterData();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredColleges = colleges.filter((c) => {
    const q = collegeSearch.toLowerCase().trim();
    if (!q) return true;
    const codeMatch = c.code ? c.code.toLowerCase().includes(q) : false;
    const nameMatch = c.name ? c.name.toLowerCase().includes(q) : false;
    const regionMatch = c.region ? c.region.toLowerCase().includes(q) : false;
    return codeMatch || nameMatch || regionMatch;
  });

  const handleSelectCollege = (col: any) => {
    setSelectedCollegeCode(col.code);
    setSelectedCollegeName(col.name);
    setShowAddCollegeForm(false);
    setErrorMsg(null);
  };

  const handleSaveCustomCollege = () => {
    const trimmedName = customCollegeName.trim();
    if (!trimmedName || trimmedName.length < 3) {
      setErrorMsg('Please enter a valid College Name (minimum 3 characters).');
      return;
    }

    const trimmedCode = customCollegeCode.trim().toUpperCase();
    const derivedCode =
      trimmedCode ||
      trimmedName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .substring(0, 4)
        .toUpperCase() ||
      'COL';

    const newCollege = {
      code: derivedCode,
      name: trimmedName,
      region: customCollegeRegion.trim() || 'Karnataka',
      isCustom: true,
    };

    setColleges((prev) => {
      const exists = prev.some((c) => c.code.toUpperCase() === derivedCode);
      return exists ? prev : [newCollege, ...prev];
    });

    setSelectedCollegeCode(newCollege.code);
    setSelectedCollegeName(newCollege.name);
    setShowAddCollegeForm(false);
    setErrorMsg(null);
  };

  const handleNextStep = () => {
    setErrorMsg(null);

    if (step === 1) {
      if (!selectedCollegeCode) {
        setErrorMsg('Please select your Engineering College or add your college manually below.');
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      const effectiveBranch = selectedBranchCode || manualBranchCode.trim().toUpperCase();
      const effectiveScheme = selectedSchemeYear || manualSchemeYear.trim();

      if (!effectiveBranch) {
        setErrorMsg('Please select your Engineering Branch to continue.');
        return;
      }
      if (!effectiveScheme) {
        setErrorMsg('Please select your Academic Scheme to continue.');
        return;
      }
      if (!selectedSemester) {
        setErrorMsg('Please select your Current Semester.');
        return;
      }

      if (!selectedBranchCode && manualBranchCode.trim()) {
        setSelectedBranchCode(manualBranchCode.trim().toUpperCase());
      }
      if (!selectedSchemeYear && manualSchemeYear.trim()) {
        setSelectedSchemeYear(manualSchemeYear.trim());
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

    let parsedCgpa: number | undefined = undefined;
    if (currentCgpa && currentCgpa.trim()) {
      const num = parseFloat(currentCgpa.trim());
      if (isNaN(num) || num < 0 || num > 10) {
        setErrorMsg('Please enter a valid Current CGPA between 0.00 and 10.00');
        return;
      }
      parsedCgpa = parseFloat(num.toFixed(2));
    }

    setSubmitting(true);
    try {
      const selectedCollegeObj = colleges.find((c) => c.code === selectedCollegeCode);
      const effectiveCollegeName = selectedCollegeName || selectedCollegeObj?.name || selectedCollegeCode;
      const selectedBranchObj = branches.find((b) => b.code === selectedBranchCode);
      const effectiveBranchName = selectedBranchName || selectedBranchObj?.name || selectedBranchCode;

      const payload = {
        usn: usn.toUpperCase().trim(),
        collegeCode: selectedCollegeCode,
        collegeName: effectiveCollegeName,
        branchCode: selectedBranchCode,
        schemeYear: selectedSchemeYear,
        semester: selectedSemester || 1,
        phone: phone.trim(),
        dob,
        currentCgpa: parsedCgpa,
      };

      try {
        await saveStudentProfileApiFunction(payload);
      } catch (apiErr: any) {
        console.warn('API save note:', apiErr?.message);
      }

      // Update local auth profile store
      updateProfile({
        usn: payload.usn,
        college: effectiveCollegeName,
        collegeCode: selectedCollegeCode,
        collegeName: effectiveCollegeName,
        branch: effectiveBranchName,
        branchCode: selectedBranchCode,
        scheme: `${selectedSchemeYear} Scheme`,
        schemeYear: selectedSchemeYear,
        semester: selectedSemester || 1,
        phone,
        dob,
        currentCgpa: parsedCgpa,
        isOnboarded: true,
      });

      // Synchronize current CGPA into Calculator store if entered
      if (parsedCgpa !== undefined && parsedCgpa > 0) {
        useAcademicRecordStore.getState().setDirectCgpa(parsedCgpa);
      }

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
                <Image
                  source={require('../../../../assets/vtu_ultima_logo.png')}
                  style={styles.logoImage}
                  contentFit="contain"
                />
                <View style={styles.headerTitleTextWrapper}>
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
                  <Text style={[styles.stepLabel, step >= 3 && styles.activeStepLabel]}>USN & CGPA</Text>
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
                <View style={styles.stepHeaderGroup}>
                  <Text style={styles.stepTitle}>Step 1: Select your Institution 🏫</Text>
                  <Text style={styles.stepSub}>
                    Fetched directly from VTU Colleges Master Directory.
                  </Text>
                </View>

                {/* Currently Selected College Indicator */}
                {selectedCollegeCode ? (
                  <View style={styles.selectedBanner}>
                    <View style={styles.selectedBannerLeft}>
                      <View style={styles.selectedBadge}>
                        <Text style={styles.selectedBadgeText}>{selectedCollegeCode}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.selectedCollegeName} numberOfLines={1}>
                          {selectedCollegeName || selectedCollegeCode}
                        </Text>
                        <Text style={styles.selectedCollegeSub}>Selected Institution</Text>
                      </View>
                    </View>
                    <Feather name="check-circle" size={20} color="#16A34A" />
                  </View>
                ) : null}

                {/* Search Box */}
                <View style={styles.searchBox}>
                  <Feather name="search" size={18} color="#64748B" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search College Code or Name (e.g. 1VA, RVCE)..."
                    placeholderTextColor="#94A3B8"
                    value={collegeSearch}
                    onChangeText={setCollegeSearch}
                  />
                  {collegeSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setCollegeSearch('')}>
                      <Feather name="x-circle" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Manual Add College Toggle Button */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.addCollegeToggleBtn}
                  onPress={() => {
                    setShowAddCollegeForm(!showAddCollegeForm);
                    setErrorMsg(null);
                  }}
                >
                  <Feather
                    name={showAddCollegeForm ? 'minus-circle' : 'plus-circle'}
                    size={16}
                    color="#0953E8"
                  />
                  <Text style={styles.addCollegeToggleText}>
                    {showAddCollegeForm
                      ? 'Hide Manual College Form'
                      : "Can't find your college? Add your college manually"}
                  </Text>
                </TouchableOpacity>

                {/* Custom College Entry Form Card */}
                {showAddCollegeForm && (
                  <View style={styles.customCollegeCard}>
                    <View style={styles.customCollegeHeader}>
                      <Feather name="edit-3" size={16} color="#0953E8" />
                      <Text style={styles.customCollegeTitle}>Add Your Engineering College</Text>
                    </View>
                    <Text style={styles.customCollegeHint}>
                      Enter your college details. It will be saved to your profile and the VTU master directory.
                    </Text>

                    <View style={styles.customFieldContainer}>
                      <Text style={styles.customFieldLabel}>College Full Name *</Text>
                      <TextInput
                        style={styles.customInput}
                        placeholder="e.g. Cambridge Institute of Technology"
                        placeholderTextColor="#94A3B8"
                        value={customCollegeName}
                        onChangeText={setCustomCollegeName}
                      />
                    </View>

                    <View style={styles.customFieldRow}>
                      <View style={[styles.customFieldContainer, { flex: 1 }]}>
                        <Text style={styles.customFieldLabel}>VTU Code (Optional)</Text>
                        <TextInput
                          style={styles.customInput}
                          placeholder="e.g. 1CD"
                          placeholderTextColor="#94A3B8"
                          value={customCollegeCode}
                          onChangeText={(txt) => setCustomCollegeCode(txt.toUpperCase())}
                          autoCapitalize="characters"
                        />
                      </View>
                      <View style={[styles.customFieldContainer, { flex: 1.4 }]}>
                        <Text style={styles.customFieldLabel}>City / Region (Optional)</Text>
                        <TextInput
                          style={styles.customInput}
                          placeholder="e.g. Bengaluru"
                          placeholderTextColor="#94A3B8"
                          value={customCollegeRegion}
                          onChangeText={setCustomCollegeRegion}
                        />
                      </View>
                    </View>

                    <View style={styles.customBtnRow}>
                      <TouchableOpacity
                        style={styles.cancelCustomBtn}
                        onPress={() => setShowAddCollegeForm(false)}
                      >
                        <Text style={styles.cancelCustomText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.saveCustomBtn}
                        onPress={handleSaveCustomCollege}
                      >
                        <Text style={styles.saveCustomText}>Save & Select College</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* College List or Loading Indicator */}
                {loadingMaster ? (
                  <View style={styles.loadingWrapper}>
                    <ActivityIndicator size="small" color="#0953E8" />
                    <Text style={styles.loadingText}>Fetching Colleges from Master Directory...</Text>
                  </View>
                ) : (
                  <View style={styles.collegeList}>
                    {filteredColleges.length === 0 ? (
                      <View style={styles.emptyCard}>
                        <Feather name="search" size={24} color="#94A3B8" />
                        <Text style={styles.emptyTitle}>
                          {colleges.length === 0
                            ? 'No colleges found in directory yet'
                            : 'No colleges match your search'}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                          You can add your college manually using the button above to proceed.
                        </Text>
                      </View>
                    ) : (
                      filteredColleges.map((col) => {
                        const isSelected = selectedCollegeCode === col.code;
                        return (
                          <TouchableOpacity
                            key={col.code}
                            activeOpacity={0.85}
                            style={[styles.collegeCard, isSelected && styles.activeCollegeCard]}
                            onPress={() => handleSelectCollege(col)}
                          >
                            <View style={[styles.codeBadge, isSelected && styles.activeCodeBadge]}>
                              <Text style={[styles.codeText, isSelected && styles.activeCodeText]}>
                                {col.code}
                              </Text>
                            </View>
                            <View style={styles.collegeMeta}>
                              <Text
                                style={[styles.collegeName, isSelected && styles.activeCollegeName]}
                              >
                                {col.name}
                              </Text>
                              <Text style={styles.collegeRegion}>
                                📍 {col.region || 'Karnataka'} • VTU Affiliated
                              </Text>
                            </View>
                            {isSelected && <Feather name="check-circle" size={20} color="#0953E8" />}
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>
                )}

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[
                    styles.nextButton,
                    !selectedCollegeCode && styles.disabledNextButton,
                  ]}
                  onPress={handleNextStep}
                >
                  <Text style={styles.nextButtonText}>Continue to Branch & Scheme ➔</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 2: Select Branch, Scheme & Semester */}
            {step === 2 && (
              <View style={styles.stepContent}>
                <View style={styles.stepHeaderGroup}>
                  <Text style={styles.stepTitle}>Step 2: Branch & Academic Scheme 🎓</Text>
                  <Text style={styles.stepSub}>
                    Select your engineering domain and active VTU regulations.
                  </Text>
                </View>

                {/* Branch Selection */}
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.fieldLabel}>Select Engineering Branch *</Text>
                    {selectedBranchCode ? (
                      <Text style={styles.selectedInlineText}>Selected: {selectedBranchCode}</Text>
                    ) : null}
                  </View>

                  {loadingMaster ? (
                    <ActivityIndicator size="small" color="#0953E8" style={{ marginVertical: 8 }} />
                  ) : branches.length > 0 ? (
                    <View style={styles.chipRow}>
                      {branches.map((b) => {
                        const isSelected = selectedBranchCode === b.code;
                        return (
                          <TouchableOpacity
                            key={b.code}
                            activeOpacity={0.8}
                            style={[styles.chip, isSelected && styles.activeChip]}
                            onPress={() => {
                              setSelectedBranchCode(b.code);
                              setSelectedBranchName(b.name || b.code);
                              setShowManualBranch(false);
                            }}
                          >
                            <Text style={[styles.chipText, isSelected && styles.activeChipText]}>
                              {b.code}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : null}

                  {/* Manual Branch Option if branches is empty or user wants other branch */}
                  <TouchableOpacity
                    style={styles.manualToggle}
                    onPress={() => setShowManualBranch(!showManualBranch)}
                  >
                    <Text style={styles.manualToggleText}>
                      {showManualBranch
                        ? '− Close manual branch input'
                        : "+ Can't find your branch? Enter branch code"}
                    </Text>
                  </TouchableOpacity>

                  {showManualBranch && (
                    <View style={styles.manualInputRow}>
                      <TextInput
                        style={styles.manualInput}
                        placeholder="e.g. AIML, CSE, ECE, ME"
                        placeholderTextColor="#94A3B8"
                        value={manualBranchCode}
                        onChangeText={(txt) => {
                          setManualBranchCode(txt.toUpperCase());
                          setSelectedBranchCode(txt.toUpperCase());
                          setSelectedBranchName(txt.toUpperCase());
                        }}
                        autoCapitalize="characters"
                      />
                    </View>
                  )}
                </View>

                {/* Scheme Selection */}
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.fieldLabel}>Select Academic Scheme *</Text>
                    {selectedSchemeYear ? (
                      <Text style={styles.selectedInlineText}>{selectedSchemeYear} Scheme</Text>
                    ) : null}
                  </View>

                  {schemes.length > 0 ? (
                    <View style={styles.schemeGrid}>
                      {schemes.map((s) => {
                        const sYear = String(s.schemeYear || s);
                        const isSelected = selectedSchemeYear === sYear;
                        return (
                          <TouchableOpacity
                            key={sYear}
                            activeOpacity={0.8}
                            style={[styles.schemeCard, isSelected && styles.activeSchemeCard]}
                            onPress={() => {
                              setSelectedSchemeYear(sYear);
                              setShowManualScheme(false);
                            }}
                          >
                            <Text
                              style={[
                                styles.schemeTitle,
                                isSelected && styles.activeSchemeTitle,
                              ]}
                            >
                              {sYear} Scheme
                            </Text>
                            <Text
                              style={[styles.schemeSub, isSelected && styles.activeSchemeSub]}
                            >
                              {sYear === '2022' ? 'NEP Syllabus' : 'CBCS Syllabus'}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : (
                    // Default fallback options if no schemes configured in DB yet
                    <View style={styles.schemeGrid}>
                      {['2022', '2021', '2018'].map((sYear) => {
                        const isSelected = selectedSchemeYear === sYear;
                        return (
                          <TouchableOpacity
                            key={sYear}
                            activeOpacity={0.8}
                            style={[styles.schemeCard, isSelected && styles.activeSchemeCard]}
                            onPress={() => setSelectedSchemeYear(sYear)}
                          >
                            <Text
                              style={[
                                styles.schemeTitle,
                                isSelected && styles.activeSchemeTitle,
                              ]}
                            >
                              {sYear} Scheme
                            </Text>
                            <Text
                              style={[styles.schemeSub, isSelected && styles.activeSchemeSub]}
                            >
                              {sYear === '2022' ? 'NEP Syllabus' : 'CBCS Syllabus'}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* Semester Selection Grid */}
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.fieldLabel}>Current Semester *</Text>
                    {selectedSemester ? (
                      <Text style={styles.selectedInlineText}>Semester {selectedSemester}</Text>
                    ) : null}
                  </View>
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
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[
                      styles.nextButton,
                      { flex: 1 },
                      (!selectedBranchCode || !selectedSchemeYear || !selectedSemester) &&
                        styles.disabledNextButton,
                    ]}
                    onPress={handleNextStep}
                  >
                    <Text style={styles.nextButtonText}>Continue ➔</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* STEP 3: USN, Current CGPA & Verification */}
            {step === 3 && (
              <View style={styles.stepContent}>
                <View style={styles.stepHeaderGroup}>
                  <Text style={styles.stepTitle}>Step 3: Verification & CGPA 🆔</Text>
                  <Text style={styles.stepSub}>
                    Provide your VTU Seat Number and initialize your academic records.
                  </Text>
                </View>

                {/* Selected Summary Card */}
                <View style={styles.summaryCard}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>College</Text>
                    <Text style={styles.summaryVal} numberOfLines={1}>
                      {selectedCollegeName || selectedCollegeCode}
                    </Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryRow}>
                    <View style={styles.summarySubItem}>
                      <Text style={styles.summaryLabel}>Branch</Text>
                      <Text style={styles.summaryVal}>{selectedBranchCode}</Text>
                    </View>
                    <View style={styles.summarySubItem}>
                      <Text style={styles.summaryLabel}>Scheme</Text>
                      <Text style={styles.summaryVal}>{selectedSchemeYear}</Text>
                    </View>
                    <View style={styles.summarySubItem}>
                      <Text style={styles.summaryLabel}>Semester</Text>
                      <Text style={styles.summaryVal}>Sem {selectedSemester}</Text>
                    </View>
                  </View>
                </View>

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

                {/* Current CGPA Field (Added for user setup) */}
                <View style={styles.inputContainer}>
                  <View style={styles.labelWithHintRow}>
                    <Text style={styles.fieldLabel}>Current CGPA (Optional)</Text>
                    <Text style={styles.fieldHintBadge}>0.00 – 10.00 scale</Text>
                  </View>
                  <View style={styles.inputBox}>
                    <Feather name="award" size={18} color="#64748B" style={styles.icon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 8.45"
                      placeholderTextColor="#94A3B8"
                      value={currentCgpa}
                      onChangeText={setCurrentCgpa}
                      keyboardType="decimal-pad"
                      maxLength={5}
                    />
                  </View>
                  <Text style={styles.fieldHelperText}>
                    Initializes your academic overview dashboard and SGPA goal calculator.
                  </Text>
                </View>

                {/* DatePicker for Date of Birth */}
                <DatePicker
                  label="Date of Birth *"
                  value={dob}
                  onChange={(selectedDate) => setDob(selectedDate)}
                  placeholder="Select Date of Birth"
                />

                {/* Mobile Phone Field */}
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
  headerTitleTextWrapper: {
    flex: 1,
  },
  logoImage: {
    width: 46,
    height: 46,
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
  stepHeaderGroup: {
    gap: 4,
  },
  stepTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
  },
  stepSub: {
    fontSize: 13,
    color: '#64748B',
  },
  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 14,
    padding: 12,
  },
  selectedBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  selectedBadge: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  selectedBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  selectedCollegeName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
  selectedCollegeSub: {
    fontSize: 11,
    color: '#16A34A',
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
  addCollegeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',
  },
  addCollegeToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0953E8',
  },
  customCollegeCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    padding: 14,
    gap: 10,
  },
  customCollegeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customCollegeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0953E8',
  },
  customCollegeHint: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  customFieldContainer: {
    gap: 4,
  },
  customFieldRow: {
    flexDirection: 'row',
    gap: 8,
  },
  customFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  customInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0F172A',
  },
  customBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelCustomBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelCustomText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  saveCustomBtn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#0953E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveCustomText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
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
  emptyCard: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
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
    borderColor: '#0953E8',
    backgroundColor: '#EFF6FF',
  },
  codeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  activeCodeBadge: {
    backgroundColor: '#0953E8',
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
    color: '#0953E8',
  },
  collegeRegion: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  sectionContainer: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedInlineText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0953E8',
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
    backgroundColor: '#0953E8',
    borderColor: '#0953E8',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  activeChipText: {
    color: '#FFFFFF',
  },
  manualToggle: {
    paddingVertical: 4,
  },
  manualToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0953E8',
  },
  manualInputRow: {
    marginTop: 4,
  },
  manualInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
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
    borderColor: '#0953E8',
  },
  schemeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  activeSchemeTitle: {
    color: '#0953E8',
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
    backgroundColor: '#0953E8',
    borderColor: '#0953E8',
  },
  semText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  activeSemText: {
    color: '#FFFFFF',
  },
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  summaryItem: {
    gap: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summarySubItem: {
    flex: 1,
    gap: 2,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  inputContainer: {
    gap: 6,
  },
  labelWithHintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldHintBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0953E8',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  fieldHelperText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
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
    backgroundColor: '#0953E8',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0953E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledNextButton: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
