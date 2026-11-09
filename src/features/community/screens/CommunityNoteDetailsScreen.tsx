import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useCommunityStore } from '../store/useCommunityStore';
import { useSavedStore } from '@/features/saved/store/useSavedStore';
import { useAuthStore } from '@/store';
import { ResourceInfoCard } from '../components/ResourceInfoCard';
import { ResourcePreview } from '../components/ResourcePreview';
import { ResourceActionBar } from '../components/ResourceActionBar';
import { ContributorMiniCard } from '../components/ContributorMiniCard';
import { ReportBottomSheet } from '../components/ReportBottomSheet';

interface NoteComment {
  id: string;
  userName: string;
  userBranch: string;
  userCollege: string;
  commentedOn: string;
  content: string;
  likesCount: number;
}

export const CommunityNoteDetailsScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getResourceById, resources } = useCommunityStore();
  const { items, toggleBookmark, toggleDownload } = useSavedStore();

  const resource = getResourceById(id || '') || resources[0];
  const [reportSheetVisible, setReportSheetVisible] = useState(false);

  if (!resource) {
    return (
      <View style={styles.errorRoot}>
        <Text>Resource details not found</Text>
      </View>
    );
  }

  const savedItem = items.find((i) => i.id === resource.id);
  const isDownloaded = savedItem ? savedItem.isDownloaded : false;
  const isBookmarked = savedItem ? savedItem.isBookmarked : false;

  const user = useAuthStore((s) => s.user);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<NoteComment[]>([
    {
      id: 'comm-1',
      userName: 'Rohan Kulkarni',
      userBranch: 'CSE • Sem 5',
      userCollege: 'BMSCE',
      commentedOn: 'Yesterday at 4:30 PM',
      content: 'Clear handwritten diagrams for Unit 3! Helped me clear the internal test.',
      likesCount: 14,
    },
    {
      id: 'comm-2',
      userName: 'Pooja Hegde',
      userBranch: 'ISE • Sem 5',
      userCollege: 'MSRIT',
      commentedOn: '3 days ago',
      content: 'Are all 5 units covered in this PDF or only Unit 1 & 2?',
      likesCount: 5,
    },
  ]);

  const handlePostComment = () => {
    if (!commentText.trim()) return;
    const newComment: NoteComment = {
      id: `comm-${Date.now()}`,
      userName: user?.name || 'Student Contributor',
      userBranch: `${user?.branch || 'CSE'} • Sem ${user?.semester || 5}`,
      userCollege: user?.college ? user.college.split(' ')[0] : 'VTU College',
      commentedOn: 'Just now',
      content: commentText.trim(),
      likesCount: 0,
    };
    setComments([newComment, ...comments]);
    setCommentText('');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={20} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle} numberOfLines={1}>{resource.title}</Text>
            <Text style={styles.headerSub}>{resource.subjectCode} Community Resource</Text>
          </View>

          <TouchableOpacity
            style={styles.rateBtn}
            onPress={() => router.push(`/community/rating/${resource.id}` as any)}
          >
            <Feather name="star" size={18} color="#F59E0B" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Contributor Header */}
        <ContributorMiniCard
          contributor={resource.contributor}
          uploadedAt={resource.uploadedAt}
          onPress={() => router.push(`/community/contributor/${resource.contributor.id}` as any)}
        />

        {/* Embedded Document Preview */}
        <ResourcePreview
          title={resource.title}
          pageCount={resource.pageCount}
          subjectCode={resource.subjectCode}
          previewPages={resource.previewPages}
        />

        {/* Comprehensive Resource Info Card */}
        <ResourceInfoCard resource={resource} />

        {/* Peer Discussion & Comments Card */}
        <View style={styles.commentsCard}>
          <View style={styles.commentsHeaderRow}>
            <View>
              <Text style={styles.commentsSectionTitle}>
                Peer Discussions & Feedback ({comments.length})
              </Text>
              <Text style={styles.commentsSectionSub}>
                Questions, study tips, and reviews by VTU students
              </Text>
            </View>
            <View style={styles.commentsCountBadge}>
              <Feather name="message-square" size={13} color="#0745E8" />
              <Text style={styles.commentsCountText}>{comments.length}</Text>
            </View>
          </View>

          {/* Add a Comment Input Box */}
          <View style={styles.addCommentBox}>
            <TextInput
              style={styles.commentInput}
              placeholder="Ask a question or leave feedback for the author..."
              placeholderTextColor="#94A3B8"
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.postCommentBtn,
                !commentText.trim() && styles.postCommentBtnDisabled,
              ]}
              onPress={handlePostComment}
              disabled={!commentText.trim()}
            >
              <Feather name="send" size={14} color="#FFFFFF" />
              <Text style={styles.postCommentBtnText}>Post Comment</Text>
            </TouchableOpacity>
          </View>

          {/* List of Comments */}
          <View style={styles.commentsList}>
            {comments.map((c) => (
              <View key={c.id} style={styles.commentItem}>
                <View style={styles.commentTopRow}>
                  <View style={styles.commentAuthorBox}>
                    <View style={styles.commentAvatarCircle}>
                      <Text style={styles.commentAvatarInitials}>
                        {c.userName.substring(0, 1)}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.commentAuthorName}>
                        Commented by {c.userName}
                      </Text>
                      <Text style={styles.commentAuthorMeta}>
                        {c.userBranch} • {c.userCollege}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.commentDateText}>
                    Commented on {c.commentedOn}
                  </Text>
                </View>

                <Text style={styles.commentContent}>{c.content}</Text>

                <View style={styles.commentFooterRow}>
                  <TouchableOpacity
                    style={styles.commentLikeBtn}
                    onPress={() => {
                      setComments((prev) =>
                        prev.map((item) =>
                          item.id === c.id
                            ? { ...item, likesCount: item.likesCount + 1 }
                            : item
                        )
                      );
                    }}
                  >
                    <Feather name="thumbs-up" size={12} color="#64748B" />
                    <Text style={styles.commentLikeCount}>
                      {c.likesCount} Helpful
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Related Links */}
        <View style={styles.relatedLinksCard}>
          <Text style={styles.relatedTitle}>Explore Related Resources</Text>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.push(`/notes` as any)}
          >
            <Feather name="book-open" size={16} color="#0745E8" />
            <Text style={styles.linkText}>View Official Module Notes for {resource.subjectCode}</Text>
            <Feather name="chevron-right" size={16} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.push(`/papers` as any)}
          >
            <Feather name="file-text" size={16} color="#0745E8" />
            <Text style={styles.linkText}>View Previous Year Papers for {resource.subjectCode}</Text>
            <Feather name="chevron-right" size={16} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.push(`/passing-packages` as any)}
          >
            <Feather name="zap" size={16} color="#DC2626" />
            <Text style={styles.linkText}>View Passing Package Exam Focus Guide</Text>
            <Feather name="chevron-right" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Action Bar */}
      <ResourceActionBar
        isDownloaded={isDownloaded}
        isBookmarked={isBookmarked}
        onToggleDownload={() => toggleDownload(resource.id)}
        onToggleBookmark={() => toggleBookmark(resource.id)}
        onPressReadNotes={() => {
          router.push({
            pathname: '/notes/[id]',
            params: { id: resource.id, view: 'reader', title: resource.title },
          } as any);
        }}
        onPressReport={() => setReportSheetVisible(true)}
      />

      <ReportBottomSheet
        visible={reportSheetVisible}
        onClose={() => setReportSheetVisible(false)}
        onSubmitReport={(reason, details) =>
          router.push(`/community/report/${resource.id}?reason=${reason}` as any)
        }
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
    flex: 1,
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  rateBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  relatedLinksCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  relatedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  commentsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  commentsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  commentsSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  commentsSectionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  commentsCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  commentsCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0745E8',
  },
  addCommentBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  commentInput: {
    fontSize: 13,
    color: '#0F172A',
    minHeight: 48,
    textAlignVertical: 'top',
  },
  postCommentBtn: {
    alignSelf: 'flex-end',
    backgroundColor: '#0745E8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    marginTop: 8,
  },
  postCommentBtnDisabled: {
    opacity: 0.5,
  },
  postCommentBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  commentsList: {
    gap: 12,
  },
  commentItem: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  commentTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  commentAuthorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentAvatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0745E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarInitials: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  commentAuthorName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  commentAuthorMeta: {
    fontSize: 10,
    color: '#64748B',
  },
  commentDateText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  commentContent: {
    fontSize: 12,
    lineHeight: 18,
    color: '#334155',
    marginVertical: 4,
  },
  commentFooterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  commentLikeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  commentLikeCount: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
});
