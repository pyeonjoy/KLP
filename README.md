# 📱 커뮤니티 앱 MVP

> 케이엘피 기술면접 과제 - React Native 기반 커뮤니티 애플리케이션

## 🎯 프로젝트 개요

React Native(Expo)와 Firebase를 활용하여 개발한 풀스택 모바일 커뮤니티 애플리케이션입니다.
사용자 인증, 게시글 작성/수정/삭제, 댓글, 이미지 업로드 등의 핵심 기능을 구현했습니다.

### 📋 주요 기능

- **👤 사용자 인증**

  - 이메일/비밀번호 회원가입 및 로그인
  - 이메일 인증 시스템 (한국어 지원)
  - 자동 로그인 상태 유지

- **📝 게시글 관리**

  - 게시글 작성/조회/수정/삭제 (CRUD)
  - 이미지 첨부 및 자동 압축
  - 실시간 목록 업데이트

- **💬 댓글 시스템**

  - 댓글 작성/수정/삭제
  - 작성자만 수정/삭제 가능
  - 인라인 편집 UI

- **🔒 보안 및 권한**
  - Firebase Security Rules 적용
  - 작성자 기반 권한 관리
  - 입력값 검증 및 에러 처리

## 🛠 기술 스택

### Frontend

- **React Native** (Expo 51+)
- **TypeScript** - 타입 안정성
- **Expo Router** - 파일 기반 라우팅
- **React Context API** - 전역 상태 관리

### Backend & Services

- **Firebase Authentication** - 사용자 인증
- **Firebase Firestore** - NoSQL 데이터베이스
- **Firebase Storage** - 이미지 파일 저장
- **EAS (Expo Application Services)** - 빌드 및 배포

### UI/UX

- **React Native StyleSheet** - 네이티브 스타일링
- **SafeAreaView** - 디바이스 노치 대응
- **KeyboardAvoidingView** - 키보드 UX 개선
- **커스텀 Snackbar** - 사용자 피드백

### 개발 도구

- **Expo CLI** - 개발 환경
- **Git** - 버전 관리
- **EAS Update** - OTA 업데이트

## 📱 앱 구조

```
mvp/
├── app/                    # Expo Router 페이지
│   ├── index.tsx          # 홈페이지
│   ├── auth.tsx           # 로그인/회원가입
│   ├── verify-email.tsx   # 이메일 인증
│   ├── posts.tsx          # 게시글 목록
│   ├── create-post.tsx    # 게시글 작성
│   ├── edit-post/[id].tsx # 게시글 수정
│   └── post/[id].tsx      # 게시글 상세/댓글
├── components/            # 재사용 컴포넌트
│   ├── AuthScreen.tsx     # 인증 컴포넌트
│   ├── Snackbar.tsx       # 알림 컴포넌트
│   ├── PostItem.tsx       # 게시글 아이템
│   ├── AppHeader.tsx      # 공통 헤더
│   └── ...
├── contexts/              # React Context
│   └── AuthContext.tsx    # 인증 상태 관리
└── firebaseConfig.js      # Firebase 설정
```

## 🚀 주요 구현 기능

### 1. 인증 시스템

```typescript
// 이메일 인증 및 자동 상태 동기화
const refreshUser = async () => {
  const currentUser = authInstance.currentUser;
  if (currentUser) {
    await reload(currentUser);
    await currentUser.getIdToken(true);
    setUser(currentUser);
    setIsEmailVerified(currentUser.emailVerified);
  }
};
```

### 2. 이미지 처리

```typescript
// 자동 이미지 압축 및 리사이즈
const compressImage = async (uri: string) => {
  const MAX_WIDTH = 1200;
  const MAX_HEIGHT = 1200;
  const COMPRESS_QUALITY = 0.7;
  // ImageManipulator를 사용한 최적화
};
```

### 3. 실시간 데이터 관리

```typescript
// Firestore 실시간 쿼리
const fetchPosts = async () => {
  const postsQuery = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(postsQuery);
  // 데이터 처리 및 상태 업데이트
};
```

### 4. 키보드 UX 개선

```typescript
<KeyboardAvoidingView
  behavior={Platform.OS === "ios" ? "padding" : "height"}
  keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
>
  <ScrollView keyboardShouldPersistTaps="handled" />
</KeyboardAvoidingView>
```

## 🔐 Firebase Security Rules

```javascript
// Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /posts/{postId} {
      allow read: if true;
      allow create: if isAuthenticated() &&
                   request.auth.token.email_verified == true;
      allow update, delete: if isAuthenticated() &&
                            resource.data.authorEmail == getUserEmail();
    }
  }
}
```

## 📦 설치 및 실행

### 1. 프로젝트 클론

```bash
git clone https://github.com/pyeonjoy/klp.git
cd mvp
```

### 2. 의존성 설치

```bash
npm install
```

### 3. Firebase 설정

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일에 실제 Firebase 설정값 입력
EXPO_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 4. 개발 서버 실행

```bash
npx expo start
```

### 5. 앱 실행

- **iOS**: Expo Go 앱 또는 iOS 시뮬레이터
- **Android**: Expo Go 앱 또는 Android 에뮬레이터
- **Web**: 브라우저에서 `w` 키 입력

## 🚀 배포

### EAS Build & Update 사용

```bash
# 빌드 설정
npx eas build:configure

# 앱 빌드
npx eas build --platform all

# OTA 업데이트
npx eas update --auto
```

## 📈 성능 최적화

- **이미지 압축**: 1200x1200px, 70% 품질로 자동 압축
- **컴포넌트 분리**: 재사용 가능한 UI 컴포넌트
- **메모리 관리**: useEffect cleanup 함수 적용
- **네트워크 최적화**: Firebase 캐싱 활용

## 🎨 UI/UX 특징

- **반응형 디자인**: 다양한 화면 크기 대응
- **다크모드 준비**: 확장 가능한 테마 시스템
- **접근성**: SafeAreaView, 키보드 대응
- **사용자 피드백**: 로딩, 성공, 에러 상태 표시

## 🧪 테스트 환경

- **iOS**: iPhone 14 Pro (시뮬레이터)
- **Android**: Pixel 7 (에뮬레이터)
- **Web**: Chrome, Safari 최신 버전

## 👨‍💻 개발자 정보

- **이름**: [편조이]
- **이메일**: [pppeee1220@gmail.com]
- **개발 기간**: 2024.08.09

## 📝 기술적 도전과 해결

### 1. 이메일 인증 상태 동기화

**문제**: Firebase 인증 상태가 실시간 반영되지 않음
**해결**: `reload()`, `getIdToken(true)`, AppState 리스너 조합

### 2. 이미지 업로드 최적화

**문제**: 대용량 이미지로 인한 성능 저하
**해결**: expo-image-manipulator를 활용한 자동 압축

### 3. 크로스 플랫폼 UI 일관성

**문제**: iOS/Android/Web 간 UI 차이
**해결**: Platform API와 조건부 스타일링

### 4. 키보드 UX 문제

**문제**: 댓글 입력 시 키보드가 UI를 가림
**해결**: KeyboardAvoidingView와 플랫폼별 설정

---

> 이 프로젝트는 케이엘피 기술면접을 위해 개발되었습니다.  
> React Native와 Firebase를 활용한 풀스택 모바일 앱 개발 역량을 보여줍니다.
