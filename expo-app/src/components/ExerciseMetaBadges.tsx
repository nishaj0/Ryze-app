import React from "react";
import { View, StyleSheet } from "react-native";
import { Typography } from "./index";
import { useTheme } from "../theme/themeStore";
import { radius, space } from "../theme/spacing";
import { ExerciseMuscle } from "../types";

interface ExerciseMetaBadgesProps {
  level: string;
  mechanic: string | null;
  equipment: string | null;
  muscles: ExerciseMuscle[] | undefined;
}

export default function ExerciseMetaBadges({
  level,
  mechanic,
  equipment,
  muscles,
}: ExerciseMetaBadgesProps) {
  const theme = useTheme();

  const levelColorMap: Record<string, { bg: string; text: string }> = {
    beginner: { bg: theme.successBg, text: theme.successText },
    intermediate: { bg: theme.warningBg, text: theme.warningText },
    expert: { bg: theme.errorBg, text: theme.errorText },
  };
  const levelColor = levelColorMap[level] || { bg: theme.surfaceSecondary, text: theme.textSecondary };

  const primaryMuscles = muscles?.filter((m) => m.isPrimary).map((m) => m.muscle.name) || [];
  const secondaryMuscles = muscles?.filter((m) => !m.isPrimary).map((m) => m.muscle.name) || [];

  return (
    <View style={styles.container}>
      <View style={styles.badgeRow}>
        <View style={[styles.badge, { backgroundColor: levelColor.bg }]}>
          <Typography variant="caption" color={levelColor.text} weight="600">
            {level}
          </Typography>
        </View>
        {mechanic && (
          <View style={[styles.badge, { backgroundColor: theme.surfaceSecondary }]}>
            <Typography variant="caption" color={theme.textSecondary} weight="600">
              {mechanic}
            </Typography>
          </View>
        )}
        {equipment && equipment !== "body only" && (
          <View style={[styles.badge, { backgroundColor: theme.surfaceSecondary }]}>
            <Typography variant="caption" color={theme.textSecondary} weight="600">
              {equipment}
            </Typography>
          </View>
        )}
      </View>

      {(primaryMuscles.length > 0 || secondaryMuscles.length > 0) && (
        <View style={styles.muscleRow}>
          {primaryMuscles.length > 0 && (
            <Typography variant="caption" color={theme.textSecondary} style={styles.muscleText}>
              <Typography variant="caption" color={theme.primary} weight="700">Primary: </Typography>
              {primaryMuscles.join(", ")}
            </Typography>
          )}
          {secondaryMuscles.length > 0 && (
            <Typography variant="caption" color={theme.textMuted} style={styles.muscleText}>
              <Typography variant="caption" color={theme.textSecondary} weight="600">Secondary: </Typography>
              {secondaryMuscles.join(", ")}
            </Typography>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: space.md,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
    marginBottom: space.sm,
  },
  badge: {
    paddingHorizontal: space.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  muscleRow: {
    gap: 2,
  },
  muscleText: {
    lineHeight: 18,
  },
});
