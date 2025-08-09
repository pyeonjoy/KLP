//로그인/회원가입 화면

import React, { useState } from "react";
import {
  View,
  TextInput,
  Button,
  Text,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import Snackbar from "./Snackbar";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  getAuth,
} from "firebase/auth";
import { app } from "../firebaseConfig";
import { useRouter } from "expo-router";

// auth 인스턴스를 직접 생성하여 타입 안정성 확보
export const authInstance = getAuth(app);

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    type: "info" as "success" | "error" | "warning" | "info",
  });
  const router = useRouter();

  // 실시간 유효성 검사
  const isValidEmail = email.includes("@") && email.includes(".");
  const isValidPassword = password.length >= 6;
  const isFormValid = isValidEmail && isValidPassword;

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

  const handleAuth = async () => {
    console.log("🔥 handleAuth 호출됨!", {
      email,
      password: password.length > 0 ? "***" : "",
      isLogin,
    });

    if (!email || !password) {
      showSnackbar("이메일과 비밀번호를 모두 입력해주세요", "warning");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(authInstance, email, password);

        // 성공 메시지 표시
        showSnackbar("로그인되었습니다! 환영합니다 🎉", "success");

        // 잠시 후 페이지 이동
        setTimeout(() => {
          router.replace("/");
        }, 1000);
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          authInstance,
          email,
          password
        );

        // 이메일 인증 메일 전송
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
            console.log(
              "🌐 웹 환경 - URL 포함한 이메일 전송:",
              window.location.origin
            );
          } else {
            // 모바일 네이티브 환경 (iOS/Android) - URL 없이 전송
            actionCodeSettings = undefined;
            console.log("📱 모바일 환경 - 기본 이메일 전송 (URL 없음)");
          }

          await sendEmailVerification(userCredential.user, actionCodeSettings);
          showSnackbar("회원가입 완료! 이메일을 확인해주세요 📧", "success");

          // 이메일 인증 페이지로 이동
          setTimeout(() => {
            router.replace("/verify-email");
          }, 1500);
        } catch (emailError) {
          console.error("이메일 전송 실패:", emailError);
          showSnackbar(
            "회원가입은 완료되었지만 인증 메일 전송에 실패했습니다",
            "warning"
          );

          // 인증 페이지로 이동 (재전송 가능)
          setTimeout(() => {
            router.replace("/verify-email");
          }, 1500);
        }
      }
    } catch (error: any) {
      let errorMessage = "알 수 없는 오류가 발생했습니다.";

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "이미 사용 중인 이메일입니다.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "비밀번호는 6자 이상이어야 합니다.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage =
          "올바른 이메일 형식을 입력해주세요.\n예: user@example.com";
      } else if (error.code === "auth/user-not-found") {
        errorMessage = "등록되지 않은 이메일입니다.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "잘못된 비밀번호입니다.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage =
          "너무 많은 시도로 일시적으로 차단되었습니다. 잠시 후 다시 시도해주세요.";
      } else if (error.code === "auth/operation-not-allowed") {
        errorMessage = "이메일/비밀번호 로그인이 비활성화되어 있습니다.";
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "네트워크 연결을 확인해주세요.";
      } else if (error.code === "auth/invalid-credential") {
        errorMessage = "이메일 또는 비밀번호가 올바르지 않습니다.";
      } else if (error.code === "auth/user-disabled") {
        errorMessage = "이 계정은 비활성화되었습니다.";
      }

      // 스낵바로 에러 표시
      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>
          {isLogin ? "🔑 로그인" : "✨ 회원가입"}
        </Text>

        <Text style={styles.subtitle}>
          {isLogin
            ? "계정에 로그인하여 커뮤니티에 참여하세요"
            : "새 계정을 만들어 커뮤니티에 참여하세요"}
        </Text>

        <TextInput
          placeholder="이메일 (예: user@example.com)"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          style={styles.input}
          placeholderTextColor="#999"
        />

        {/* 이메일 입력 조건 */}
        <View style={styles.singleRequirementContainer}>
          <Text style={styles.requirementIcon}>
            {email === "" ? "✉️" : isValidEmail ? "✅" : "❌"}
          </Text>
          <Text
            style={[
              styles.requirementText,
              email !== "" &&
                (isValidEmail ? styles.validText : styles.invalidText),
            ]}
          >
            올바른 이메일 형식을 입력해주세요 (예: user@example.com)
          </Text>
        </View>

        <TextInput
          placeholder="비밀번호"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          placeholderTextColor="#999"
        />

        {/* 비밀번호 입력 조건 */}
        <View style={styles.singleRequirementContainer}>
          <Text style={styles.requirementIcon}>
            {password === "" ? "🔒" : isValidPassword ? "✅" : "❌"}
          </Text>
          <Text
            style={[
              styles.requirementText,
              password !== "" &&
                (isValidPassword ? styles.validText : styles.invalidText),
            ]}
          >
            비밀번호는 최소 6자 이상 입력해주세요
          </Text>
        </View>

        {/* 회원가입 시 추가 안내 */}
        {!isLogin && (
          <View style={styles.additionalInfo}>
            <Text style={styles.requirementIcon}>⚠️</Text>
            <Text style={styles.requirementText}>
              회원가입 시 새로운 이메일을 사용해주세요
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.authButton,
            loading && styles.authButtonDisabled,
            !isFormValid && !loading && styles.authButtonInvalid,
          ]}
          onPress={handleAuth}
          disabled={loading || !isFormValid}
        >
          <Text style={styles.authButtonText}>
            {loading ? "처리 중..." : isLogin ? "로그인" : "회원가입"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text style={styles.toggleText}>
            {isLogin
              ? "계정이 없으신가요? 회원가입하기"
              : "이미 계정이 있으신가요? 로그인하기"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.push("/")}
        >
          <Text style={styles.homeButtonText}>🏠 홈으로 돌아가기</Text>
        </TouchableOpacity>
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
    justifyContent: "center",
    padding: 20,
  },
  formContainer: {
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderWidth: 2,
    borderColor: "#e9ecef",
    marginBottom: 15,
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    color: "#1a1a1a",
  },
  authButton: {
    backgroundColor: "#007AFF",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  authButtonDisabled: {
    backgroundColor: "#999",
  },
  authButtonInvalid: {
    backgroundColor: "#ccc",
  },
  authButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  toggleButton: {
    padding: 10,
    marginBottom: 15,
  },
  toggleText: {
    color: "#007AFF",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
  },
  homeButton: {
    backgroundColor: "#6c757d",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  homeButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  requirementIcon: {
    fontSize: 12,
    marginRight: 8,
    marginTop: 1,
  },
  requirementText: {
    fontSize: 12,
    color: "#666",
    flex: 1,
    lineHeight: 16,
  },
  validText: {
    color: "#28a745",
    fontWeight: "500",
  },
  invalidText: {
    color: "#dc3545",
    fontWeight: "500",
  },
  singleRequirementContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  additionalInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3cd",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: "#ffc107",
  },
});
