import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuthStore, UserProfile } from '@/store';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
}) => {
  const { user, updateProfile } = useAuthStore();

  const [name, setName] = useState('');
  const [usn, setUsn] = useState('');
  const [college, setCollege] = useState('');
  const [branch, setBranch] = useState('CSE');
  const [semester, setSemester] = useState(5);
  const [scheme, setScheme] = useState('2022');
  const [targetCgpa, setTargetCgpa] = useState('9.20');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUsn(user.usn || '1VA21CS042');
      setCollege(user.college || 'Sai Vidya Institute of Technology');
      setBranch(user.branch || 'CSE');
      setSemester(user.semester || 5);
      setScheme(user.scheme || '2022');
      setTargetCgpa(user.targetCgpa ? String(user.targetCgpa) : '9.20');
    }
  }, [user, visible]);

  const branches = ['CSE', 'ISE', 'ECE', 'EEE', 'ME', 'CIV'];
  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];
  const schemes = ['2022', '2021', '2018', '2017'];

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter your full name.');
      return;
    }

    const parsedCgpa = parseFloat(targetCgpa);
    if (isNaN(parsedCgpa) || parsedCgpa < 0 || parsedCgpa > 10) {
      Alert.alert('Invalid CGPA', 'Target CGPA must be between 0.0 and 10.0.');
      return;
    }

    updateProfile({
      name: name.trim(),
      usn: usn.trim().toUpperCase(),
      college: college.trim(),
      branch,
      semester,
      scheme,
      targetCgpa: parsedCgpa,
    });

    Alert.alert('Profile Updated', 'Your academic details have been successfully saved!');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Academic Profile</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveHeaderBtn}>
            <Text style={styles.saveHeaderBtnText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={{ paddingBottom: 160 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Full Name Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Fardeen Khan"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* USN Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>VTU USN (University Seat Number)</Text>
            <TextInput
              style={styles.textInput}
              value={usn}
              onChangeText={setUsn}
              placeholder="e.g. 1VA21CS042"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
            />
          </View>

          {/* College Name Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>College / Institute Name</Text>
            <TextInput
              style={styles.textInput}
              value={college}
              onChangeText={setCollege}
              placeholder="e.g. Sai Vidya Institute of Technology"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Branch Chips */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Engineering Branch</Text>
            <View style={styles.chipsWrap}>
              {branches.map((b) => (
                <TouchableOpacity
                  key={b}
                  activeOpacity={0.8}
                  style={[styles.chip, branch === b && styles.chipActive]}
                  onPress={() => setBranch(b)}
                >
                  <Text style={[styles.chipText, branch === b && styles.chipTextActive]}>
                    {b}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Semester Chips */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Active Semester</Text>
            <View style={styles.chipsWrap}>
              {semesters.map((s) => (
                <TouchableOpacity
                  key={s}
                  activeOpacity={0.8}
                  style={[styles.chip, semester === s && styles.chipActive]}
                  onPress={() => setSemester(s)}
                >
                  <Text style={[styles.chipText, semester === s && styles.chipTextActive]}>
                    Sem {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Scheme Chips */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Curriculum Scheme</Text>
            <View style={styles.chipsWrap}>
              {schemes.map((sch) => (
                <TouchableOpacity
                  key={sch}
                  activeOpacity={0.8}
                  style={[styles.chip, scheme === sch && styles.chipActive]}
                  onPress={() => setScheme(sch)}
                >
                  <Text style={[styles.chipText, scheme === sch && styles.chipTextActive]}>
                    {sch} Scheme
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Target CGPA Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Target CGPA Goal</Text>
            <TextInput
              style={styles.textInput}
              value={targetCgpa}
              onChangeText={setTargetCgpa}
              keyboardType="decimal-pad"
              placeholder="e.g. 9.20"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.saveSubmitBtn}
            onPress={handleSave}
          >
            <Text style={styles.saveSubmitBtnText}>Save Profile Updates</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveHeaderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveHeaderBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0745E8',
  },
  formScroll: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  textInput: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#0F172A',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#0745E8',
    borderColor: '#0745E8',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  saveSubmitBtn: {
    height: 50,
    borderRadius: 16,
    backgroundColor: '#0745E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  saveSubmitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
