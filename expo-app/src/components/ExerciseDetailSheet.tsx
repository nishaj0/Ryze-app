import React from "react";
import { View, Modal, TouchableOpacity, ScrollView } from "react-native";
import { Exercise } from "../types";
import { Typography, Icon, ExerciseImageCarousel, InstructionStepper, ExerciseMetaBadges } from "./index";
import { useTheme } from "../theme/themeStore";
import { space, radius } from "../theme/spacing";

interface ExerciseDetailSheetProps {
  exercise: Exercise | null;
  visible: boolean;
  onClose: () => void;
}

export default function ExerciseDetailSheet({ exercise, visible, onClose }: ExerciseDetailSheetProps) {
  const theme = useTheme();

  if (!exercise) return null;

  const primaryMuscles = exercise.muscles?.filter((m) => m.isPrimary).map((m) => m.muscle.name) || [];
  const secondaryMuscles = exercise.muscles?.filter((m) => !m.isPrimary).map((m) => m.muscle.name) || [];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: theme.bgOverlay }}>
        <View
          style={{
            backgroundColor: theme.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: "85%",
            paddingBottom: space.xl,
          }}
        >
          {/* Handle */}
          <View style={{ alignItems: "center", paddingVertical: space.sm }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: space.lg, paddingTop: 0 }}>
            {/* Header */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: space.md }}>
              <View style={{ flex: 1, marginRight: space.md }}>
                <Typography variant="heading1" color={theme.textPrimary}>
                  {exercise.name}
                </Typography>
                {exercise.equipment && (
                  <Typography variant="bodySmall" color={theme.textSecondary} style={{ marginTop: space.xs }}>
                    {exercise.equipment}
                  </Typography>
                )}
              </View>
              <TouchableOpacity onPress={onClose} style={{ padding: space.xs }}>
                <Icon name="X" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Images */}
            {exercise.images && exercise.images.length > 0 && (
              <View style={{ marginBottom: space.lg }}>
                <ExerciseImageCarousel images={exercise.images} />
              </View>
            )}

            {/* Meta Badges */}
            <ExerciseMetaBadges
              level={exercise.level}
              mechanic={exercise.mechanic}
              equipment={exercise.equipment}
              muscles={exercise.muscles}
            />

            {/* Muscles */}
            {(primaryMuscles.length > 0 || secondaryMuscles.length > 0) && (
              <View style={{ marginBottom: space.lg }}>
                <Typography variant="label" color={theme.textSecondary} style={{ marginBottom: space.sm }}>
                  MUSCLES WORKED
                </Typography>
                {primaryMuscles.length > 0 && (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.xs, marginBottom: space.sm }}>
                    {primaryMuscles.map((muscle) => (
                      <View
                        key={muscle}
                        style={{
                          backgroundColor: theme.primaryLight,
                          paddingHorizontal: space.md,
                          paddingVertical: space.xs,
                          borderRadius: radius.sm,
                        }}
                      >
                        <Typography variant="caption" color={theme.primary} weight="600" style={{ textTransform: "capitalize" }}>
                          {muscle}
                        </Typography>
                      </View>
                    ))}
                  </View>
                )}
                {secondaryMuscles.length > 0 && (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.xs }}>
                    {secondaryMuscles.map((muscle) => (
                      <View
                        key={muscle}
                        style={{
                          backgroundColor: theme.surfaceSecondary,
                          paddingHorizontal: space.md,
                          paddingVertical: space.xs,
                          borderRadius: radius.sm,
                        }}
                      >
                        <Typography variant="caption" color={theme.textSecondary} weight="600" style={{ textTransform: "capitalize" }}>
                          {muscle}
                        </Typography>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Instructions */}
            {exercise.instructions && (
              <View style={{ marginBottom: space.lg }}>
                <Typography variant="label" color={theme.textSecondary} style={{ marginBottom: space.sm }}>
                  INSTRUCTIONS
                </Typography>
                <InstructionStepper instructions={exercise.instructions} />
              </View>
            )}

            {/* Close Button */}
            <TouchableOpacity
              onPress={onClose}
              style={{
                backgroundColor: theme.primary,
                borderRadius: radius.lg,
                paddingVertical: space.md,
                alignItems: "center",
                marginTop: space.md,
              }}
            >
              <Typography variant="body" color={theme.primaryText} weight="600">
                Close
              </Typography>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
