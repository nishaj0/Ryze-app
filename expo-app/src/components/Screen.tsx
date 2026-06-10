import React from "react";
import { ScrollView, View, StyleProp, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { lightTheme } from "../theme/colors";
import { space } from "../theme/spacing";

interface ScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scroll?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  bg?: string;
}

export default function Screen({
  children,
  style,
  scroll = true,
  padding = "lg",
  bg = lightTheme.bg,
}: ScreenProps) {
  const paddingMap = {
    none: 0,
    sm: space.sm,
    md: space.md,
    lg: space.lg,
  };

  const content = (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: bg,
          padding: paddingMap[padding],
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (scroll) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {content}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      {content}
    </SafeAreaView>
  );
}
