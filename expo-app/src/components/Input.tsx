import React from "react";
import { View, TextInput, TextInputProps, StyleProp, ViewStyle } from "react-native";
import Typography from "./Typography";
import { useTheme } from "../theme/themeStore";
import { radius, space } from "../theme/spacing";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  containerStyle,
  icon,
  style,
  placeholderTextColor,
  multiline,
  numberOfLines,
  ...props
}: InputProps) {
  const theme = useTheme();

  const isMultiline = multiline === true;
  const minHeight = isMultiline ? (numberOfLines ? numberOfLines * 24 + 24 : 100) : 48;

  return (
    <View style={[{ width: "100%" }, containerStyle]}>
      {label && (
        <Typography variant="label" color={theme.textSecondary} style={{ marginBottom: space.sm }}>
          {label}
        </Typography>
      )}
      <View
        style={[
          {
            flexDirection: isMultiline ? "column" : "row",
            alignItems: isMultiline ? "flex-start" : "center",
            backgroundColor: theme.inputBg,
            borderWidth: 1.5,
            borderColor: error ? theme.borderError : theme.inputBorder,
            borderRadius: radius.lg,
            paddingHorizontal: space.md,
            minHeight,
            paddingVertical: isMultiline ? space.md : 0,
          },
          error && { backgroundColor: theme.errorBg },
        ]}
      >
        {icon && <View style={{ marginRight: space.sm, marginTop: isMultiline ? 4 : 0 }}>{icon}</View>}
        <TextInput
          multiline={isMultiline}
          numberOfLines={isMultiline ? numberOfLines : undefined}
          placeholderTextColor={placeholderTextColor || theme.inputPlaceholder}
          style={[
            {
              flex: 1,
              fontSize: 16,
              color: theme.inputText,
              paddingVertical: 12,
              fontFamily: "Inter",
              textAlignVertical: isMultiline ? "top" : "center",
            },
            style,
          ]}
          {...props}
        />
      </View>
      {error && (
        <Typography
          variant="caption"
          color={theme.errorText}
          style={{ marginTop: space.xs }}
        >
          {error}
        </Typography>
      )}
    </View>
  );
}
