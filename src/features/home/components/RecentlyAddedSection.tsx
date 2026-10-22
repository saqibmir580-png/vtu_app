import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ResourceItem } from '../types/home.types';

interface RecentlyAddedSectionProps {
  resources: ResourceItem[];
}

export const RecentlyAddedSection: React.FC<RecentlyAddedSectionProps> = ({ resources }) => {
  const router = useRouter();

  if (resources.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Recently Added Resources</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/library')}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resourcesList}>
        {resources.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.8}
            style={styles.resourceCard}
            onPress={() => {
              if (item.type === 'Question Paper') {
                router.push('/(tabs)/library');
              } else {
                router.push(`/notes/${item.id}` as any);
              }
            }}
          >
            <View style={styles.iconBox}>
              <Feather
                name={item.type === 'Question Paper' ? 'layers' : 'file-text'}
                size={20}
                color={item.type === 'Question Paper' ? '#7E22CE' : '#EF4444'}
              />
            </View>

            <View style={styles.infoWrapper}>
              <Text style={styles.subjectTag}>{item.subject} • Sem {item.semester}</Text>
              <Text style={styles.titleText}>{item.title}</Text>
              <Text style={styles.metaText}>
                {item.type} • {item.fileSize} • {item.downloadsCount} downloads
              </Text>
            </View>

            <Feather name="download" size={18} color="#0745E8" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0745E8',
  },
  resourcesList: {
    gap: 10,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderColor: '#E2E8F0',
    borderWidth: 1,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoWrapper: {
    flex: 1,
  },
  subjectTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0745E8',
    marginBottom: 2,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});
