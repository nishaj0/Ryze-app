import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Typography } from "./index";
import { Icon } from "./index";
import { useTheme } from "../theme/themeStore";
import { radius, space } from "../theme/spacing";

interface InstructionStepperProps {
  instructions: string | null;
  autoRotateMs?: number;
}

export default function InstructionStepper({
  instructions,
  autoRotateMs = 5000,
}: InstructionStepperProps) {
  const theme = useTheme();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = instructions
    ? instructions.split("\n").filter((s) => s.trim().length > 0)
    : [];

  useEffect(() => {
    if (steps.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, autoRotateMs);
    return () => clearInterval(timer);
  }, [steps.length, autoRotateMs]);

  if (steps.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bgSurface }]}>
        <Typography variant="bodySmall" color={theme.textMuted} style={{ fontStyle: "italic" }}>
          No instructions available
        </Typography>
      </View>
    );
  }

  const goNext = () => setCurrentStep((prev) => (prev + 1) % steps.length);
  const goPrev = () => setCurrentStep((prev) => (prev - 1 + steps.length) % steps.length);

  return (
    <View style={[styles.container, { backgroundColor: theme.bgSurface }]}>
      <View style={styles.header}>
        <Icon name="Lightbulb" size={16} color={theme.primary} />
        <Typography variant="caption" color={theme.primary} weight="700">
          HOW TO PERFORM
        </Typography>
      </View>

      <View style={styles.stepContainer}>
        <TouchableOpacity onPress={goPrev} disabled={steps.length <= 1} style={styles.arrow}>
          <Icon
            name="ChevronLeft"
            size={20}
            color={steps.length > 1 ? theme.textSecondary : theme.textMuted}
          />
        </TouchableOpacity>

        <View style={styles.stepContent}>
          <Typography variant="bodySmall" color={theme.textPrimary} style={styles.stepText}>
            {steps[currentStep]}
          </Typography>
        </View>

        <TouchableOpacity onPress={goNext} disabled={steps.length <= 1} style={styles.arrow}>
          <Icon
            name="ChevronRight"
            size={20}
            color={steps.length > 1 ? theme.textSecondary : theme.textMuted}
          />
        </TouchableOpacity>
      </View>

      {steps.length > 1 && (
        <View style={styles.dots}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === currentStep ? theme.primary : theme.border },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    padding: space.md,
    marginBottom: space.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    marginBottom: space.sm,
  },
  stepContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  arrow: {
    padding: space.sm,
  },
  stepContent: {
    flex: 1,
    minHeight: 40,
    justifyContent: "center",
  },
  stepText: {
    textAlign: "center",
    lineHeight: 20,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: space.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
