import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Header } from '@/shared/components';
import { StatusBar } from 'react-native';
import { fetchNotesFromApi } from '../api/notesApi';
import { NoteResource } from '../types/notes.types';

export const UnitResourcesScreen: React.FC = () => {
  const router = useRouter();
  const { id, subjectCode, subjectName } = useLocalSearchParams<{
    id: string;
    subjectCode?: string;
    subjectName?: string;
  }>();

  const unitNum = parseInt(id || '1', 10) || 1;
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [resources, setResources] = useState<NoteResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const filters = ['All', 'Handwritten Notes', 'Typed Notes', 'Short Notes', 'Revision Notes'];

  useEffect(() => {
    let isMounted = true;
    const loadUnitNotes = async () => {
      try {
        const fetched = await fetchNotesFromApi({
          subjectCode: subjectCode || undefined,
        });
        const unitNotes = (fetched || []).filter(
          (n) => (n.unitNumber || 1) === unitNum
        );
        if (isMounted) {
          setResources(unitNotes);
        }
      } catch (err) {
        if (isMounted) {
          setResources([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadUnitNotes();
    return () => {
      isMounted = false;
    };
  }, [unitNum, subjectCode]);

  const toggleBookmark = (resId: string) => {
    setResources((prev) =>
      prev.map((r) => (r.id === resId ? { ...r, isBookmarked: !r.isBookmarked } : r))
    );
  };

  const filteredResources = resources.filter((res) => {
    if (activeFilter === 'All') return true;
    return res.type === activeFilter;
  });

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0745E8" />
      <Header title={`Module ${unitNum} Resources`} dark={true} showBack={true} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Unit Info Header */}
        <View style={styles.unitHeaderCard}>
          <Text style={styles.unitTag}>Module {unitNum} Syllabus</Text>
          <Text style={styles.unitTitle}>
            {subjectName ? decodeURIComponent(subjectName) : `Module ${unitNum} Notes`}
          </Text>
          <Text style={styles.resourceCountText}>
            {filteredResources.length} {filteredResources.length === 1 ? 'Resource' : 'Resources'} available
          </Text>
        </View>

        {/* Video Lectures Quick Link */}
        <TouchableOpacity
          style={styles.videoBanner}
          activeOpacity={0.85}
          onPress={() => router.push('/videos' as any)}
        >
          <View style={styles.videoBannerLeft}>
            <View style={styles.videoBannerIcon}>
              <Feather name="video" size={18} color="#E11D48" />
            </View>
            <View>
              <Text style={styles.videoBannerTitle}>Module Video Lectures</Text>
              <Text style={styles.videoBannerSub}>Watch topic lectures for this module</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={18} color="#94A3B8" />
        </TouchableOpacity>

        {/* Filter Chips Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, activeFilter === filter && styles.activeFilterChip]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterChipText, activeFilter === filter && styles.activeFilterChipText]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Resource Cards List */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0745E8" />
            <Text style={styles.loadingText}>Loading module resources...</Text>
          </View>
        ) : filteredResources.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="file-text" size={40} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Resources Uploaded</Text>
            <Text style={styles.emptySub}>
              No study documents have been uploaded for Module {unitNum} yet.
            </Text>
          </View>
        ) : (
          <View style={styles.resourcesList}>
            {filteredResources.map((res) => (
              <TouchableOpacity
                key={res.id}
                activeOpacity={0.85}
                style={styles.resourceCard}
                onPress={() => router.push(`/notes/${res.id}?view=reader` as any)}
              >
                <View style={styles.cardTop}>
                  <View style={styles.iconBox}>
                    <Feather
                      name={res.fileFormat === 'IMAGE' ? 'image' : 'file-text'}
                      size={22}
                      color="#0745E8"
                    />
                  </View>
                  <View style={styles.titleWrapper}>
                    <View style={styles.badgeRow}>
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>{res.type}</Text>
                      </View>
                      <Text style={styles.fileSizeText}>
                        {res.fileFormat} • {res.fileSize}
                      </Text>
                    </View>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {res.title}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBottom}>
                  <View style={styles.authorRow}>
                    <Feather name="user" size={13} color="#94A3B8" />
                    <Text style={styles.authorText}>{res.author || 'VTU Faculty'}</Text>
                  </View>

                  <View style={styles.actionBtns}>
                    <TouchableOpacity
                      style={styles.bookmarkBtn}
                      onPress={() => toggleBookmark(res.id)}
                    >
                      <Feather
                        name="bookmark"
                        size={16}
                        color={res.isBookmarked ? '#0745E8' : '#94A3B8'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  unitHeaderCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  unitTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0745E8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  unitTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  resourceCountText: {
    fontSize: 12,
    color: '#64748B',
  },
  videoBanner: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FFE4E6',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  videoBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  videoBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#9F1239',
  },
  videoBannerSub: {
    fontSize: 11,
    color: '#BE123C',
    marginTop: 1,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  activeFilterChip: {
    backgroundColor: '#0745E8',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  activeFilterChipText: {
    color: '#FFFFFF',
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptySub: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  resourcesList: {
    gap: 12,
  },
  resourceCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrapper: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  typeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  fileSizeText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 18,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorText: {
    fontSize: 11,
    color: '#64748B',
  },
  actionBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  bookmarkBtn: {
    padding: 4,
  },
});
