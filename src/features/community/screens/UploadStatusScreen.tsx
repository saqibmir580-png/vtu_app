import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useCommunityStore } from '../store/useCommunityStore';
import { UploadProgress } from '../components/UploadProgress';
import { UploadStatusCard } from '../components/UploadStatusCard';

export const UploadStatusScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { uploadStatus, uploadProgressPercent, getResourceById, uploadDraft } =
    useCommunityStore();

  const resource = getResourceById(id || '') || {
    id: id || 'cr-1',
    title: uploadDraft.title || 'Computer Networks Lecture Notes',
  };

  const handleClose = () => {
    router.replace('/(tabs)/community' as any);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
            <Feather name="x" size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Upload Confirmation</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {uploadStatus !== 'published' && uploadStatus !== 'rejected' && (
          <UploadProgress status={uploadStatus} progressPercent={uploadProgressPercent} />
        )}

        <UploadStatusCard
          status={uploadStatus}
          resourceTitle={resource.title}
          onPressView={() => router.push(`/community/resource/${resource.id}` as any)}
          onPressMyContributions={() => router.push('/community/my-contributions' as any)}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  safeTop: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollContent: { padding: 16 },
});
