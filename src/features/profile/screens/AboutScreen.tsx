import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export const AboutScreen: React.FC = () => {
  const router = useRouter();

  return (
    <View style={styles.root}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>About & Legal</Text>
            <Text style={styles.headerSub}>App Info & Disclaimers</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Branding Hero Banner */}
        <View style={styles.brandHero}>
          <View style={styles.logoCircle}>
            <Feather name="book-open" size={32} color="#0745E8" />
          </View>
          <Text style={styles.appName}>VTU Ultima</Text>
          <Text style={styles.appVersion}>Version 1.0.0 (Build 2026.09)</Text>
          <Text style={styles.appTagline}>
            The ultimate academic companion for VTU engineering students.
          </Text>
        </View>

        {/* Info Rows */}
        <View style={styles.cardGroup}>
          <TouchableOpacity style={styles.infoRow} activeOpacity={0.8}>
            <Feather name="help-circle" size={18} color="#0745E8" />
            <Text style={styles.rowText}>Help & Support Center</Text>
            <Feather name="chevron-right" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.infoRow} activeOpacity={0.8}>
            <Feather name="shield" size={18} color="#059669" />
            <Text style={styles.rowText}>Privacy Policy</Text>
            <Feather name="chevron-right" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.infoRow} activeOpacity={0.8}>
            <Feather name="file-text" size={18} color="#D97706" />
            <Text style={styles.rowText}>Terms of Service</Text>
            <Feather name="chevron-right" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* University Disclaimer Banner */}
        <View style={styles.disclaimerCard}>
          <View style={styles.disclaimerTitleRow}>
            <Feather name="info" size={16} color="#475569" />
            <Text style={styles.disclaimerTitle}>University Disclaimer</Text>
          </View>
          <Text style={styles.disclaimerText}>
            This mobile application is an independent student productivity platform designed to assist engineering students at Visvesvaraya Technological University (VTU), Belagavi. Syllabus metadata, circular notifications, and question paper archives are curated for study purposes.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerSafeArea: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  brandHero: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#C7D2FE',
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  appVersion: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0745E8',
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  cardGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  rowText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },
  disclaimerCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  disclaimerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  disclaimerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
});
