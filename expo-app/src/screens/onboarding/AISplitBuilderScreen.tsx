import React, { useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../../navigation/types";
import { generateAISplit } from "../../api/splits";
import { createSplit, setActiveSplit } from "../../api/splits";
import { completeOnboarding } from "../../api/onboarding";
import { useOnboarding } from "./OnboardingContext";
import { useAuthStore } from "../../store/authStore";
import { Typography, Card, Button, Input, Icon } from "../../components";
import { useTheme } from "../../theme/themeStore";
import { space, radius } from "../../theme/spacing";

type Props = NativeStackScreenProps<OnboardingStackParamList, "AISplitBuilder">;

const EQUIPMENT_OPTIONS = [
  { label: "Full Gym", value: "barbell" },
  { label: "Home Gym", value: "dumbbell" },
  { label: "Bodyweight", value: "body only" },
];

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
  const { setAuth, token } = useAuthStore();

  const [description, setDescription] = useState("");
  const [equipmentFilter, setEquipmentFilter] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatedSplit, setGeneratedSplit] = useState<GeneratedSplit | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleEquipment = (value: string) => {
    setEquipmentFilter((prev) =>
      prev.includes(value) ? prev.filter((e) => e !== value) : [...prev, value]
    );
  };

  const handleGenerate = async () => {
    if (!description.trim()) {
      Alert.alert("Description Required", "Please describe your situation and goals.");
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedSplit(null);
    setWarnings([]);

    try {
      const result = await generateAISplit(
        description,
        equipmentFilter.length > 0 ? equipmentFilter : undefined
      );
      setGeneratedSplit(result.split);
      setWarnings(result.warnings);
    } catch (err: any) {
      const message = err.response?.data?.error || "Failed to generate split. Please try again.";
      setError(message);
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

      await setAuth(token!, onboardingRes.user);
    } catch (err: any) {
      const message = err.response?.data?.error || "Failed to save split. Please try again.";
      Alert.alert("Error", message);
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
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: space.xl }}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Typography
            variant="heading3"
            color={theme.textPrimary}
            style={{ marginTop: space.lg }}
          >
            Building your split...
          </Typography>
          <Typography
            variant="body"
            color={theme.textSecondary}
            style={{ marginTop: space.sm, textAlign: "center" }}
          >
            AI is analyzing your requirements and creating a personalized workout plan.
          </Typography>
        </View>
      </SafeAreaView>
    );
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
              DESCRIBE YOUR SITUATION
            </Typography>
            <Input
              value={description}
              onChangeText={setDescription}
              placeholder="e.g., I have 4 days per week, full gym access, want to build muscle, no injuries..."
              multiline
              numberOfLines={6}
              containerStyle={{ marginBottom: 0 }}
            />
          </Card>

          {/* Equipment Filter */}
          <Card shadow="sm" style={{ padding: space.lg, marginBottom: space.lg }}>
            <Typography variant="label" color={theme.textSecondary} style={{ marginBottom: space.sm }}>
              EQUIPMENT ACCESS (OPTIONAL)
            </Typography>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
              {EQUIPMENT_OPTIONS.map((option) => {
                const isSelected = equipmentFilter.includes(option.value);
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => toggleEquipment(option.value)}
                    style={{
                      backgroundColor: isSelected ? theme.primary : theme.surfaceSecondary,
                      paddingHorizontal: space.md,
                      paddingVertical: space.sm,
                      borderRadius: radius.full,
                      borderWidth: 1,
                      borderColor: isSelected ? theme.primary : theme.border,
                    }}
                  >
                    <Typography
                      variant="bodySmall"
                      color={isSelected ? theme.primaryText : theme.textPrimary}
                      weight="600"
                    >
                      {option.label}
                    </Typography>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Typography
              variant="bodySmall"
              color={theme.textMuted}
              style={{ marginTop: space.sm }}
            >
              Select equipment types to filter the exercise library
            </Typography>
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
