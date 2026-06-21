import React from "react";
import { View } from "react-native";
import Svg, { Rect, Text as SvgText, Line } from "react-native-svg";
import { useTheme } from "../../theme/themeStore";

export interface BarItem {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarItem[];
  width?: number;
  height?: number;
  color?: string;
  yAxisFormatter?: (v: number) => string;
  showValues?: boolean;
  horizontal?: boolean;
}

export default function BarChart({
  data,
  width = 320,
  height = 200,
  color,
  yAxisFormatter = (v) => Math.round(v).toString(),
  showValues = true,
  horizontal = false,
}: BarChartProps) {
  const theme = useTheme();
  const defaultColor = color || theme.primary;

  if (!data || data.length === 0) {
    return <View style={{ height, width }} />;
  }

  const padding = { top: 20, right: 16, bottom: 36, left: 44 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxV = Math.max(...data.map((d) => d.value), 1);

  if (horizontal) {
    const barH = (chartH / data.length) * 0.7;
    const gap = (chartH / data.length) * 0.3;
    return (
      <Svg width={width} height={height}>
        {data.map((d, i) => {
          const y = padding.top + i * (barH + gap) + gap / 2;
          const w = (d.value / maxV) * chartW;
          const barColor = d.color || defaultColor;
          return (
            <React.Fragment key={i}>
              <SvgText
                x={padding.left - 8}
                y={y + barH / 2 + 4}
                fontSize={11}
                fill={theme.textMuted}
                textAnchor="end"
                fontFamily="Inter"
              >
                {d.label}
              </SvgText>
              <Rect x={padding.left} y={y} width={w} height={barH} rx={4} fill={barColor} />
              {showValues && (
                <SvgText
                  x={padding.left + w + 6}
                  y={y + barH / 2 + 4}
                  fontSize={11}
                  fill={theme.textSecondary}
                  fontFamily="Inter"
                >
                  {yAxisFormatter(d.value)}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    );
  }

  const barW = (chartW / data.length) * 0.6;
  const gap = (chartW / data.length) * 0.4;

  return (
    <Svg width={width} height={height}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
        const y = padding.top + chartH * (1 - frac);
        return (
          <React.Fragment key={i}>
            <Line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke={theme.border}
              strokeWidth={0.5}
            />
            <SvgText
              x={padding.left - 8}
              y={y + 4}
              fontSize={10}
              fill={theme.textMuted}
              textAnchor="end"
              fontFamily="Inter"
            >
              {yAxisFormatter(maxV * frac)}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const x = padding.left + i * (barW + gap) + gap / 2;
        const barH = (d.value / maxV) * chartH;
        const y = padding.top + chartH - barH;
        const barColor = d.color || defaultColor;
        return (
          <React.Fragment key={i}>
            <Rect x={x} y={y} width={barW} height={barH} rx={4} fill={barColor} />
            {showValues && (
              <SvgText
                x={x + barW / 2}
                y={y - 6}
                fontSize={10}
                fill={theme.textSecondary}
                textAnchor="middle"
                fontFamily="Inter"
              >
                {yAxisFormatter(d.value)}
              </SvgText>
            )}
            <SvgText
              x={x + barW / 2}
              y={height - 8}
              fontSize={10}
              fill={theme.textMuted}
              textAnchor="middle"
              fontFamily="Inter"
            >
              {d.label}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}
