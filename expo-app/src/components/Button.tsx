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
import { useTheme } from "../theme/themeStore";
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
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const sizeStyles: Record<Size, ViewStyle> = {
    sm: { paddingVertical: space.sm, paddingHorizontal: space.md },
    md: { paddingVertical: space.md, paddingHorizontal: space.lg },
    lg: { paddingVertical: 14, paddingHorizontal: space.xl },
  };

  const variantStyles: Record<Variant, { bg: string; text: string; border: string }> = {
    primary: {
      bg: isDisabled ? theme.disabled : theme.primary,
      text: theme.primaryText,
      border: "transparent",
    },
    secondary: {
      bg: isDisabled ? theme.disabled : theme.secondary,
      text: isDisabled ? theme.disabledText : theme.secondaryText,
      border: "transparent",
    },
    outline: {
      bg: "transparent",
      text: isDisabled ? theme.disabledText : theme.primary,
      border: isDisabled ? theme.disabled : theme.primary,
    },
    ghost: {
      bg: "transparent",
      text: isDisabled ? theme.disabledText : theme.primary,
      border: "transparent",
    },
    danger: {
      bg: isDisabled ? theme.disabled : theme.danger,
      text: theme.primaryText,
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
