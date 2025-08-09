//헤더 컴포넌트

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

interface AppHeaderProps {
  title: string;
  leftButton?: {
    text: string;
    onPress: () => void;
    style?: "primary" | "secondary" | "danger";
  };
  rightButton?: {
    text: string;
    onPress: () => void;
    style?: "primary" | "secondary" | "danger";
  };
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export default function AppHeader({
  title,
  leftButton,
  rightButton,
  showBackButton = false,
  onBackPress,
}: AppHeaderProps) {
  const getButtonStyle = (style: "primary" | "secondary" | "danger" = "primary") => {
    switch (style) {
      case "primary":
        return styles.primaryButton;
      case "secondary":
        return styles.secondaryButton;
      case "danger":
        return styles.dangerButton;
      default:
        return styles.primaryButton;
    }
  };

  const getButtonTextStyle = (style: "primary" | "secondary" | "danger" = "primary") => {
    switch (style) {
      case "primary":
        return styles.primaryButtonText;
      case "secondary":
        return styles.secondaryButtonText;
      case "danger":
        return styles.dangerButtonText;
      default:
        return styles.primaryButtonText;
    }
  };

  return (
    <View style={styles.header}>
      {/* 왼쪽 버튼 영역 */}
      <View style={styles.leftSection}>
        {showBackButton && onBackPress ? (
          <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
            <Text style={styles.backButtonText}>← 뒤로</Text>
          </TouchableOpacity>
        ) : leftButton ? (
          <TouchableOpacity
            style={getButtonStyle(leftButton.style)}
            onPress={leftButton.onPress}
          >
            <Text style={getButtonTextStyle(leftButton.style)}>
              {leftButton.text}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {/* 중앙 제목 */}
      <Text style={styles.title}>{title}</Text>

      {/* 오른쪽 버튼 영역 */}
      <View style={styles.rightSection}>
        {rightButton ? (
          <TouchableOpacity
            style={getButtonStyle(rightButton.style)}
            onPress={rightButton.onPress}
          >
            <Text style={getButtonTextStyle(rightButton.style)}>
              {rightButton.text}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  leftSection: {
    flex: 1,
    alignItems: "flex-start",
  },
  rightSection: {
    flex: 1,
    alignItems: "flex-end",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center",
    flex: 2,
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
  primaryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: "#34C759",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  secondaryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  dangerButton: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  dangerButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
