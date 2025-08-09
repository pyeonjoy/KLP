//로딩딩

import React from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

interface LoadingSpinnerProps {
  message?: string;
  size?: "small" | "large";
  color?: string;
}

export default function LoadingSpinner({ 
  message = "로딩 중...", 
  size = "large", 
  color = "#007AFF" 
}: LoadingSpinnerProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  text: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});
