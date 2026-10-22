import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { MOCK_RESOURCES } from '../api/notesData';

export const NotesSearchScreen: React.FC = () => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState(['21CS52', 'Computer Networks', 'Subnetting', 'Normalization']);
  const suggestedSearches = ['Data Structures', '21CS53', 'Handwritten Notes', 'Question Papers'];

  const filteredResults = MOCK_RESOURCES.filter((res) => {
    if (!query.trim()) return false;
    const q = query.toLowerCase();
    return (
      res.title.toLowerCase().includes(q) ||
      res.subjectName.toLowerCase().includes(q) ||
      res.subjectCode.toLowerCase().includes(q) ||
      res.unitTitle.toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Search Bar with Back Arrow */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="chevron-left" size={22} color="#0745E8" />
        </TouchableOpacity>
        <View style={styles.inputWrapper}>
          <Feather name="search" size={18} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Search code (21CS52), subject, notes..."
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Feather name="x" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.container}>
        {query.trim().length === 0 ? (
          <View style={styles.initialContent}>
            {/* Recent Searches */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <View style={styles.chipsRow}>
                {recentSearches.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.chip}
                    onPress={() => setQuery(item)}
                  >
                    <Feather name="clock" size={12} color="#64748B" />
                    <Text style={styles.chipText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Suggested Searches */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Suggested Searches</Text>
              <View style={styles.chipsRow}>
                {suggestedSearches.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.suggestedChip}
                    onPress={() => setQuery(item)}
                  >
                    <Feather name="trending-up" size={12} color="#0745E8" />
                    <Text style={styles.suggestedChipText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ) : filteredResults.length === 0 ? (
          /* Empty Search State */
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconBox}>
              <Feather name="search" size={32} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>Couldn't find anything</Text>
            <Text style={styles.emptySub}>
              Try searching with another subject name, code (e.g. 21CS52), or note title.
            </Text>
          </View>
        ) : (
          /* Search Results List */
          <View style={{ flex: 1 }}>
            <Text style={styles.resultCountText}>
              {filteredResults.length} {filteredResults.length === 1 ? 'result' : 'results'} found for "{query}"
            </Text>
            <FlatList
              data={filteredResults}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.resultCard}
                  onPress={() => router.push(`/notes/${item.id}` as any)}
                >
                  <View style={styles.resultIconBox}>
                    <Feather name="file-text" size={20} color="#0745E8" />
                  </View>
                  <View style={styles.resultInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                      <Text style={styles.resultTag}>{item.subjectCode} • {item.type}</Text>
                      {item.isPaid ? (
                        <View style={styles.listPaidBadge}>
                          <Feather name="lock" size={10} color="#D97706" />
                          <Text style={styles.listPaidBadgeText}>Paid • ₹{item.price || 19}</Text>
                        </View>
                      ) : (
                        <View style={styles.listFreeBadge}>
                          <Feather name="gift" size={10} color="#059669" />
                          <Text style={styles.listFreeBadgeText}>Free</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.resultTitle}>{item.title}</Text>
                    <Text style={styles.resultSub}>{item.unitTitle} • {item.fileSize}</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color="#94A3B8" />
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  initialContent: {
    gap: 24,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  chipText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  suggestedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  suggestedChipText: {
    fontSize: 13,
    color: '#0745E8',
    fontWeight: '600',
  },
  resultCountText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
    fontWeight: '600',
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  resultIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resultInfo: {
    flex: 1,
  },
  resultTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0745E8',
  },
  listPaidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  listPaidBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  listFreeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  listFreeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  resultSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});
