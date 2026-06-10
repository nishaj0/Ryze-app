import React from "react";
import { View, StyleProp, ViewStyle } from "react-native";
import { lightTheme } from "../theme/colors";
import { radius, space } from "../theme/spacing";

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: "none" | "sm" | "md" | "lg";
  border?: boolean;
  shadow?: "none" | "sm" | "md";
}

export default function Card({
  children,
  style,
  padding = "md",
  border = true,
  shadow = "sm",
}: CardProps) {
  const paddingMap = {
    none: 0,
    sm: space.sm,
    md: space.md,
    lg: space.lg,
  };

  const shadowMap = {
    none: {},
    sm: {
      shadowColor: lightTheme.shadowMd,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: lightTheme.shadowLg,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 4,
    },
  };

  return (
    <View
      style={[
        {
          backgroundColor: lightTheme.surface,
          borderRadius: radius.lg,
          padding: paddingMap[padding],
          borderWidth: border ? 1 : 0,
          borderColor: lightTheme.border,
        },
        shadowMap[shadow],
        style,
      ]}
    >
      {children}
    </View>
  );
}
