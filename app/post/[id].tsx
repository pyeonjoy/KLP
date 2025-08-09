//게시글 상세 화면

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useAuth } from "../../contexts/AuthContext";
import Snackbar from "../../components/Snackbar";

interface ContentBlock {
  id: string;
  type: "text" | "image";
  content: string;
  imageDimensions?: { width: number; height: number };
}

interface ContentItem {
  id: string;
  type: "text" | "image";
  content: string;
  position: number;
  imageDimensions?: { width: number; height: number };
}

interface ContentSegment {
  id: string;
  type: "text" | "image";
  content: string;
  imageDimensions?: { width: number; height: number };
}

interface InlineElement {
  id: string;
  type: "text" | "image" | "break";
  content: string;
  imageDimensions?: { width: number; height: number };
  insertPosition?: number;
}

interface IntegratedBlock {
  id: string;
  type: "text" | "image";
  content: string;
  imageDimensions?: { width: number; height: number };
}

interface SingleInlineContent {
  text: string;
  images: Array<{
    id: string;
    uri: string;
    position: number;
    dimensions?: { width: number; height: number };
  }>;
}

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  authorEmail: string;
  createdAt: Timestamp;
  imageUrl?: string;
  contentBlocks?: ContentBlock[]; // 기존 리치 콘텐츠 구조
  contentText?: string; // 통합 텍스트 (마커 방식)
  contentImages?: ContentItem[]; // 통합 이미지 배열
  contentSegments?: ContentSegment[]; // 블로그 스타일 구조
  inlineElements?: InlineElement[]; // 인라인 플로우 구조
  integratedBlocks?: IntegratedBlock[]; // 통합 에디터 구조
  inlineContent?: SingleInlineContent; // 새로운 단일 블록 에디터 구조
}

