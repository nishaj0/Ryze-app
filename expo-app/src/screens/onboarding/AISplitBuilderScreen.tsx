import React, { useState, useEffect, useRef } from "react";
import {
  View,
  ScrollView,
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../../navigation/types";
import { generateAISplit } from "../../api/splits";
import { createSplit, setActiveSplit } from "../../api/splits";
import { completeOnboarding } from "../../api/onboarding";
import { getApiErrorMessage } from "../../utils/apiErrors";
import { useOnboarding } from "./OnboardingContext";
import { useAuthStore } from "../../store/authStore";
import { clearOnboardingProgress } from "../../utils/storage";
import { Typography, Card, Button, Input, Icon } from "../../components";
import { useTheme } from "../../theme/themeStore";
import { space, radius } from "../../theme/spacing";

type Props = NativeStackScreenProps<OnboardingStackParamList, "AISplitBuilder">;

// ─── AI Generating Progress Screen ───────────────────────────────────────────

const STEPS = [
  { label: "Reading your profile",       doneAt: 2  },
  { label: "Selecting exercises",        doneAt: 7  },
  { label: "Structuring your split",     doneAt: 14 },
  { label: "Finalising & validating",    doneAt: 20 },
];

// Total estimate we animate toward (Gemini usually finishes in 15-25s)
const ESTIMATED_SECONDS = 25;

function AIGeneratingScreen({ theme }: { theme: any }) {
  const progress = useRef(new Animated.Value(0)).current;
  const pulse    = useRef(new Animated.Value(1)).current;
  const [elapsed, setElapsed] = useState(0);
  const [doneSteps, setDoneSteps] = useState<number>(0);

  // Smooth progress bar: 0 → 85% in ESTIMATED_SECONDS, then stalls
  useEffect(() => {
    Animated.timing(progress, {
      toValue: 0.85,
      duration: ESTIMATED_SECONDS * 1000,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, []);

  // Pulsing glow on the icon
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 1,    duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    ).start();
  }, []);

  // Elapsed-second ticker + step advancement
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed((s) => {
        const next = s + 1;
        const done = STEPS.filter((st) => st.doneAt <= next).length;
        setDoneSteps(done);
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const currentStepLabel =
    doneSteps < STEPS.length ? STEPS[doneSteps].label : "Almost done...";

  const remaining = Math.max(0, ESTIMATED_SECONDS - elapsed);
  const timerLabel =
    elapsed < ESTIMATED_SECONDS
      ? `~${remaining}s remaining`
      : "Wrapping up...";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: space.xl }}>

        {/* Pulsing icon */}
        <Animated.View style={{ transform: [{ scale: pulse }], marginBottom: space.xl }}>
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: theme.primaryLight,
            alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="Sparkles" size={36} color={theme.primary} />
          </View>
        </Animated.View>

        {/* Heading */}
        <Typography variant="heading2" color={theme.textPrimary} style={{ textAlign: "center", marginBottom: space.xs }}>
          Building your split
        </Typography>
        <Typography variant="body" color={theme.textSecondary} style={{ textAlign: "center", marginBottom: space.xl }}>
          {currentStepLabel}
        </Typography>

        {/* Progress bar */}
        <View style={{ width: "100%", marginBottom: space.sm }}>
          <View style={{
            width: "100%", height: 8, borderRadius: 999,
            backgroundColor: theme.surfaceSecondary,
            overflow: "hidden",
          }}>
            <Animated.View style={{
              height: "100%", borderRadius: 999,
              backgroundColor: theme.primary,
              width: barWidth,
            }} />
          </View>
        </View>

        {/* Timer */}
        <Typography variant="bodySmall" color={theme.textMuted} style={{ textAlign: "center", marginBottom: space.xl }}>
          {timerLabel}
        </Typography>

        {/* Step checklist */}
        <View style={{ width: "100%", gap: space.sm }}>
          {STEPS.map((step, i) => {
            const done    = i < doneSteps;
            const active  = i === doneSteps;
            return (
              <View key={step.label} style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                <View style={{
                  width: 24, height: 24, borderRadius: 12,
                  backgroundColor: done ? theme.primary : active ? theme.primaryLight : theme.surfaceSecondary,
                  borderWidth: active ? 2 : 0,
                  borderColor: theme.primary,
                  alignItems: "center", justifyContent: "center",
                }}>
                  {done && <Icon name="Check" size={13} color={theme.primaryText} />}
                </View>
                <Typography
                  variant="bodySmall"
                  color={done ? theme.primary : active ? theme.textPrimary : theme.textMuted}
                  weight={active ? "600" : "400"}
                >
                  {step.label}
                </Typography>
              </View>
            );
          })}
        </View>

      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────


interface GeneratedExercise {
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
}

interface GeneratedDay {
  dayNumber: number;
  name: string;
  muscleGroups: string[];
  isRest: boolean;
  exercises: GeneratedExercise[];
}

interface GeneratedSplit {
  name: string;
  description: string;
  type: string;
  daysPerWeek: number;
  days: GeneratedDay[];
}

export default function AISplitBuilderScreen({ navigation }: Props) {
  const theme = useTheme();
  const { data: onboardingData } = useOnboarding();
  const { setAuth, token, user } = useAuthStore();

  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedSplit, setGeneratedSplit] = useState<GeneratedSplit | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);


  const handleGenerate = async () => {
    if (!description.trim() && !onboardingData) {
      Alert.alert("Description Required", "Please describe your goals or any specific requirements.");
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedSplit(null);
    setWarnings([]);

    try {
      const result = await generateAISplit(description, {
        goal: onboardingData.goal,
        experienceLevel: onboardingData.experienceLevel,
        daysAvailable: onboardingData.daysAvailable,
        equipmentAccess: onboardingData.equipmentAccess,
        gender: onboardingData.gender,
      });
      setGeneratedSplit(result.split);
      setWarnings(result.warnings);
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!generatedSplit) return;

    setSaving(true);
    try {
      // Create the split
      const splitRes = await createSplit({
        name: generatedSplit.name,
        description: generatedSplit.description,
        type: generatedSplit.type,
        daysPerWeek: generatedSplit.daysPerWeek,
        days: generatedSplit.days.map((day) => ({
          dayNumber: day.dayNumber,
          name: day.name,
          isRest: day.isRest,
          muscleGroups: day.muscleGroups,
          exercises: day.exercises.map((ex) => ({
            exerciseId: ex.exerciseId,
            targetSets: ex.targetSets,
            targetRepsMin: ex.targetRepsMin,
            targetRepsMax: ex.targetRepsMax,
          })),
        })),
      });

      // Set as active split
      await setActiveSplit(splitRes.split.id);

      // Complete onboarding
      const onboardingRes = await completeOnboarding({
        ...onboardingData,
        splitId: splitRes.split.id,
      });

      // Clear saved progress now that onboarding is complete
      if (user?.id) {
        await clearOnboardingProgress(user.id);
      }

      await setAuth(token!, onboardingRes.user);
    } catch (err: any) {
      Alert.alert("Error", getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = () => {
    setGeneratedSplit(null);
    setWarnings([]);
    setError(null);
  };

  const handleEditManually = () => {
    // Navigate to custom split builder with pre-filled data
    // For now, just navigate to the custom split screen
    navigation.navigate("OnboardingCustomSplit");
  };

  if (loading) {
    return <AIGeneratingScreen theme={theme} />;
  }

  if (generatedSplit) {
    // Preview phase
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: space.lg, paddingBottom: space.xl }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={{ marginBottom: space.lg }}>
              <Typography variant="heading1" color={theme.textPrimary}>
                Your AI-Generated Split
              </Typography>
              <Typography
                variant="body"
                color={theme.textSecondary}
                style={{ marginTop: space.xs }}
              >
                Review and customize before saving
              </Typography>
            </View>

            {/* Split Info */}
            <Card shadow="sm" style={{ padding: space.lg, marginBottom: space.lg }}>
              <Typography variant="heading2" color={theme.textPrimary}>
                {generatedSplit.name}
              </Typography>
              {generatedSplit.description && (
                <Typography
                  variant="body"
                  color={theme.textSecondary}
                  style={{ marginTop: space.xs }}
                >
                  {generatedSplit.description}
                </Typography>
              )}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: space.sm,
                  marginTop: space.md,
                }}
              >
                <Icon name="Calendar" size={16} color={theme.textMuted} />
                <Typography variant="bodySmall" color={theme.textMuted}>
                  {generatedSplit.daysPerWeek} days/week
                </Typography>
              </View>
            </Card>

            {/* Warnings */}
            {warnings.length > 0 && (
              <Card
                style={{
                  padding: space.md,
                  marginBottom: space.lg,
                  backgroundColor: theme.warningBg,
                  borderColor: theme.warning,
                  borderWidth: 1,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                  <Icon name="AlertTriangle" size={18} color={theme.warning} />
                  <Typography variant="bodySmall" color={theme.warningText} weight="600">
                    Warnings
                  </Typography>
                </View>
                {warnings.map((warning, idx) => (
                  <Typography
                    key={idx}
                    variant="bodySmall"
                    color={theme.warningText}
                    style={{ marginTop: space.xs }}
                  >
                    • {warning}
                  </Typography>
                ))}
              </Card>
            )}

            {/* Days */}
            {generatedSplit.days.map((day) => (
              <Card
                key={day.dayNumber}
                shadow="sm"
                style={{ padding: space.lg, marginBottom: space.md }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: space.md,
                  }}
                >
                  <Typography variant="heading3" color={theme.textPrimary}>
                    Day {day.dayNumber}: {day.name}
                  </Typography>
                  {day.isRest && (
                    <View
                      style={{
                        backgroundColor: theme.successBg,
                        paddingHorizontal: space.sm,
                        paddingVertical: space.xs,
                        borderRadius: radius.sm,
                      }}
                    >
                      <Typography variant="caption" color={theme.success} weight="600">
                        REST
                      </Typography>
                    </View>
                  )}
                </View>

                {day.muscleGroups.length > 0 && (
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: space.xs,
                      marginBottom: space.md,
                    }}
                  >
                    {day.muscleGroups.map((mg) => (
                      <View
                        key={mg}
                        style={{
                          backgroundColor: theme.primaryLight,
                          paddingHorizontal: space.sm,
                          paddingVertical: space.xs,
                          borderRadius: radius.sm,
                        }}
                      >
                        <Typography variant="caption" color={theme.primary} weight="600">
                          {mg}
                        </Typography>
                      </View>
                    ))}
                  </View>
                )}

                {!day.isRest && day.exercises.length > 0 && (
                  <View style={{ gap: space.sm }}>
                    {day.exercises.map((ex, idx) => (
                      <View
                        key={idx}
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          paddingVertical: space.xs,
                          borderBottomWidth: idx < day.exercises.length - 1 ? 1 : 0,
                          borderBottomColor: theme.border,
                        }}
                      >
                        <Typography variant="body" color={theme.textPrimary} style={{ flex: 1 }}>
                          {ex.exerciseName}
                        </Typography>
                        <Typography variant="bodySmall" color={theme.textMuted}>
                          {ex.targetSets}×{ex.targetRepsMin}-{ex.targetRepsMax}
                        </Typography>
                      </View>
                    ))}
                  </View>
                )}
              </Card>
            ))}

            {/* Actions */}
            <View style={{ gap: space.md, marginTop: space.lg }}>
              <Button
                title={saving ? "Saving..." : "Accept & Save"}
                onPress={handleAccept}
                loading={saving}
                variant="primary"
                size="lg"
                icon={<Icon name="Check" size={20} color={theme.primaryText} />}
              />
              <Button
                title="Regenerate"
                onPress={handleRegenerate}
                variant="secondary"
                size="lg"
                icon={<Icon name="RefreshCw" size={20} color={theme.primary} />}
              />
              <Button
                title="Edit Manually"
                onPress={handleEditManually}
                variant="outline"
                size="lg"
                icon={<Icon name="Edit" size={20} color={theme.primary} />}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Input phase
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: space.lg, paddingBottom: space.xl }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ marginBottom: space.lg }}>
            <Typography variant="heading1" color={theme.textPrimary}>
              Build Your Split with AI
            </Typography>
            <Typography
              variant="body"
              color={theme.textSecondary}
              style={{ marginTop: space.xs }}
            >
              Describe your situation and goals, and AI will create a personalized workout plan for
              you.
            </Typography>
          </View>

          {/* Description Input */}
          <Card shadow="sm" style={{ padding: space.lg, marginBottom: space.lg }}>
            <Typography variant="label" color={theme.textSecondary} style={{ marginBottom: space.sm }}>
              ADDITIONAL NOTES (OPTIONAL)
            </Typography>
            <Input
              value={description}
              onChangeText={setDescription}
              placeholder="Injuries, exercise preferences, or anything not captured above..."
              multiline
              numberOfLines={6}
              containerStyle={{ marginBottom: 0 }}
            />
          </Card>

          {/* Error Message */}
          {error && (
            <Card
              style={{
                padding: space.md,
                marginBottom: space.lg,
                backgroundColor: theme.errorBg,
                borderColor: theme.error,
                borderWidth: 1,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                <Icon name="AlertCircle" size={18} color={theme.error} />
                <Typography variant="body" color={theme.errorText}>
                  {error}
                </Typography>
              </View>
            </Card>
          )}

          {/* Generate Button */}
          <Button
            title="Generate Split"
            onPress={handleGenerate}
            variant="primary"
            size="lg"
            icon={<Icon name="Sparkles" size={20} color={theme.primaryText} />}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
