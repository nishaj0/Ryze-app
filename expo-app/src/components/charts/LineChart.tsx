import React from "react";
import { View } from "react-native";
import Svg, { Path, Line, Circle, Text as SvgText, Defs, LinearGradient, Stop } from "react-native-svg";
import { useTheme } from "../../theme/themeStore";
import { typography } from "../../theme/typography";

export interface ChartPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: ChartPoint[];
  width?: number;
  height?: number;
  color?: string;
  showDots?: boolean;
  showLabels?: boolean;
  showGrid?: boolean;
  yAxisFormatter?: (v: number) => string;
  unit?: string;
}

export default function LineChart({
  data,
  width = 320,
  height = 200,
  color,
  showDots = true,
  showLabels = true,
  showGrid = true,
  yAxisFormatter = (v) => Math.round(v).toString(),
  unit = "",
}: LineChartProps) {
  const theme = useTheme();
  const defaultColor = color || theme.primary;
  if (!data || data.length === 0) {
    return <View style={{ height, width, justifyContent: "center", alignItems: "center" }} />;
  }

  const padding = { top: 20, right: 16, bottom: 32, left: 44 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const values = data.map((d) => d.value);
  const maxV = Math.max(...values, 1);
  const minV = Math.min(...values, 0);
  const range = maxV - minV || 1;

  // Build path
  const points = data.map((d, i) => {
    const x = padding.left + (i / Math.max(data.length - 1, 1)) * chartW;
    const y = padding.top + chartH - ((d.value - minV) / range) * chartH;
    return { x, y };
  });

  // Smooth line path (using simple cubic)
  const linePath = points
    .map((p, i, arr) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = arr[i - 1];
      const cx = (prev.x + p.x) / 2;
      return `Q ${cx} ${prev.y}, ${cx} ${(prev.y + p.y) / 2} T ${p.x} ${p.y}`;
    })
    .join(" ");

  // Area path (line + close)
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`
      : "";

  // Y-axis grid lines (4 segments)
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: padding.top + chartH * t,
    v: maxV - range * t,
  }));

  // X-axis labels - show subset to avoid clutter
  const labelStep = Math.max(1, Math.ceil(data.length / 5));
  const labels = data.map((d, i) => ({ ...d, i })).filter((d) => d.i % labelStep === 0);

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={defaultColor} stopOpacity={0.25} />
          <Stop offset="100%" stopColor={defaultColor} stopOpacity={0} />
        </LinearGradient>
      </Defs>

      {/* Grid lines */}
      {showGrid &&
        gridLines.map((g, i) => (
          <React.Fragment key={`g-${i}`}>
            <Line
              x1={padding.left}
              y1={g.y}
              x2={width - padding.right}
              y2={g.y}
              stroke={theme.border}
              strokeWidth={1}
              strokeDasharray={i === 4 ? "0" : "3,3"}
            />
            <SvgText
              x={padding.left - 8}
              y={g.y + 4}
              fontSize={10}
              fill={theme.textMuted}
              textAnchor="end"
            >
              {yAxisFormatter(g.v)}
            </SvgText>
          </React.Fragment>
        ))}

      {/* Area fill */}
      {areaPath && <Path d={areaPath} fill="url(#lineGrad)" />}

      {/* Line */}
      <Path d={linePath} stroke={defaultColor} strokeWidth={2.5} fill="none" />

      {/* Dots */}
      {showDots &&
        points.map((p, i) => (
          <Circle key={`d-${i}`} cx={p.x} cy={p.y} r={4} fill="#fff" stroke={defaultColor} strokeWidth={2} />
        ))}

      {/* X labels */}
      {showLabels &&
        labels.map((d) => {
          const x = padding.left + (d.i / Math.max(data.length - 1, 1)) * chartW;
          return (
            <SvgText
              key={`l-${d.i}`}
              x={x}
              y={height - 8}
              fontSize={10}
              fill={theme.textMuted}
              textAnchor="middle"
            >
              {d.label}
            </SvgText>
          );
        })}
    </Svg>
  );
}
