import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useCommunityStore } from '../store/useCommunityStore';

interface CommunityStatsProps {
  notesCount?: number;
  upvotesCount?: number;
  contributorsCount?: number;
}

export const CommunityStats: React.FC<CommunityStatsProps> = ({
  notesCount,
  upvotesCount,
  contributorsCount,
}) => {
  const { resources, contributors } = useCommunityStore();

  const totalNotes = notesCount !== undefined ? notesCount : resources.length;
  const totalUpvotes =
    upvotesCount !== undefined
      ? upvotesCount
      : resources.reduce((acc, curr) => acc + (curr.usefulCount || 0), 0);
  const totalContributors =
    contributorsCount !== undefined ? contributorsCount : contributors.length;

  return (
    <View style={styles.container}>
      <View style={styles.tile}>
        <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
          <Feather name="file-text" size={16} color="#0745E8" />
        </View>
        <Text style={styles.number}>{totalNotes}</Text>
        <Text style={styles.label}>Notes Shared</Text>
      </View>

      <View style={styles.tile}>
        <View style={[styles.iconBox, { backgroundColor: '#D1FAE5' }]}>
          <Feather name="thumbs-up" size={16} color="#059669" />
        </View>
        <Text style={styles.number}>{totalUpvotes.toLocaleString()}</Text>
        <Text style={styles.label}>Helpful Votes</Text>
      </View>

      <View style={styles.tile}>
        <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
          <Feather name="award" size={16} color="#0284C7" />
        </View>
        <Text style={styles.number}>{totalContributors}</Text>
        <Text style={styles.label}>Contributors</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  tile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  number: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  label: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
});
