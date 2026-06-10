import React from "react";
import { Text, TextStyle, TextProps } from "react-native";
import { lightTheme } from "../theme/colors";
import { typography, fontFamily } from "../theme/typography";

type Variant = keyof typeof typography;

interface TypographyProps extends TextProps {
  variant?: Variant;
  color?: string;
  align?: "left" | "center" | "right";
  weight?: TextStyle["fontWeight"];
  children: React.ReactNode;
}

const familyFor = (weight: string): string => {
  if (weight === "500") return fontFamily.medium;
  if (weight === "600") return fontFamily.semibold;
  if (weight === "700") return fontFamily.bold;
  if (weight === "800" || weight === "900") return fontFamily.extrabold;
  return fontFamily.primary;
};

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
  const finalWeight = (weight || config.fontWeight) as string;
  const finalFamily = familyFor(finalWeight);

  return (
    <Text
      style={[
        {
          fontFamily: finalFamily,
          fontSize: config.fontSize,
          fontWeight: finalWeight as TextStyle["fontWeight"],
          lineHeight: config.fontSize * config.lineHeight,
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
