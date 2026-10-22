import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StudyHistory } from '../types/home.types';

interface ContinueStudyingCardProps {
  history: StudyHistory | null;
}

export const ContinueStudyingCard: React.FC<ContinueStudyingCardProps> = ({ history }) => {
  const router = useRouter();

  if (!history) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.emptyCard}
          onPress={() => router.push('/(tabs)/library')}
        >
          <View style={styles.emptyIconBox}>
            <Feather name="book-open" size={18} color="#0745E8" />
          </View>
          <View style={styles.infoWrapper}>
            <Text style={styles.subjectText}>Explore Notes Library</Text>
            <Text style={styles.unitText}>Browse module PDFs & VTU resources</Text>
          </View>
          <View style={styles.arrowCircle}>
            <Feather name="chevron-right" size={18} color="#0745E8" />
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Continue Studying</Text>
        <Text style={styles.timeText}>{history.lastOpenedTime}</Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.cardContent}
        onPress={() => router.push(`/notes/${history.resourceId}?view=reader`)}
      >
        {/* Left Icon */}
        <View style={styles.iconBox}>
          <Feather name="book-open" size={20} color="#0745E8" />
        </View>

        {/* Middle Details & Progress */}
        <View style={styles.infoWrapper}>
          <View style={styles.subjectRow}>
            <Text style={styles.subjectText} numberOfLines={1}>
              {history.subject}
            </Text>
            <Text style={styles.percentText}>{history.progress}%</Text>
          </View>

          <Text style={styles.unitText} numberOfLines={1}>
            {history.unit} • {history.resourceTitle}
          </Text>

          {/* Slim Progress Bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${history.progress}%` }]} />
          </View>
        </View>

        {/* Right Arrow Action */}
        <View style={styles.arrowCircle}>
          <Feather name="chevron-right" size={18} color="#0745E8" />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  timeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  cardContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  subjectText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginRight: 6,
  },
  percentText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#16A34A',
  },
  unitText: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 6,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0745E8',
    borderRadius: 2,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emptyIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
