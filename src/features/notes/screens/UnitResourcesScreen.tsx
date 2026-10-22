import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Header } from '@/shared/components';
import { MOCK_UNITS, MOCK_RESOURCES } from '../api/notesData';

export const UnitResourcesScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [resources, setResources] = useState(MOCK_RESOURCES);

  const unit = MOCK_UNITS.find((u) => u.id === id) || MOCK_UNITS[0];

  const filters = ['All', 'Handwritten Notes', 'Typed Notes', 'Short Notes', 'Revision Notes'];

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
      <Header title={`Unit ${unit.unitNumber}`} showBack />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Unit Info Header */}
        <View style={styles.unitHeaderCard}>
          <Text style={styles.unitTag}>Unit {unit.unitNumber} Syllabus</Text>
          <Text style={styles.unitTitle}>{unit.title}</Text>
          <Text style={styles.resourceCountText}>{filteredResources.length} Resources available</Text>
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
              <Text style={styles.videoBannerSub}>Watch YouTube lectures for this subject</Text>
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
        <View style={styles.resourcesList}>
          {filteredResources.map((res) => (
            <TouchableOpacity
              key={res.id}
              activeOpacity={0.85}
              style={styles.resourceCard}
              onPress={() => router.push(`/notes/${res.id}` as any)}
            >
              <View style={styles.cardTop}>
                <View style={styles.iconBox}>
                  <Feather name="file-text" size={22} color="#0745E8" />
                </View>
                <View style={styles.titleWrapper}>
                  <View style={styles.badgeRow}>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>{res.type}</Text>
                    </View>
                    <Text style={styles.fileFormatText}>{res.fileFormat} • {res.fileSize}</Text>
                    {res.isPaid && !res.isPurchased ? (
                      <View style={styles.listPaidBadge}>
                        <Feather name="lock" size={10} color="#D97706" />
                        <Text style={styles.listPaidBadgeText}>Paid • ₹{res.price || 19}</Text>
                      </View>
                    ) : res.isPurchased ? (
                      <View style={styles.listFreeBadge}>
                        <Feather name="check" size={10} color="#059669" />
                        <Text style={styles.listFreeBadgeText}>Unlocked</Text>
                      </View>
                    ) : (
                      <View style={styles.listFreeBadge}>
                        <Feather name="gift" size={10} color="#059669" />
                        <Text style={styles.listFreeBadgeText}>Free</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.resourceTitle}>{res.title}</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.bookmarkBtn}
                  onPress={() => toggleBookmark(res.id)}
                >
                  <Feather
                    name="bookmark"
                    size={18}
                    color={res.isBookmarked ? '#0745E8' : '#94A3B8'}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.descriptionText} numberOfLines={2}>
                {res.description}
              </Text>

              <View style={styles.cardFooter}>
                <Text style={styles.authorText}>By {res.author}</Text>
                <View style={styles.openLink}>
                  <Text style={styles.openLinkText}>View Note</Text>
                  <Feather name="arrow-right" size={14} color="#0745E8" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
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
    backgroundColor: '#EEF2FF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderColor: '#C7D2FE',
    borderWidth: 1,
  },
  unitTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0745E8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  unitTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
    marginBottom: 6,
    lineHeight: 24,
  },
  resourceCountText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  filterRow: {
    gap: 8,
    paddingBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  activeFilterChip: {
    backgroundColor: '#0745E8',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  activeFilterChipText: {
    color: '#FFFFFF',
  },
  resourcesList: {
    gap: 14,
  },
  resourceCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0745E8',
  },
  fileFormatText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
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
  resourceTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 20,
  },
  bookmarkBtn: {
    padding: 4,
    marginLeft: 8,
  },
  descriptionText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  authorText: {
    fontSize: 12,
    color: '#64748B',
  },
  openLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  openLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0745E8',
  },
  videoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FFE4E6',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  videoBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#9F1239',
  },
  videoBannerSub: {
    fontSize: 11,
    color: '#E11D48',
    marginTop: 1,
  },
});
