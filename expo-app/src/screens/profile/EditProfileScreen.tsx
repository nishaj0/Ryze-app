import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../store/authStore";
import { updateProfile } from "../../api/auth";
import { Typography, Card, Button, Icon, Input } from "../../components";
import { lightTheme } from "../../theme/colors";
import { space, radius } from "../../theme/spacing";

type Props = NativeStackScreenProps<ProfileStackParamList, "EditProfile">;

const goals = [
  { value: "MUSCLE_GAIN", label: "Build Muscle", icon: "Dumbbell" as const },
  { value: "WEIGHT_LOSS", label: "Lose Weight", icon: "Flame" as const },
  { value: "GET_FIT", label: "Get Fit", icon: "Activity" as const },
  { value: "MAINTAIN", label: "Maintain", icon: "Scale" as const },
];

const genders = [
  { value: "MALE", label: "Male", icon: "User" as const },
  { value: "FEMALE", label: "Female", icon: "User" as const },
  { value: "OTHER", label: "Other", icon: "Users" as const },
];

const experienceLevels = [
  { value: "BEGINNER", label: "Beginner", icon: "Sprout" as const },
  { value: "INTERMEDIATE", label: "Intermediate", icon: "TreePine" as const },
  { value: "ADVANCED", label: "Advanced", icon: "Mountain" as const },
];

const equipmentOptions = [
  { value: "FULL_GYM", label: "Full Gym", icon: "Dumbbell" as const },
  { value: "HOME", label: "Home", icon: "Home" as const },
  { value: "LIMITED", label: "Limited", icon: "CircleDot" as const },
];

