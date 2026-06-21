import React from "react";
import Svg, { Circle, Text as SvgText } from "react-native-svg";
import { useTheme } from "../../theme/themeStore";

interface RingChartProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  unit?: string;
}

export default function RingChart({
  value,
  max,
  size = 120,
  strokeWidth = 12,
  color,
  trackColor,
  label,
  unit = "",
}: RingChartProps) {
  const theme = useTheme();
  const defaultColor = color || theme.primary;
  const defaultTrackColor = trackColor || theme.surfaceTertiary;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.min(value / Math.max(max, 1), 1);
  const offset = circumference * (1 - percent);

  return (
    <Svg width={size} height={size}>
      {/* Track */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={defaultTrackColor}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Progress */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={defaultColor}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        // Rotate -90deg so it starts at top
        rotation={-90}
        originX={size / 2}
        originY={size / 2}
      />
      {/* Center label */}
      <SvgText
        x={size / 2}
        y={size / 2 - 4}
        fontSize={size / 4.5}
        fontWeight="700"
        fill={theme.textPrimary}
        textAnchor="middle"
      >
        {Math.round(value)}
        {unit && <SvgText fontSize={size / 9} fill={theme.textMuted}>{unit}</SvgText>}
      </SvgText>
      {label && (
        <SvgText
          x={size / 2}
          y={size / 2 + size / 5.5}
          fontSize={size / 12}
          fill={theme.textMuted}
          textAnchor="middle"
        >
          {label}
        </SvgText>
      )}
    </Svg>
  );
}
