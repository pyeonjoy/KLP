//개별 게시글 컴포넌트트

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Timestamp } from "firebase/firestore";

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  authorEmail: string;
  createdAt: Timestamp;
  imageUrl?: string;
}

interface PostItemProps {
  item: Post;
  currentUserEmail?: string;
  onEdit: (post: Post) => void;
  onDelete: (post: Post) => void;
}

export default function PostItem({ item, currentUserEmail, onEdit, onDelete }: PostItemProps) {
  const router = useRouter();

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

  return (
    <View style={styles.postItem}>
      {/* 메인 게시글 영역 */}
      <TouchableOpacity
        style={styles.postContent}
        onPress={() => router.push(`/post/${item.id}`)}
      >
        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postPreview} numberOfLines={2}>
          {item.content}
        </Text>
        <View style={styles.postMeta}>
          <Text style={styles.postAuthor}>👤 {item.author}</Text>
          <Text style={styles.postDate}>🕐 {formatDate(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>

      {/* 작성자만 보이는 수정/삭제 버튼 */}
      {isAuthor && (
        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => onEdit(item)}
          >
            <Ionicons name="create" size={16} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              onDelete(item);
            }}
          >
            <Ionicons name="trash" size={16} color="#ff4444" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  postItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  postContent: {
    flex: 1,
    padding: 20,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 8,
    lineHeight: 24,
  },
  postPreview: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  postMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  postAuthor: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "500",
  },
  postDate: {
    fontSize: 12,
    color: "#999",
  },
  postActions: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  editButton: {
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    minWidth: 40,
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "rgba(255, 68, 68, 0.1)",
    padding: 12,
    borderRadius: 8,
    minWidth: 40,
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
  },
});
