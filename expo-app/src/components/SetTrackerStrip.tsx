import React, { useState } from "react";
import { View, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Typography } from "./index";
import { useTheme } from "../theme/themeStore";
import { radius, space } from "../theme/spacing";
import { SetLog } from "../types";

interface SetTrackerStripProps {
  targetSets: number;
  loggedSets: SetLog[];
  currentSetNumber: number;
  onSetPress?: (setIndex: number) => void;
}

export default function SetTrackerStrip({
  targetSets,
  loggedSets,
  currentSetNumber,
  onSetPress,
}: SetTrackerStripProps) {
  const theme = useTheme();
  const [expandedSet, setExpandedSet] = useState<number | null>(null);

  const handleSetPress = (index: number) => {
    if (onSetPress) {
      onSetPress(index);
    }
    setExpandedSet(expandedSet === index ? null : index);
  };

  const sets = Array.from({ length: targetSets }, (_, i) => {
    const logged = loggedSets[i];
    const isDone = !!logged && !logged.wasSkipped;
    const isSkipped = !!logged && logged.wasSkipped;
    const isCurrent = i === currentSetNumber - 1 && !logged;
    return { index: i, logged, isDone, isSkipped, isCurrent };
  });

  return (
    <View style={styles.container}>
      <Typography variant="caption" color={theme.textMuted} weight="600" style={styles.label}>
        SETS
      </Typography>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {sets.map((set) => {
          const isExpanded = expandedSet === set.index;
          let bgColor: string = theme.surfaceSecondary;
          let textColor: string = theme.textMuted;

          if (set.isDone) {
            bgColor = theme.successBg;
            textColor = theme.successText;
          } else if (set.isSkipped) {
            bgColor = theme.surfaceTertiary;
            textColor = theme.textMuted;
          } else if (set.isCurrent) {
            bgColor = theme.primaryLight;
            textColor = theme.primary;
          }

          return (
            <View key={set.index} style={styles.setWrapper}>
              <TouchableOpacity
                onPress={() => handleSetPress(set.index)}
                style={[styles.setPill, { backgroundColor: bgColor }]}
              >
                <Typography variant="caption" color={textColor} weight="700">
                  {set.isDone
                    ? `\u2713 ${set.logged?.weightKg ?? 0}\u00d7${set.logged?.reps ?? 0}`
                    : set.isSkipped
                      ? "SKIP"
                      : set.isCurrent
                        ? `${set.index + 1}`
                        : `${set.index + 1}`}
                </Typography>
              </TouchableOpacity>
              {isExpanded && set.logged && (
                <View style={[styles.expandedDetail, { backgroundColor: theme.bgSurface }]}>
                  <Typography variant="caption" color={theme.textSecondary}>
                    {set.logged.weightKg}kg \u00d7 {set.logged.reps} reps
                  </Typography>
                  {set.logged.notes && (
                    <Typography variant="caption" color={theme.textMuted} style={{ marginTop: 2 }}>
                      {set.logged.notes}
                    </Typography>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: space.md,
  },
  label: {
    marginBottom: space.sm,
  },
  scrollContent: {
    flexDirection: "row",
    gap: space.sm,
  },
  setWrapper: {
    alignItems: "center",
  },
  setPill: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.sm,
    minWidth: 64,
    alignItems: "center",
  },
  expandedDetail: {
    marginTop: space.xs,
    alignItems: "center",
    borderRadius: radius.sm,
    padding: space.xs,
    minWidth: 64,
  },
});
