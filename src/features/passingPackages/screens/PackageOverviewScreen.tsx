import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { usePassingPackageStore } from '../store/usePassingPackageStore';
import { PackageStats } from '../components/PackageStats';
import { PackageSectionCard } from '../components/PackageSectionCard';
import { SubjectSelector } from '../components/SubjectSelector';
import { PaymentCheckoutModal } from '@/features/notes/components/PaymentCheckoutModal';
import { AdBannerCard } from '@/shared/components/AdBannerCard';
import { Header } from '@/shared/components/Header';
import { CustomConfirmationModal } from '@/shared/components/CustomConfirmationModal';

export const PackageOverviewScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    getPackageById,
    getPackagesForCurrentStudent,
    isPackageUnlocked,
    unlockPackage,
  } = usePassingPackageStore();

  const currentPackages = getPackagesForCurrentStudent();
  const pkg = getPackageById(id || '') || currentPackages[0];

  const [isCheckoutVisible, setIsCheckoutVisible] = useState(false);
  const [paymentSuccessVisible, setPaymentSuccessVisible] = useState(false);

  if (!pkg) {
    return (
      <View style={styles.errorRoot}>
        <Text style={styles.errorText}>Package Not Found</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isUnlocked = isPackageUnlocked(pkg.id);
  const isPaid = Boolean(pkg.isPaid && (pkg.price ?? 49) > 0);
  const isRestrictedPreview = isPaid && !isUnlocked;
  const price = pkg.price ?? 49;
  const originalPrice = pkg.originalPrice ?? 129;

  const payableResource = {
    id: pkg.id,
    title: `${pkg.subjectCode} ${pkg.subjectName} Passing Package`,
    price,
    subjectCode: pkg.subjectCode,
    subjectName: pkg.subjectName,
    totalPages: 24,
    category: 'PASSING_PACKAGES' as const,
  };

  const handlePaymentSuccess = () => {
    unlockPackage(pkg.id);
    setIsCheckoutVisible(false);
    setPaymentSuccessVisible(true);
  };

  const handleLockedSectionPress = (sectionName: string) => {
    if (isRestrictedPreview) {
      setIsCheckoutVisible(true);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0745E8" />

      {/* Unified Custom Header */}
      <Header
        title={`${pkg.subjectCode} Package`}
        dark={true}
        showBack={true}
        rightElement={
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/passing-packages/saved' as any)}
          >
            <Feather name="bookmark" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {/* Subject Switcher Bar */}
      {currentPackages.length > 1 && (
        <SubjectSelector
          packages={currentPackages}
          selectedId={pkg.id}
          onSelectPackage={(p) => router.replace(`/passing-packages/overview/${p.id}` as any)}
        />
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Subject Info Strip */}
        <View style={styles.subjectInfoCard}>
          <View style={styles.subjectInfoTop}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.subjectTitle}>{pkg.subjectName}</Text>
              <Text style={styles.subjectMeta}>
                VTU {pkg.branch} • Sem {pkg.semester} • {pkg.scheme} Scheme
              </Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Feather name="shield" size={14} color="#059669" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>
        </View>

        {/* Monetization & Unlock Card */}
        {isRestrictedPreview ? (
          <View style={styles.monetizationCard}>
            <View style={styles.pricingTopRow}>
              <View>
                <View style={styles.pricingBadgeRow}>
                  <Text style={styles.packageCategoryPill}>HIGH-YIELD PASSING PACKAGE</Text>
                  <View style={styles.discountPill}>
                    <Text style={styles.discountText}>SAVE 62%</Text>
                  </View>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceText}>₹{price}</Text>
                  <Text style={styles.originalPriceText}>₹{originalPrice}</Text>
                  <Text style={styles.priceMeta}>One-Time Unlock</Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.88}
                style={styles.unlockBtn}
                onPress={() => setIsCheckoutVisible(true)}
              >
                <Feather name="unlock" size={16} color="#FFFFFF" />
                <Text style={styles.unlockBtnText}>Unlock Now</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.previewNoticeBox}>
              <Feather name="lock" size={13} color="#D97706" />
              <Text style={styles.previewNoticeText}>
                Preview Mode Active: Practice introductory questions free. Unlock to access 1-Night-Before Exam Sequence, 5-Year Repeated Questions & Offline PDF solutions.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.unlockedBanner}>
            <View style={styles.unlockedIconCircle}>
              <Feather name="check-circle" size={18} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.unlockedTitle}>Full Package Unlocked</Text>
              <Text style={styles.unlockedSub}>
                Lifetime access to all 5 units, 1-night revision guides, and offline PDFs.
              </Text>
            </View>
          </View>
        )}

        {/* Package Statistics */}
        <PackageStats pkg={pkg} />

        {/* 6 Primary Package Feature Sections */}
        <View style={styles.sectionsContainer}>
          <Text style={styles.sectionHeaderTitle}>Passing Package Modules</Text>

          {/* 1. Emergency 1-Night-Before (Special Dark Tile) */}
          <PackageSectionCard
            title="1-Night-Before-Exam Mode"
            subtitle="Rapid 45-min sequence covering top-priority units & compulsory questions"
            iconName="moon"
            iconColor="#F472B6"
            iconBg="rgba(244, 114, 182, 0.15)"
            badgeCount={isRestrictedPreview ? 'LOCKED' : 'RECOMMENDED'}
            badgeColor={isRestrictedPreview ? '#FEE2E2' : '#0745E8'}
            badgeTextColor={isRestrictedPreview ? '#DC2626' : '#FFFFFF'}
            isSpecial
            onPress={() => {
              if (isRestrictedPreview) {
                handleLockedSectionPress('1-Night-Before-Exam Mode');
              } else {
                router.push(`/passing-packages/night-before/${pkg.id}` as any);
              }
            }}
          />

          {/* 2. Important Questions */}
          <PackageSectionCard
            title="Important Questions"
            subtitle="High-yield questions with marks breakdown and solution hints"
            iconName="help-circle"
            iconColor="#0745E8"
            iconBg="#EEF2FF"
            badgeCount={isRestrictedPreview ? 'PREVIEW (FREE)' : pkg.importantQuestionsCount}
            badgeColor="#EEF2FF"
            badgeTextColor="#0745E8"
            onPress={() => router.push(`/passing-packages/important-questions/${pkg.id}` as any)}
          />

          {/* 3. Repeated Questions */}
          <PackageSectionCard
            title="Repeated Questions"
            subtitle="Sorted by frequency of appearance across past 5 VTU exam cycles"
            iconName="repeat"
            iconColor="#0745E8"
            iconBg="#EEF2FF"
            badgeCount={isRestrictedPreview ? 'LOCKED' : pkg.repeatedQuestionsCount}
            badgeColor={isRestrictedPreview ? '#FEE2E2' : '#EEF2FF'}
            badgeTextColor={isRestrictedPreview ? '#DC2626' : '#0745E8'}
            onPress={() => {
              if (isRestrictedPreview) {
                handleLockedSectionPress('Repeated Questions');
              } else {
                router.push(`/passing-packages/repeated-questions/${pkg.id}` as any);
              }
            }}
          />

          {/* 4. Most Expected Questions */}
          <PackageSectionCard
            title="Most Expected Questions"
            subtitle="Categorized into Very High, High, and Medium Priority focus areas"
            iconName="target"
            iconColor="#DC2626"
            iconBg="#FEF2F2"
            badgeCount={pkg.expectedQuestionsCount}
            badgeColor="#FEF2F2"
            badgeTextColor="#DC2626"
            onPress={() => router.push(`/passing-packages/expected-questions/${pkg.id}` as any)}
          />

          {/* 5. Unit Weightage Visualizer */}
          <PackageSectionCard
            title="Unit Weightage & Progress"
            subtitle="Visual progress indicators comparing expected marks weightage per unit"
            iconName="bar-chart-2"
            iconColor="#0284C7"
            iconBg="#E0F2FE"
            badgeCount={`${pkg.unitCount} Units`}
            badgeColor="#E0F2FE"
            badgeTextColor="#0284C7"
            onPress={() => router.push(`/passing-packages/unit-weightage/${pkg.id}` as any)}
          />

          {/* 6. Last-Minute Revision */}
          <PackageSectionCard
            title="Last-Minute Revision PDFs"
            subtitle="Formula cheat-sheets, key concepts, and 15 compulsory exam diagrams"
            iconName="file-text"
            iconColor="#D97706"
            iconBg="#FEF3C7"
            badgeCount={isRestrictedPreview ? 'LOCKED (PDF)' : pkg.revisionResourceCount}
            badgeColor={isRestrictedPreview ? '#FEE2E2' : '#FEF3C7'}
            badgeTextColor={isRestrictedPreview ? '#DC2626' : '#D97706'}
            onPress={() => {
              if (isRestrictedPreview) {
                handleLockedSectionPress('Last-Minute Revision PDFs');
              } else {
                router.push(`/passing-packages/revision/${pkg.id}` as any);
              }
            }}
          />
        </View>

        {/* Sponsored Banner Slot */}
        <View style={{ paddingHorizontal: 16 }}>
          <AdBannerCard placement="PASSING_PACKAGE_BOTTOM" />
        </View>

        {/* Disclaimer Bar */}
        <View style={styles.disclaimerBox}>
          <Feather name="info" size={14} color="#64748B" />
          <Text style={styles.disclaimerText}>
            Passing packages are exam preparation tools curated by VTU toppers based on historical exam patterns. Questions are designed for high probability passing outcomes.
          </Text>
        </View>
      </ScrollView>

      {/* Universal In-App Payment Checkout Modal */}
      <PaymentCheckoutModal
        visible={isCheckoutVisible}
        onClose={() => setIsCheckoutVisible(false)}
        resource={payableResource}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Custom Confirmation Modal for Payment Success */}
      <CustomConfirmationModal
        visible={paymentSuccessVisible}
        onClose={() => setPaymentSuccessVisible(false)}
        title="Passing Package Unlocked!"
        message="You now have complete access to the 1-Night-Before Exam Sequence, Repeated Exam Questions, Model Answers, and PDF Downloads."
        confirmText="Start Studying"
        type="success"
        icon="check-circle"
        showCancel={false}
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
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  backBtnText: {
    color: '#0745E8',
    fontWeight: '700',
    marginTop: 10,
  },
  header: {
    backgroundColor: '#0745E8',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 12,
  },
  codePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 2,
  },
  codeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  headerSubject: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  scrollContent: {
    paddingBottom: 36,
  },
  subjectInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subjectInfoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subjectTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 24,
  },
  subjectMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  monetizationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#0745E8',
    shadowColor: '#0745E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  pricingTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pricingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  packageCategoryPill: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0745E8',
    letterSpacing: 0.5,
  },
  discountPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  discountText: {
    color: '#059669',
    fontSize: 9,
    fontWeight: '800',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  priceText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
  },
  originalPriceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  priceMeta: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0745E8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: '#0745E8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  unlockBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  previewNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  previewNoticeText: {
    flex: 1,
    fontSize: 11,
    color: '#92400E',
    lineHeight: 16,
    fontWeight: '500',
  },
  unlockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  unlockedIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
  },
  unlockedSub: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
  },
  sectionsContainer: {
    paddingHorizontal: 16,
    marginTop: 6,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
});
