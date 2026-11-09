import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { apiClient } from '@/infrastructure/api/client';
import { useAuthStore } from '@/store';

export type AdPlacement =
  | 'HOME_BANNER'
  | 'NOTES_READER_BOTTOM'
  | 'COMMUNITY_FEED'
  | 'PASSING_PACKAGE_BOTTOM';

export interface AdData {
  id: string;
  title: string;
  sponsorName: string;
  placement: AdPlacement;
  imageUrl: string;
  targetUrl: string;
  ctaText?: string;
}

const FALLBACK_ADS: Record<AdPlacement, AdData> = {
  HOME_BANNER: {
    id: 'ad-camp-101',
    title: 'VTU State Hackathon 2026: Innovate for Karnataka',
    sponsorName: 'VTU Innovation Cell & Karnataka Tech Council',
    placement: 'HOME_BANNER',
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
    targetUrl: 'https://vtu.ac.in',
    ctaText: 'Register Now',
  },
  NOTES_READER_BOTTOM: {
    id: 'ad-camp-102',
    title: 'GATE 2027 Comprehensive Masterclass & Scholarship Test',
    sponsorName: 'National GATE Academy',
    placement: 'NOTES_READER_BOTTOM',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80',
    targetUrl: 'https://vtu.ac.in',
    ctaText: 'Claim 70% Off',
  },
  COMMUNITY_FEED: {
    id: 'ad-camp-103',
    title: 'Full Stack AI & Cloud Developer Internship Drive',
    sponsorName: 'Bengaluru Tech Consortium',
    placement: 'COMMUNITY_FEED',
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
    targetUrl: 'https://vtu.ac.in',
    ctaText: 'Apply Now',
  },
  PASSING_PACKAGE_BOTTOM: {
    id: 'ad-camp-104',
    title: 'VTU Crash Course & Last 5 Years Solved Question Papers',
    sponsorName: 'VTU Scholars Club',
    placement: 'PASSING_PACKAGE_BOTTOM',
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80',
    targetUrl: 'https://vtu.ac.in',
    ctaText: 'Explore Roadmaps',
  },
};

interface AdBannerCardProps {
  placement: AdPlacement;
  visible?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const AdBannerCard: React.FC<AdBannerCardProps> = ({
  placement,
  visible = true,
  compact = false,
  style,
}) => {
  const user = useAuthStore((state) => state.user);
  const [ad, setAd] = useState<AdData | null>(FALLBACK_ADS[placement]);
  const impressionLoggedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const fetchAd = async () => {
      try {
        const queryParams = new URLSearchParams({
          placement,
          branch: user?.branch || 'ALL',
          semester: String(user?.semester || 'ALL'),
          scheme: user?.scheme || 'ALL',
        });

        const res: any = await apiClient.get(`/ads/active?${queryParams.toString()}`);
        const data = res.data?.data || res.data || res;
        const list = Array.isArray(data) ? data : data.items || data.data || [];

        if (isMounted && Array.isArray(list) && list.length > 0) {
          setAd(list[0]);
        }
      } catch {
        // Retain fallback ad
      }
    };

    fetchAd();

    return () => {
      isMounted = false;
    };
  }, [placement, user?.branch, user?.semester, user?.scheme]);

  // Track impression once per ad mount
  useEffect(() => {
    if (ad && !impressionLoggedRef.current) {
      impressionLoggedRef.current = true;
      apiClient.post(`/ads/${ad.id}/impression`).catch(() => {});
    }
  }, [ad]);

  if (!visible || !ad) {
    return null;
  }

  const handlePress = async () => {
    try {
      apiClient.post(`/ads/${ad.id}/click`).catch(() => {});
      if (ad.targetUrl) {
        const canOpen = await Linking.canOpenURL(ad.targetUrl);
        if (canOpen) {
          await Linking.openURL(ad.targetUrl);
        }
      }
    } catch {
      // Ignore link error
    }
  };

  // Compact sticky bar layout (used in Notes Reader footer)
  if (compact || placement === 'NOTES_READER_BOTTOM') {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        style={[styles.compactContainer, style]}
      >
        <View style={styles.compactLeft}>
          <View style={styles.compactSponsoredPill}>
            <Text style={styles.compactSponsoredText}>AD</Text>
          </View>
          <View style={styles.compactTextWrap}>
            <Text style={styles.compactTitle} numberOfLines={1}>
              {ad.title}
            </Text>
            <Text style={styles.compactSponsor} numberOfLines={1}>
              {ad.sponsorName}
            </Text>
          </View>
        </View>

        <View style={styles.compactCtaBtn}>
          <Text style={styles.compactCtaText}>{ad.ctaText || 'Learn More'}</Text>
          <Feather name="external-link" size={11} color="#0745E8" />
        </View>
      </TouchableOpacity>
    );
  }

  // Full native banner card layout (Home, Community Feed, Passing Package)
  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={handlePress}
      style={[styles.cardContainer, style]}
    >
      {/* Banner Creative Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: ad.imageUrl }}
          style={styles.bannerImage}
          resizeMode="cover"
        />
        {/* Sponsored Pill Overlay */}
        <View style={styles.sponsoredBadge}>
          <Text style={styles.sponsoredBadgeText}>SPONSORED</Text>
        </View>
      </View>

      {/* Card Details */}
      <View style={styles.contentWrap}>
        <View style={styles.infoLeft}>
          <Text style={styles.adTitle} numberOfLines={2}>
            {ad.title}
          </Text>
          <Text style={styles.adSponsor} numberOfLines={1}>
            By {ad.sponsorName}
          </Text>
        </View>

        <View style={styles.ctaButton}>
          <Text style={styles.ctaButtonText}>{ad.ctaText || 'Open'}</Text>
          <Feather name="arrow-up-right" size={13} color="#FFFFFF" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginVertical: 10,
  },
  imageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#0F172A',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  sponsoredBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sponsoredBadgeText: {
    color: '#F8FAFC',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  contentWrap: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  infoLeft: {
    flex: 1,
  },
  adTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
  },
  adSponsor: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  ctaButton: {
    backgroundColor: '#0745E8',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shrink: 0,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // Compact Sticky Bar Styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  compactLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 10,
  },
  compactSponsoredPill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  compactSponsoredText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
  },
  compactTextWrap: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  compactSponsor: {
    fontSize: 10,
    color: '#64748B',
  },
  compactCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  compactCtaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0745E8',
  },
});
