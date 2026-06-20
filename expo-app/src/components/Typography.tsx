import React from "react";
import { Text, TextStyle, TextProps } from "react-native";
import { lightTheme } from "../theme/colors";
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
  color = lightTheme.textPrimary,
  align = "left",
  weight,
  style,
  children,
  ...props
}: TypographyProps) {
  const config = typography[variant];
  const finalWeight = (weight || config.fontWeight) as TextStyle["fontWeight"];

  return (
    <Text
      style={[
        {
          fontSize: config.fontSize,
          fontWeight: finalWeight,
          color,
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
