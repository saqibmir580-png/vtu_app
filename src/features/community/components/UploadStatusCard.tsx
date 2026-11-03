import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { UploadStatus } from '../types/community.types';

interface UploadStatusCardProps {
  status: UploadStatus;
  resourceTitle: string;
  onPressView: () => void;
  onPressMyContributions: () => void;
}

export const UploadStatusCard: React.FC<UploadStatusCardProps> = ({
  status,
  resourceTitle,
  onPressView,
  onPressMyContributions,
}) => {
  const isSuccess = status === 'published';

  return (
    <View style={styles.card}>
      <View style={[styles.iconCircle, isSuccess ? styles.circleSuccess : styles.circlePending]}>
        <Feather
          name={isSuccess ? 'check-circle' : 'clock'}
          size={36}
          color={isSuccess ? '#059669' : '#D97706'}
        />
      </View>

      <Text style={styles.title}>
        {isSuccess ? 'Notes Published to VTU Community!' : 'Submission Received'}
      </Text>

      <Text style={styles.resourceTitle}>{resourceTitle}</Text>

      <Text style={styles.message}>
        {isSuccess
          ? 'Thank you for contributing! Your notes are now accessible to thousands of engineering students across VTU.'
          : 'Your uploaded document is currently undergoing automated malware scan & syllabus verification.'}
      </Text>

      {/* Contributor Reward Badge Card */}
      <View style={styles.rewardNoticeBox}>
        <View style={styles.rewardIconBadge}>
          <Feather name="award" size={20} color="#B45309" />
        </View>
        <View style={styles.rewardNoticeTextCol}>
          <Text style={styles.rewardNoticeTitle}>
            {isSuccess ? 'Rewards Credited' : 'Pending Contributor Reward'}
          </Text>
          <Text style={styles.rewardNoticeDesc}>
            {isSuccess
              ? '🎉 +50 VTU Coins & +100 XP have been credited to your profile!'
              : '🌟 Earn +50 VTU Coins & +100 XP once verified and published by academic reviewers.'}
          </Text>
        </View>
      </View>

      <View style={styles.btnColumn}>
        <TouchableOpacity activeOpacity={0.85} style={styles.primaryBtn} onPress={onPressView}>
          <Feather name="book-open" size={16} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>View Uploaded Resource</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.8} style={styles.secondaryBtn} onPress={onPressMyContributions}>
          <Feather name="user-check" size={16} color="#0745E8" />
          <Text style={styles.secondaryBtnText}>Go to My Contributions</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 20,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  circleSuccess: {
    backgroundColor: '#ECFDF5',
  },
  circlePending: {
    backgroundColor: '#FEF3C7',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  resourceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0745E8',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  rewardNoticeBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    gap: 12,
  },
  rewardIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardNoticeTextCol: {
    flex: 1,
  },
  rewardNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  rewardNoticeDesc: {
    fontSize: 12,
    color: '#B45309',
    lineHeight: 16,
  },
  btnColumn: {
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0745E8',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  secondaryBtnText: {
    color: '#0745E8',
    fontWeight: '700',
    fontSize: 14,
  },
});
