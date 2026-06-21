import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../../navigation/types";
import { requestExercise } from "../../api/exercises";
import { Typography, Card, Button, Icon, Input } from "../../components";
import { useTheme } from "../../theme/themeStore";
import { space, radius } from "../../theme/spacing";

type Props = NativeStackScreenProps<ProfileStackParamList, "RequestExercise">;

const MUSCLES = [
  "abdominals", "abductors", "adductors", "biceps", "calves", "chest",
  "forearms", "glutes", "hamstrings", "lats", "lower back", "middle back",
  "neck", "quadriceps", "shoulders", "traps", "triceps"
];

const FORCES = ["push", "pull", "static"];
const LEVELS = ["beginner", "intermediate", "expert"];
const MECHANICS = ["isolation", "compound"];
const CATEGORIES = ["strength", "cardio", "stretching", "powerlifting", "olympic weightlifting", "strongman", "plyometrics"];

export default function RequestExerciseScreen({ navigation }: Props) {
  const theme = useTheme();
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [force, setForce] = useState<string | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const [mechanic, setMechanic] = useState<string | null>(null);
  const [equipment, setEquipment] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [instructions, setInstructions] = useState("");
  const [primaryMuscles, setPrimaryMuscles] = useState<string[]>([]);
  const [secondaryMuscles, setSecondaryMuscles] = useState<string[]>([]);

  const toggleMuscle = (muscle: string, isPrimary: boolean) => {
    if (isPrimary) {
      setPrimaryMuscles((prev) =>
        prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle]
      );
    } else {
      setSecondaryMuscles((prev) =>
        prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle]
      );
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Exercise name is required");
      return;
    }

    setSubmitting(true);
    try {
      await requestExercise({
        name: name.trim(),
        description: description.trim() || undefined,
        force: force || undefined,
        level: level || undefined,
        mechanic: mechanic || undefined,
        equipment: equipment.trim() || undefined,
        category: category || undefined,
        instructions: instructions.trim() || undefined,
        primaryMuscles: primaryMuscles.length > 0 ? primaryMuscles : undefined,
        secondaryMuscles: secondaryMuscles.length > 0 ? secondaryMuscles : undefined,
      });

      Alert.alert(
        "Request Submitted",
        "Thank you! Your exercise request has been submitted. Our team will review it and add it to the database.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const renderSelectGroup = (
    label: string,
    options: string[],
    selected: string | null,
    onSelect: (value: string | null) => void
  ) => (
    <View style={{ marginBottom: space.lg }}>
      <Typography variant="caption" color={theme.textMuted} weight="700" style={{ marginBottom: space.sm }}>
        {label} (OPTIONAL)
      </Typography>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
        <TouchableOpacity
          onPress={() => onSelect(null)}
          style={{
            paddingHorizontal: space.md,
            paddingVertical: space.sm,
            borderRadius: radius.full,
            backgroundColor: !selected ? theme.primary : theme.surfaceSecondary,
            borderWidth: 1,
            borderColor: !selected ? theme.primary : theme.border,
          }}
        >
          <Typography
            variant="caption"
            color={!selected ? theme.primaryText : theme.textSecondary}
            weight="600"
          >
            None
          </Typography>
        </TouchableOpacity>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            onPress={() => onSelect(option)}
            style={{
              paddingHorizontal: space.md,
              paddingVertical: space.sm,
              borderRadius: radius.full,
              backgroundColor: selected === option ? theme.primary : theme.surfaceSecondary,
              borderWidth: 1,
              borderColor: selected === option ? theme.primary : theme.border,
            }}
          >
            <Typography
              variant="caption"
              color={selected === option ? theme.primaryText : theme.textSecondary}
              weight="600"
              style={{ textTransform: "capitalize" }}
            >
              {option}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderMuscleGroup = (label: string, muscles: string[], isPrimary: boolean) => (
    <View style={{ marginBottom: space.lg }}>
      <Typography variant="caption" color={theme.textMuted} weight="700" style={{ marginBottom: space.sm }}>
        {label} (OPTIONAL)
      </Typography>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
        {MUSCLES.map((muscle) => {
          const isSelected = muscles.includes(muscle);
          return (
            <TouchableOpacity
              key={muscle}
              onPress={() => toggleMuscle(muscle, isPrimary)}
              style={{
                paddingHorizontal: space.md,
                paddingVertical: space.sm,
                borderRadius: radius.full,
                backgroundColor: isSelected ? theme.primary : theme.surfaceSecondary,
                borderWidth: 1,
                borderColor: isSelected ? theme.primary : theme.border,
              }}
            >
              <Typography
                variant="caption"
                color={isSelected ? theme.primaryText : theme.textSecondary}
                weight="600"
                style={{ textTransform: "capitalize" }}
              >
                {muscle}
              </Typography>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: space.lg, paddingBottom: space.xl }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={{ marginBottom: space.xl }}>
          <Typography variant="caption" color={theme.textMuted} weight="600">
            REQUEST NEW EXERCISE
          </Typography>
          <Typography variant="heading1" color={theme.textPrimary} style={{ marginTop: space.xs }}>
            Help us expand our library
          </Typography>
          <Typography variant="body" color={theme.textSecondary} style={{ marginTop: space.sm }}>
            Fill in as much detail as you can. Only the name is required.
          </Typography>
        </View>

        {/* Name (Required) */}
        <View style={{ marginBottom: space.lg }}>
          <Typography variant="caption" color={theme.textMuted} weight="700" style={{ marginBottom: space.sm }}>
            EXERCISE NAME *
          </Typography>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="e.g., Bulgarian Split Squat"
            containerStyle={{ marginBottom: 0 }}
          />
        </View>

        {/* Description */}
        <View style={{ marginBottom: space.lg }}>
          <Typography variant="caption" color={theme.textMuted} weight="700" style={{ marginBottom: space.sm }}>
            DESCRIPTION / NOTES (OPTIONAL)
          </Typography>
          <Input
            value={description}
            onChangeText={setDescription}
            placeholder="Why do you want this exercise? Any additional context..."
            containerStyle={{ marginBottom: 0 }}
            multiline
            style={{ minHeight: 80 }}
          />
        </View>

        {/* Select Groups */}
        {renderSelectGroup("FORCE TYPE", FORCES, force, setForce)}
        {renderSelectGroup("DIFFICULTY LEVEL", LEVELS, level, setLevel)}
        {renderSelectGroup("MECHANIC TYPE", MECHANICS, mechanic, setMechanic)}
        {renderSelectGroup("CATEGORY", CATEGORIES, category, setCategory)}

        {/* Equipment */}
        <View style={{ marginBottom: space.lg }}>
          <Typography variant="caption" color={theme.textMuted} weight="700" style={{ marginBottom: space.sm }}>
            EQUIPMENT (OPTIONAL)
          </Typography>
          <Input
            value={equipment}
            onChangeText={setEquipment}
            placeholder="e.g., barbell, dumbbells, cable machine"
            containerStyle={{ marginBottom: 0 }}
          />
        </View>

        {/* Instructions */}
        <View style={{ marginBottom: space.lg }}>
          <Typography variant="caption" color={theme.textMuted} weight="700" style={{ marginBottom: space.sm }}>
            INSTRUCTIONS (OPTIONAL)
          </Typography>
          <Input
            value={instructions}
            onChangeText={setInstructions}
            placeholder="How to perform this exercise..."
            containerStyle={{ marginBottom: 0 }}
            multiline
            style={{ minHeight: 120 }}
          />
        </View>

        {/* Muscle Groups */}
        {renderMuscleGroup("PRIMARY MUSCLES", primaryMuscles, true)}
        {renderMuscleGroup("SECONDARY MUSCLES", secondaryMuscles, false)}

        {/* Submit Button */}
        <Button
          title="Submit Request"
          onPress={handleSubmit}
          variant="primary"
          size="lg"
          loading={submitting}
          disabled={!name.trim()}
          icon={<Icon name="Send" size={20} color={theme.primaryText} />}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
