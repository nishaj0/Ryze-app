import React from "react";
import { View, TextInput, TextInputProps, StyleProp, ViewStyle } from "react-native";
import Typography from "./Typography";
import { lightTheme } from "../theme/colors";
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
  ...props
}: InputProps) {
  return (
    <View style={[{ width: "100%" }, containerStyle]}>
      {label && (
        <Typography variant="label" color={lightTheme.textSecondary} style={{ marginBottom: space.sm }}>
          {label}
        </Typography>
      )}
      <View
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: lightTheme.inputBg,
            borderWidth: 1.5,
            borderColor: error ? lightTheme.borderError : lightTheme.inputBorder,
            borderRadius: radius.lg,
            paddingHorizontal: space.md,
            minHeight: 48,
          },
          error && { backgroundColor: lightTheme.errorBg },
        ]}
      >
        {icon && <View style={{ marginRight: space.sm }}>{icon}</View>}
        <TextInput
          placeholderTextColor={placeholderTextColor || lightTheme.inputPlaceholder}
          style={[
            {
              flex: 1,
              fontSize: 16,
              color: lightTheme.inputText,
              paddingVertical: 12,
              fontFamily: "Inter",
            },
            style,
          ]}
          {...props}
        />
      </View>
      {error && (
        <Typography
          variant="caption"
          color={lightTheme.errorText}
          style={{ marginTop: space.xs }}
        >
          {error}
        </Typography>
      )}
    </View>
  );
}
