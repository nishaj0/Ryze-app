import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity, Switch, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../../store/authStore";
import { updateProfile } from "../../api/auth";
import { Typography, Card, Icon } from "../../components";
import { lightTheme } from "../../theme/colors";
import { space, radius } from "../../theme/spacing";

export default function SettingsScreen() {
  const { user, updateUser } = useAuthStore();
  const [units, setUnits] = useState(user?.units || "kg");
  const [weeklyCheckin, setWeeklyCheckin] = useState(user?.weeklyCheckin ?? true);

  const handleUnitsChange = async (newUnits: string) => {
    setUnits(newUnits);
    try {
      await updateProfile({ units: newUnits });
      updateUser({ units: newUnits });
    } catch (err) {
      Alert.alert("Error", "Failed to update units");
      setUnits(units);
    }
  };

  const handleWeeklyCheckinChange = async (value: boolean) => {
    setWeeklyCheckin(value);
    try {
      await updateProfile({ weeklyCheckin: value });
      updateUser({ weeklyCheckin: value });
    } catch (err) {
      Alert.alert("Error", "Failed to update preferences");
      setWeeklyCheckin(weeklyCheckin);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: lightTheme.bg }} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: space.lg, paddingBottom: space.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ marginBottom: space.xl }}>
          <Typography variant="caption" color={lightTheme.textMuted} weight="600">
            PREFERENCES
          </Typography>
          <Typography variant="heading1" color={lightTheme.textPrimary} style={{ marginTop: space.xs }}>
            Settings
          </Typography>
        </View>

        {/* Units */}
        <Card shadow="sm" style={{ padding: space.lg, marginBottom: space.lg }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.md }}>
            <Icon name="Scale" size={16} color={lightTheme.textMuted} />
            <Typography variant="caption" color={lightTheme.textMuted} weight="700">
              UNITS
            </Typography>
          </View>
          <View style={{ flexDirection: "row", gap: space.md }}>
            {(["kg", "lbs"] as const).map((u) => {
              const isSelected = units === u;
              return (
                <TouchableOpacity
                  key={u}
                  onPress={() => handleUnitsChange(u)}
                  style={{ flex: 1 }}
                  activeOpacity={0.8}
                >
                  <Card
                    shadow={isSelected ? "sm" : "none"}
                    style={{
                      padding: space.md,
                      backgroundColor: isSelected ? lightTheme.primaryLight : lightTheme.surfaceSecondary,
                      borderColor: isSelected ? lightTheme.primary : lightTheme.border,
                      borderWidth: isSelected ? 2 : 1,
                    }}
                  >
                    <View style={{ alignItems: "center" }}>
                      <Typography
                        variant="heading3"
                        color={isSelected ? lightTheme.primary : lightTheme.textPrimary}
                      >
                        {u === "kg" ? "Kilograms" : "Pounds"}
                      </Typography>
                      <Typography variant="caption" color={lightTheme.textMuted}>
                        {u}
                      </Typography>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Notifications */}
        <Card shadow="sm" style={{ padding: space.lg, marginBottom: space.lg }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.md }}>
            <Icon name="Bell" size={16} color={lightTheme.textMuted} />
            <Typography variant="caption" color={lightTheme.textMuted} weight="700">
              NOTIFICATIONS
            </Typography>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: 2 }}>
                <Icon name="Calendar" size={14} color={lightTheme.textPrimary} />
                <Typography variant="body" color={lightTheme.textPrimary} weight="600">
                  Weekly Check-in
                </Typography>
              </View>
              <Typography variant="caption" color={lightTheme.textMuted} style={{ marginLeft: 22 }}>
                Remind to log weight & photos
              </Typography>
            </View>
            <Switch
              value={weeklyCheckin}
              onValueChange={handleWeeklyCheckinChange}
              trackColor={{ false: lightTheme.surfaceTertiary, true: lightTheme.primary }}
              thumbColor={lightTheme.surface}
            />
          </View>
        </Card>

        {/* About */}
        <Card shadow="sm" style={{ padding: space.lg }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.md }}>
            <Icon name="Info" size={16} color={lightTheme.textMuted} />
            <Typography variant="caption" color={lightTheme.textMuted} weight="700">
              ABOUT
            </Typography>
          </View>

          <View style={{ gap: space.md }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body" color={lightTheme.textSecondary}>
                App
              </Typography>
              <Typography variant="body" color={lightTheme.textPrimary} weight="600">
                Ryze
              </Typography>
            </View>
            <View style={{ height: 1, backgroundColor: lightTheme.border }} />
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body" color={lightTheme.textSecondary}>
                Version
              </Typography>
              <Typography variant="body" color={lightTheme.textPrimary} weight="600">
                1.0.0
              </Typography>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
