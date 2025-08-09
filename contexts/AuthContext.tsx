//React Native 앱의 인증 상태 관리를 담당하는 핵심 컴포넌트
//앱 전체에서 사용자 로그인 상태를 공유하는 Context API 구현
//모든 화면에서 현재 로그인된 사용자 정보에 접근 가능

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut, reload } from "firebase/auth";
import { authInstance } from "../components/AuthScreen";

interface AuthContextType {
  user: User | null; // 현재 로그인된 사용자 정보
  loading: boolean; // 로딩 상태 (앱 시작시 사용자 확인중)
  logout: () => Promise<void>; // 로그아웃 함수
  isEmailVerified: boolean; // 이메일 인증 여부
  refreshUser: () => Promise<void>; // 사용자 정보 새로고침 함수
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  isEmailVerified: false,
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      setUser(user); // 사용자 정보 업데이트
      setIsEmailVerified(user?.emailVerified || false); // 이메일 인증 상태
      setLoading(false); // 로딩 완료
    });

    return unsubscribe;
  }, []);

  //로그아웃 기능
  const logout = async () => {
    try {
      await signOut(authInstance);

      // 상태 초기화
      setUser(null);
      setIsEmailVerified(false);
    } catch (error) {
      throw error; // 에러를 다시 던져서 상위에서 처리할 수 있도록
    }
  };

  // 사용자 정보 새로고침 기능
  const refreshUser = async () => {
    try {
      const currentUser = authInstance.currentUser;
      if (currentUser) {
        // 1. 사용자 정보 새로고침
        await reload(currentUser);

        // 2. 토큰도 강제 새로고침
        await currentUser.getIdToken(true);

        // 3. 상태 강제 업데이트
        setUser(currentUser);
        setIsEmailVerified(currentUser.emailVerified);

        // onAuthStateChanged가 자동으로 트리거되어 상태 업데이트됨
      }
    } catch (error) {
      // 에러 무시
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, logout, isEmailVerified, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
