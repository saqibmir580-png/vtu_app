import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Avatar } from './Avatar';
import { UserProfile } from '@/store';

interface StudentProfileHeaderProps {
  user: UserProfile;
  onSettingsPress?: () => void;
  onEditPress?: () => void;
}

export const StudentProfileHeader: React.FC<StudentProfileHeaderProps> = ({
  user,
  onSettingsPress,
  onEditPress,
}) => {
  return (
    <View style={styles.container}>
      {/* Top Header Row */}
      <View style={styles.topRow}>
        <Text style={styles.headerTitle}>Profile</Text>
        {(onEditPress || onSettingsPress) && (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.settingsBtn}
            onPress={onEditPress || onSettingsPress}
          >
            <Feather name={onEditPress ? "edit-2" : "settings"} size={18} color="#0745E8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Hero Content */}
      <View style={styles.heroContent}>
        <Avatar
          name={user.name}
          avatarUrl={user.avatarUrl}
          size={76}
          showEditBadge
          onPressEdit={onEditPress}
        />

        <View style={styles.infoCol}>
          <Text style={styles.studentName}>{user.name}</Text>
          <Text style={styles.usnText}>USN: {user.usn || '1VA21CS042'}</Text>
          <Text style={styles.collegeText} numberOfLines={1}>
            <Feather name="map-pin" size={11} color="#64748B" /> {user.college || 'Sai Vidya Institute of Technology'}{user.collegeCity ? `, ${user.collegeCity}` : ''}
          </Text>

          <View style={styles.metaBadgeRow}>
            <View style={styles.metaBadge}>
              <Text style={styles.metaBadgeText}>{user.branch || 'CSE'}</Text>
            </View>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.metaText}>Sem {user.semester || 5}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.metaText}>{user.scheme || '2022'} Scheme</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  infoCol: {
    flex: 1,
  },
  studentName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  usnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0745E8',
    marginBottom: 2,
  },
  collegeText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 6,
  },
  metaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  metaBadgeText: {
    color: '#0745E8',
    fontSize: 11,
    fontWeight: '800',
  },
  dot: {
    color: '#CBD5E1',
    fontSize: 10,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
});
