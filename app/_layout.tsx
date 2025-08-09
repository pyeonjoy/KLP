//루트 레이아웃

import React from "react";
import { Slot } from "expo-router";
import { Platform } from "react-native";
import { AuthProvider } from "../contexts/AuthContext";

// 웹에서만 shadow 경고 패치 적용
if (Platform.OS === "web") {
  require("../web-patch.js");
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <Slot />
    </AuthProvider>
  );
}
