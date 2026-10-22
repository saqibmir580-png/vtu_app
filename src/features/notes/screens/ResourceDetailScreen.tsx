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
import { MOCK_RESOURCES } from '../api/notesData';
import { fetchNoteByIdFromApi } from '../api/notesApi';
import { NoteResource } from '../types/notes.types';
import { useAuthStore } from '@/store';

export const ResourceDetailScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const user = useAuthStore((state) => state.user);

  const [resource, setResource] = useState<NoteResource>(
    () => MOCK_RESOURCES.find((r) => r.id === id) || MOCK_RESOURCES[0]
  );
  const [isLoading, setIsLoading] = useState(true);

  const [isBookmarked, setIsBookmarked] = useState(resource.isBookmarked);
  const [isDownloaded, setIsDownloaded] = useState(resource.isDownloaded);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    let isMounted = true;
    if (id) {
      fetchNoteByIdFromApi(id as string, user?.id).then((res) => {
        if (isMounted && res) {
          setResource(res);
          setIsBookmarked(res.isBookmarked);
          setIsDownloaded(res.isDownloaded);
        }
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, [id, user?.id]);

  const handleDownload = () => {
    if (isDownloaded) return;
    setIsDownloading(true);
    let prog = 0;
    const interval = setInterval(() => {
      prog += 25;
      setDownloadProgress(prog);
      if (prog >= 100) {
        clearInterval(interval);
        setIsDownloading(false);
        setIsDownloaded(true);
      }
    }, 400);
  };

  return (
    <View style={styles.rootContainer}>
      <Header title="Resource Details" showBack />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Resource Preview Header Card */}
        <View style={styles.previewCard}>
          <View style={styles.fileTypeBox}>
            <Feather name="file-text" size={32} color="#0745E8" />
            <Text style={styles.fileFormatTag}>{resource.fileFormat}</Text>
          </View>
          <View style={styles.previewInfo}>
            <View style={styles.badgeRow}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{resource.type}</Text>
              </View>
              <Text style={styles.fileSizeText}>{resource.fileSize}</Text>
            </View>
            <Text style={styles.resourceTitle}>{resource.title}</Text>
            <Text style={styles.subjectSub}>
              {resource.subjectCode} • {resource.subjectName} (Unit {resource.unitNumber})
            </Text>
          </View>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.actionsRow}>
          {/* Open Reader Primary Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.openBtn}
            onPress={() => router.push(`/notes/${resource.id}?view=reader`)}
          >
            <Feather name="book-open" size={18} color="#FFFFFF" />
            <Text style={styles.openBtnText}>Open Document</Text>
          </TouchableOpacity>

          {/* Bookmark Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.iconActionBtn, isBookmarked && styles.activeIconActionBtn]}
            onPress={() => setIsBookmarked(!isBookmarked)}
          >
            <Feather name="bookmark" size={20} color={isBookmarked ? '#0745E8' : '#64748B'} />
          </TouchableOpacity>

          {/* Download Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.iconActionBtn, isDownloaded && styles.downloadedBtn]}
            onPress={handleDownload}
            disabled={isDownloading}
          >
            <Feather
              name={isDownloaded ? 'check-circle' : isDownloading ? 'loader' : 'download'}
              size={20}
              color={isDownloaded ? '#16A34A' : '#64748B'}
            />
          </TouchableOpacity>
        </View>

        {/* Download State Progress Banner */}
        {isDownloading && (
          <View style={styles.downloadStateCard}>
            <View style={styles.downloadStateHeader}>
              <Text style={styles.downloadStateTitle}>Downloading Resource...</Text>
              <Text style={styles.downloadPercent}>{downloadProgress}%</Text>
            </View>
            <View style={styles.downloadTrack}>
              <View style={[styles.downloadFill, { width: `${downloadProgress}%` }]} />
            </View>
          </View>
        )}

        {/* Offline Available Badge */}
        {isDownloaded && !isDownloading && (
          <View style={styles.offlineAvailableCard}>
            <Feather name="check-circle" size={18} color="#16A34A" />
            <Text style={styles.offlineAvailableText}>Available Offline in Downloads</Text>
          </View>
        )}

        {/* Description Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Overview & Description</Text>
          <Text style={styles.descriptionText}>{resource.description}</Text>
          <View style={styles.authorMetaRow}>
            <Text style={styles.metaLabel}>Author / Contributor:</Text>
            <Text style={styles.metaValue}>{resource.author}</Text>
          </View>
          <View style={styles.authorMetaRow}>
            <Text style={styles.metaLabel}>Downloads:</Text>
            <Text style={styles.metaValue}>{resource.downloadsCount} students</Text>
          </View>
        </View>

        {/* Table of Contents Section */}
        {resource.tableOfContents && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Table of Contents ({resource.tableOfContents.length})</Text>
            <View style={styles.tocList}>
              {resource.tableOfContents.map((item, index) => (
                <View key={index} style={styles.tocItem}>
                  <View style={styles.tocDot} />
                  <Text style={styles.tocText}>{item}</Text>
                </View>
              ))}
            </View>
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
  previewCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  fileTypeBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileFormatTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0745E8',
    marginTop: 2,
  },
  previewInfo: {
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
  fileSizeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 22,
  },
  subjectSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  openBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0745E8',
    borderRadius: 16,
    paddingVertical: 14,
    gap: 8,
    shadowColor: '#0745E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  openBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  iconActionBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconActionBtn: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    borderWidth: 1.5,
  },
  downloadedBtn: {
    backgroundColor: '#DCFCE7',
  },
  downloadStateCard: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  downloadStateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  downloadStateTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0369A1',
  },
  downloadPercent: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0369A1',
  },
  downloadTrack: {
    height: 6,
    backgroundColor: '#E0F2FE',
    borderRadius: 3,
    overflow: 'hidden',
  },
  downloadFill: {
    height: '100%',
    backgroundColor: '#0284C7',
    borderRadius: 3,
  },
  offlineAvailableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
    gap: 8,
  },
  offlineAvailableText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 14,
  },
  authorMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  metaLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  tocList: {
    gap: 10,
  },
  tocItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tocDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0745E8',
  },
  tocText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
});
