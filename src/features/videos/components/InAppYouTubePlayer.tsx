import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  Dimensions,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { VideoLesson } from '../types/video.types';
import { openYouTubeVideo } from '../utils/youtubeLauncher';

interface InAppYouTubePlayerProps {
  visible: boolean;
  lesson: VideoLesson | null;
  courseTitle?: string;
  subjectCode?: string;
  instructorName?: string;
  channelName?: string;
  onClose: () => void;
  onNextLesson?: () => void;
  onPrevLesson?: () => void;
  hasNextLesson?: boolean;
  hasPrevLesson?: boolean;
  onOpenNotes?: (noteId?: string) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_HEIGHT = Math.min(SCREEN_WIDTH * (9 / 16), 320);

export const InAppYouTubePlayer: React.FC<InAppYouTubePlayerProps> = ({
  visible,
  lesson,
  courseTitle,
  subjectCode,
  instructorName,
  channelName,
  onClose,
  onNextLesson,
  onPrevLesson,
  hasNextLesson,
  hasPrevLesson,
  onOpenNotes,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  if (!visible || !lesson) return null;

  const videoId = lesson.youtubeVideoId;

  const embedHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; background: #000; }
          html, body { width: 100%; height: 100%; overflow: hidden; background: #000; display: flex; align-items: center; justify-content: center; }
          .video-container { position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
          iframe { width: 100%; height: 100%; border: none; }
        </style>
      </head>
      <body>
        <div class="video-container">
          <iframe
            src="https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&modestbranding=1&rel=0&enablejsapi=1&fs=1"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowfullscreen>
          </iframe>
        </div>
      </body>
    </html>
  `;

  // 1. Minimized WhatsApp-style floating mini-player at the bottom
  if (isMinimized) {
    return (
      <View style={styles.pipFloatingContainer}>
        <TouchableOpacity
          style={styles.pipContent}
          activeOpacity={0.9}
          onPress={() => setIsMinimized(false)}
        >
          {/* Mini video thumbnail container */}
          <View style={styles.pipVideoThumbBox}>
            <FontAwesome5 name="youtube" size={18} color="#EF4444" />
          </View>

          {/* Mini Info */}
          <View style={styles.pipTextContainer}>
            <Text style={styles.pipTitle} numberOfLines={1}>
              {lesson.title}
            </Text>
            <Text style={styles.pipSubtitle} numberOfLines={1}>
              Module {lesson.moduleNumber} • {channelName || 'YouTube Lecture'}
            </Text>
          </View>

          {/* Action buttons */}
          <View style={styles.pipActions}>
            <TouchableOpacity
              style={styles.pipIconBtn}
              onPress={() => openYouTubeVideo(videoId)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="external-link" size={16} color="#EF4444" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pipIconBtn}
              onPress={() => setIsMinimized(false)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="maximize-2" size={16} color="#1E293B" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pipIconBtn}
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="x" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  // 2. Full In-App Embedded Player Modal
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => {
        setIsMinimized(true);
      }}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <SafeAreaView style={styles.modalRoot} edges={['top', 'bottom']}>
        {/* Top Header bar with WhatsApp-style Minimize & YouTube Launch Buttons */}
        <View style={styles.playerTopHeader}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setIsMinimized(true)}
            activeOpacity={0.7}
          >
            <Feather name="chevron-down" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerBadgeText}>
              MODULE {lesson.moduleNumber}
            </Text>
            <Text style={styles.headerSubjectText} numberOfLines={1}>
              {subjectCode ? `${subjectCode} • ` : ''}{courseTitle || 'Video Lecture'}
            </Text>
          </View>

          <View style={styles.headerRightActions}>
            <TouchableOpacity
              style={styles.openYoutubeHeaderBtn}
              activeOpacity={0.8}
              onPress={() => openYouTubeVideo(videoId)}
            >
              <FontAwesome5 name="youtube" size={14} color="#EF4444" />
              <Text style={styles.openYoutubeHeaderText}>App</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Feather name="x" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Video Player Frame */}
        <View style={styles.videoPlayerFrame}>
          {Platform.OS === 'web' ? (
            // Native HTML5 Iframe for web
            <iframe
              key={videoId}
              src={`https://www.youtube-nocookie.com/embed/${videoId}?playsinline=1&modestbranding=1&rel=0&enablejsapi=1&origin=https://www.youtube-nocookie.com`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                backgroundColor: '#000000',
              }}
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : (
            // React Native WebView for Android / iOS
            <WebView
              key={videoId}
              source={{
                uri: `https://www.youtube-nocookie.com/embed/${videoId}?playsinline=1&modestbranding=1&rel=0&enablejsapi=1&origin=https://www.youtube-nocookie.com`,
                headers: {
                  Referer: 'https://www.youtube-nocookie.com',
                },
              }}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsFullscreenVideo={true}
              originWhitelist={['*']}
              userAgent={
                Platform.OS === 'android'
                  ? 'Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
                  : 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
              }
              mixedContentMode="always"
              style={styles.webView}
            />
          )}
        </View>

        {/* Quick YouTube App Direct Launch / Error 150/152 helper banner */}
        <View style={styles.restrictionNoticeBanner}>
          <View style={styles.restrictionNoticeLeft}>
            <FontAwesome5 name="youtube" size={13} color="#EF4444" />
            <Text style={styles.restrictionNoticeText} numberOfLines={1}>
              If blocked by channel rights (Error 152/150):
            </Text>
          </View>
          <TouchableOpacity
            style={styles.restrictionOpenBtn}
            activeOpacity={0.8}
            onPress={() => openYouTubeVideo(videoId)}
          >
            <Text style={styles.restrictionOpenBtnText}>Open YouTube App</Text>
            <Feather name="external-link" size={11} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Lesson Details & Navigation Under Video */}
        <ScrollView
          style={styles.detailsScroll}
          contentContainerStyle={styles.detailsScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title & Metadata Card */}
          <View style={styles.infoCard}>
            <View style={styles.metaBadgeRow}>
              <View style={styles.moduleBadge}>
                <Text style={styles.moduleBadgeText}>VTU Module {lesson.moduleNumber}</Text>
              </View>
              {lesson.durationText ? (
                <View style={styles.durationChip}>
                  <Feather name="clock" size={11} color="#64748B" />
                  <Text style={styles.durationChipText}>{lesson.durationText}</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.lessonTitleText}>{lesson.title}</Text>

            {lesson.unitName ? (
              <Text style={styles.unitNameText}>{lesson.unitName}</Text>
            ) : null}

            {/* Channel / Instructor Card */}
            <View style={styles.channelRow}>
              <View style={styles.channelAvatar}>
                <Feather name="user" size={16} color="#0745E8" />
              </View>
              <View style={styles.channelInfo}>
                <Text style={styles.channelNameText}>
                  {channelName || 'VTU EduLab Masterclasses'}
                </Text>
                <Text style={styles.instructorText}>
                  Educator: {instructorName || 'YouTube Educator'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.channelYoutubeBtn}
                activeOpacity={0.8}
                onPress={() => openYouTubeVideo(videoId)}
              >
                <FontAwesome5 name="youtube" size={13} color="#FFFFFF" />
                <Text style={styles.channelYoutubeBtnText}>Watch on YT</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Previous / Next Lecture Navigation */}
          <View style={styles.navRow}>
            <TouchableOpacity
              style={[styles.navBtn, !hasPrevLesson && styles.navBtnDisabled]}
              disabled={!hasPrevLesson}
              onPress={onPrevLesson}
              activeOpacity={0.8}
            >
              <Feather
                name="arrow-left"
                size={16}
                color={hasPrevLesson ? '#0F172A' : '#94A3B8'}
              />
              <Text
                style={[
                  styles.navBtnText,
                  !hasPrevLesson && styles.navBtnTextDisabled,
                ]}
              >
                Previous
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navBtn, !hasNextLesson && styles.navBtnDisabled]}
              disabled={!hasNextLesson}
              onPress={onNextLesson}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.navBtnText,
                  !hasNextLesson && styles.navBtnTextDisabled,
                ]}
              >
                Next Lecture
              </Text>
              <Feather
                name="arrow-right"
                size={16}
                color={hasNextLesson ? '#0F172A' : '#94A3B8'}
              />
            </TouchableOpacity>
          </View>

          {/* Quick study aids (Notes link) */}
          {lesson.relatedNoteId ? (
            <TouchableOpacity
              style={styles.relatedNoteCard}
              activeOpacity={0.85}
              onPress={() => onOpenNotes && onOpenNotes(lesson.relatedNoteId)}
            >
              <View style={styles.relatedNoteLeft}>
                <View style={styles.relatedNoteIcon}>
                  <Feather name="file-text" size={18} color="#0745E8" />
                </View>
                <View>
                  <Text style={styles.relatedNoteTitle}>Module Hand-Written Notes</Text>
                  <Text style={styles.relatedNoteSub}>Open PDF notes for this specific lecture</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}

          {/* Feature Highlight Pill */}
          <View style={styles.featurePill}>
            <Feather name="check-circle" size={14} color="#059669" />
            <Text style={styles.featurePillText}>
              In-app playback powered by YouTube IFrame. Use the top arrow to minimize into Picture-in-Picture.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  playerTopHeader: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: '#000000',
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  headerBadgeText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerSubjectText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  openYoutubeHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
  },
  openYoutubeHeaderText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  videoPlayerFrame: {
    width: SCREEN_WIDTH,
    height: VIDEO_HEIGHT,
    backgroundColor: '#000000',
  },
  webView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  detailsScroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  detailsScrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  metaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  moduleBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  moduleBadgeText: {
    color: '#0745E8',
    fontSize: 11,
    fontWeight: '700',
  },
  durationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  durationChipText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  lessonTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 22,
    marginBottom: 6,
  },
  unitNameText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 14,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginTop: 4,
    gap: 10,
  },
  channelAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelInfo: {
    flex: 1,
  },
  channelNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  instructorText: {
    fontSize: 11,
    color: '#64748B',
  },
  channelYoutubeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  channelYoutubeBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: 12,
  },
  navBtnDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.6,
  },
  navBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  navBtnTextDisabled: {
    color: '#94A3B8',
  },
  relatedNoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  relatedNoteLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  relatedNoteIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  relatedNoteTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E40AF',
  },
  relatedNoteSub: {
    fontSize: 11,
    color: '#3B82F6',
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 10,
  },
  featurePillText: {
    fontSize: 11,
    color: '#065F46',
    flex: 1,
    lineHeight: 16,
  },

  // WhatsApp-style Floating PiP Mini-Player
  pipFloatingContainer: {
    position: 'absolute',
    bottom: 20,
    left: 12,
    right: 12,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 12,
  },
  pipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pipVideoThumbBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  pipTextContainer: {
    flex: 1,
  },
  pipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  pipSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  pipActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  pipIconBtn: {
    padding: 6,
  },
  restrictionNoticeBanner: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  restrictionNoticeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  restrictionNoticeText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    flex: 1,
  },
  restrictionOpenBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  restrictionOpenBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
