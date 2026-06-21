import React from "react";
import { View } from "react-native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import { useTheme } from "../../theme/themeStore";

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  count: number;
}

interface HeatmapProps {
  data: HeatmapDay[];
  width?: number;
  cellSize?: number;
  gap?: number;
  weeks?: number; // number of weeks to show
}

export default function Heatmap({ data, width = 320, cellSize = 14, gap = 3, weeks = 13 }: HeatmapProps) {
  // Build a map for quick lookup
  const map = new Map<string, number>();
  const theme = useTheme();
  data.forEach((d) => map.set(d.date, d.count));

  // Determine max count for color scaling
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  // Build grid: last N weeks ending today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - weeks * 7 + 1);

  // Align startDate to a Sunday
  const startDow = startDate.getDay();
  startDate.setDate(startDate.getDate() - startDow);

  const totalDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const cols = Math.ceil(totalDays / 7);
  const gridW = cols * (cellSize + gap) + 24; // +24 for day labels
  const gridH = 7 * (cellSize + gap) + 18; // +18 for month labels

  const finalW = Math.min(width, gridW);
  const finalH = gridH;

  const colorFor = (count: number): string => {
    if (count === 0) return theme.surfaceTertiary;
    if (count === 1) return theme.primary[100];
    if (count === 2) return theme.primary[300];
    if (count >= 3) return theme.primary[600];
    return theme.primary[100];
  };

  const days = ["S", "M", "T", "W", "T", "F", "S"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Build cells
  const cells: { x: number; y: number; date: string; count: number; isFuture: boolean }[] = [];
  const cursor = new Date(startDate);
  let col = 0;
  while (cursor.getTime() <= today.getTime()) {
    for (let row = 0; row < 7; row++) {
      const dateStr = cursor.toISOString().split("T")[0];
      const isFuture = cursor.getTime() > today.getTime();
      cells.push({
        x: 24 + col * (cellSize + gap),
        y: 18 + row * (cellSize + gap),
        date: dateStr,
        count: map.get(dateStr) || 0,
        isFuture,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    col++;
  }

  // Month labels
  const monthLabels: { x: number; month: number }[] = [];
  let lastMonth = -1;
  cells.forEach((c) => {
    const d = new Date(c.date);
    if (d.getMonth() !== lastMonth && d.getDate() <= 7) {
      monthLabels.push({ x: c.x, month: d.getMonth() });
      lastMonth = d.getMonth();
    }
  });

  return (
    <View>
      <Svg width={finalW} height={finalH}>
        {/* Day labels */}
        {days.map((d, i) => (
          <SvgText
            key={`d-${i}`}
            x={20}
            y={18 + i * (cellSize + gap) + cellSize - 2}
            fontSize={9}
            fill={theme.textMuted}
            textAnchor="end"
          >
            {i % 2 === 1 ? d : ""}
          </SvgText>
        ))}

        {/* Month labels */}
        {monthLabels.map((m, i) => (
          <SvgText
            key={`m-${i}`}
            x={m.x}
            y={10}
            fontSize={9}
            fill={theme.textMuted}
          >
            {monthNames[m.month]}
          </SvgText>
        ))}

        {/* Cells */}
        {cells.map((c, i) => (
          <Rect
            key={`c-${i}`}
            x={c.x}
            y={c.y}
            width={cellSize}
            height={cellSize}
            rx={3}
            fill={c.isFuture ? "transparent" : colorFor(c.count)}
            stroke={c.isFuture ? theme.border : "transparent"}
            strokeWidth={c.isFuture ? 0.5 : 0}
          />
        ))}
      </Svg>

      {/* Legend */}
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 6 }}>
        <SvgText fontSize={9} fill={theme.textMuted}>Less</SvgText>
        {[0, 1, 2, 3, 4].map((c) => (
          <Rect key={c} width={10} height={10} rx={2} fill={colorFor(c)} />
        ))}
        <SvgText fontSize={9} fill={theme.textMuted}>More</SvgText>
      </View>
    </View>
  );
}
