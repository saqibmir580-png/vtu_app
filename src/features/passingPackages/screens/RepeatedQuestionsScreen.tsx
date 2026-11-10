import React from 'react';
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
import { RepeatedQuestionCard } from '../components/RepeatedQuestionCard';
import { Header } from '@/shared/components/Header';

export const RepeatedQuestionsScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    getPackageById,
    getPackagesForCurrentStudent,
    bookmarkedQuestionIds,
    toggleQuestionBookmark,
  } = usePassingPackageStore();

  const pkg = getPackageById(id || '') || getPackagesForCurrentStudent()[0];

  if (!pkg) {
    return (
      <View style={styles.errorRoot}>
        <Text>Package Not Found</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0745E8" />
      <Header title="Repeated Questions" dark={true} showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Frequency Info Banner */}
        <View style={styles.infoBanner}>
          <Feather name="repeat" size={20} color="#7C3AED" />
          <View style={styles.infoTextWrapper}>
            <Text style={styles.infoTitle}>Historical Frequency Ranking</Text>
            <Text style={styles.infoSub}>
              Questions appearing 2x or more in VTU Regular & Model papers over the last 5 years.
            </Text>
          </View>
        </View>

        {/* Question Cards List */}
        {pkg.repeatedQuestions.map((q) => (
          <RepeatedQuestionCard
            key={q.id}
            question={q}
            isBookmarked={bookmarkedQuestionIds.includes(q.id)}
            onToggleBookmark={() => toggleQuestionBookmark(q.id)}
            onPressQuestion={() =>
              router.push(`/passing-packages/question/${q.id}?pkgId=${pkg.id}` as any)
            }
          />
        ))}
      </ScrollView>
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
  scrollContent: {
    padding: 16,
  },
  infoBanner: {
    backgroundColor: '#F3E8FF',
    borderColor: '#DDD6FE',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  infoTextWrapper: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6D28D9',
  },
  infoSub: {
    fontSize: 12,
    color: '#5B21B6',
    marginTop: 2,
    lineHeight: 16,
  },
});
