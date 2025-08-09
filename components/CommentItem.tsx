//댓글 컴포넌트

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Timestamp } from "firebase/firestore";

interface Comment {
  id: string;
  content: string;
  author: string;
  authorEmail: string;
  createdAt: Timestamp;
}

interface CommentItemProps {
  item: Comment;
  currentUserEmail?: string;
  editingCommentId: string | null;
  editingCommentText: string;
  onEdit: (comment: Comment) => void;
  onDelete: (comment: Comment) => void;
  onSave: (commentId: string) => void;
  onCancelEdit: () => void;
  onEditTextChange: (text: string) => void;
}

export default function CommentItem({
  item,
  currentUserEmail,
  editingCommentId,
  editingCommentText,
  onEdit,
  onDelete,
  onSave,
  onCancelEdit,
  onEditTextChange,
}: CommentItemProps) {
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

  const isAuthor = currentUserEmail && item.authorEmail === currentUserEmail;
  const isEditing = editingCommentId === item.id;

  return (
    <View style={styles.commentItem}>
      <View style={styles.commentHeader}>
        <View style={styles.commentMeta}>
          <Text style={styles.commentAuthor}>👤 {item.author}</Text>
          <Text style={styles.commentDate}>{formatDate(item.createdAt)}</Text>
        </View>

        {/* 작성자만 보이는 수정/삭제 버튼 */}
        {isAuthor && (
          <View style={styles.commentActions}>
            {isEditing ? (
              // 편집 모드일 때의 버튼들
              <>
                <TouchableOpacity
                  style={styles.commentSaveButton}
                  onPress={() => onSave(item.id)}
                >
                  <Ionicons name="checkmark" size={14} color="#28a745" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.commentCancelButton}
                  onPress={onCancelEdit}
                >
                  <Ionicons name="close" size={14} color="#6c757d" />
                </TouchableOpacity>
              </>
            ) : (
              // 일반 모드일 때의 버튼들
              <>
                <TouchableOpacity
                  style={styles.commentEditButton}
                  onPress={() => onEdit(item)}
                >
                  <Ionicons name="create" size={14} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.commentDeleteButton}
                  onPress={() => onDelete(item)}
                >
                  <Ionicons name="trash" size={14} color="#ff4444" />
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>

      {/* 댓글 내용 - 편집 모드에 따라 다르게 렌더링 */}
      {isEditing ? (
        <TextInput
          style={styles.editCommentInput}
          value={editingCommentText}
          onChangeText={onEditTextChange}
          multiline
          autoFocus
          placeholder="댓글을 수정하세요..."
        />
      ) : (
        <Text style={styles.commentContent}>{item.content}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  commentItem: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 10,
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
  commentAuthor: {
    fontSize: 12,
    fontWeight: "600",
    color: "#007AFF",
  },
  commentDate: {
    fontSize: 12,
    color: "#999",
    marginLeft: 12,
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
  commentContent: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
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
});
