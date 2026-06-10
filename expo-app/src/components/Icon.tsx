import React from "react";
import * as LucideIcons from "lucide-react-native";
import { lightTheme } from "../theme/colors";

// Re-export all lucide icons for convenience
export * from "lucide-react-native";

// Typed icon name
export type IconName = keyof typeof LucideIcons;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export default function Icon({
  name,
  size = 24,
  color = lightTheme.textSecondary,
  strokeWidth = 2,
}: IconProps) {
  const LucideIcon = LucideIcons[name] as React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;

  if (!LucideIcon) {
    console.warn(`Icon "${name}" not found in lucide-react-native`);
    return null;
  }

  return <LucideIcon size={size} color={color} strokeWidth={strokeWidth} />;
}
