import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/store';
import { apiClient } from '@/infrastructure/api/client';

interface AvatarUploadModalProps {
  visible: boolean;
  onClose: () => void;
}

// Stylized student/scholar vector avatars (no real stock photos)
export const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/adventurer/png?seed=ScholarFelix&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/adventurer/png?seed=CoderAria&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/bottts/png?seed=VTUEngineer&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/adventurer/png?seed=CampusPro&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/bottts/png?seed=TechPioneer&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/adventurer/png?seed=DataScientist&backgroundColor=c0ebd7',
];

export const AvatarUploadModal: React.FC<AvatarUploadModalProps> = ({
  visible,
  onClose,
}) => {
  const { user, updateProfile } = useAuthStore();
  const [selectedUri, setSelectedUri] = useState<string>(user?.avatarUrl || PRESET_AVATARS[0]);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Sync with current user avatar on open
  React.useEffect(() => {
    if (user?.avatarUrl) {
      setSelectedUri(user.avatarUrl);
    }
  }, [user?.avatarUrl, visible]);

  // Gallery Picker: allowsEditing: false (No Crop Modal!)
  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please allow gallery access to select a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // NO crop modal
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedUri = result.assets[0].uri;
        // Update preview immediately, showing save button for confirmation
        setSelectedUri(pickedUri);
      }
    } catch {
      Alert.alert('Selection Error', 'Could not open photo library.');
    }
  };

  // Camera Capture: allowsEditing: false (No Crop Modal!)
  const handleTakeWithCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please allow camera access to take a profile photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false, // NO crop modal
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const capturedUri = result.assets[0].uri;
        setSelectedUri(capturedUri);
      }
    } catch {
      Alert.alert('Camera Error', 'Could not start camera.');
    }
  };

  // Upload and Save Profile Picture
  const handleSave = async () => {
    if (!selectedUri) return;
    setIsUploading(true);

    const isLocalFile = selectedUri.startsWith('file:') || selectedUri.startsWith('content:');

    try {
      if (isLocalFile) {
        // Upload to backend using Multer & Cloudinary middleware
        const formData = new FormData();
        const filename = selectedUri.split('/').pop() || 'avatar.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('avatar', {
          uri: selectedUri,
          name: filename,
          type,
        } as any);

        if (user?.id) {
          formData.append('userId', user.id);
        }

        const res: any = await apiClient.post('/users/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const serverUrl = res.data?.data?.avatarUrl || res.data?.avatarUrl || selectedUri;
        updateProfile({ avatarUrl: serverUrl });
      } else {
        // Selected one of the preset illustrated avatars
        updateProfile({ avatarUrl: selectedUri });

        // Sync preset selection to backend user record
        try {
          await apiClient.post('/users/avatar', {
            avatarUrl: selectedUri,
            userId: user?.id,
          });
        } catch {
          // Local profile is already safely updated
        }
      }

      Alert.alert('Success', 'Profile picture updated successfully!');
      onClose();
    } catch (err: any) {
      console.warn('Avatar upload error:', err);
      // Fallback: save locally in store & AsyncStorage
      updateProfile({ avatarUrl: selectedUri });
      Alert.alert('Updated', 'Profile picture updated locally.');
      onClose();
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheetContainer}>
          <View style={styles.handleBar} />

          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Update Profile Picture</Text>
              <Text style={styles.headerSub}>Choose an avatar or upload from your device</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Active Avatar Preview */}
          <View style={styles.previewBox}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{ uri: selectedUri }}
                style={styles.previewAvatar}
              />
              {isUploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              )}
            </View>
            <Text style={styles.previewName}>{user?.name || 'Student Avatar'}</Text>
          </View>

          {/* Mobile Device Gallery & Camera Action Buttons */}
          <View style={styles.deviceActionRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.deviceActionBtn}
              onPress={handlePickFromGallery}
            >
              <View style={[styles.deviceActionIcon, { backgroundColor: '#EEF2FF' }]}>
                <Feather name="image" size={18} color="#0745E8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.deviceActionTitle}>Choose from Gallery</Text>
                <Text style={styles.deviceActionSub}>Pick photo from device</Text>
              </View>
              <Feather name="chevron-right" size={16} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.deviceActionBtn}
              onPress={handleTakeWithCamera}
            >
              <View style={[styles.deviceActionIcon, { backgroundColor: '#F0FDF4' }]}>
                <Feather name="camera" size={18} color="#16A34A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.deviceActionTitle}>Take a Photo</Text>
                <Text style={styles.deviceActionSub}>Use phone camera</Text>
              </View>
              <Feather name="chevron-right" size={16} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Illustrated Presets Grid */}
          <Text style={styles.sectionLabel}>CHOOSE FROM AVATAR PRESETS</Text>
          <View style={styles.presetsGrid}>
            {PRESET_AVATARS.map((url, idx) => {
              const isSel = selectedUri === url;
              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.8}
                  style={[styles.presetItem, isSel && styles.presetItemSel]}
                  onPress={() => setSelectedUri(url)}
                >
                  <Image source={{ uri: url }} style={styles.presetImage} />
                  {isSel && (
                    <View style={styles.checkBadge}>
                      <Feather name="check" size={12} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.saveBtn, isUploading && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Feather name="check-circle" size={18} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Save Profile Picture</Text>
              </>
            )}
          </TouchableOpacity>
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
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
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBox: {
    alignItems: 'center',
    marginBottom: 18,
  },
  avatarWrapper: {
    position: 'relative',
    width: 86,
    height: 86,
    borderRadius: 43,
    marginBottom: 8,
  },
  previewAvatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 3,
    borderColor: '#0745E8',
    backgroundColor: '#F1F5F9',
  },
  previewName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'center',
    marginBottom: 24,
  },
  presetItem: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    position: 'relative',
    backgroundColor: '#F8FAFC',
  },
  presetItemSel: {
    borderColor: '#0745E8',
    backgroundColor: '#EEF2FF',
  },
  presetImage: {
    width: '100%',
    height: '100%',
    borderRadius: 27,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#0745E8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  saveBtn: {
    height: 50,
    borderRadius: 16,
    backgroundColor: '#0745E8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0745E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  deviceActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  deviceActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deviceActionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceActionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  deviceActionSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 43,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
