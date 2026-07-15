/**
 * Ryze Skeleton Components
 * Built on top of Moti for smooth shimmer animations.
 * Provides both a low-level <Skeleton> primitive and
 * higher-level screen-specific skeleton layouts.
 */

import React from "react";
import { View, Dimensions } from "react-native";
import { MotiView } from "moti";
import { useTheme } from "../theme/themeStore";
import { space, radius } from "../theme/spacing";

// ---------------------------------------------------------------------------
// Base colour tokens
// ---------------------------------------------------------------------------
const BASE_COLOR = "#E2E8F0";   // neutral-200
const SHINE_COLOR = "#F1F5F9";  // neutral-100 (lighter "shimmer" overlay)

// ---------------------------------------------------------------------------
// Skeleton — single animated rectangle / circle
// ---------------------------------------------------------------------------
interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export function Skeleton({ width = "100%", height = 16, borderRadius = 8, style }: SkeletonProps) {
  const theme = useTheme();
  return (
    <MotiView
      from={{ opacity: 0.4 }}
      animate={{ opacity: 1 }}
      transition={{
        type: "timing",
        duration: 800,
        loop: true,
        repeatReverse: true,
      }}
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: BASE_COLOR,
          overflow: "hidden",
        },
        style,
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// SkeletonCard — a generic card-shaped skeleton block
// ---------------------------------------------------------------------------
interface SkeletonCardProps {
  height?: number;
  style?: object;
  children?: React.ReactNode;
}

export function SkeletonCard({ height, style, children }: SkeletonCardProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: theme.border,
          padding: space.lg,
          shadowColor: theme.shadowSm,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 4,
          elevation: 2,
          ...(height ? { height } : {}),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ============================================================================
// Screen-level skeleton layouts
// ============================================================================

const { width: screenW } = Dimensions.get("window");

// ---------------------------------------------------------------------------
// HomeScreen skeleton
// ---------------------------------------------------------------------------
export function HomeScreenSkeleton() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, padding: space.lg, backgroundColor: theme.bg }}>
      {/* Greeting */}
      <Skeleton width="40%" height={12} borderRadius={4} style={{ marginBottom: space.xs }} />
      <Skeleton width="60%" height={28} borderRadius={8} style={{ marginBottom: space.sm }} />
      <Skeleton width="40%" height={16} borderRadius={6} style={{ marginBottom: space.xl }} />

      {/* Today's plan card */}
      <SkeletonCard style={{ marginBottom: space.lg }}>
        <Skeleton width="30%" height={12} borderRadius={4} style={{ marginBottom: space.sm }} />
        <Skeleton width="70%" height={24} borderRadius={6} style={{ marginBottom: space.sm }} />
        <View style={{ flexDirection: "row", gap: space.sm, marginBottom: space.md }}>
          <Skeleton width={80} height={24} borderRadius={12} />
          <Skeleton width={80} height={24} borderRadius={12} />
        </View>
        <Skeleton height={48} borderRadius={12} style={{ marginTop: space.sm }} />
      </SkeletonCard>

      {/* Stats row */}
      <View style={{ flexDirection: "row", gap: space.md, marginBottom: space.lg }}>
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} style={{ flex: 1, alignItems: "center", padding: space.md, gap: space.sm }}>
            <Skeleton width={32} height={32} borderRadius={16} />
            <Skeleton width="50%" height={24} borderRadius={6} />
            <Skeleton width="60%" height={12} borderRadius={4} />
          </SkeletonCard>
        ))}
      </View>

      {/* Reminders */}
      {[0, 1].map((i) => (
        <SkeletonCard
          key={`reminder-${i}`}
          style={{ marginBottom: space.lg, padding: space.md, flexDirection: "row", alignItems: "center", gap: space.sm }}
        >
          <Skeleton width={22} height={22} borderRadius={11} />
          <View style={{ flex: 1, gap: space.xs }}>
            <Skeleton width="45%" height={16} borderRadius={4} />
            <Skeleton width="80%" height={12} borderRadius={4} />
          </View>
          <Skeleton width={70} height={32} borderRadius={8} />
        </SkeletonCard>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// ProfileScreen skeleton
// ---------------------------------------------------------------------------
export function ProfileScreenSkeleton() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, padding: space.lg, backgroundColor: theme.bg }}>
      {/* Avatar */}
      <View style={{ alignItems: "center", marginBottom: space.lg }}>
        <Skeleton width={80} height={80} borderRadius={40} style={{ marginBottom: space.md }} />
        <Skeleton width={120} height={22} borderRadius={6} style={{ marginBottom: space.sm }} />
        <Skeleton width={160} height={14} borderRadius={4} />
      </View>

      {/* Current split card */}
      <SkeletonCard style={{ marginBottom: space.lg }}>
        <Skeleton width="30%" height={12} borderRadius={4} style={{ marginBottom: space.sm }} />
        <Skeleton width="70%" height={20} borderRadius={6} style={{ marginBottom: space.sm }} />
        <Skeleton width="40%" height={12} borderRadius={4} />
      </SkeletonCard>

      {/* Menu items */}
      <SkeletonCard style={{ marginBottom: space.lg, padding: 0 }}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: space.md,
              borderBottomWidth: i < 3 ? 1 : 0,
              borderBottomColor: theme.border,
              gap: space.md,
            }}
          >
            <Skeleton width={24} height={24} borderRadius={6} />
            <Skeleton width="50%" height={16} borderRadius={4} />
          </View>
        ))}
      </SkeletonCard>
    </View>
  );
}

