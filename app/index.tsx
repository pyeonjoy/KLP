//홈페이지

import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  AppState,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../contexts/AuthContext";

export default function Home() {
  const router = useRouter();
  const { user, loading, logout, isEmailVerified, refreshUser } = useAuth();

  // 앱이 다시 포커스될 때 사용자 정보 새로고침
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === "active" && user) {
        refreshUser();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    // 컴포넌트 마운트 시에도 항상 새로고침 (인증 상태와 관계없이)
    if (user) {
      refreshUser();
    }

    return () => subscription?.remove();
  }, [user, refreshUser]);

  // 추가: 5초마다 자동 새로고침 (인증되지 않은 경우만)
  useEffect(() => {
    if (user && !isEmailVerified) {
      const interval = setInterval(() => {
        refreshUser();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [user, isEmailVerified, refreshUser]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>로딩 중...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>📱 커뮤니티 앱 MVP</Text>

      {user ? (
        <View style={styles.userSection}>
          <Text style={styles.welcomeText}>환영합니다! 👋</Text>
          <Text style={styles.emailText}>{user.email}</Text>

          {/* 이메일 인증 상태 표시 */}
          {!isEmailVerified && (
            <View style={styles.verificationWarning}>
              <Text style={styles.warningText}>
                ⚠️ 이메일 인증이 필요합니다
              </Text>
              <TouchableOpacity
                style={styles.warningButton}
                onPress={async () => {
                  // 1. 사용자 정보 새로고침
                  await refreshUser();

                  // 2. 토큰도 강제 새로고침
                  if (user) {
                    try {
                      await user.getIdToken(true);
                    } catch (error) {
                      // 에러 무시
                    }
                  }

                  // 3. 잠시 후 다시 한 번 새로고침
                  setTimeout(async () => {
                    await refreshUser();

                    // 4. 여전히 인증되지 않았다면 인증 페이지로 이동
                    setTimeout(() => {
                      if (!user?.emailVerified) {
                        router.push("/verify-email");
                      }
                    }, 500);
                  }, 1000);
                }}
              >
                <Text style={styles.warningButtonText}>지금 인증하기</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push("/posts")}
            >
              <Text style={styles.primaryButtonText}>📝 글 목록 보기</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push("/create-post")}
            >
              <Text style={styles.primaryButtonText}>✏️ 글 작성하기</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dangerButton}
              onPress={async () => {
                try {
                  await logout();
                } catch (error) {
                  // 에러 무시
                }
              }}
            >
              <Text style={styles.dangerButtonText}>🚪 로그아웃</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.guestSection}>
          <Text style={styles.welcomeText}>
            커뮤니티에 오신 것을 환영합니다! 🎉
          </Text>
          <Text style={styles.descText}>
            로그인하여 글을 작성하고 댓글을 남겨보세요.
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push("/auth")}
            >
              <Text style={styles.primaryButtonText}>🔑 로그인 / 회원가입</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push("/posts")}
            >
              <Text style={styles.secondaryButtonText}>
                📝 글 목록 보기 (읽기만 가능)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#1a1a1a",
    textAlign: "center",
  },
  userSection: {
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
  },
  guestSection: {
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
    color: "#007AFF",
    textAlign: "center",
  },
  emailText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
  },
  descText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
    lineHeight: 24,
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#34C759",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  dangerButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dangerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  warningButton: {
    backgroundColor: "#ffc107",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  warningButtonText: {
    color: "#856404",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  verificationWarning: {
    backgroundColor: "#fff3cd",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
    alignItems: "center",
  },
  warningText: {
    color: "#856404",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
    textAlign: "center",
  },
});
