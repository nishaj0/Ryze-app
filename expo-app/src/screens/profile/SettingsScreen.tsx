import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity, Switch, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../../store/authStore";
import { updateProfile } from "../../api/auth";
import { Typography, Card, Icon } from "../../components";
import { useTheme, useThemeMode } from "../../theme/themeStore";
import { space, radius } from "../../theme/spacing";

export default function SettingsScreen() {
  const { user, updateUser } = useAuthStore();
  const theme = useTheme();
  const { mode, setMode } = useThemeMode();
  const [units, setUnits] = useState(user?.units || "kg");
  const [weeklyCheckin, setWeeklyCheckin] = useState(user?.weeklyCheckin ?? true);
  const [reminderTime, setReminderTime] = useState(user?.reminderTime || "08:00");

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

  const handleReminderTimeChange = async (time: string) => {
    setReminderTime(time);
    try {
      await updateProfile({ reminderTime: time });
      updateUser({ reminderTime: time });
    } catch (err) {
      Alert.alert("Error", "Failed to update reminder time");
      setReminderTime(user?.reminderTime || "08:00");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: space.lg, paddingBottom: space.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ marginBottom: space.xl }}>
          <Typography variant="caption" color={theme.textMuted} weight="600">
            PREFERENCES
          </Typography>
          <Typography variant="heading1" color={theme.textPrimary} style={{ marginTop: space.xs }}>
            Settings
          </Typography>
        </View>

        {/* Units */}
        <Card shadow="sm" style={{ padding: space.lg, marginBottom: space.lg }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.md }}>
            <Icon name="Scale" size={16} color={theme.textMuted} />
            <Typography variant="caption" color={theme.textMuted} weight="700">
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
                      backgroundColor: isSelected ? theme.primaryLight : theme.surfaceSecondary,
                      borderColor: isSelected ? theme.primary : theme.border,
                      borderWidth: isSelected ? 2 : 1,
                    }}
                  >
                    <View style={{ alignItems: "center" }}>
                      <Typography
                        variant="heading3"
                        color={isSelected ? theme.primary : theme.textPrimary}
                      >
                        {u === "kg" ? "Kilograms" : "Pounds"}
                      </Typography>
                      <Typography variant="caption" color={theme.textMuted}>
                        {u}
                      </Typography>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Theme */}
        <Card shadow="sm" style={{ padding: space.lg, marginBottom: space.lg }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.md }}>
            <Icon name="Palette" size={16} color={theme.textMuted} />
            <Typography variant="caption" color={theme.textMuted} weight="700">
              APPEARANCE
            </Typography>
          </View>
          <View style={{ flexDirection: "row", gap: space.md }}>
            {(["light", "dark"] as const).map((m) => {
              const isSelected = mode === m;
              return (
                <TouchableOpacity
                  key={m}
                  onPress={() => setMode(m)}
                  style={{ flex: 1 }}
                  activeOpacity={0.8}
                >
                  <Card
                    shadow={isSelected ? "sm" : "none"}
                    style={{
                      padding: space.md,
                      backgroundColor: isSelected ? theme.primaryLight : theme.surfaceSecondary,
                      borderColor: isSelected ? theme.primary : theme.border,
                      borderWidth: isSelected ? 2 : 1,
                    }}
                  >
                    <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "center", gap: space.sm }}>
                      <Icon name={m === "light" ? "Sun" : "Moon"} size={18} color={isSelected ? theme.primary : theme.textSecondary} />
                      <Typography
                        variant="body"
                        color={isSelected ? theme.primary : theme.textPrimary}
                        weight="600"
                      >
                        {m === "light" ? "Chalk" : "Iron"}
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
            <Icon name="Bell" size={16} color={theme.textMuted} />
            <Typography variant="caption" color={theme.textMuted} weight="700">
              NOTIFICATIONS
            </Typography>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: 2 }}>
                <Icon name="Calendar" size={14} color={theme.textPrimary} />
                <Typography variant="body" color={theme.textPrimary} weight="600">
                  Weekly Check-in
                </Typography>
              </View>
              <Typography variant="caption" color={theme.textMuted} style={{ marginLeft: 22 }}>
                Remind to log weight & photos
              </Typography>
            </View>
            <Switch
              value={weeklyCheckin}
              onValueChange={handleWeeklyCheckinChange}
              trackColor={{ false: theme.surfaceTertiary, true: theme.primary }}
              thumbColor={theme.surface}
            />
          </View>

          <View style={{ height: 1, backgroundColor: theme.border, marginVertical: space.md }} />

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: 2 }}>
                <Icon name="Clock" size={14} color={theme.textPrimary} />
                <Typography variant="body" color={theme.textPrimary} weight="600">
                  Reminder Time
                </Typography>
              </View>
              <Typography variant="caption" color={theme.textMuted} style={{ marginLeft: 22 }}>
                Daily workout reminder notification
              </Typography>
            </View>
            <TouchableOpacity
              onPress={() => {
                Alert.prompt(
                  "Workout Reminder Time",
                  "Enter notification time (HH:MM in 24h format):",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Save",
                      onPress: (val) => {
                        const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
                        if (val && regex.test(val)) {
                          handleReminderTimeChange(val);
                        } else {
                          Alert.alert("Invalid Time", "Please enter in HH:MM 24-hour format (e.g. 08:30 or 17:00).");
                        }
                      }
                    }
                  ],
                  "plain-text",
                  reminderTime
                );
              }}
              style={{
                backgroundColor: theme.surfaceSecondary,
                borderColor: theme.border,
                borderWidth: 1,
                borderRadius: radius.md,
                paddingHorizontal: space.md,
                paddingVertical: space.sm,
              }}
            >
              <Typography variant="body" color={theme.textPrimary} weight="700">
                {reminderTime}
              </Typography>
            </TouchableOpacity>
          </View>
        </Card>

        {/* About */}
        <Card shadow="sm" style={{ padding: space.lg }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.md }}>
            <Icon name="Info" size={16} color={theme.textMuted} />
            <Typography variant="caption" color={theme.textMuted} weight="700">
              ABOUT
            </Typography>
          </View>

          <View style={{ gap: space.md }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body" color={theme.textSecondary}>
                App
              </Typography>
              <Typography variant="body" color={theme.textPrimary} weight="600">
                Ryze
              </Typography>
            </View>
            <View style={{ height: 1, backgroundColor: theme.border }} />
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body" color={theme.textSecondary}>
                Version
              </Typography>
              <Typography variant="body" color={theme.textPrimary} weight="600">
                1.0.0
              </Typography>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
