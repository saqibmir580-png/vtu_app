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
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useCommunityStore } from '../store/useCommunityStore';
import { UploadPreviewCard } from '../components/UploadPreviewCard';

export const UploadPreviewScreen: React.FC = () => {
  const router = useRouter();
  const { uploadDraft, startUploadProcess } = useCommunityStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await startUploadProcess((newId) => {
        router.replace(`/community/upload/status/${newId}` as any);
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={20} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>Review & Submit</Text>
            <Text style={styles.headerSub}>Step 3 of 3: Final Preview</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Step Indicator */}
        <View style={styles.stepBar}>
          <View style={styles.stepItem}>
            <Text style={styles.stepNumDone}>✓</Text>
            <Text style={styles.stepLabel}>File</Text>
          </View>
          <View style={[styles.stepLine, styles.stepLineDone]} />
          <View style={styles.stepItem}>
            <Text style={styles.stepNumDone}>✓</Text>
            <Text style={styles.stepLabel}>Details</Text>
          </View>
          <View style={[styles.stepLine, styles.stepLineDone]} />
          <View style={[styles.stepItem, styles.stepActive]}>
            <Text style={styles.stepNumActive}>3</Text>
            <Text style={styles.stepLabelActive}>Preview</Text>
          </View>
        </View>

        <Text style={styles.title}>Confirm Your Contribution</Text>
        <Text style={styles.subtitle}>
          Please verify your resource metadata before publishing to the VTU Community.
        </Text>

        <UploadPreviewCard formData={uploadDraft} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity activeOpacity={0.85} style={styles.submitBtn} onPress={handleSubmit}>
          <Feather name="upload-cloud" size={18} color="#FFFFFF" />
          <Text style={styles.submitBtnText}>Publish to VTU Community</Text>
        </TouchableOpacity>
      </View>
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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: { alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 11, color: '#64748B', marginTop: 1 },
  scrollContent: { padding: 16 },
  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  stepItem: { alignItems: 'center', opacity: 0.5 },
  stepActive: { opacity: 1 },
  stepNumDone: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#059669',
    textAlign: 'center',
    lineHeight: 26,
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepNumActive: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0745E8',
    textAlign: 'center',
    lineHeight: 26,
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepLabel: { fontSize: 10, color: '#64748B', marginTop: 2 },
  stepLabelActive: { fontSize: 10, fontWeight: '800', color: '#0745E8', marginTop: 2 },
  stepLine: { width: 30, height: 2, backgroundColor: '#E2E8F0' },
  stepLineDone: { backgroundColor: '#059669' },
  title: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#64748B', marginBottom: 12, lineHeight: 18 },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  submitBtn: {
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