// ---------------------------------------------------------------------------
// DashboardScreen skeleton
// ---------------------------------------------------------------------------
export function DashboardScreenSkeleton() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Header */}
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.lg }}>
        <Skeleton width="40%" height={32} borderRadius={8} style={{ marginBottom: space.sm }} />
        <Skeleton width="55%" height={16} borderRadius={4} />
      </View>

      {/* Stat cards */}
      <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
        <View style={{ flexDirection: "row", gap: space.md }}>
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} style={{ flex: 1 }}>
              <Skeleton width={36} height={36} borderRadius={10} style={{ marginBottom: space.sm }} />
              <Skeleton width="60%" height={24} borderRadius={6} style={{ marginBottom: space.xs }} />
              <Skeleton width="80%" height={12} borderRadius={4} />
            </SkeletonCard>
          ))}
        </View>
      </View>

      {/* Progressive overload card */}
      <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
        <SkeletonCard>
          <Skeleton width="48%" height={12} borderRadius={4} style={{ marginBottom: space.md }} />
          <View style={{ flexDirection: "row", gap: 3, marginBottom: space.md }}>
            <Skeleton width="50%" height={38} borderRadius={8} />
            <Skeleton width="50%" height={38} borderRadius={8} />
          </View>
          <Skeleton height={46} borderRadius={8} style={{ marginBottom: space.sm }} />
          <Skeleton height={46} borderRadius={8} style={{ marginBottom: space.lg }} />
          <View style={{ flexDirection: "row", gap: space.md, marginBottom: space.lg }}>
            <View style={{ flex: 1, gap: space.xs }}>
              <Skeleton width="45%" height={12} borderRadius={4} />
              <Skeleton width="75%" height={20} borderRadius={5} />
            </View>
            <View style={{ flex: 1, gap: space.xs }}>
              <Skeleton width="40%" height={12} borderRadius={4} />
              <Skeleton width="55%" height={20} borderRadius={5} />
            </View>
          </View>
          <Skeleton height={38} borderRadius={8} style={{ marginBottom: space.md }} />
          <Skeleton height={190} borderRadius={12} />
        </SkeletonCard>
      </View>

      {/* Chart card */}
      <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
        <SkeletonCard>
          <Skeleton width="40%" height={12} borderRadius={4} style={{ marginBottom: space.sm }} />
          <Skeleton width="50%" height={28} borderRadius={6} style={{ marginBottom: space.md }} />
          <Skeleton height={180} borderRadius={12} style={{ marginBottom: space.md }} />
        </SkeletonCard>
      </View>

      {/* Heatmap card */}
      <View style={{ paddingHorizontal: space.lg }}>
        <SkeletonCard>
          <Skeleton width="50%" height={12} borderRadius={4} style={{ marginBottom: space.md }} />
          <Skeleton height={96} borderRadius={8} />
        </SkeletonCard>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// RecordsScreen skeleton
