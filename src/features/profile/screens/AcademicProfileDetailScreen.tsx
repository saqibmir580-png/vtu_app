import React from 'react';
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
import { AcademicInfoCard } from '../components/AcademicInfoCard';
import { Header } from '@/shared/components/Header';
import { StatusBar } from 'react-native';

export const AcademicProfileDetailScreen: React.FC = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { currentCgpa, loadAcademicRecords } = useAcademicRecordStore();

  React.useEffect(() => {
    loadAcademicRecords();
  }, []);

  if (!user) return null;

  const effectiveCgpa = (user.currentCgpa && user.currentCgpa > 0) ? user.currentCgpa : (currentCgpa || 8.74);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0745E8" />
      <Header
        title="Academic Profile"
        dark={true}
        showBack={true}
        rightElement={
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.editHeaderBtn}
            onPress={() => router.push('/profile/edit' as any)}
          >
            <Feather name="edit-2" size={14} color="#FFFFFF" />
            <Text style={styles.editHeaderBtnText}>Edit</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* College & Institution Card */}
        <AcademicInfoCard
          label="COLLEGE & INSTITUTION"
          value={user.college || 'Sai Vidya Institute of Technology'}
          subText={`Location: ${user.collegeCity || 'Bengaluru'} • VTU Affiliated`}
          iconName="map-pin"
          iconBg="#E0F2FE"
          iconColor="#0284C7"
        />

        {/* Branch Card */}
        <AcademicInfoCard
          label="ENGINEERING BRANCH"
          value={user.branch || 'CSE'}
          subText="Computer Science & Engineering"
          iconName="cpu"
          iconBg="#EEF2FF"
          iconColor="#0745E8"
        />

        {/* Semester Card */}
        <AcademicInfoCard
          label="CURRENT SEMESTER"
          value={`Semester ${user.semester || 5}`}
          subText="Third Year B.E. Degree Course"
          iconName="book"
          iconBg="#D1FAE5"
          iconColor="#059669"
        />

        {/* Scheme Card */}
        <AcademicInfoCard
          label="CURRICULUM SCHEME"
          value={`${user.scheme || '2022'} Scheme`}
          subText="NEP 2020 Aligned Credit System"
          iconName="layers"
          iconBg="#FEF3C7"
          iconColor="#D97706"
        />

        {/* CGPA Card */}
        <AcademicInfoCard
          label="CUMULATIVE GRADE POINT AVERAGE"
          value={effectiveCgpa.toFixed(2)}
          subText={`Target CGPA Goal: ${(user.targetCgpa || 9.20).toFixed(2)}`}
          iconName="trending-up"
          iconBg="#F3E8FF"
          iconColor="#9333EA"
        />

        {/* Academic Identity Details Banner */}
        <View style={styles.infoBanner}>
          <Feather name="shield" size={18} color="#0745E8" style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Automatic Filter Personalization</Text>
            <Text style={styles.bannerDesc}>
              Updating your Branch, Semester, or Scheme dynamically updates notes, question paper filters, and calendar schedules across the VTU Super App.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer Sticky Edit Button */}
      <SafeAreaView edges={['bottom']} style={styles.footerSafeArea}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.stickyEditBtn}
          onPress={() => router.push('/profile/edit' as any)}
        >
          <Feather name="edit-3" size={18} color="#FFFFFF" />
          <Text style={styles.stickyEditBtnText}>Edit Academic Details</Text>
        </TouchableOpacity>
      </SafeAreaView>
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
  editHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  editHeaderBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  infoBanner: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  bannerDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  footerSafeArea: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  stickyEditBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#0745E8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stickyEditBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
