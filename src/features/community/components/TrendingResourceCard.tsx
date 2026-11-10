import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CommunityResource } from '../types/community.types';
import { ResourceTypeBadge } from './ResourceTypeBadge';
import { ContributorAvatar } from './ContributorAvatar';

interface TrendingResourceCardProps {
  resource: CommunityResource;
  rank: number;
  onPress: () => void;
}

export const TrendingResourceCard: React.FC<TrendingResourceCardProps> = ({
  resource,
  rank,
  onPress,
}) => {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.card} onPress={onPress}>
      <View style={styles.rankCircle}>
        <Text style={styles.rankText}>#{rank}</Text>
      </View>

      <View style={styles.contentWrapper}>
        <View style={styles.metaRow}>
          <ResourceTypeBadge type={resource.resourceType} size="small" />
          <Text style={styles.codeText}>{resource.subjectCode}</Text>
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {resource.title}
        </Text>

        <View style={styles.authorRow}>
          <ContributorAvatar contributor={resource.contributor} size={18} />
          <Text style={styles.author} numberOfLines={1}>
            By {resource.contributor.name} • {resource.usefulCount} Useful Votes
          </Text>
        </View>
      </View>

      <Feather name="trending-up" size={18} color="#059669" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  rankCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  contentWrapper: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  codeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  author: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
  },
});
