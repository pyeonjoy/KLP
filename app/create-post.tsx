//게시글 작성 화면

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { db, storage } from "../firebaseConfig";
import { useAuth } from "../contexts/AuthContext";
import Snackbar from "../components/Snackbar";
import { Ionicons } from "@expo/vector-icons";

export default function CreatePostScreen() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    type: "info" as "success" | "error" | "warning" | "info",
  });
  const router = useRouter();
  const { user } = useAuth();

  // 스낵바 표시 함수
  const showSnackbar = (
    message: string,
    type: "success" | "error" | "warning" | "info"
  ) => {
    setSnackbar({
      visible: true,
      message,
      type,
    });
  };

  // 스낵바 숨기기 함수
  const hideSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, visible: false }));
  };

  // 로그인하지 않은 사용자는 접근 불가
  if (!user) {
    return (
      <View style={styles.noAuthContainer}>
        <Text style={styles.noAuthText}>🔒 로그인이 필요합니다</Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push("/auth")}
        >
          <Text style={styles.loginButtonText}>로그인하러 가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 이미지 압축 및 리사이즈 함수
  const compressImage = async (
    uri: string
  ): Promise<{ uri: string; width: number; height: number }> => {
    try {
      // 최대 크기 설정 (픽셀)
      const MAX_WIDTH = 1200;
      const MAX_HEIGHT = 1200;
      const COMPRESS_QUALITY = 0.7; // 70% 품질

      // 원본 이미지 크기 확인
      const imageInfo = await ImageManipulator.manipulateAsync(uri, [], {
        compress: 1,
        format: ImageManipulator.SaveFormat.JPEG,
      });

      let { width, height } = imageInfo;

      // 크기 조정이 필요한지 확인
      let needsResize = false;
      let newWidth = width;
      let newHeight = height;

      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        needsResize = true;
        const aspectRatio = width / height;

        if (width > height) {
          // 가로가 더 긴 경우
          newWidth = Math.min(width, MAX_WIDTH);
          newHeight = newWidth / aspectRatio;
        } else {
          // 세로가 더 긴 경우
          newHeight = Math.min(height, MAX_HEIGHT);
          newWidth = newHeight * aspectRatio;
        }
      }

      // 이미지 조작 설정
      const manipulateActions = [];
      if (needsResize) {
        manipulateActions.push({
          resize: {
            width: Math.round(newWidth),
            height: Math.round(newHeight),
          },
        });
      }

      // 이미지 압축 및 리사이즈 실행
      const result = await ImageManipulator.manipulateAsync(
        uri,
        manipulateActions,
        {
          compress: COMPRESS_QUALITY,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return {
        uri: result.uri,
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      // 압축 실패 시 원본 반환하되, 기본 크기 추정
      try {
        // 원본 이미지의 크기라도 가져오기 시도
        const fallbackInfo = await ImageManipulator.manipulateAsync(uri, [], {
          compress: 1,
          format: ImageManipulator.SaveFormat.JPEG,
        });
        return {
          uri,
          width: fallbackInfo.width || 300,
          height: fallbackInfo.height || 200,
        };
      } catch {
        // 모든 시도 실패 시 기본 비율 사용
        return {
          uri,
          width: 16,
          height: 9,
        };
      }
    }
  };

  // 이미지 선택
  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      showSnackbar("사진에 접근하기 위한 권한이 필요합니다.", "warning");
      return;
    }

    try {
      showSnackbar("이미지를 선택하고 있습니다...", "info");

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9, // 초기 선택 시엔 높은 품질로
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        // 파일 크기 확인 (대략적)
        const fileSize = asset.fileSize || 0;
        const fileSizeMB = fileSize / (1024 * 1024);

        console.log(
          `📷 선택된 이미지: ${Math.round(fileSizeMB * 100) / 100}MB`
        );

        if (fileSizeMB > 10) {
          showSnackbar(
            "이미지 파일이 너무 큽니다. 10MB 이하로 선택해주세요.",
            "warning"
          );
          return;
        }

        showSnackbar("이미지를 최적화하고 있습니다...", "info");

        // 이미지 압축 및 리사이즈
        const compressedImage = await compressImage(asset.uri);

        setImageUri(compressedImage.uri);
        setImageDimensions({
          width: compressedImage.width,
          height: compressedImage.height,
        });

        showSnackbar("이미지가 최적화되었습니다! 📸", "success");
      }
    } catch (error) {
      console.error("이미지 선택 실패:", error);
      showSnackbar("이미지 선택에 실패했습니다.", "error");
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

  const handleSubmit = async () => {
    console.log("글 작성 시작!", {
      title: title.trim(),
      contentLength: content.trim().length,
      hasImage: !!imageUri,
      user: user?.email,
    });

    if (!title.trim()) {
      showSnackbar("제목을 입력해주세요.", "warning");
      return;
    }

    if (!content.trim() && !imageUri) {
      showSnackbar("내용 또는 이미지 중 하나는 입력해주세요.", "warning");
      return;
    }

    if (!user) {
      showSnackbar("글을 작성하려면 로그인이 필요합니다.", "warning");
      return;
    }

    setUploading(true);

    try {
      // 이미지가 있으면 업로드
      let imageUrl: string | null = null;
      if (imageUri) {
        console.log("이미지 업로드 시작...");
        imageUrl = await uploadImage(imageUri);
        console.log("이미지 업로드 완료:", imageUrl);
      }

      // Firestore에 글 저장
      const postData = {
        title: title.trim(),
        content: content.trim(),
        imageUrl: imageUrl,
        author: user.displayName || user.email?.split("@")[0] || "익명",
        authorEmail: user.email,
        createdAt: Timestamp.now(),
      };

      console.log("Firestore에 저장 시작...", postData);
      const docRef = await addDoc(collection(db, "posts"), postData);
      console.log("Firestore 저장 완료! 문서 ID:", docRef.id);

      // 성공 메시지 표시
      showSnackbar("글이 성공적으로 작성되었습니다! 🎉", "success");

      // 1초 후 작성한 게시글 상세 페이지로 이동
      setTimeout(() => {
        router.replace(`/post/${docRef.id}`);
      }, 1000);
    } catch (error: any) {
      console.error("글 작성 오류:", error);
      console.error("오류 세부사항:", {
        code: error.code,
        message: error.message,
        stack: error.stack,
      });

      let errorMessage = "글 작성 중 오류가 발생했습니다.";

      if (error.code === "permission-denied") {
        errorMessage = "Firebase 권한이 없습니다. 로그인 상태를 확인해주세요.";
      } else if (error.code === "unauthenticated") {
        errorMessage = "로그인이 필요합니다.";
      } else if (
        error.message.includes("Missing or insufficient permissions")
      ) {
        errorMessage = "Firebase 보안 규칙을 확인해주세요.";
      }

      showSnackbar(errorMessage, "error");
    } finally {
      setUploading(false);
    }
  };

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
          <Text style={styles.headerTitle}>✏️ 글쓰기</Text>
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
                  imageDimensions &&
                    imageDimensions.width > 0 &&
                    imageDimensions.height > 0 && {
                      aspectRatio:
                        imageDimensions.width / imageDimensions.height,
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

          {/* 제출 버튼 */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              uploading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={uploading}
          >
            {uploading ? (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.submitButtonText}>게시 중...</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>📝 글 게시하기</Text>
            )}
          </TouchableOpacity>

          {/* 스낵바 */}
          <Snackbar
            visible={snackbar.visible}
            message={snackbar.message}
            type={snackbar.type}
            onDismiss={hideSnackbar}
            duration={4000}
          />
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
    maxHeight: 400,
    borderRadius: 10,
    resizeMode: "contain",
    backgroundColor: "#f8f9fa",
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
  submitButton: {
    backgroundColor: "#007AFF",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: "#999",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  uploadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  noAuthContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noAuthText: {
    fontSize: 20,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
  },
  loginButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  loginButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
