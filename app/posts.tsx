//게시글 목록 화면

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../contexts/AuthContext";
import Snackbar from "../components/Snackbar";
import PostItem from "../components/PostItem";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import AppHeader from "../components/AppHeader";

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  authorEmail: string;
  createdAt: Timestamp;
  imageUrl?: string;
}

export default function PostsScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    type: "info" as "success" | "error" | "warning" | "info",
  });
  const router = useRouter();
  const { user } = useAuth();

  const showSnackbar = (
    message: string,
    type: "success" | "error" | "warning" | "info"
  ) => {
    setSnackbar({ visible: true, message, type });
  };

  const hideSnackbar = () => {
    setSnackbar({ ...snackbar, visible: false });
  };

  const fetchPosts = async () => {
    try {
      const postsQuery = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(postsQuery);
      const postsData: Post[] = [];

      querySnapshot.forEach((doc) => {
        postsData.push({
          id: doc.id,
          ...doc.data(),
        } as Post);
      });

      setPosts(postsData);
    } catch (error) {
      showSnackbar("글 목록을 불러오는데 실패했습니다.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  // 게시글 삭제 함수
  const handleDeletePost = async (post: Post) => {
    if (!user || post.authorEmail !== user.email) {
      showSnackbar("게시글을 삭제할 권한이 없습니다.", "error");
      return;
    }

    try {
      showSnackbar("게시글을 삭제하고 있습니다...", "info");

      await deleteDoc(doc(db, "posts", post.id));

      // 목록 새로고침
      fetchPosts();
      showSnackbar("게시글이 삭제되었습니다! 🗑️", "success");
    } catch (error: any) {
      showSnackbar("게시글 삭제에 실패했습니다.", "error");
    }
  };

  // 게시글 수정 페이지로 이동
  const handleEditPost = (post: Post) => {
    if (!user || post.authorEmail !== user.email) {
      showSnackbar("게시글을 수정할 권한이 없습니다.", "error");
      return;
    }

    router.push(`/edit-post/${post.id}`);
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

  const renderPost = ({ item }: { item: Post }) => (
    <PostItem
      item={item}
      currentUserEmail={user?.email ?? undefined}
      onEdit={handleEditPost}
      onDelete={handleDeletePost}
    />
  );

  if (loading) {
    return <LoadingSpinner message="글 목록을 불러오는 중..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="📝 커뮤니티 글"
        rightButton={{
          text: user ? "✏️ 글쓰기" : "🔑 로그인",
          onPress: () => router.push(user ? "/create-post" : "/auth"),
          style: user ? "primary" : "secondary",
        }}
      />

      {posts.length === 0 ? (
        <EmptyState
          title="아직 작성된 글이 없습니다."
          subtitle={
            user
              ? "첫 번째 글을 작성해보세요!"
              : "로그인 후 글을 작성할 수 있습니다."
          }
          buttonText={user ? "첫 번째 글 작성하기" : "로그인하기"}
          onButtonPress={() => router.push(user ? "/create-post" : "/auth")}
          showButton={true}
        />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => router.push("/")}
      >
        <Text style={styles.homeButtonText}>🏠 홈으로</Text>
      </TouchableOpacity>

      <Snackbar
        visible={snackbar.visible}
        message={snackbar.message}
        type={snackbar.type}
        onDismiss={hideSnackbar}
        duration={4000}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  listContainer: {
    padding: 15,
  },
  homeButton: {
    position: "absolute",
    bottom: 30,
    left: 20,
    backgroundColor: "#6c757d",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  homeButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
