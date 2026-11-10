import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { usePassingPackageStore } from '../store/usePassingPackageStore';
import { ImportantQuestionCard } from '../components/ImportantQuestionCard';
import { PackageFilterSheet } from '../components/PackageFilterSheet';
import { Header } from '@/shared/components/Header';
import { PackageFilterOptions } from '../types/passingPackages.types';

export const ImportantQuestionsScreen: React.FC = () => {
  const router = useRouter();
  const { id, unit } = useLocalSearchParams<{ id: string; unit?: string }>();
  const {
    getPackageById,
    getPackagesForCurrentStudent,
    bookmarkedQuestionIds,
    toggleQuestionBookmark,
  } = usePassingPackageStore();

  const pkg = getPackageById(id || '') || getPackagesForCurrentStudent()[0];
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [filters, setFilters] = useState<PackageFilterOptions>({
    selectedUnit: unit ? parseInt(unit, 10) : 'All',
    selectedPriority: 'All',
    selectedMarks: 'All',
  });

  if (!pkg) {
    return (
      <View style={styles.errorRoot}>
        <Text>Package Not Found</Text>
      </View>
    );
  }

  const filteredQuestions = pkg.importantQuestions.filter((q) => {
    if (filters.selectedUnit !== 'All' && q.unitNumber !== filters.selectedUnit) {
      return false;
    }
    if (filters.selectedPriority !== 'All' && q.priority !== filters.selectedPriority) {
      return false;
    }
    if (filters.selectedMarks !== 'All' && q.marks !== filters.selectedMarks) {
      return false;
    }
    return true;
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0745E8" />
      <Header
        title="Important Questions"
        dark={true}
        showBack={true}
        rightElement={
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setFilterSheetVisible(true)}
          >
            <Feather name="sliders" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      <View style={styles.unitPillsWrapper}>
        {/* Unit Filter Quick Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.unitPillsRow}>
          {['All', 1, 2, 3, 4, 5].map((u) => {
            const isSelected = filters.selectedUnit === u;
            return (
              <TouchableOpacity
                key={String(u)}
                activeOpacity={0.8}
                style={[styles.unitPill, isSelected && styles.unitPillSelected]}
                onPress={() => setFilters({ ...filters, selectedUnit: u as any })}
              >
                <Text style={[styles.unitPillText, isSelected && styles.unitPillTextSelected]}>
                  {u === 'All' ? 'All Units' : `Unit ${u}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filteredQuestions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Feather name="search" size={32} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No matching questions found</Text>
            <Text style={styles.emptySub}>Try adjusting your unit or marks filter to view questions.</Text>
          </View>
        ) : (
          filteredQuestions.map((q) => (
            <ImportantQuestionCard
              key={q.id}
              question={q}
              isBookmarked={bookmarkedQuestionIds.includes(q.id)}
              onToggleBookmark={() => toggleQuestionBookmark(q.id)}
              onPressQuestion={() =>
                router.push(`/passing-packages/question/${q.id}?pkgId=${pkg.id}` as any)
              }
              onPressNotes={() => {
                if (q.relatedNoteId) {
                  router.push(`/notes/${q.relatedNoteId}` as any);
                }
              }}
            />
          ))
        )}
      </ScrollView>

      {/* Filter Bottom Sheet */}
      <PackageFilterSheet
        visible={filterSheetVisible}
        filters={filters}
        onClose={() => setFilterSheetVisible(false)}
        onApplyFilters={(updated) => setFilters(updated)}
        onReset={() => setFilters({ selectedUnit: 'All', selectedPriority: 'All', selectedMarks: 'All' })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  errorRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeTop: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
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
  headerTitleBox: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitPillsWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingTop: 10,
  },
  unitPillsRow: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  unitPill: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  unitPillSelected: {
    backgroundColor: '#0745E8',
    borderColor: '#0745E8',
  },
  unitPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  unitPillTextSelected: {
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginTop: 30,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
});