export default function EditProfileScreen({ navigation }: Props) {
  const { user, updateUser } = useAuthStore();
  const [name, setName] = useState(user?.name || "");
  const [goal, setGoal] = useState(user?.goal || "GET_FIT");
  const [weight, setWeight] = useState(String(user?.currentWeight || ""));
  const [height, setHeight] = useState(String(user?.height || ""));
  const [sleep, setSleep] = useState(String(user?.sleepHours || ""));
  const [gender, setGender] = useState(user?.gender || "OTHER");
  const [experienceLevel, setExperienceLevel] = useState(user?.experienceLevel || "BEGINNER");
  const [daysAvailable, setDaysAvailable] = useState(user?.daysAvailable || 3);
  const [equipmentAccess, setEquipmentAccess] = useState(user?.equipmentAccess || "FULL_GYM");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: any = {
        name,
        goal,
        gender,
        experienceLevel,
        daysAvailable,
        equipmentAccess,
      };
      if (weight) updates.currentWeight = parseFloat(weight);
      if (height) updates.height = parseFloat(height);
      if (sleep) updates.sleepHours = parseFloat(sleep);

      await updateProfile(updates);
      updateUser(updates);
      Alert.alert("Success", "Profile updated", [{ text: "OK", onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: lightTheme.bg }} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: space.lg, paddingBottom: space.xl }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={{ marginBottom: space.xl }}>
          <Typography variant="caption" color={lightTheme.textMuted} weight="600">
            EDIT YOUR PROFILE
          </Typography>
          <Typography variant="heading1" color={lightTheme.textPrimary} style={{ marginTop: space.xs }}>
            Edit Profile
          </Typography>
        </View>

        <View style={{ gap: space.lg }}>
          <Input
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            icon={<Icon name="User" size={20} color={lightTheme.textMuted} />}
          />

          <View>
            <Typography variant="label" color={lightTheme.textSecondary} style={{ marginBottom: space.sm }}>
              GOAL
            </Typography>
            <View style={{ gap: space.sm }}>
              {goals.map((g) => {
                const isSelected = goal === g.value;
                return (
                  <TouchableOpacity
                    key={g.value}
                    onPress={() => setGoal(g.value)}
                    activeOpacity={0.8}
                  >
                    <Card
                      shadow={isSelected ? "sm" : "none"}
                      style={{
                        padding: space.md,
                        backgroundColor: isSelected ? lightTheme.primaryLight : lightTheme.surface,
                        borderColor: isSelected ? lightTheme.primary : lightTheme.border,
                        borderWidth: isSelected ? 2 : 1,
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: radius.md,
                            backgroundColor: isSelected ? lightTheme.primary : lightTheme.surfaceSecondary,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Icon name={g.icon} size={20} color={isSelected ? lightTheme.primaryText : lightTheme.textSecondary} />
                        </View>
                        <Typography variant="body" color={isSelected ? lightTheme.primary : lightTheme.textPrimary} weight="600">
                          {g.label}
                        </Typography>
                        {isSelected && (
                          <View style={{ marginLeft: "auto" }}><Icon name="CheckCircle2" size={20} color={lightTheme.primary} /></View>
                        )}
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: space.md }}>
            <View style={{ flex: 1 }}>
              <Input
                label="Weight (kg)"
                value={weight}
                onChangeText={setWeight}
                placeholder="70"
                keyboardType="decimal-pad"
                containerStyle={{ marginBottom: 0 }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Height (cm)"
                value={height}
                onChangeText={setHeight}
                placeholder="175"
                keyboardType="decimal-pad"
                containerStyle={{ marginBottom: 0 }}
              />
            </View>
          </View>

          <Input
            label="Sleep (hours/night)"
            value={sleep}
            onChangeText={setSleep}
            placeholder="8"
            keyboardType="decimal-pad"
            icon={<Icon name="Moon" size={20} color={lightTheme.textMuted} />}
          />

          <View>
            <Typography variant="label" color={lightTheme.textSecondary} style={{ marginBottom: space.sm }}>
              GENDER
            </Typography>
            <View style={{ flexDirection: "row", gap: space.sm }}>
              {genders.map((g) => {
                const isSelected = gender === g.value;
                return (
                  <TouchableOpacity
                    key={g.value}
                    onPress={() => setGender(g.value)}
                    activeOpacity={0.8}
                    style={{ flex: 1 }}
                  >
                    <Card
                      shadow={isSelected ? "sm" : "none"}
                      style={{
                        padding: space.md,
                        backgroundColor: isSelected ? lightTheme.primaryLight : lightTheme.surface,
                        borderColor: isSelected ? lightTheme.primary : lightTheme.border,
                        borderWidth: isSelected ? 2 : 1,
                      }}
                    >
                      <View style={{ alignItems: "center" }}>
                        <Icon name={g.icon} size={20} color={isSelected ? lightTheme.primary : lightTheme.textSecondary} />
                        <Typography
                          variant="caption"
                          color={isSelected ? lightTheme.primary : lightTheme.textPrimary}
                          weight="600"
                          style={{ marginTop: space.xs }}
                        >
                          {g.label}
                        </Typography>
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View>
            <Typography variant="label" color={lightTheme.textSecondary} style={{ marginBottom: space.sm }}>
              EXPERIENCE LEVEL
            </Typography>
            <View style={{ gap: space.sm }}>
              {experienceLevels.map((exp) => {
                const isSelected = experienceLevel === exp.value;
                return (
                  <TouchableOpacity
                    key={exp.value}
                    onPress={() => setExperienceLevel(exp.value)}
                    activeOpacity={0.8}
                  >
                    <Card
                      shadow={isSelected ? "sm" : "none"}
                      style={{
                        padding: space.md,
                        backgroundColor: isSelected ? lightTheme.primaryLight : lightTheme.surface,
                        borderColor: isSelected ? lightTheme.primary : lightTheme.border,
                        borderWidth: isSelected ? 2 : 1,
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: radius.md,
                            backgroundColor: isSelected ? lightTheme.primary : lightTheme.surfaceSecondary,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Icon name={exp.icon} size={18} color={isSelected ? lightTheme.primaryText : lightTheme.textSecondary} />
                        </View>
                        <Typography variant="body" color={isSelected ? lightTheme.primary : lightTheme.textPrimary} weight="600">
                          {exp.label}
                        </Typography>
                        {isSelected && (
                          <View style={{ marginLeft: "auto" }}><Icon name="CheckCircle2" size={20} color={lightTheme.primary} /></View>
                        )}
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View>
            <Typography variant="label" color={lightTheme.textSecondary} style={{ marginBottom: space.sm }}>
              DAYS PER WEEK
            </Typography>
            <View style={{ flexDirection: "row", gap: space.xs, flexWrap: "wrap" }}>
              {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                const isSelected = daysAvailable === d;
                return (
                  <TouchableOpacity
                    key={d}
                    onPress={() => setDaysAvailable(d)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: isSelected ? lightTheme.primary : lightTheme.surfaceSecondary,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: isSelected ? 0 : 1,
                        borderColor: lightTheme.border,
                      }}
                    >
                      <Typography
                        variant="body"
                        color={isSelected ? lightTheme.primaryText : lightTheme.textPrimary}
                        weight="700"
                      >
                        {d}
                      </Typography>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View>
            <Typography variant="label" color={lightTheme.textSecondary} style={{ marginBottom: space.sm }}>
              EQUIPMENT ACCESS
            </Typography>
            <View style={{ gap: space.sm }}>
              {equipmentOptions.map((eq) => {
                const isSelected = equipmentAccess === eq.value;
                return (
                  <TouchableOpacity
                    key={eq.value}
                    onPress={() => setEquipmentAccess(eq.value)}
                    activeOpacity={0.8}
                  >
                    <Card
                      shadow={isSelected ? "sm" : "none"}
                      style={{
                        padding: space.md,
                        backgroundColor: isSelected ? lightTheme.primaryLight : lightTheme.surface,
                        borderColor: isSelected ? lightTheme.primary : lightTheme.border,
                        borderWidth: isSelected ? 2 : 1,
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: radius.md,
                            backgroundColor: isSelected ? lightTheme.primary : lightTheme.surfaceSecondary,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Icon name={eq.icon} size={18} color={isSelected ? lightTheme.primaryText : lightTheme.textSecondary} />
                        </View>
                        <Typography variant="body" color={isSelected ? lightTheme.primary : lightTheme.textPrimary} weight="600">
                          {eq.label}
                        </Typography>
                        {isSelected && (
                          <View style={{ marginLeft: "auto" }}><Icon name="CheckCircle2" size={20} color={lightTheme.primary} /></View>
                        )}
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        <View style={{ marginTop: space.xl }}>
          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            variant="primary"
            size="lg"
            icon={<Icon name="Save" size={20} color={lightTheme.primaryText} />}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
