//이메일 인증 화면

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { sendEmailVerification, reload } from "firebase/auth";
import { useAuth } from "../contexts/AuthContext";
import { authInstance } from "../components/AuthScreen";
import Snackbar from "../components/Snackbar";

export default function VerifyEmailScreen() {
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    type: "info" as "success" | "error" | "warning" | "info",
  });
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  // 로그인하지 않은 경우 홈으로 리다이렉트
  useEffect(() => {
    if (!user) {
      router.replace("/");
      return;
    }

    // 이미 인증된 경우 홈으로 리다이렉트
    if (user.emailVerified) {
      router.replace("/");
      return;
    }
  }, [user]);

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

  // 인증 메일 재전송
  const resendVerificationEmail = async () => {
    if (!user) return;

    setResending(true);
    try {
      // 플랫폼별 URL 설정
      let actionCodeSettings;

      if (
        Platform.OS === "web" &&
        typeof window !== "undefined" &&
        window.location
      ) {
        // 웹 환경
        actionCodeSettings = {
          url: window.location.origin,
          handleCodeInApp: true,
        };
        console.log("🌐 웹 환경 - URL 포함한 재전송:", window.location.origin);
      } else {
        // 모바일 네이티브 환경 (iOS/Android) - URL 없이 전송
        actionCodeSettings = undefined;
        console.log("📱 모바일 환경 - 기본 재전송 (URL 없음)");
      }

      await sendEmailVerification(user, actionCodeSettings);
      showSnackbar("인증 메일이 재전송되었습니다! 📧", "success");
    } catch (error: any) {
      let errorMessage = "인증 메일 전송에 실패했습니다.";

      if (error.code === "auth/too-many-requests") {
        errorMessage = "너무 많은 요청입니다. 잠시 후 다시 시도해주세요.";
      } else if (error.code === "auth/user-token-expired") {
        errorMessage = "세션이 만료되었습니다. 다시 로그인해주세요.";
      }

      showSnackbar(errorMessage, "error");
    } finally {
      setResending(false);
    }
  };

  // 인증 상태 확인
  const checkVerificationStatus = async () => {
    if (!user) return;

    setChecking(true);
    try {
      console.log("🔄 인증 상태 확인 시작...");

      // 사용자 정보 새로고침
      await reload(user);
      console.log("✅ reload 완료, 현재 상태:", user.emailVerified);

      // reload 후 AuthContext 새로고침
      await refreshUser();

      // 짧은 지연 후 다시 확인
      setTimeout(() => {
        const currentUser = authInstance.currentUser;
        console.log("📊 최신 사용자 상태:", {
          user: currentUser?.email,
          emailVerified: currentUser?.emailVerified,
        });

        if (currentUser?.emailVerified) {
          showSnackbar("이메일 인증이 완료되었습니다! 🎉", "success");

          // 강제 세션 갱신을 위해 토큰 새로고침
          currentUser.getIdToken(true).then(() => {
            console.log("🔑 토큰 새로고침 완료");
            setTimeout(() => {
              router.replace("/");
            }, 1000);
          });
        } else {
          showSnackbar(
            "아직 인증이 완료되지 않았습니다. 이메일을 확인해주세요.",
            "warning"
          );
        }
        setChecking(false);
      }, 500); // 0.5초 대기
    } catch (error) {
      console.error("❌ 인증 상태 확인 에러:", error);
      showSnackbar("인증 상태 확인에 실패했습니다.", "error");
      setChecking(false);
    }
  };

  // 나중에 인증하기
  const skipForNow = () => {
    Alert.alert(
      "인증 건너뛰기",
      "이메일 인증을 나중에 하시겠습니까?\n일부 기능이 제한될 수 있습니다.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "건너뛰기",
          style: "destructive",
          onPress: () => router.replace("/"),
        },
      ]
    );
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* 이메일 아이콘 */}
        <View style={styles.iconContainer}>
          <Text style={styles.emailIcon}>📧</Text>
        </View>

        {/* 제목 */}
        <Text style={styles.title}>이메일 인증</Text>

        {/* 설명 */}
        <Text style={styles.description}>
          계정 보안을 위해 이메일 인증이 필요합니다.
        </Text>

        {/* 이메일 주소 */}
        <View style={styles.emailContainer}>
          <Text style={styles.emailLabel}>인증 메일 전송 주소:</Text>
          <Text style={styles.emailText}>{user.email}</Text>
        </View>

        {/* 안내 메시지 */}
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionTitle}>📱 인증 방법:</Text>
          <Text style={styles.instructionText}>1. 이메일 앱을 열어주세요</Text>
          <Text style={styles.instructionText}>
            2. 받은 편지함에서 인증 메일을 찾아주세요
          </Text>
          <Text style={styles.instructionText}>
            3. 메일 내 "이메일 인증" 링크를 클릭해주세요
          </Text>
          <Text style={styles.instructionText}>
            4. 아래 "인증 완료 확인" 버튼을 눌러주세요
          </Text>
        </View>

        {/* 버튼들 */}
        <View style={styles.buttonContainer}>
          {/* 인증 완료 확인 버튼 */}
          <TouchableOpacity
            style={[styles.primaryButton, checking && styles.disabledButton]}
            onPress={checkVerificationStatus}
            disabled={checking}
          >
            {checking ? (
              <View style={styles.loadingButton}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.primaryButtonText}>확인 중...</Text>
              </View>
            ) : (
              <Text style={styles.primaryButtonText}>✅ 인증 완료 확인</Text>
            )}
          </TouchableOpacity>

          {/* 인증 메일 재전송 버튼 */}
          <TouchableOpacity
            style={[styles.secondaryButton, resending && styles.disabledButton]}
            onPress={resendVerificationEmail}
            disabled={resending}
          >
            {resending ? (
              <View style={styles.loadingButton}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.secondaryButtonText}>전송 중...</Text>
              </View>
            ) : (
              <Text style={styles.secondaryButtonText}>
                📧 인증 메일 재전송
              </Text>
            )}
          </TouchableOpacity>

          {/* 나중에 하기 버튼 */}
          <TouchableOpacity style={styles.skipButton} onPress={skipForNow}>
            <Text style={styles.skipButtonText}>나중에 인증하기</Text>
          </TouchableOpacity>
        </View>

        {/* 도움말 */}
        <View style={styles.helpContainer}>
          <Text style={styles.helpTitle}>💡 도움말:</Text>
          <Text style={styles.helpText}>
            • 메일이 오지 않는다면 스팸함을 확인해보세요
          </Text>
          <Text style={styles.helpText}>
            • 메일 전송에 최대 5분이 소요될 수 있습니다
          </Text>
          <Text style={styles.helpText}>
            • 문제가 지속되면 다른 이메일로 가입해보세요
          </Text>
        </View>
      </View>

      {/* 스낵바 */}
      <Snackbar
        visible={snackbar.visible}
        message={snackbar.message}
        type={snackbar.type}
        onDismiss={hideSnackbar}
        duration={4000}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  emailIcon: {
    fontSize: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  emailContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  emailLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  emailText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  instructionContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 15,
  },
  instructionText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginBottom: 8,
  },
  buttonContainer: {
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: "#007AFF",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
  },
  secondaryButton: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 2,
    borderColor: "#007AFF",
  },

  skipButton: {
    padding: 15,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 5,
  },
  secondaryButtonText: {
    color: "#007AFF",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 5,
  },
  skipButtonText: {
    color: "#666",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  helpContainer: {
    backgroundColor: "#fff3cd",
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#ffc107",
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#856404",
    marginBottom: 10,
  },
  helpText: {
    fontSize: 12,
    color: "#856404",
    lineHeight: 16,
    marginBottom: 4,
  },
});
