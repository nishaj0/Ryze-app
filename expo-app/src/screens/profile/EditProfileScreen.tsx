import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
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

export default function EditProfileScreen({ navigation }: Props) {
  const { user, updateUser } = useAuthStore();
  const [name, setName] = useState(user?.name || "");
  const [goal, setGoal] = useState(user?.goal || "GET_FIT");
  const [weight, setWeight] = useState(String(user?.currentWeight || ""));
  const [height, setHeight] = useState(String(user?.height || ""));
  const [sleep, setSleep] = useState(String(user?.sleepHours || ""));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: any = { name };
      if (goal) updates.goal = goal;
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
