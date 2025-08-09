//성공/오류/경고/정보 메시지를 화면 상단에 표시

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from "react-native";

interface SnackbarProps {
  visible: boolean;
  message: string;
  type?: "success" | "error" | "warning" | "info";
  duration?: number;
  onDismiss: () => void;
}

const { width } = Dimensions.get("window");

export default function Snackbar({
  visible,
  message,
  type = "info",
  duration = 4000,
  onDismiss,
}: SnackbarProps) {
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    if (visible) {
      // 스낵바 나타나기, 위에서 아래로 슬라이드 인인
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // 일정 시간 후 자동으로 사라지기
      const timer = setTimeout(() => {
        hideSnackbar();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideSnackbar = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "#28a745";
      case "error":
        return "#dc3545";
      case "warning":
        return "#ffc107";
      default:
        return "#007AFF";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      default:
        return "ℹ️";
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={hideSnackbar}
        activeOpacity={0.9}
      >
        <Text style={styles.icon}>{getIcon()}</Text>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
        <TouchableOpacity onPress={hideSnackbar} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 10,
    right: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 9999,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  icon: {
    fontSize: 18,
    marginRight: 10,
  },
  message: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  closeText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

