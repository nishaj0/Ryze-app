import React from "react";
import { View } from "react-native";
import Svg, { Rect, Text as SvgText, Line } from "react-native-svg";
import { lightTheme } from "../../theme/colors";

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
  color = lightTheme.primary,
  yAxisFormatter = (v) => Math.round(v).toString(),
  showValues = true,
  horizontal = false,
}: BarChartProps) {
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
          const barColor = d.color || color;
          return (
            <React.Fragment key={i}>
              <SvgText
                x={padding.left - 8}
                y={y + barH / 2 + 4}
                fontSize={11}
                fill={lightTheme.textSecondary}
                textAnchor="end"
              >
                {d.label}
              </SvgText>
              <Rect
                x={padding.left}
                y={y}
                width={w}
                height={barH}
                fill={barColor}
                rx={4}
              />
              {showValues && (
                <SvgText
                  x={padding.left + w + 6}
                  y={y + barH / 2 + 4}
                  fontSize={11}
                  fill={lightTheme.textPrimary}
                  fontWeight="600"
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

  // Vertical bars
  const barW = (chartW / data.length) * 0.7;
  const gap = (chartW / data.length) * 0.3;

  // Grid lines
  const gridLines = [0, 0.5, 1].map((t) => ({
    y: padding.top + chartH * (1 - t),
    v: maxV * t,
  }));

  return (
    <Svg width={width} height={height}>
      {gridLines.map((g, i) => (
        <React.Fragment key={i}>
          <Line
            x1={padding.left}
            y1={g.y}
            x2={width - padding.right}
            y2={g.y}
            stroke={lightTheme.border}
            strokeWidth={1}
            strokeDasharray={i === 2 ? "0" : "3,3"}
          />
          <SvgText x={padding.left - 8} y={g.y + 4} fontSize={10} fill={lightTheme.textMuted} textAnchor="end">
            {yAxisFormatter(g.v)}
          </SvgText>
        </React.Fragment>
      ))}

      {data.map((d, i) => {
        const x = padding.left + i * (barW + gap) + gap / 2;
        const h = (d.value / maxV) * chartH;
        const y = padding.top + chartH - h;
        const barColor = d.color || color;
        return (
          <React.Fragment key={i}>
            <Rect x={x} y={y} width={barW} height={h} fill={barColor} rx={6} />
            {showValues && (
              <SvgText
                x={x + barW / 2}
                y={y - 6}
                fontSize={10}
                fill={lightTheme.textPrimary}
                fontWeight="600"
                textAnchor="middle"
              >
                {yAxisFormatter(d.value)}
              </SvgText>
            )}
            <SvgText
              x={x + barW / 2}
              y={height - 16}
              fontSize={10}
              fill={lightTheme.textMuted}
              textAnchor="middle"
            >
              {d.label}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}
