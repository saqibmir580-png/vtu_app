import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAttendanceStore } from '../store/useAttendanceStore';
import { AttendanceInput } from '../components/AttendanceInput';
import { TargetAttendanceSelector } from '../components/TargetAttendanceSelector';
import { fetchAdminCoursesFromApi, AdminSubjectItem } from '../api/attendanceApi';
import { useAuthStore } from '@/store';

interface AddSubjectModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AddSubjectModal: React.FC<AddSubjectModalProps> = ({
  visible,
  onClose,
}) => {
  const { user } = useAuthStore();
  const addSubject = useAttendanceStore((state) => state.addSubject);

  const studentSem = user?.semester || 5;
  const [selectedSemester, setSelectedSemester] = useState<number>(studentSem);

  const [availableSubjects, setAvailableSubjects] = useState<AdminSubjectItem[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<AdminSubjectItem | null>(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [attended, setAttended] = useState(24);
  const [conducted, setConducted] = useState(28);
  const [target, setTarget] = useState(85);
  const [error, setError] = useState<string | null>(null);

  // Fetch admin subjects whenever semester changes or modal opens
  useEffect(() => {
    if (visible) {
      loadSubjectsForSemester(selectedSemester);
    }
  }, [visible, selectedSemester]);

  const loadSubjectsForSemester = async (sem: number) => {
    setIsLoadingSubjects(true);
    try {
      const courses = await fetchAdminCoursesFromApi(sem, user?.branch);
      setAvailableSubjects(courses);
      if (courses.length > 0 && !selectedCourse) {
        setSelectedCourse(courses[0]);
      }
    } catch {
      // Fallback handled in API
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  const handleSelectCourse = (course: AdminSubjectItem) => {
    setSelectedCourse(course);
    setDropdownOpen(false);
    if (error) setError(null);
  };

  const filteredSubjects = availableSubjects.filter(
    (s) =>
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => {
    if (!selectedCourse) {
      setError('Please select a subject from the catalog.');
      return;
    }
    if (attended > conducted) {
      setError('Attended classes cannot be greater than conducted classes.');
      return;
    }

    setError(null);
    addSubject({
      subjectName: selectedCourse.name,
      subjectCode: selectedCourse.code,
      attendedClasses: attended,
      conductedClasses: conducted,
      targetAttendance: target,
      iconName: selectedCourse.code.includes('L') ? 'cpu' : 'book',
      iconBg: selectedCourse.code.includes('L') ? '#F0FDF4' : '#EEF2FF',
    });

    // Reset & close
    setAttended(24);
    setConducted(28);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheetContainer}>
          <View style={styles.handleBar} />

          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Add Attendance Subject</Text>
              <Text style={styles.headerSub}>Admin Catalog • Semester {selectedSemester}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Semester Filter Tabs */}
            <View style={styles.semFilterSection}>
              <Text style={styles.fieldLabel}>Filter by Semester:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.semChipsRow}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
                  const isActive = selectedSemester === sem;
                  return (
                    <TouchableOpacity
                      key={`sem-${sem}`}
                      style={[styles.semChip, isActive && styles.semChipActive]}
                      onPress={() => {
                        setSelectedSemester(sem);
                        setSelectedCourse(null);
                      }}
                    >
                      <Text style={[styles.semChipText, isActive && styles.semChipTextActive]}>
                        Sem {sem} {sem === studentSem ? '★' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Subject Selector Dropdown Trigger */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Course / Subject (Admin Catalog)</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.dropdownTrigger, dropdownOpen && styles.dropdownTriggerActive]}
                onPress={() => setDropdownOpen(!dropdownOpen)}
              >
                {selectedCourse ? (
                  <View style={styles.selectedCourseRow}>
                    <View style={styles.codePill}>
                      <Text style={styles.codePillText}>{selectedCourse.code}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.courseNameText} numberOfLines={1}>
                        {selectedCourse.name}
                      </Text>
                      <Text style={styles.courseSubText}>
                        {selectedCourse.type || 'Theory'} • {selectedCourse.credits} Credits
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.placeholderText}>
                    {isLoadingSubjects ? 'Loading subjects...' : 'Tap to select subject'}
                  </Text>
                )}
                <Feather
                  name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>

            {/* Dropdown Options List */}
            {dropdownOpen && (
              <View style={styles.dropdownContainer}>
                {/* Search in Dropdown */}
                <View style={styles.searchBox}>
                  <Feather name="search" size={16} color="#94A3B8" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search by code or title..."
                    placeholderTextColor="#94A3B8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Feather name="x" size={14} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>

                {isLoadingSubjects ? (
                  <View style={styles.dropdownLoading}>
                    <ActivityIndicator size="small" color="#0745E8" />
                    <Text style={styles.loadingText}>Fetching courses from admin catalog...</Text>
                  </View>
                ) : (
                  <View style={styles.optionsList}>
                    {filteredSubjects.map((item) => {
                      const isSelected = selectedCourse?.id === item.id;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                          onPress={() => handleSelectCourse(item)}
                        >
                          <View style={styles.optionLeft}>
                            <View style={[styles.optionCodePill, isSelected && styles.optionCodePillActive]}>
                              <Text style={[styles.optionCodeText, isSelected && styles.optionCodeTextActive]}>
                                {item.code}
                              </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.optionTitle, isSelected && styles.optionTitleActive]} numberOfLines={1}>
                                {item.name}
                              </Text>
                              <Text style={styles.optionMeta}>
                                {item.type || 'Course'} • {item.credits} Credits
                              </Text>
                            </View>
                          </View>
                          {isSelected && <Feather name="check" size={18} color="#0745E8" />}
                        </TouchableOpacity>
                      );
                    })}

                    {filteredSubjects.length === 0 && (
                      <View style={styles.emptyDropdown}>
                        <Text style={styles.emptyDropdownText}>No courses match "{searchQuery}"</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Total Conducted Classes Stepper */}
            <AttendanceInput
              label="Total Conducted Classes"
              subText="Total lectures delivered so far"
              value={conducted}
              onChangeValue={(v) => {
                setConducted(v);
                if (attended > v) setAttended(v);
              }}
              min={0}
            />

            {/* Classes You Attended Stepper */}
            <AttendanceInput
              label="Classes You Attended"
              subText="Total lectures you were present"
              value={attended}
              onChangeValue={(v) => {
                if (v <= conducted) setAttended(v);
              }}
              min={0}
            />

            {/* Target Attendance Selector */}
            <TargetAttendanceSelector selectedTarget={target} onSelectTarget={setTarget} />

            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* Submit Button */}
            <TouchableOpacity activeOpacity={0.9} style={styles.submitBtn} onPress={handleAdd}>
              <Feather name="plus-circle" size={18} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>Add Subject to Attendance</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  semFilterSection: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  semChipsRow: {
    gap: 6,
  },
  semChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  semChipActive: {
    backgroundColor: '#0745E8',
    borderColor: '#0745E8',
  },
  semChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  semChipTextActive: {
    color: '#FFFFFF',
  },
  fieldSection: {
    marginBottom: 14,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownTriggerActive: {
    borderColor: '#0745E8',
    backgroundColor: '#FAFCFF',
  },
  selectedCourseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  codePill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  codePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0745E8',
  },
  courseNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  courseSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  placeholderText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  dropdownContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    padding: 10,
    marginBottom: 16,
    maxHeight: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 2,
  },
  dropdownLoading: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
  },
  optionsList: {
    gap: 6,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
  },
  optionItemSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    borderWidth: 1,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  optionCodePill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  optionCodePillActive: {
    backgroundColor: '#0745E8',
  },
  optionCodeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
  },
  optionCodeTextActive: {
    color: '#FFFFFF',
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  optionTitleActive: {
    color: '#0745E8',
  },
  optionMeta: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  emptyDropdown: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyDropdownText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 10,
  },
  submitBtn: {
    height: 50,
    borderRadius: 16,
    backgroundColor: '#0745E8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    shadowColor: '#0745E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
