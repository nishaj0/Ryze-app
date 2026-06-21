import React from "react";
import { View, StyleSheet } from "react-native";
import { Typography } from "./index";
import { lightTheme } from "../theme/colors";
import { radius, space } from "../theme/spacing";
import { ExerciseMuscle } from "../types";

interface ExerciseMetaBadgesProps {
  level: string;
  mechanic: string | null;
  equipment: string | null;
  muscles: ExerciseMuscle[] | undefined;
}

const levelColors: Record<string, { bg: string; text: string }> = {
  beginner: { bg: lightTheme.successBg, text: lightTheme.successText },
  intermediate: { bg: lightTheme.warningBg, text: lightTheme.warningText },
  expert: { bg: lightTheme.errorBg, text: lightTheme.errorText },
};

export default function ExerciseMetaBadges({
  level,
  mechanic,
  equipment,
  muscles,
}: ExerciseMetaBadgesProps) {
  const levelColor = levelColors[level] || { bg: lightTheme.surfaceSecondary, text: lightTheme.textSecondary };

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
          <View style={[styles.badge, { backgroundColor: lightTheme.surfaceSecondary }]}>
            <Typography variant="caption" color={lightTheme.textSecondary} weight="600">
              {mechanic}
            </Typography>
          </View>
        )}
        {equipment && equipment !== "body only" && (
          <View style={[styles.badge, { backgroundColor: lightTheme.surfaceSecondary }]}>
            <Typography variant="caption" color={lightTheme.textSecondary} weight="600">
              {equipment}
            </Typography>
          </View>
        )}
      </View>

      {(primaryMuscles.length > 0 || secondaryMuscles.length > 0) && (
        <View style={styles.muscleRow}>
          {primaryMuscles.length > 0 && (
            <Typography variant="caption" color={lightTheme.textSecondary} style={styles.muscleText}>
              <Typography variant="caption" color={lightTheme.primary} weight="700">Primary: </Typography>
              {primaryMuscles.join(", ")}
            </Typography>
          )}
          {secondaryMuscles.length > 0 && (
            <Typography variant="caption" color={lightTheme.textMuted} style={styles.muscleText}>
              <Typography variant="caption" color={lightTheme.textSecondary} weight="600">Secondary: </Typography>
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