interface Comment {
  id: string;
  content: string;
  author: string;
  authorEmail: string;
  createdAt: Timestamp;
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    type: "info" as "success" | "error" | "warning" | "info",
  });
  const router = useRouter();
  const { user } = useAuth();

  const showSnackbar = (message: string, type: "success" | "error" | "warning" | "info") => {
    setSnackbar({ visible: true, message, type });
  };

  const hideSnackbar = () => {
    setSnackbar({ ...snackbar, visible: false });
  };

  useEffect(() => {
    if (!id || typeof id !== "string") return;

    // 글 정보 가져오기
    const fetchPost = async () => {
      try {
        const postDoc = await getDoc(doc(db, "posts", id));
        if (postDoc.exists()) {
          const postData = {
            id: postDoc.id,
            ...postDoc.data(),
          } as Post;
          setPost(postData);

          // 이미지가 있으면 차원 정보 가져오기
          if (postData.imageUrl) {
            Image.getSize(
              postData.imageUrl,
              (width, height) => {
                setImageAspectRatio(width / height);
              },
              (error) => {
                console.log("이미지 크기 가져오기 실패:", error);
                // 기본 비율 사용
                setImageAspectRatio(16 / 9);
              }
            );
          }
        } else {
          Alert.alert("오류", "존재하지 않는 글입니다.");
          router.back();
        }
      } catch (error) {
        console.error("글 가져오기 실패:", error);
        Alert.alert("오류", "글을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();

    // 댓글 실시간 업데이트
    const commentsQuery = query(
      collection(db, "posts", id, "comments"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const commentsData: Comment[] = [];
      snapshot.forEach((doc) => {
        commentsData.push({
          id: doc.id,
          ...doc.data(),
        } as Comment);
      });
      setComments(commentsData);
    });

    return () => unsubscribe();
  }, [id]);

  const handleSubmitComment = async () => {
    if (!user) {
      Alert.alert("알림", "댓글을 작성하려면 로그인이 필요합니다.");
      return;
    }

    if (!newComment.trim()) {
      Alert.alert("알림", "댓글 내용을 입력해주세요.");
      return;
    }

    setSubmittingComment(true);
    try {
      await addDoc(collection(db, "posts", id as string, "comments"), {
        content: newComment.trim(),
        author: user.displayName || user.email?.split("@")[0] || "익명",
        authorEmail: user.email,
        createdAt: Timestamp.now(),
      });

      setNewComment("");
      Alert.alert("성공", "댓글이 작성되었습니다.");
    } catch (error) {
      console.error("댓글 작성 실패:", error);
      Alert.alert("오류", "댓글 작성에 실패했습니다.");
    } finally {
      setSubmittingComment(false);
    }
  };

  // 게시글 삭제 함수
  const handleDeletePost = async () => {
    console.log("삭제 시도:", {
      post: !!post,
      user: !!user,
      postAuthor: post?.authorEmail,
      currentUser: user?.email,
      canDelete: post?.authorEmail === user?.email,
    });

    if (!post || !user || post.authorEmail !== user.email) {
      console.log("권한 없음");
      Alert.alert("오류", "게시글을 삭제할 권한이 없습니다.");
      return;
    }

    console.log("권한 확인 완료, Firebase 삭제 실행");
    
    // 임시로 확인 대화상자 없이 바로 삭제 (테스트용)
    try {
      console.log("🗑️ Firebase 삭제 시작...", {
        postId: post.id,
        userEmail: user?.email,
        postAuthorEmail: post.authorEmail,
        isOwner: post.authorEmail === user?.email,
      });

      console.log("Firebase 삭제 요청 전송 중...");
      const docRef = doc(db, "posts", post.id);
      console.log("📄 Document reference:", docRef.path);

      await deleteDoc(docRef);
      console.log("Firebase 삭제 성공!");
      console.log("게시글 목록으로 이동 중...");
      
      // 성공 메시지 표시 후 페이지 이동
      showSnackbar("게시글이 삭제되었습니다!", "success");
      setTimeout(() => {
        router.replace("/posts");
      }, 1500);
    } catch (error: any) {
      console.error("게시글 삭제 실패:", error);
      console.error("오류 세부사항:", {
        code: error.code,
        message: error.message,
        stack: error.stack,
      });

      let errorMessage = "게시글 삭제에 실패했습니다.";

      if (error.code === "permission-denied") {
        errorMessage =
          "삭제 권한이 없습니다. Firebase 보안 규칙을 확인해주세요.";
      } else if (error.code === "unauthenticated") {
        errorMessage = "로그인이 필요합니다.";
      } else if (error.code === "not-found") {
        errorMessage = "이미 삭제된 게시글입니다.";
      }

      Alert.alert("오류", errorMessage);
    }
  };

  // 게시글 수정 페이지로 이동
  const handleEditPost = () => {
    if (!post || !user || post.authorEmail !== user.email) {
      Alert.alert("오류", "게시글을 수정할 권한이 없습니다.");
      return;
    }

    router.push(`/edit-post/${post.id}`);
  };

  // 댓글 삭제 함수
  const handleDeleteComment = (comment: Comment) => {
    if (!user || comment.authorEmail !== user.email) {
      Alert.alert("오류", "댓글을 삭제할 권한이 없습니다.");
      return;
    }

    Alert.alert("댓글 삭제", "정말로 이 댓글을 삭제하시겠습니까?", [
      {
        text: "취소",
        style: "cancel",
      },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            console.log("댓글 삭제 시작...", comment.id);
            await deleteDoc(
              doc(db, "posts", id as string, "comments", comment.id)
            );
            console.log("댓글 삭제 성공!");
          } catch (error: any) {
            console.error("댓글 삭제 실패:", error);
            Alert.alert("오류", "댓글 삭제에 실패했습니다.");
          }
        },
      },
    ]);
  };

  // 댓글 수정 시작 함수
  const handleEditComment = (comment: Comment) => {
    if (!user || comment.authorEmail !== user.email) {
      Alert.alert("오류", "댓글을 수정할 권한이 없습니다.");
      return;
    }

    setEditingCommentId(comment.id);
    setEditingCommentText(comment.content);
  };

  // 댓글 수정 저장 함수
  const handleSaveComment = async (commentId: string) => {
    if (!editingCommentText.trim()) {
      Alert.alert("알림", "댓글 내용을 입력해주세요.");
      return;
    }

    try {
      console.log("댓글 수정 시작...", commentId);
      await updateDoc(doc(db, "posts", id as string, "comments", commentId), {
        content: editingCommentText.trim(),
      });
      console.log("✅ 댓글 수정 성공!");

      // 편집 모드 해제
      setEditingCommentId(null);
      setEditingCommentText("");
    } catch (error: any) {
      console.error("❌ 댓글 수정 실패:", error);
      Alert.alert("오류", "댓글 수정에 실패했습니다.");
    }
  };

  // 댓글 수정 취소 함수
  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
  };

  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 리치 콘텐츠 블록 렌더링 (기존 방식)
  const renderContentBlock = (block: ContentBlock, index: number) => {
    if (block.type === "text" && block.content.trim()) {
      return (
        <Text key={block.id} style={styles.postContentBlock}>
          {block.content}
        </Text>
      );
    } else if (block.type === "image") {
      return (
        <Image
          key={block.id}
          source={{ uri: block.content }}
          style={[
            styles.postContentImage,
            block.imageDimensions && {
              aspectRatio:
                block.imageDimensions.width / block.imageDimensions.height,
            },
          ]}
        />
      );
    }
    return null;
  };

  // 통합 콘텐츠 렌더링 (새로운 방식)
  const renderUnifiedContent = (text: string, images: ContentItem[]) => {
    if (images.length === 0) {
      return <Text style={styles.postContent}>{text}</Text>;
    }

    // 이미지 마커를 실제 이미지로 교체
    const parts = [];
    let currentText = text;
    let lastIndex = 0;

    // 이미지들을 위치 순서대로 정렬
    const sortedImages = [...images].sort((a, b) => a.position - b.position);

    sortedImages.forEach((image, index) => {
      const marker = `📷${image.id}`;
      const markerIndex = currentText.indexOf(marker, lastIndex);

      if (markerIndex !== -1) {
        // 마커 이전의 텍스트 추가
        const beforeText = currentText.slice(lastIndex, markerIndex);
        if (beforeText.trim()) {
          parts.push(
            <Text key={`text-${index}-before`} style={styles.postContentBlock}>
              {beforeText}
            </Text>
          );
        }

        // 이미지 추가
        parts.push(
          <Image
            key={`image-${image.id}`}
            source={{ uri: image.content }}
            style={[
              styles.postContentImage,
              image.imageDimensions && {
                aspectRatio:
                  image.imageDimensions.width / image.imageDimensions.height,
              },
            ]}
          />
        );

        lastIndex = markerIndex + marker.length;
      }
    });

    // 마지막 텍스트 추가
    const remainingText = currentText.slice(lastIndex);
    if (remainingText.trim()) {
      parts.push(
        <Text key="text-final" style={styles.postContentBlock}>
          {remainingText}
        </Text>
      );
    }

    return <View style={styles.unifiedContent}>{parts}</View>;
  };

  // 블로그 스타일 세그먼트 렌더링 (최신 방식)
  const renderBlogSegments = (segments: ContentSegment[]) => {
    return (
      <View style={styles.blogContent}>
        {segments.map((segment, index) => {
          if (segment.type === "text" && segment.content.trim()) {
            return (
              <Text key={segment.id} style={styles.postContentBlock}>
                {segment.content}
              </Text>
            );
          } else if (segment.type === "image") {
            return (
              <Image
                key={segment.id}
                source={{ uri: segment.content }}
                style={[
                  styles.postContentImage,
                  segment.imageDimensions && {
                    aspectRatio:
                      segment.imageDimensions.width /
                      segment.imageDimensions.height,
                  },
                ]}
              />
            );
          }
          return null;
        })}
      </View>
    );
  };

  // 인라인 플로우 렌더링 (최신 방식)
  const renderInlineFlow = (elements: InlineElement[]) => {
    return (
      <View style={styles.inlineFlow}>
        {elements.map((element, index) => {
          if (element.type === "text" && element.content.trim()) {
            return (
              <Text key={element.id} style={styles.postContentBlock}>
                {element.content}
              </Text>
            );
          } else if (element.type === "image") {
            return (
              <Image
                key={element.id}
                source={{ uri: element.content }}
                style={[
                  styles.postContentImage,
                  element.imageDimensions && {
                    aspectRatio:
                      element.imageDimensions.width /
                      element.imageDimensions.height,
                  },
                ]}
              />
            );
          } else if (element.type === "break") {
            return <View key={element.id} style={styles.contentBreak} />;
          }
          return null;
        })}
      </View>
    );
  };

  // 통합 에디터 블록 렌더링
  const renderIntegratedBlocks = (blocks: IntegratedBlock[]) => {
    return (
      <View style={styles.integratedContent}>
        {blocks.map((block, index) => {
          if (block.type === "text" && block.content.trim()) {
            return (
              <Text key={block.id} style={styles.postContentBlock}>
                {block.content}
              </Text>
            );
          } else if (block.type === "image") {
            return (
              <Image
                key={block.id}
                source={{ uri: block.content }}
                style={[
                  styles.postContentImage,
                  block.imageDimensions && {
                    aspectRatio:
                      block.imageDimensions.width /
                      block.imageDimensions.height,
                  },
                ]}
              />
            );
          }
          return null;
        })}
      </View>
    );
  };

  // 웹 스타일 인라인 콘텐츠 렌더링 (최신 방식)
  const renderWebInlineContent = (inlineContent: SingleInlineContent) => {
    if (inlineContent.images.length === 0) {
      // 줄바꿈을 고려한 텍스트 렌더링
      const lines = inlineContent.text.split("\n");
      return (
        <View style={styles.webInlineContent}>
          {lines.map((line, index) => (
            <Text key={index} style={styles.postContentBlock}>
              {line || "\u00A0"} {/* 빈 줄 처리 */}
            </Text>
          ))}
        </View>
      );
    }

    const elements = [];
    let currentText = inlineContent.text;
    let lastIndex = 0;

    // 위치 순서대로 이미지 정렬
    const sortedImages = [...inlineContent.images].sort((a, b) => {
      const aPos = currentText.indexOf(`📷IMG_${a.id}`);
      const bPos = currentText.indexOf(`📷IMG_${b.id}`);
      return aPos - bPos;
    });

    sortedImages.forEach((image, index) => {
      const placeholder = `📷IMG_${image.id}`;
      const placeholderIndex = currentText.indexOf(placeholder, lastIndex);

      if (placeholderIndex !== -1) {
        // 플레이스홀더 이전 텍스트
        const beforeText = currentText.slice(lastIndex, placeholderIndex);
        if (beforeText) {
          // 줄바꿈을 고려한 텍스트 처리
          const textLines = beforeText.split("\n");
          textLines.forEach((line, lineIndex) => {
            if (lineIndex > 0) {
              elements.push(
                <Text key={`br-${index}-${lineIndex}`}>{"\n"}</Text>
              );
            }
            if (line) {
              elements.push(
                <Text
                  key={`text-${index}-${lineIndex}`}
                  style={styles.inlineText}
                >
                  {line}
                </Text>
              );
            }
          });
        }

        // 인라인 이미지
        elements.push(
          <Image
            key={`image-${image.id}`}
            source={{ uri: image.uri }}
            style={[
              styles.inlinePostImage,
              image.dimensions && {
                aspectRatio: image.dimensions.width / image.dimensions.height,
              },
            ]}
          />
        );

        lastIndex = placeholderIndex + placeholder.length;
      }
    });

    // 남은 텍스트
    const remainingText = currentText.slice(lastIndex);
    if (remainingText) {
      const textLines = remainingText.split("\n");
      textLines.forEach((line, lineIndex) => {
        if (lineIndex > 0) {
          elements.push(<Text key={`br-final-${lineIndex}`}>{"\n"}</Text>);
        }
        if (line) {
          elements.push(
            <Text key={`text-final-${lineIndex}`} style={styles.inlineText}>
              {line}
            </Text>
          );
        }
      });
    }

    return <View style={styles.webInlineFlow}>{elements}</View>;
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentHeader}>
        <View style={styles.commentMeta}>
          <Text style={styles.commentAuthor}>👤 {item.author}</Text>
          <Text style={styles.commentDate}>{formatDate(item.createdAt)}</Text>
        </View>

        {/* 작성자만 보이는 수정/삭제 버튼 */}
        {user && item.authorEmail === user.email && (
          <View style={styles.commentActions}>
            {editingCommentId === item.id ? (
              // 편집 모드일 때의 버튼들
              <>
                <TouchableOpacity
                  style={styles.commentSaveButton}
                  onPress={() => handleSaveComment(item.id)}
                >
                  <Ionicons name="checkmark" size={14} color="#28a745" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.commentCancelButton}
                  onPress={handleCancelEdit}
                >
                  <Ionicons name="close" size={14} color="#6c757d" />
                </TouchableOpacity>
              </>
            ) : (
              // 일반 모드일 때의 버튼들
              <>
                <TouchableOpacity
                  style={styles.commentEditButton}
                  onPress={() => handleEditComment(item)}
                >
                  <Ionicons name="create" size={14} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.commentDeleteButton}
                  onPress={() => handleDeleteComment(item)}
                >
                  <Ionicons name="trash" size={14} color="#ff4444" />
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>

      {/* 댓글 내용 - 편집 모드에 따라 다르게 렌더링 */}
      {editingCommentId === item.id ? (
        <TextInput
          style={styles.editCommentInput}
          value={editingCommentText}
          onChangeText={setEditingCommentText}
          multiline
          autoFocus
          placeholder="댓글을 수정하세요..."
        />
      ) : (
        <Text style={styles.commentContent}>{item.content}</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={styles.keyboardAvoidingView}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>글을 불러오는 중...</Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={styles.keyboardAvoidingView}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>글을 찾을 수 없습니다.</Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>돌아가기</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => router.replace("/posts")}
        >
          <Text style={styles.headerBackText}>← 목록으로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>글 보기</Text>

        {/* 작성자만 수정/삭제 버튼 표시 */}
        {user && post && post.authorEmail === user.email ? (
          <View style={styles.authorActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleEditPost}
            >
              <Ionicons name="create" size={20} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDeletePost}
            >
              <Ionicons name="trash" size={20} color="#ff4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      <ScrollView 
        style={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {/* 글 내용 */}
        <View style={styles.postContainer}>
          <Text style={styles.postTitle}>{post.title}</Text>

          <View style={styles.postMeta}>
            <Text style={styles.postAuthor}>👤 {post.author}</Text>
            <Text style={styles.postDate}>🕐 {formatDate(post.createdAt)}</Text>
          </View>

          {/* 콘텐츠 표시 - 우선순위: 웹 인라인 > 단일 인라인 > 통합 블록 > 인라인 플로우 > 블로그 세그먼트 > 통합 콘텐츠 > 블록 콘텐츠 > 기존 콘텐츠 */}
          {post.inlineContent ? (
            // 새로운 웹 스타일 인라인 에디터 콘텐츠 (최신)
            renderWebInlineContent(post.inlineContent)
          ) : post.integratedBlocks && post.integratedBlocks.length > 0 ? (
            // 통합 에디터 콘텐츠
            renderIntegratedBlocks(post.integratedBlocks)
          ) : post.inlineElements && post.inlineElements.length > 0 ? (
            // 인라인 플로우 에디터 콘텐츠
            renderInlineFlow(post.inlineElements)
          ) : post.contentSegments && post.contentSegments.length > 0 ? (
            // 블로그 스타일 에디터 콘텐츠
            renderBlogSegments(post.contentSegments)
          ) : post.contentText && post.contentImages ? (
            // 통합 에디터 콘텐츠 (마커 방식)
            renderUnifiedContent(post.contentText, post.contentImages)
          ) : post.contentBlocks && post.contentBlocks.length > 0 ? (
            // 기존 리치 에디터 콘텐츠 (하위 호환성)
            <View style={styles.richContent}>
              {post.contentBlocks.map(renderContentBlock)}
            </View>
          ) : (
            // 기존 단순 콘텐츠 구조 (하위 호환성)
            <>
              {post.imageUrl && (
                <Image
                  source={{ uri: post.imageUrl }}
                  style={[
                    styles.postImage,
                    imageAspectRatio && { aspectRatio: imageAspectRatio },
                  ]}
                />
              )}
              <Text style={styles.postContent}>{post.content}</Text>
            </>
          )}
        </View>

        {/* 댓글 섹션 */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>💬 댓글 ({comments.length})</Text>

          {/* 댓글 작성 */}
          {user ? (
            <View style={styles.commentForm}>
              <TextInput
                style={styles.commentInput}
                placeholder="댓글을 작성해주세요..."
                value={newComment}
                onChangeText={setNewComment}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[
                  styles.submitCommentButton,
                  submittingComment && styles.submitCommentButtonDisabled,
                ]}
                onPress={handleSubmitComment}
                disabled={submittingComment}
              >
                <Text style={styles.submitCommentText}>
                  {submittingComment ? "등록 중..." : "댓글 등록"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.loginPrompt}>
              <Text style={styles.loginPromptText}>
                댓글을 작성하려면 로그인이 필요합니다.
              </Text>
              <TouchableOpacity
                style={styles.loginPromptButton}
                onPress={() => router.push("/auth")}
              >
                <Text style={styles.loginPromptButtonText}>로그인하기</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 댓글 목록 */}
          {comments.length > 0 ? (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={renderComment}
              scrollEnabled={false}
              style={styles.commentsList}
            />
          ) : (
            <View style={styles.noComments}>
              <Text style={styles.noCommentsText}>
                📭 아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      <Snackbar
        visible={snackbar.visible}
        message={snackbar.message}
        type={snackbar.type}
        onDismiss={hideSnackbar}
        duration={4000}
      />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerBackButton: {
    padding: 5,
  },
  headerBackText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  authorActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: "rgba(0, 122, 255, 0.1)",
  },
  content: {
    flex: 1,
  },
  postContainer: {
    backgroundColor: "#fff",
    padding: 20,
    margin: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 15,
    lineHeight: 32,
  },
  postMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f4",
  },
  postAuthor: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  postDate: {
    fontSize: 14,
    color: "#999",
  },
  postImage: {
    width: "100%",
    borderRadius: 8,
    marginBottom: 20,
    resizeMode: "cover", // 이미지 비율 유지하면서 가득 채움
  },
  postContent: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
  },
  richContent: {
    // 리치 콘텐츠 컨테이너
  },
  postContentBlock: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    marginBottom: 15,
  },
  postContentImage: {
    width: "100%",
    borderRadius: 8,
    marginBottom: 15,
    resizeMode: "cover",
  },
  unifiedContent: {
    // 통합 콘텐츠 컨테이너
  },
  blogContent: {
    // 블로그 스타일 콘텐츠 컨테이너
  },
  inlineFlow: {
    // 인라인 플로우 콘텐츠 컨테이너
  },
  contentBreak: {
    height: 8,
  },
  integratedContent: {
    // 통합 에디터 콘텐츠 컨테이너
  },
  singleInlineContent: {
    // 단일 블록 인라인 콘텐츠 컨테이너
  },
  webInlineContent: {
    // 웹 스타일 인라인 콘텐츠 컨테이너
  },
  webInlineFlow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
  },
  inlineText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    flexShrink: 1,
  },
  inlinePostImage: {
    maxWidth: 300,
    maxHeight: 220,
    borderRadius: 8,
    resizeMode: "cover",
    marginHorizontal: 4,
    marginVertical: 2,
  },
  commentsSection: {
    backgroundColor: "#fff",
    margin: 15,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 15,
  },
  commentForm: {
    marginBottom: 20,
  },
  commentInput: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    minHeight: 80,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  submitCommentButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  submitCommentButtonDisabled: {
    backgroundColor: "#999",
  },
  submitCommentText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  loginPrompt: {
    backgroundColor: "#f8f9fa",
    padding: 20,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  loginPromptText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
    textAlign: "center",
  },
  loginPromptButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  loginPromptButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  commentsList: {
    marginTop: 10,
  },
  commentItem: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  commentMeta: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentEditButton: {
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    padding: 6,
    borderRadius: 6,
    marginLeft: 6,
  },
  commentDeleteButton: {
    backgroundColor: "rgba(255, 68, 68, 0.1)",
    padding: 6,
    borderRadius: 6,
    marginLeft: 6,
  },
  commentSaveButton: {
    backgroundColor: "rgba(40, 167, 69, 0.1)",
    padding: 6,
    borderRadius: 6,
    marginLeft: 6,
  },
  commentCancelButton: {
    backgroundColor: "rgba(108, 117, 125, 0.1)",
    padding: 6,
    borderRadius: 6,
    marginLeft: 6,
  },
  editCommentInput: {
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#fff",
    minHeight: 40,
    textAlignVertical: "top",
  },
  commentAuthor: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "600",
  },
  commentDate: {
    fontSize: 12,
    color: "#999",
    marginLeft: 12,
  },
  commentContent: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  noComments: {
    padding: 30,
    alignItems: "center",
  },
  noCommentsText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  backButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
