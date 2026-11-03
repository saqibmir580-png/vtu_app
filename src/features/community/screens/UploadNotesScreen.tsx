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
import * as DocumentPicker from 'expo-document-picker';
import { useCommunityStore } from '../store/useCommunityStore';
import { FileUploadZone } from '../components/FileUploadZone';

export const UploadNotesScreen: React.FC = () => {
  const router = useRouter();
  const { uploadDraft, setUploadDraft } = useCommunityStore();

  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        const sizeMb = file.size ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : '2.5 MB';
        setUploadDraft({
          fileUri: file.uri,
          fileName: file.name,
          fileSize: sizeMb,
          pageCount: 15,
        });
        return;
      }
    } catch (e) {
      console.warn('Document picker fallback:', e);
    }

    setUploadDraft({
      fileName: 'VTU_Lecture_Notes_Module.pdf',
      fileSize: '3.8 MB',
      pageCount: 22,
    });
  };

  const handleNext = () => {
    if (!uploadDraft.fileName) {
      handlePickDocument();
    }
    router.push('/community/upload/details' as any);
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
            <Text style={styles.headerTitle}>Upload Notes</Text>
            <Text style={styles.headerSub}>Step 1 of 3: Select PDF</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Step Indicator */}
        <View style={styles.stepBar}>
          <View style={[styles.stepItem, styles.stepActive]}>
            <Text style={styles.stepNumActive}>1</Text>
            <Text style={styles.stepLabelActive}>File</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.stepItem}>
            <Text style={styles.stepNum}>2</Text>
            <Text style={styles.stepLabel}>Details</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.stepItem}>
            <Text style={styles.stepNum}>3</Text>
            <Text style={styles.stepLabel}>Preview</Text>
          </View>
        </View>

        <Text style={styles.title}>Upload Your VTU Lecture Notes</Text>
        <Text style={styles.subtitle}>
          Share your class notes, formula sheets, or solved question banks with VTU students.
        </Text>

        <FileUploadZone
          selectedFileName={uploadDraft.fileName}
          selectedFileSize={uploadDraft.fileSize}
          onPickFile={handlePickDocument}
        />

        <View style={styles.guidelinesBox}>
          <Text style={styles.guidelineTitle}>Upload Guidelines:</Text>
          <View style={styles.bulletRow}>
            <Feather name="check" size={14} color="#059669" />
            <Text style={styles.bulletText}>Ensure handwriting is legible and high-contrast.</Text>
          </View>
          <View style={styles.bulletRow}>
            <Feather name="check" size={14} color="#059669" />
            <Text style={styles.bulletText}>Make sure notes correspond to the official VTU 2022/2021 scheme.</Text>
          </View>
          <View style={styles.bulletRow}>
            <Feather name="check" size={14} color="#059669" />
            <Text style={styles.bulletText}>Only upload PDF format (Max 25 MB).</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity activeOpacity={0.85} style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>Continue to Note Details</Text>
          <Feather name="arrow-right" size={16} color="#FFFFFF" />
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
    marginBottom: 20,
    gap: 8,
  },
  stepItem: { alignItems: 'center', opacity: 0.5 },
  stepActive: { opacity: 1 },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E2E8F0',
    textAlign: 'center',
    lineHeight: 26,
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  stepNumActive: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#7C3AED',
    textAlign: 'center',
    lineHeight: 26,
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepLabel: { fontSize: 10, color: '#64748B', marginTop: 2 },
  stepLabelActive: { fontSize: 10, fontWeight: '800', color: '#7C3AED', marginTop: 2 },
  stepLine: { width: 30, height: 2, backgroundColor: '#E2E8F0' },
  title: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#64748B', marginBottom: 16, lineHeight: 18 },
  guidelinesBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  guidelineTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bulletText: { fontSize: 12, color: '#475569' },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  nextBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