// ---------------------------------------------------------------------------
export function RecordsScreenSkeleton() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.lg }}>
        <Skeleton width="30%" height={12} borderRadius={4} style={{ marginBottom: space.sm }} />
        <Skeleton width="55%" height={32} borderRadius={8} style={{ marginBottom: space.sm }} />
        <Skeleton width="40%" height={14} borderRadius={4} />
      </View>
      <View style={{ paddingHorizontal: space.lg, gap: space.sm }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} style={{ padding: space.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
              <Skeleton width={40} height={40} borderRadius={10} />
              <View style={{ flex: 1, gap: space.sm }}>
                <Skeleton width="60%" height={16} borderRadius={4} />
                <Skeleton width="35%" height={12} borderRadius={4} />
              </View>
              <View style={{ alignItems: "flex-end", gap: space.sm }}>
                <Skeleton width={80} height={16} borderRadius={4} />
                <Skeleton width={60} height={12} borderRadius={4} />
              </View>
            </View>
          </SkeletonCard>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// MetricsScreen skeleton
// ---------------------------------------------------------------------------
export function MetricsScreenSkeleton() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.lg }}>
        <Skeleton width="45%" height={32} borderRadius={8} style={{ marginBottom: space.sm }} />
        <Skeleton width="55%" height={14} borderRadius={4} />
      </View>
      {/* Tab bar */}
      <View style={{ flexDirection: "row", paddingHorizontal: space.lg, marginBottom: space.lg, gap: space.sm }}>
        <Skeleton width={100} height={36} borderRadius={20} />
        <Skeleton width={100} height={36} borderRadius={20} />
      </View>
      {/* Latest stat */}
      <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
        <SkeletonCard>
          <Skeleton width="30%" height={12} borderRadius={4} style={{ marginBottom: space.sm }} />
          <Skeleton width="40%" height={40} borderRadius={8} style={{ marginBottom: space.sm }} />
          <Skeleton width="50%" height={12} borderRadius={4} />
        </SkeletonCard>
      </View>
      {/* Chart */}
      <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
        <SkeletonCard>
          <Skeleton width="50%" height={12} borderRadius={4} style={{ marginBottom: space.md }} />
          <Skeleton height={160} borderRadius={10} />
        </SkeletonCard>
      </View>
      {/* History list */}
      <View style={{ paddingHorizontal: space.lg, gap: space.sm }}>
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} style={{ padding: space.md }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Skeleton width="35%" height={16} borderRadius={4} />
              <Skeleton width="25%" height={16} borderRadius={4} />
            </View>
          </SkeletonCard>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// PhotosTimelineScreen skeleton
// ---------------------------------------------------------------------------
export function PhotosTimelineScreenSkeleton() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.lg }}>
        <Skeleton width="30%" height={12} borderRadius={4} style={{ marginBottom: space.sm }} />
        <Skeleton width="60%" height={32} borderRadius={8} style={{ marginBottom: space.sm }} />
        <Skeleton width="40%" height={14} borderRadius={4} />
      </View>
      <View style={{ paddingHorizontal: space.lg, gap: space.lg }}>
        {[0, 1].map((i) => (
          <SkeletonCard key={i} style={{ padding: 0, overflow: "hidden" }}>
            <Skeleton width="100%" height={280} borderRadius={0} />
            <View style={{ padding: space.lg, gap: space.sm }}>
              <Skeleton width="40%" height={14} borderRadius={4} />
              <Skeleton width="60%" height={18} borderRadius={4} />
            </View>
          </SkeletonCard>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// PhotoCompareScreen skeleton
// ---------------------------------------------------------------------------
export function PhotoCompareScreenSkeleton() {
  const theme = useTheme();
  const halfW = (screenW - space.lg * 2 - space.md) / 2;
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.lg }}>
        <Skeleton width="50%" height={32} borderRadius={8} style={{ marginBottom: space.sm }} />
        <Skeleton width="65%" height={14} borderRadius={4} />
      </View>
      <View style={{ flexDirection: "row", paddingHorizontal: space.lg, gap: space.md }}>
        <Skeleton width={halfW} height={260} borderRadius={12} />
        <Skeleton width={halfW} height={260} borderRadius={12} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// SplitSwitcherScreen skeleton
// ---------------------------------------------------------------------------
export function SplitSwitcherScreenSkeleton() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, padding: space.lg, backgroundColor: theme.bg }}>
      <Skeleton width="30%" height={12} borderRadius={4} style={{ marginBottom: space.sm }} />
      <Skeleton width="50%" height={32} borderRadius={8} style={{ marginBottom: space.xl }} />
      <View style={{ gap: space.sm }}>
        {[0, 1, 2, 3].map((i) => (
          <SkeletonCard key={i}>
            <Skeleton width="70%" height={20} borderRadius={6} style={{ marginBottom: space.sm }} />
            <Skeleton width="40%" height={12} borderRadius={4} style={{ marginBottom: space.md }} />
            <View style={{ flexDirection: "row", gap: space.sm }}>
              <Skeleton width={60} height={22} borderRadius={11} />
              <Skeleton width={60} height={22} borderRadius={11} />
            </View>
          </SkeletonCard>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// SplitDetailsScreen skeleton
// ---------------------------------------------------------------------------
export function SplitDetailsScreenSkeleton() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, padding: space.lg, backgroundColor: theme.bg }}>
      <Skeleton width="25%" height={12} borderRadius={4} style={{ marginBottom: space.sm }} />
      <Skeleton width="65%" height={32} borderRadius={8} style={{ marginBottom: space.sm }} />
      <Skeleton width="45%" height={14} borderRadius={4} style={{ marginBottom: space.xl }} />
      {[0, 1, 2, 3].map((i) => (
        <SkeletonCard key={i} style={{ marginBottom: space.md }}>
          <Skeleton width="35%" height={18} borderRadius={6} style={{ marginBottom: space.sm }} />
          <View style={{ flexDirection: "row", gap: space.sm, marginBottom: space.sm }}>
            <Skeleton width={70} height={20} borderRadius={10} />
            <Skeleton width={70} height={20} borderRadius={10} />
          </View>
          <Skeleton width="80%" height={14} borderRadius={4} />
        </SkeletonCard>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// SplitSelectionScreen skeleton
// ---------------------------------------------------------------------------
export function SplitSelectionScreenSkeleton() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, padding: space.lg, backgroundColor: theme.bg }}>
      <Skeleton width="55%" height={28} borderRadius={8} style={{ marginBottom: space.sm }} />
      <Skeleton width="70%" height={16} borderRadius={4} style={{ marginBottom: space.xl }} />
      <View style={{ gap: space.md }}>
        {[0, 1, 2, 3].map((i) => (
          <SkeletonCard key={i}>
            <Skeleton width="60%" height={20} borderRadius={6} style={{ marginBottom: space.sm }} />
            <Skeleton width="40%" height={12} borderRadius={4} style={{ marginBottom: space.sm }} />
            <Skeleton width="90%" height={14} borderRadius={4} />
          </SkeletonCard>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// ExerciseProgressScreen skeleton
// ---------------------------------------------------------------------------
export function ExerciseProgressScreenSkeleton() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, padding: space.lg, backgroundColor: theme.bg }}>
      <Skeleton width="60%" height={28} borderRadius={8} style={{ marginBottom: space.xl }} />
      <SkeletonCard style={{ marginBottom: space.lg }}>
        <Skeleton width="35%" height={12} borderRadius={4} style={{ marginBottom: space.md }} />
        <Skeleton height={180} borderRadius={10} />
      </SkeletonCard>
      <View style={{ gap: space.sm }}>
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} style={{ padding: space.md }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Skeleton width="35%" height={14} borderRadius={4} />
              <Skeleton width="30%" height={14} borderRadius={4} />
              <Skeleton width="25%" height={14} borderRadius={4} />
            </View>
          </SkeletonCard>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Inline skeleton for small inline loading (alternatives, exercises list)
// ---------------------------------------------------------------------------
export function InlineListSkeleton({ rows = 3 }: { rows?: number }) {
  const theme = useTheme();
  return (
    <View style={{ gap: space.sm }}>
      {Array.from({ length: rows }).map((_, i) => (
        <View
          key={i}
          style={{
            backgroundColor: theme.surfaceSecondary,
            borderRadius: radius.md,
            padding: space.md,
            borderWidth: 1,
            borderColor: theme.border,
            gap: space.sm,
          }}
        >
          <Skeleton width="65%" height={16} borderRadius={4} />
          <Skeleton width="40%" height={12} borderRadius={4} />
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// WorkoutSummaryScreen skeleton
// ---------------------------------------------------------------------------
export function WorkoutSummaryScreenSkeleton() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, padding: space.lg, backgroundColor: theme.bg }}>
      {/* Header */}
      <Skeleton width="65%" height={32} borderRadius={8} style={{ marginBottom: space.sm }} />
      <Skeleton width="40%" height={14} borderRadius={4} style={{ marginBottom: space.xl }} />
      {/* Stats row */}
      <View style={{ flexDirection: "row", gap: space.md, marginBottom: space.lg }}>
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} style={{ flex: 1, alignItems: "center", gap: space.sm }}>
            <Skeleton width={32} height={32} borderRadius={8} />
            <Skeleton width="60%" height={20} borderRadius={4} />
            <Skeleton width="70%" height={12} borderRadius={4} />
          </SkeletonCard>
        ))}
      </View>
      {/* Chart placeholder */}
      <SkeletonCard style={{ marginBottom: space.lg }}>
        <Skeleton width="45%" height={14} borderRadius={4} style={{ marginBottom: space.md }} />
        <Skeleton height={160} borderRadius={10} />
      </SkeletonCard>
      {/* Exercise list */}
      <View style={{ gap: space.sm }}>
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} style={{ padding: space.md }}>
            <Skeleton width="55%" height={18} borderRadius={4} style={{ marginBottom: space.sm }} />
            <Skeleton width="35%" height={14} borderRadius={4} />
          </SkeletonCard>
        ))}
      </View>
    </View>
  );
}
