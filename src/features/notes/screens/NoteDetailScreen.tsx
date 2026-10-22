import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Header } from '@/shared/components';
import { fetchNotesFromApi } from '../api/notesApi';
import { NoteResource } from '../types/notes.types';
import { MOCK_RESOURCES } from '../api/notesData';
import { useAuthStore } from '@/store';

const UNITS = ['All', 'Unit 1', 'Unit 2', 'Unit 3', 'Unit 4', 'Unit 5'];

export const NoteDetailScreen: React.FC = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [activeUnit, setActiveUnit] = useState('All');
  const [notes, setNotes] = useState<NoteResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadNotes = useCallback(async () => {
    try {
      const fetched = await fetchNotesFromApi({ userId: user?.id });
      if (fetched && fetched.length > 0) {
        setNotes(fetched);
      } else {
        setNotes(MOCK_RESOURCES);
      }
    } catch {
      setNotes(MOCK_RESOURCES);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadNotes();
  };

  const filteredNotes = notes.filter((n) => {
    if (activeUnit === 'All') return true;
    const unitNum = parseInt(activeUnit.replace('Unit ', ''), 10);
    return n.unitNumber === unitNum;
  });

  return (
    <View style={styles.rootContainer}>
      <Header title="Notes & PDFs" showBack />
      <View style={styles.container}>
        {/* Unit Filter Pills */}
        <View style={styles.filterRow}>
          {UNITS.map((unit) => (
            <TouchableOpacity
              key={unit}
              style={[styles.tagPill, activeUnit === unit && styles.activeTagPill]}
              onPress={() => setActiveUnit(unit)}
            >
              <Text style={[styles.tagText, activeUnit === unit && styles.activeTagText]}>
                {unit}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0745E8" />
            <Text style={styles.loadingText}>Loading notes & documents...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredNotes}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#0745E8']} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Feather name="file-text" size={40} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No Notes Found</Text>
                <Text style={styles.emptySub}>
                  No documents found for {activeUnit}. Try selecting 'All' or refresh.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.fileCard}
                activeOpacity={0.8}
                onPress={() => router.push(`/notes/${item.id}?view=reader`)}
              >
                <View style={styles.iconBox}>
                  <Feather name="file-text" size={22} color="#EF4444" />
                </View>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.fileSub}>
                      {item.fileFormat || 'PDF'} • {item.fileSize || '2.4 MB'}
                    </Text>
                    {item.totalPages ? (
                      <Text style={styles.dotSub}> • {item.totalPages} pages</Text>
                    ) : null}
                    {item.isPaid && !item.isPurchased ? (
                      <View style={styles.paidBadge}>
                        <Text style={styles.paidBadgeText}>₹{item.price || 19}</Text>
                      </View>
                    ) : item.isPurchased ? (
                      <View style={styles.freeBadge}>
                        <Text style={styles.freeBadgeText}>Unlocked</Text>
                      </View>
                    ) : (
                      <View style={styles.freeBadge}>
                        <Text style={styles.freeBadgeText}>Free</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color="#94A3B8" />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tagPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  activeTagPill: {
    backgroundColor: '#0745E8',
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTagText: {
    color: '#FFFFFF',
  },
  listContainer: {
    gap: 12,
    paddingBottom: 40,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileSub: {
    fontSize: 12,
    color: '#64748B',
  },
  dotSub: {
    fontSize: 12,
    color: '#64748B',
  },
  paidBadge: {
    marginLeft: 8,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  paidBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  freeBadge: {
    marginLeft: 8,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  freeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
