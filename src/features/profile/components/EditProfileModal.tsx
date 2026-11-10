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
  Image,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/store';
import { useAcademicRecordStore } from '@/features/calculators';
import { apiClient } from '@/infrastructure/api/client';

export const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/adventurer/png?seed=ScholarFelix&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/adventurer/png?seed=CoderAria&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/bottts/png?seed=VTUEngineer&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/adventurer/png?seed=CampusPro&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/bottts/png?seed=TechPioneer&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/adventurer/png?seed=DataScientist&backgroundColor=c0ebd7',
];

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
}) => {
  const { user, updateProfile } = useAuthStore();
  const { currentCgpa, setDirectCgpa } = useAcademicRecordStore();

  const [name, setName] = useState('');
  const [usn, setUsn] = useState('');
  const [college, setCollege] = useState('');
  const [branch, setBranch] = useState('CSE');
  const [semester, setSemester] = useState(5);
  const [scheme, setScheme] = useState('2022');
  const [currentCgpaInput, setCurrentCgpaInput] = useState('');
  const [selectedAvatarUri, setSelectedAvatarUri] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setUsn(user.usn || '1VA21CS042');
      setCollege(user.college || 'Sai Vidya Institute of Technology');
      setBranch(user.branch || 'CSE');
      setSemester(user.semester || 5);
      setScheme(user.scheme || '2022');
      const effectiveCgpa = (user?.currentCgpa && user.currentCgpa > 0) ? user.currentCgpa : (currentCgpa > 0 ? currentCgpa : 0);
      setCurrentCgpaInput(effectiveCgpa > 0 ? String(effectiveCgpa) : '');
      setSelectedAvatarUri(user.avatarUrl || PRESET_AVATARS[0]);
    }
  }, [user, currentCgpa, visible]);

  const branches = ['CSE', 'ISE', 'ECE', 'AIML', 'EEE', 'ME', 'CIV'];
  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];
  const schemes = ['2022', '2021', '2018', '2017'];

  // Gallery Picker
  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please allow gallery access to select a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedAvatarUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Selection Error', 'Could not open photo library.');
    }
  };

  // Camera Capture
  const handleTakeWithCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please allow camera access to take a profile photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedAvatarUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Camera Error', 'Could not start camera.');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter your full name.');
      return;
    }

    const parsedCgpa = parseFloat(currentCgpaInput);
    if (currentCgpaInput.trim() !== '' && (isNaN(parsedCgpa) || parsedCgpa < 0 || parsedCgpa > 10)) {
      Alert.alert('Invalid CGPA', 'Current CGPA must be a valid number between 0.00 and 10.00.');
      return;
    }

    const validCgpa = !isNaN(parsedCgpa) && parsedCgpa >= 0 && parsedCgpa <= 10 ? parsedCgpa : 0;

    setIsSaving(true);
    let resolvedAvatarUrl = selectedAvatarUri || user?.avatarUrl;

    try {
      // 1. Upload avatar if selected from local file
      const isLocalFile =
        selectedAvatarUri &&
        (selectedAvatarUri.startsWith('file:') || selectedAvatarUri.startsWith('content:'));

      if (isLocalFile) {
        try {
          const formData = new FormData();
          const filename = selectedAvatarUri.split('/').pop() || 'avatar.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';

          formData.append('avatar', {
            uri: selectedAvatarUri,
            name: filename,
            type,
          } as any);

          if (user?.id) {
            formData.append('userId', user.id);
          }

          const res: any = await apiClient.post('/users/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          resolvedAvatarUrl = res.data?.data?.avatarUrl || res.data?.avatarUrl || selectedAvatarUri;
        } catch (uploadErr) {
          console.warn('[Avatar Upload Network Warning]:', uploadErr);
        }
      } else if (selectedAvatarUri && selectedAvatarUri !== user?.avatarUrl) {
        try {
          await apiClient.post('/users/avatar', {
            avatarUrl: selectedAvatarUri,
            userId: user?.id,
          });
        } catch {
          // resilient fallback
        }
      }

      // 2. Direct Update to Academic Record Store (syncs CGPA Calculator & Dashboard immediately)
      if (currentCgpaInput.trim() !== '') {
        setDirectCgpa(validCgpa);
      }

      // 3. Update Auth Store immediately
      updateProfile({
        name: name.trim(),
        usn: usn.trim().toUpperCase(),
        college: college.trim(),
        branch,
        semester,
        scheme,
        currentCgpa: validCgpa,
        avatarUrl: resolvedAvatarUrl,
      });

      // 4. Sync Student Academic Profile with Backend
      try {
        await apiClient.post('/users/student-profile', {
          name: name.trim(),
          usn: usn.trim().toUpperCase(),
          collegeCode: college.trim(),
          branchCode: branch,
          semester,
          schemeYear: scheme,
          currentCgpa: validCgpa,
        });
      } catch (profileSyncErr) {
        console.warn('[Student Profile Sync Note]:', profileSyncErr);
      }

      Alert.alert('Profile Updated', 'Your profile details and CGPA have been updated successfully!');
      onClose();
    } finally {
      setIsSaving(false);
    }
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
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} disabled={isSaving}>
            <Feather name="x" size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Student Profile</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={styles.saveHeaderBtn}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#0745E8" />
            ) : (
              <Text style={styles.saveHeaderBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={{ paddingBottom: 160 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Profile Picture Selector */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarPreviewWrapper}>
              <Image
                source={{
                  uri:
                    selectedAvatarUri ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
                }}
                style={styles.avatarPreviewImg}
              />
              <View style={styles.avatarPencilBadge}>
                <Feather name="edit-2" size={12} color="#FFFFFF" />
              </View>
            </View>

            {/* Quick Action Buttons */}
            <View style={styles.avatarActionRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.avatarActionBtn}
                onPress={handlePickFromGallery}
              >
                <Feather name="image" size={14} color="#0745E8" />
                <Text style={styles.avatarActionText}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.avatarActionBtn}
                onPress={handleTakeWithCamera}
              >
                <Feather name="camera" size={14} color="#0745E8" />
                <Text style={styles.avatarActionText}>Camera</Text>
              </TouchableOpacity>
            </View>

            {/* Preset Avatars Carousel */}
            <Text style={styles.presetLabel}>Or choose an illustrated avatar:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetsList}
            >
              {PRESET_AVATARS.map((uri, idx) => {
                const isSelected = selectedAvatarUri === uri;
                return (
                  <TouchableOpacity
                    key={`preset-${idx}`}
                    activeOpacity={0.8}
                    style={[styles.presetItem, isSelected && styles.presetItemActive]}
                    onPress={() => setSelectedAvatarUri(uri)}
                  >
                    <Image source={{ uri }} style={styles.presetImg} />
                    {isSelected && (
                      <View style={styles.presetCheck}>
                        <Feather name="check" size={10} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.sectionDivider} />

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

          {/* Current CGPA Input */}
          <View style={styles.inputGroup}>
            <View style={styles.cgpaLabelRow}>
              <Text style={styles.inputLabel}>Current CGPA</Text>
              <Text style={styles.cgpaHint}>Syncs CGPA Calculator & Dashboard</Text>
            </View>
            <TextInput
              style={styles.textInput}
              value={currentCgpaInput}
              onChangeText={setCurrentCgpaInput}
              keyboardType="decimal-pad"
              placeholder="e.g. 8.75 (0.00 to 10.00)"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.saveSubmitBtn, isSaving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveSubmitBtnText}>Save Profile Updates</Text>
            )}
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
    minWidth: 44,
    alignItems: 'center',
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
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  avatarPreviewWrapper: {
    position: 'relative',
    width: 84,
    height: 84,
    borderRadius: 42,
    marginBottom: 12,
  },
  avatarPreviewImg: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: '#0745E8',
  },
  avatarPencilBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0745E8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatarActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  avatarActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0745E8',
  },
  presetLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  presetsList: {
    gap: 10,
    paddingBottom: 4,
  },
  presetItem: {
    position: 'relative',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  presetItemActive: {
    borderColor: '#0745E8',
    borderWidth: 2.5,
  },
  presetImg: {
    width: '100%',
    height: '100%',
  },
  presetCheck: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#0745E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },
  inputGroup: {
    marginBottom: 18,
  },
  cgpaLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cgpaHint: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0745E8',
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
