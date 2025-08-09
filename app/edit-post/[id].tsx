//게시글 수정 화면

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import { db, storage } from "../../firebaseConfig";
import { useAuth } from "../../contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  authorEmail: string;
  imageUrl?: string;
}

export default function EditPostScreen() {
  const { id } = useLocalSearchParams();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!id || typeof id !== "string") return;

    const fetchPost = async () => {
      try {
        const postDoc = await getDoc(doc(db, "posts", id));
        if (postDoc.exists()) {
          const postData = postDoc.data() as Post;

          // 작성자 확인
          if (!user || postData.authorEmail !== user.email) {
            Alert.alert("오류", "게시글을 수정할 권한이 없습니다.", [
              {
                text: "확인",
                onPress: () => router.back(),
              },
            ]);
            return;
          }

          setTitle(postData.title);
          setContent(postData.content);
          if (postData.imageUrl) {
            setImageUri(postData.imageUrl);
            setOriginalImageUrl(postData.imageUrl);

            // 이미지 크기 정보 가져오기
            Image.getSize(
              postData.imageUrl,
              (width, height) => {
                setImageDimensions({ width, height });
              },
              (error) => {
                console.log("이미지 크기 가져오기 실패:", error);
                setImageDimensions({ width: 16, height: 9 });
              }
            );
          }
        } else {
          Alert.alert("오류", "존재하지 않는 게시글입니다.", [
            {
              text: "확인",
              onPress: () => router.back(),
            },
          ]);
        }
      } catch (error) {
        console.error("게시글 불러오기 실패:", error);
        Alert.alert("오류", "게시글을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, user]);

  // 이미지 선택
  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("권한 필요", "사진에 접근하기 위한 권한이 필요합니다.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri);

      // 이미지 크기 정보 저장
      if (asset.width && asset.height) {
        setImageDimensions({ width: asset.width, height: asset.height });
      } else {
        Image.getSize(
          asset.uri,
          (width, height) => {
            setImageDimensions({ width, height });
          },
          (error) => {
            console.log("이미지 크기 가져오기 실패:", error);
            setImageDimensions({ width: 16, height: 9 });
          }
        );
      }
    }
  };

  // 이미지 제거
  const removeImage = () => {
    setImageUri(null);
    setImageDimensions(null);
  };

  // 이미지 업로드 함수
  const uploadImage = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();

    const filename = `posts/${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.jpg`;
    const imageRef = ref(storage, filename);

    await uploadBytes(imageRef, blob);
    const downloadURL = await getDownloadURL(imageRef);

    return downloadURL;
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("알림", "제목을 입력해주세요.");
      return;
    }

    if (!content.trim() && !imageUri) {
      Alert.alert("알림", "내용 또는 이미지 중 하나는 입력해주세요.");
      return;
    }

    if (!user) {
      Alert.alert("오류", "로그인이 필요합니다.");
      return;
    }

    setSaving(true);

    try {
      let imageUrl: string | null = null;

      // 이미지 처리
      if (imageUri) {
        if (imageUri === originalImageUrl) {
          // 기존 이미지를 그대로 사용
          imageUrl = originalImageUrl;
        } else {
          // 새로운 이미지 업로드
          console.log("📷 새 이미지 업로드 시작...");
          imageUrl = await uploadImage(imageUri);
          console.log("✅ 이미지 업로드 완료:", imageUrl);
        }
      }

      // Firestore에 글 업데이트
      const updateData = {
        title: title.trim(),
        content: content.trim(),
        imageUrl: imageUrl,
      };

      console.log("💾 Firestore 업데이트 시작...", updateData);
      await updateDoc(doc(db, "posts", id as string), updateData);
      console.log("✅ Firestore 업데이트 완료!");

      // 즉시 이동 (Alert 없이)
      console.log("🔄 게시글 페이지로 이동...", `/post/${id}`);
      router.replace(`/post/${id}`);
    } catch (error: any) {
      console.error("❌ 게시글 수정 오류:", error);
      Alert.alert("오류", "게시글 수정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>게시글 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace("/posts")}
          >
            <Text style={styles.backButtonText}>← 목록으로</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>✏️ 글 수정</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.form}>
          {/* 제목 입력 */}
          <TextInput
            style={styles.titleInput}
            placeholder="제목을 입력하세요"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />

          {/* 내용 입력 */}
          <Text style={styles.label}>📝 내용 작성</Text>
          <TextInput
            style={styles.contentInput}
            placeholder="내용을 입력하세요..."
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            numberOfLines={8}
          />

          {/* 이미지 섹션 */}
          <Text style={styles.label}>📷 이미지 첨부 (선택사항)</Text>

          {imageUri ? (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: imageUri }}
                style={[
                  styles.selectedImage,
                  imageDimensions && {
                    aspectRatio: imageDimensions.width / imageDimensions.height,
                  },
                ]}
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={removeImage}
              >
                <Ionicons name="close-circle" size={24} color="#ff4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.imagePickerButton}
              onPress={pickImage}
            >
              <Ionicons name="camera" size={32} color="#007AFF" />
              <Text style={styles.imagePickerText}>이미지 선택</Text>
            </TouchableOpacity>
          )}

          {/* 수정 완료 버튼 */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <View style={styles.savingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.saveButtonText}>저장 중...</Text>
              </View>
            ) : (
              <Text style={styles.saveButtonText}>✅ 수정 완료</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
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
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  form: {
    padding: 20,
  },
  titleInput: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 10,
  },
  contentInput: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e9ecef",
    minHeight: 120,
  },
  imageContainer: {
    position: "relative",
    marginBottom: 20,
  },
  selectedImage: {
    width: "100%",
    maxHeight: 300,
    borderRadius: 10,
    resizeMode: "cover",
  },
  removeImageButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 2,
  },
  imagePickerButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#007AFF",
    borderStyle: "dashed",
    borderRadius: 10,
    padding: 40,
    alignItems: "center",
    marginBottom: 20,
  },
  imagePickerText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "500",
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: "#28a745",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonDisabled: {
    backgroundColor: "#999",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  savingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});
