// Updated Notes Library Feed - 1-Tap Reader & Razorpay SDK Modal
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/store';
import { useToast } from '@/core/providers/ToastProvider';
import { MOCK_SUBJECTS, MOCK_RESOURCES } from '../api/notesData';
import {
  fetchNotesFromApi,
  fetchSubjectsFromApi,
  createRazorpayOrderFromApi,
  verifyRazorpayPaymentFromApi,
  purchaseNoteFromApi,
} from '../api/notesApi';
import { Subject, NoteResource } from '../types/notes.types';
import { PaymentCheckoutModal } from '../components/PaymentCheckoutModal';

export const NotesListScreen: React.FC = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { showToast } = useToast();

  const [notes, setNotes] = useState<NoteResource[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>(MOCK_SUBJECTS);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Direct Filtering & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('All');
  const [showSyllabusView, setShowSyllabusView] = useState(false);

  // Payment Modal State
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedNoteForPayment, setSelectedNoteForPayment] = useState<NoteResource | null>(null);

  const typeFilters = ['All', 'Free', 'Paid', 'Handwritten', 'Revision'];
  const moduleFilters = [
    { label: 'All Units', value: 'ALL' },
    { label: 'Module 1', value: '1' },
    { label: 'Module 2', value: '2' },
    { label: 'Module 3', value: '3' },
    { label: 'Module 4', value: '4' },
    { label: 'Module 5', value: '5' },
  ];

  const loadData = useCallback(async (isManualRefresh = false) => {
    try {
      const [fetchedNotes, fetchedSubjects] = await Promise.all([
        fetchNotesFromApi({
          semester: user?.semester || 5,
          branchCode: user?.branch || 'CSE',
          schemeYear: user?.scheme || '2022',
          userId: user?.id,
        }),
        fetchSubjectsFromApi({
          semester: user?.semester || 5,
          branchCode: user?.branch || 'CSE',
          schemeYear: user?.scheme || '2022',
        }),
      ]);

      setNotes(fetchedNotes);
      setSubjects(fetchedSubjects.length > 0 ? fetchedSubjects : MOCK_SUBJECTS);
      if (isManualRefresh) {
        showToast('Library resources synced with server', 'success');
      }
    } catch {
      setNotes(MOCK_RESOURCES);
      setSubjects(MOCK_SUBJECTS);
      if (isManualRefresh) {
        showToast('Offline mode: Using cached notes', 'info');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData(true);
  };

  // Open custom Payment Checkout Sheet
  const handleOpenPaymentModal = (resource: NoteResource) => {
    setSelectedNoteForPayment(resource);
    setPaymentModalVisible(true);
  };

  // Called when Razorpay checkout & signature verification succeed
  const handlePaymentSuccess = (unlockedResource: NoteResource) => {
    showToast('Payment successful! Note unlocked.', 'success');
    setNotes((prev) =>
      prev.map((n) =>
        n.id === unlockedResource.id ? { ...n, isPurchased: true } : n
      )
    );
    router.push(`/notes/${unlockedResource.id}?view=reader` as any);
  };

  // Filtered Notes Feed
  const filteredNotes = useMemo(() => {
    return notes.filter((res) => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (res.title || '').toLowerCase().includes(q);
        const matchCode = (res.subjectCode || '').toLowerCase().includes(q);
        const matchSubName = (res.subjectName || '').toLowerCase().includes(q);
        const matchUnit = (res.unitTitle || '').toLowerCase().includes(q);
        if (!matchTitle && !matchCode && !matchSubName && !matchUnit) return false;
      }

      // 2. Subject Filter
      if (selectedSubject !== 'ALL') {
        const matchesCode =
          res.subjectCode?.toUpperCase() === selectedSubject.toUpperCase() ||
          res.subjectId === selectedSubject;
        if (!matchesCode) return false;
      }

      // 3. Module Filter
      if (selectedModule !== 'ALL') {
        const modNum = Number(selectedModule);
        const titleLower = (res.title || '').toLowerCase();
        const hasModuleInTitle =
          titleLower.includes(`module ${modNum}`) ||
          titleLower.includes(`unit ${modNum}`) ||
          titleLower.includes(`mod ${modNum}`) ||
          titleLower.includes(`mod-${modNum}`);
        if (res.unitNumber !== modNum && !hasModuleInTitle) return false;
      }

      // 4. Type / Price Filter
      const titleLower = (res.title || '').toLowerCase();
      const typeStr = res.type || '';
      if (activeTypeFilter === 'Free') {
        if (res.isPaid && !res.isPurchased) return false;
      } else if (activeTypeFilter === 'Paid') {
        if (!res.isPaid) return false;
      } else if (activeTypeFilter === 'Handwritten') {
        if (!typeStr.includes('Handwritten') && !titleLower.includes('handwritten')) return false;
      } else if (activeTypeFilter === 'Revision') {
        if (
          !typeStr.includes('Revision') &&
          !typeStr.includes('Short') &&
          !titleLower.includes('revision') &&
          !titleLower.includes('formula')
        )
          return false;
      }

      return true;
    });
  }, [notes, searchQuery, selectedSubject, selectedModule, activeTypeFilter]);

  return (
    <View style={styles.rootContainer}>
      {/* Top Header */}
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>Notes Library</Text>
          <View style={styles.headerRightActions}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.iconCircle}
              onPress={() => router.push('/notifications' as any)}
            >
              <Feather name="bell" size={18} color="#0F172A" />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.avatarCircle}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Image
                source={{
                  uri:
                    user?.avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
                }}
                style={styles.avatarImg}
              />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#0745E8']} />
        }
      >
        {/* Instant In-Place Live Search Bar */}
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes, subjects (e.g. 21CS52), topics..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Feather name="x" size={16} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>

        {/* Current Semester Mini-Bar */}
        <View style={styles.semesterBar}>
          <View style={styles.semLeft}>
            <View style={styles.semDot} />
            <Text style={styles.semText}>
              Semester {user?.semester || 5} • {user?.branch || 'CSE'} ({user?.scheme || '2022'} Scheme)
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.changeSemLink}
            onPress={() => router.push('/notes/semesters' as any)}
          >
            <Text style={styles.changeSemLinkText}>Change</Text>
            <Feather name="chevron-right" size={13} color="#0745E8" />
          </TouchableOpacity>
        </View>

        {/* Continue Studying Card */}
        {notes.length > 0 && !searchQuery && (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.continueCard}
            onPress={() => router.push(`/notes/${notes[0]?.id || 'r1'}?view=reader` as any)}
          >
            <View style={styles.continueHeader}>
              <View style={styles.continueIconBox}>
                <Feather name="book-open" size={20} color="#0745E8" />
              </View>
              <View style={styles.continueInfo}>
                <Text style={styles.continueLabel}>CONTINUE STUDYING</Text>
                <Text style={styles.continueSubject} numberOfLines={1}>
                  {notes[0]?.title || 'Computer Networks (21CS52)'}
                </Text>
                <Text style={styles.continueUnit}>
                  {notes[0]?.subjectCode || '21CS52'} • 1-Tap Resume Reader
                </Text>
              </View>
              <View style={styles.continueActionBadge}>
                <Text style={styles.continueActionText}>Open</Text>
                <Feather name="arrow-right" size={13} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* 1. Subjects Filter Chips (Horizontal) */}
        <View style={styles.filterSection}>
          <View style={styles.filterSectionHeader}>
            <Text style={styles.filterSectionTitle}>Course / Subject</Text>
            <TouchableOpacity
              onPress={() => setShowSyllabusView(!showSyllabusView)}
              style={styles.toggleSyllabusBtn}
            >
              <Text style={styles.toggleSyllabusText}>
                {showSyllabusView ? 'Hide Subjects Grid' : 'View Subjects Grid'}
              </Text>
              <Feather
                name={showSyllabusView ? 'chevron-up' : 'chevron-down'}
                size={14}
                color="#0745E8"
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipRow}
          >
            <TouchableOpacity
              style={[
                styles.subjectChip,
                selectedSubject === 'ALL' && styles.activeSubjectChip,
              ]}
              onPress={() => setSelectedSubject('ALL')}
            >
              <Text
                style={[
                  styles.subjectChipText,
                  selectedSubject === 'ALL' && styles.activeSubjectChipText,
                ]}
              >
                All Courses ({notes.length})
              </Text>
            </TouchableOpacity>

            {subjects.map((sub) => {
              const count = notes.filter(
                (n) =>
                  n.subjectCode?.toUpperCase() === sub.code?.toUpperCase() ||
                  n.subjectId === sub.id
              ).length;
              const isSelected = selectedSubject === sub.code;

              return (
                <TouchableOpacity
                  key={sub.id}
                  style={[styles.subjectChip, isSelected && styles.activeSubjectChip]}
                  onPress={() => setSelectedSubject(isSelected ? 'ALL' : sub.code)}
                >
                  <Text
                    style={[styles.subjectChipText, isSelected && styles.activeSubjectChipText]}
                  >
                    {sub.code} {count > 0 ? `(${count})` : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Collapsible Syllabus Grid (If student wants curriculum overview) */}
        {showSyllabusView && (
          <View style={styles.syllabusGrid}>
            {subjects.map((subject) => (
              <TouchableOpacity
                key={subject.id}
                activeOpacity={0.8}
                style={styles.subjectCard}
                onPress={() => {
                  setSelectedSubject(subject.code);
                  setShowSyllabusView(false);
                }}
              >
                <View
                  style={[
                    styles.subjectIconBox,
                    { backgroundColor: subject.iconBg || '#EEF2FF' },
                  ]}
                >
                  <Feather
                    name={(subject.iconName as any) || 'book-open'}
                    size={20}
                    color={subject.iconColor || '#0745E8'}
                  />
                </View>
                <View style={styles.subjectInfo}>
                  <Text style={styles.subjectCode}>{subject.code}</Text>
                  <Text style={styles.subjectName} numberOfLines={1}>
                    {subject.name}
                  </Text>
                  <Text style={styles.resourceMeta}>{subject.resourceCount} Resources</Text>
                </View>
                <Feather name="filter" size={16} color="#0745E8" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 2. Modules / Units Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Module / Syllabus Unit</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipRow}
          >
            {moduleFilters.map((mod) => (
              <TouchableOpacity
                key={mod.value}
                style={[
                  styles.filterChip,
                  selectedModule === mod.value && styles.activeFilterChip,
                ]}
                onPress={() => setSelectedModule(mod.value)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedModule === mod.value && styles.activeFilterChipText,
                  ]}
                >
                  {mod.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 3. Type / Pricing Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Format & Pricing</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipRow}
          >
            {typeFilters.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterChip,
                  activeTypeFilter === filter && styles.activeFilterChip,
                ]}
                onPress={() => setActiveTypeFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    activeTypeFilter === filter && styles.activeFilterChipText,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Notes Feed Results Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Available Notes ({filteredNotes.length})
          </Text>
          {(selectedSubject !== 'ALL' || selectedModule !== 'ALL' || searchQuery || activeTypeFilter !== 'All') && (
            <TouchableOpacity
              onPress={() => {
                setSelectedSubject('ALL');
                setSelectedModule('ALL');
                setSearchQuery('');
                setActiveTypeFilter('All');
              }}
            >
              <Text style={styles.resetFilterText}>Reset Filters</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notes Listing */}
        {isLoading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#0745E8" />
            <Text style={{ marginTop: 12, color: '#64748B', fontSize: 13 }}>
              Loading curated notes from server...
            </Text>
          </View>
        ) : filteredNotes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="file-text" size={40} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No notes matching filters</Text>
            <Text style={styles.emptySub}>
              Try searching a different subject code or clear active filters.
            </Text>
            <TouchableOpacity
              style={styles.emptyResetBtn}
              onPress={() => {
                setSelectedSubject('ALL');
                setSelectedModule('ALL');
                setSearchQuery('');
                setActiveTypeFilter('All');
              }}
            >
              <Text style={styles.emptyResetText}>Clear All Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.notesList}>
            {filteredNotes.map((resource) => {
              const isPaid = Boolean(resource.isPaid && (resource.price && resource.price > 0));
              const isPurchased = Boolean(resource.isPurchased);
              const isLocked = isPaid && !isPurchased;

              return (
                <View key={resource.id} style={styles.noteItemCard}>
                  {/* Card Header Row */}
                  <View style={styles.noteCardHeader}>
                    <View style={styles.badgeRow}>
                      <View style={styles.subjectPill}>
                        <Text style={styles.subjectPillText}>
                          {resource.subjectCode || 'VTU'}
                        </Text>
                      </View>
                      <View style={styles.unitPill}>
                        <Text style={styles.unitPillText}>
                          {resource.unitTitle || (resource.unitNumber ? `Module ${resource.unitNumber}` : 'Module Notes')}
                        </Text>
                      </View>
                    </View>

                    {/* Pricing Pill */}
                    {isLocked ? (
                      <View style={styles.pricePillPaid}>
                        <Feather name="lock" size={11} color="#D97706" />
                        <Text style={styles.pricePillPaidText}>₹{resource.price || 19}</Text>
                      </View>
                    ) : isPurchased ? (
                      <View style={styles.pricePillFree}>
                        <Feather name="check-circle" size={11} color="#059669" />
                        <Text style={styles.pricePillFreeText}>Unlocked</Text>
                      </View>
                    ) : (
                      <View style={styles.pricePillFree}>
                        <Feather name="gift" size={11} color="#059669" />
                        <Text style={styles.pricePillFreeText}>Free</Text>
                      </View>
                    )}
                  </View>

                  {/* Title & Subject Name */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => router.push(`/notes/${resource.id}?view=reader` as any)}
                  >
                    <Text style={styles.noteItemTitle}>{resource.title}</Text>
                    <Text style={styles.noteItemSubjectName}>
                      {resource.subjectName} • {resource.type || 'PDF Notes'}
                    </Text>
                  </TouchableOpacity>

                  {/* Meta Details & Telemetry */}
                  <View style={styles.noteMetaRow}>
                    <View style={styles.metaItem}>
                      <Feather name="file" size={13} color="#64748B" />
                      <Text style={styles.metaItemText}>
                        {resource.totalPages ? `${resource.totalPages} Pages` : 'PDF'}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Feather name="download" size={13} color="#64748B" />
                      <Text style={styles.metaItemText}>
                        {resource.downloadsCount || 0} downloads
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Feather name="user" size={13} color="#64748B" />
                      <Text style={styles.metaItemText}>
                        {resource.author || 'VTU Faculty'}
                      </Text>
                    </View>
                  </View>

                  {/* 1-Tap Action Row */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={[
                        styles.studyNowBtn,
                        isLocked && styles.studyNowBtnOutline,
                      ]}
                      onPress={() => router.push(`/notes/${resource.id}?view=reader` as any)}
                    >
                      <Feather
                        name="book-open"
                        size={15}
                        color={isLocked ? '#0745E8' : '#FFFFFF'}
                      />
                      <Text
                        style={[
                          styles.studyNowBtnText,
                          isLocked && styles.studyNowBtnOutlineText,
                        ]}
                      >
                        {isLocked ? 'Read Free Preview' : 'Open & Study'}
                      </Text>
                    </TouchableOpacity>

                    {isLocked && (
                      <TouchableOpacity
                        activeOpacity={0.85}
                        style={styles.buyNowBtn}
                        onPress={() => handleOpenPaymentModal(resource)}
                      >
                        <Feather name="zap" size={14} color="#FFFFFF" />
                        <Text style={styles.buyNowBtnText}>
                          Unlock ₹{resource.price || 19}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Dedicated Razorpay Payment Confirmation Sheet */}
      <PaymentCheckoutModal
        visible={paymentModalVisible}
        resource={selectedNoteForPayment}
        onClose={() => setPaymentModalVisible(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerSafeArea: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTopRow: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    height: '100%',
  },
  clearSearchBtn: {
    padding: 6,
  },
  semesterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginBottom: 16,
  },
  semLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  semDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#0745E8',
  },
  semText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  changeSemLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  changeSemLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0745E8',
  },
  continueCard: {
    backgroundColor: '#0745E8',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#0745E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  continueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  continueIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  continueInfo: {
    flex: 1,
  },
  continueLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: 0.5,
  },
  continueSubject: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  continueUnit: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  continueActionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    gap: 4,
  },
  continueActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  filterSection: {
    marginBottom: 14,
  },
  filterSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  toggleSyllabusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 8,
  },
  toggleSyllabusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0745E8',
  },
  filterChipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  subjectChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
  },
  activeSubjectChip: {
    backgroundColor: '#0745E8',
    borderColor: '#0745E8',
  },
  subjectChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  activeSubjectChipText: {
    color: '#FFFFFF',
  },
  syllabusGrid: {
    gap: 8,
    marginBottom: 16,
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
  },
  subjectIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectCode: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0745E8',
  },
  subjectName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  resourceMeta: {
    fontSize: 11,
    color: '#64748B',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  activeFilterChip: {
    backgroundColor: '#0F172A',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  activeFilterChipText: {
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  resetFilterText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },
  notesList: {
    gap: 14,
  },
  noteItemCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  noteCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subjectPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  subjectPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0745E8',
  },
  unitPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  unitPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  pricePillPaid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  pricePillPaidText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  pricePillFree: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  pricePillFreeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  noteItemTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 21,
    marginBottom: 4,
  },
  noteItemSubjectName: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
  },
  noteMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaItemText: {
    fontSize: 11,
    color: '#64748B',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  studyNowBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0745E8',
    height: 40,
    borderRadius: 12,
    gap: 6,
  },
  studyNowBtnOutline: {
    backgroundColor: '#EEF2FF',
  },
  studyNowBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  studyNowBtnOutlineText: {
    color: '#0745E8',
  },
  buyNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 5,
  },
  buyNowBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 36,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  emptyResetBtn: {
    backgroundColor: '#0745E8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  emptyResetText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
