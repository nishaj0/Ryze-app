import React from "react";
import { Text, TextStyle, TextProps } from "react-native";
import { useTheme } from "../theme/themeStore";
import { typography } from "../theme/typography";

type Variant = keyof typeof typography;

interface TypographyProps extends TextProps {
  variant?: Variant;
  color?: string;
  align?: "left" | "center" | "right";
  weight?: TextStyle["fontWeight"];
  children: React.ReactNode;
}

export default function Typography({
  variant = "body",
  color,
  align = "left",
  weight,
  style,
  children,
  ...props
}: TypographyProps) {
  const theme = useTheme();
  const config = typography[variant];
  const finalWeight = (weight || config.fontWeight) as TextStyle["fontWeight"];
  const finalColor = color || theme.textPrimary;

  return (
    <Text
      style={[
        {
          fontSize: config.fontSize,
          fontWeight: finalWeight,
          color: finalColor,
          textAlign: align,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}
