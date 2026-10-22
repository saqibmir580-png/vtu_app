import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/store';
import { useAcademicRecordStore } from '@/features/calculators';
import { useSavedStore } from '@/features/saved/store/useSavedStore';
import { StudentProfileHeader } from '../components/StudentProfileHeader';
import { AcademicIdentityCard } from '../components/AcademicIdentityCard';
import { SectionHeader } from '../components/SectionHeader';
import { ProfileMenuRow } from '../components/ProfileMenuRow';
import { AvatarUploadModal } from '../components/AvatarUploadModal';
import { ChangePasswordModal } from '../components/ChangePasswordModal';

export const ProfileHomeScreen: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { currentCgpa, totalCreditsEarned, loadAcademicRecords } = useAcademicRecordStore();
  const { items } = useSavedStore();

  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [activeSavedTab, setActiveSavedTab] = useState<'BOOKMARKS' | 'DOWNLOADS'>('BOOKMARKS');

  useEffect(() => {
    loadAcademicRecords();
  }, []);

  if (!user) return null;

  const effectiveCgpa = (user?.currentCgpa && user.currentCgpa > 0) ? user.currentCgpa : (currentCgpa || 8.74);
  const bookmarkedItems = items.filter((i) => i.isBookmarked);
  const downloadedItems = items.filter((i) => i.isDownloaded);

  const displayedSavedItems = activeSavedTab === 'BOOKMARKS' ? bookmarkedItems.slice(0, 3) : downloadedItems.slice(0, 3);

  const handleLogout = () => {
    Alert.alert(
      'Logout Confirmation',
      'Are you sure you want to sign out of your VTU Student Account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/(auth)/login' as any);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <StudentProfileHeader
          user={user}
          onEditPress={() => setAvatarModalVisible(true)}
        />
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Academic Snapshot Card with Synchronized CGPA & Quick Badges */}
        <AcademicIdentityCard
          semester={user.semester || 5}
          cgpa={effectiveCgpa}
          scheme={user.scheme || '2022'}
          bookmarksCount={bookmarkedItems.length}
          downloadsCount={downloadedItems.length}
          onPressBookmarks={() => setActiveSavedTab('BOOKMARKS')}
          onPressDownloads={() => setActiveSavedTab('DOWNLOADS')}
          onPressEdit={() => router.push('/profile/edit' as any)}
        />

        {/* Section: My In-App Library & DRM Vault */}
        <View style={styles.vaultSection}>
          <View style={styles.vaultHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.vaultSectionTitle}>My Library & In-App Vault</Text>
              <Text style={styles.vaultSectionSub}>Stored securely inside your app sandbox</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/saved' as any)}>
              <Text style={styles.vaultViewAllText}>View All ({items.length})</Text>
            </TouchableOpacity>
          </View>

          {/* Tab Switcher */}
          <View style={styles.vaultTabRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.vaultTabBtn, activeSavedTab === 'BOOKMARKS' && styles.vaultTabBtnActive]}
              onPress={() => setActiveSavedTab('BOOKMARKS')}
            >
              <Feather
                name="bookmark"
                size={14}
                color={activeSavedTab === 'BOOKMARKS' ? '#0745E8' : '#64748B'}
              />
              <Text
                style={[
                  styles.vaultTabBtnText,
                  activeSavedTab === 'BOOKMARKS' && styles.vaultTabBtnTextActive,
                ]}
              >
                Bookmarks ({bookmarkedItems.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.vaultTabBtn, activeSavedTab === 'DOWNLOADS' && styles.vaultTabBtnActive]}
              onPress={() => setActiveSavedTab('DOWNLOADS')}
            >
              <Feather
                name="download-cloud"
                size={14}
                color={activeSavedTab === 'DOWNLOADS' ? '#059669' : '#64748B'}
              />
              <Text
                style={[
                  styles.vaultTabBtnText,
                  activeSavedTab === 'DOWNLOADS' && { color: '#059669', fontWeight: '800' },
                ]}
              >
                In-App Offline ({downloadedItems.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* DRM Protection Notice */}
          <View style={styles.drmNoticeBox}>
            <Feather name="shield" size={14} color="#0745E8" />
            <Text style={styles.drmNoticeText}>
              In-app DRM protection enabled. Screenshots and recordings are blocked to safeguard verified materials.
            </Text>
          </View>

          {/* Items List */}
          {displayedSavedItems.length > 0 ? (
            <View style={styles.vaultItemsList}>
              {displayedSavedItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  style={styles.vaultItemCard}
                  onPress={() => {
                    if (item.type === 'Note') {
                      const cleanId = item.id.replace('note-', '');
                      router.push(`/notes/${cleanId}` as any);
                    } else {
                      router.push('/(tabs)/library');
                    }
                  }}
                >
                  <View
                    style={[
                      styles.vaultItemIcon,
                      { backgroundColor: item.type === 'Note' ? '#EEF2FF' : '#F3E8FF' },
                    ]}
                  >
                    <Feather
                      name={item.type === 'Note' ? 'file-text' : 'layers'}
                      size={18}
                      color={item.type === 'Note' ? '#0745E8' : '#7E22CE'}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.vaultItemTag}>
                      {item.subjectCode} • {item.type === 'Note' ? 'Notes' : 'Paper'}
                    </Text>
                    <Text style={styles.vaultItemTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.vaultItemMeta}>
                      {item.fileSize} • {item.pageCount} Pages • {activeSavedTab === 'DOWNLOADS' ? 'Offline Ready' : 'Saved'}
                    </Text>
                  </View>

                  <Feather name="chevron-right" size={16} color="#94A3B8" />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.vaultEmptyBox}>
              <Feather
                name={activeSavedTab === 'BOOKMARKS' ? 'bookmark' : 'download-cloud'}
                size={32}
                color="#CBD5E1"
              />
              <Text style={styles.vaultEmptyTitle}>
                {activeSavedTab === 'BOOKMARKS' ? 'No Bookmarked Items' : 'No In-App Downloads'}
              </Text>
              <Text style={styles.vaultEmptySub}>
                {activeSavedTab === 'BOOKMARKS'
                  ? 'Bookmark notes or question papers to access them quickly here.'
                  : 'Download notes for offline reading directly in the application.'}
              </Text>
            </View>
          )}
        </View>

        {/* Section 1: Academic */}
        <SectionHeader title="Academic" />
        <ProfileMenuRow
          title="Academic Profile"
          subtitle="View Branch, Semester, Scheme & CGPA"
          badge={`${user.branch || 'CSE'} • Sem ${user.semester || 5}`}
          iconName="award"
          iconBg="#EEF2FF"
          iconColor="#0745E8"
          onPress={() => router.push('/profile/academic' as any)}
        />

        {/* Section 2: Study */}
        <SectionHeader title="Study & Downloads" />
        <ProfileMenuRow
          title="Saved & Offline Library"
          subtitle="Manage downloaded notes & bookmarked papers"
          badge={`${items.length} items`}
          iconName="download-cloud"
          iconBg="#D1FAE5"
          iconColor="#059669"
          onPress={() => router.push('/saved' as any)}
        />
        <ProfileMenuRow
          title="Notifications & Circulars"
          subtitle="VTU exam timetables & test alerts"
          iconName="bell"
          iconBg="#FEF3C7"
          iconColor="#D97706"
          onPress={() => router.push('/(tabs)/community' as any)}
        />

        {/* Section 3: Information & Account */}
        <SectionHeader title="Information & Security" />
        <ProfileMenuRow
          title="About VTU Super App"
          subtitle="Version v1.0.0, University disclaimer & Help"
          iconName="info"
          iconBg="#E0F2FE"
          iconColor="#0284C7"
          onPress={() => router.push('/profile/about' as any)}
        />
        <ProfileMenuRow
          title="Privacy Policy"
          subtitle="How we protect your academic data"
          iconName="shield"
          iconBg="#F1F5F9"
          iconColor="#475569"
          onPress={() => router.push('/profile/about' as any)}
        />
        <ProfileMenuRow
          title="Terms of Service"
          subtitle="Usage guidelines for engineering students"
          iconName="file-text"
          iconBg="#F1F5F9"
          iconColor="#475569"
          onPress={() => router.push('/profile/about' as any)}
        />
        <ProfileMenuRow
          title="Security & Change Password"
          subtitle="Update account password & security options"
          iconName="lock"
          iconBg="#EEF2FF"
          iconColor="#0745E8"
          onPress={() => setChangePasswordVisible(true)}
        />
        <ProfileMenuRow
          title="Sign Out of Account"
          subtitle="Log out from VTU Student Super App"
          iconName="log-out"
          iconBg="#FEE2E2"
          iconColor="#DC2626"
          onPress={handleLogout}
        />
      </ScrollView>

      {/* Avatar Upload Modal */}
      <AvatarUploadModal
        visible={avatarModalVisible}
        onClose={() => setAvatarModalVisible(false)}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        visible={changePasswordVisible}
        onClose={() => setChangePasswordVisible(false)}
      />
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  vaultSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  vaultHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  vaultSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  vaultSectionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  vaultViewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0745E8',
  },
  vaultTabRow: {
    flexDirection: 'row',
    backgroundColor: '#EDF2F7',
    padding: 3,
    borderRadius: 12,
    gap: 4,
    marginBottom: 10,
  },
  vaultTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 9,
  },
  vaultTabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  vaultTabBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  vaultTabBtnTextActive: {
    color: '#0745E8',
    fontWeight: '800',
  },
  drmNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: 12,
  },
  drmNoticeText: {
    flex: 1,
    fontSize: 10,
    color: '#1E40AF',
    lineHeight: 14,
    fontWeight: '600',
  },
  vaultItemsList: {
    gap: 8,
  },
  vaultItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vaultItemIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaultItemTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0745E8',
    textTransform: 'uppercase',
  },
  vaultItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginVertical: 2,
  },
  vaultItemMeta: {
    fontSize: 11,
    color: '#64748B',
  },
  vaultEmptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  vaultEmptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 8,
  },
  vaultEmptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
});
