import React from "react";
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
} from "react-native";
import Typography from "./Typography";
import { lightTheme } from "../theme/colors";
import { radius, space } from "../theme/spacing";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  title: string;
  onPress?: (e: GestureResponderEvent) => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
}

export default function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = true,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const sizeStyles: Record<Size, ViewStyle> = {
    sm: { paddingVertical: space.sm, paddingHorizontal: space.md },
    md: { paddingVertical: space.md, paddingHorizontal: space.lg },
    lg: { paddingVertical: 14, paddingHorizontal: space.xl },
  };

  const variantStyles: Record<Variant, { bg: string; text: string; border: string }> = {
    primary: {
      bg: isDisabled ? lightTheme.disabled : lightTheme.primary,
      text: lightTheme.primaryText,
      border: "transparent",
    },
    secondary: {
      bg: isDisabled ? lightTheme.disabled : lightTheme.secondary,
      text: isDisabled ? lightTheme.disabledText : lightTheme.secondaryText,
      border: "transparent",
    },
    outline: {
      bg: "transparent",
      text: isDisabled ? lightTheme.disabledText : lightTheme.primary,
      border: isDisabled ? lightTheme.disabled : lightTheme.primary,
    },
    ghost: {
      bg: "transparent",
      text: isDisabled ? lightTheme.disabledText : lightTheme.primary,
      border: "transparent",
    },
    danger: {
      bg: isDisabled ? lightTheme.disabled : lightTheme.danger,
      text: lightTheme.primaryText,
      border: "transparent",
    },
  };

  const v = variantStyles[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          borderWidth: variant === "outline" ? 1.5 : 0,
          borderRadius: radius.lg,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: space.sm,
          width: fullWidth ? "100%" : undefined,
          opacity: isDisabled ? 0.6 : 1,
          minHeight: size === "lg" ? 56 : size === "md" ? 48 : 40,
        },
        sizeStyles[size],
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <>
          {icon}
          <Typography
            variant="button"
            color={v.text}
            style={[{ fontSize: size === "sm" ? 14 : 16 }, textStyle]}
          >
            {title}
          </Typography>
        </>
      )}
    </TouchableOpacity>
  );
}
