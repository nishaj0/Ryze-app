import React, { useEffect, useState, useCallback } from "react";
import { View, TouchableOpacity, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../store/authStore";
import { getActiveSplit } from "../../api/splits";
import { deleteAccount } from "../../api/auth";
import { getAppSettings, AppSettings } from "../../api/app";
import { getMyTickets } from "../../api/support";
import { UserSplit } from "../../types";
import { Screen, Typography, Card, Button, Icon, ProfileScreenSkeleton, IconName } from "../../components";
import { useTheme } from "../../theme/themeStore";
import { space } from "../../theme/spacing";

type Props = NativeStackScreenProps<ProfileStackParamList, "ProfileMain">;

export default function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuthStore();
  const theme = useTheme();
  const [userSplit, setUserSplit] = useState<UserSplit | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [hasTickets, setHasTickets] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [splitRes, settingsRes, ticketsRes] = await Promise.all([
        getActiveSplit(),
        getAppSettings().catch(() => null),
        getMyTickets().catch(() => []),
      ]);
      setUserSplit(splitRes.userSplit);
      setAppSettings(settingsRes);
      setHasTickets(ticketsRes && ticketsRes.length > 0);
    } catch (err) {
      console.error("[ProfileScreen] Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation, loadData]);

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and ALL associated data, including:\n\n\u2022 Workout history & session logs\n\u2022 Custom splits & programs\n\u2022 Body metrics & progress photos\n\u2022 Personal records\n\u2022 Check-ins & AI suggestions\n\u2022 Nutrition logs & notifications\n\nThis action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Forever",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccount();
              await logout();
            } catch (err) {
              Alert.alert("Error", "Failed to delete account. Please try again.");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <Screen scroll padding="none">
        <ProfileScreenSkeleton />
      </Screen>
    );
  }

  interface MenuItem {
    label: string;
    icon: IconName;
    onPress: () => void;
  }

  const menuItems: MenuItem[] = [
    { label: "Edit Profile", icon: "User", onPress: () => navigation.navigate("EditProfile") },
    { label: "Ryze Coach", icon: "Sparkles", onPress: () => navigation.navigate("CoachChat") },
    { label: "Browse Exercises", icon: "Dumbbell", onPress: () => navigation.navigate("AllExercises") },
    { label: "Workout History", icon: "Calendar", onPress: () => (navigation as any).navigate("Home", { screen: "WorkoutHistory" }) },
    { label: "Switch Split", icon: "Repeat", onPress: () => navigation.navigate("SplitSwitcher") },
    { label: "Body Metrics", icon: "Ruler", onPress: () => navigation.navigate("Metrics") },
  ];

  if (!appSettings || appSettings.bugReportingEnabled) {
    menuItems.push({ label: "Report Bug", icon: "AlertTriangle", onPress: () => navigation.navigate("ReportBug") });
  }

  if (!appSettings || appSettings.helpRequestsEnabled) {
    menuItems.push({ label: "Request Help", icon: "HelpCircle", onPress: () => navigation.navigate("RequestHelp") });
  }

  if (hasTickets || !appSettings || appSettings.bugReportingEnabled || appSettings.helpRequestsEnabled) {
    menuItems.push({ label: "My Tickets", icon: "MessageSquare", onPress: () => navigation.navigate("MyTickets") });
  }

  menuItems.push({ label: "Settings", icon: "Settings", onPress: () => navigation.navigate("Settings") });

  return (
    <Screen scroll padding="lg">
      {/* Profile Header */}
      <View style={{ alignItems: "center", marginBottom: space.lg }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: theme.primary,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: space.md,
          }}
        >
          <Typography variant="display" color={theme.primaryText} style={{ fontSize: 32 }}>
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </Typography>
        </View>
        <Typography variant="heading2" color={theme.textPrimary}>
          {user?.name || "User"}
        </Typography>
        <Typography variant="body" color={theme.textSecondary} style={{ marginTop: space.xs }}>
          {user?.email}
        </Typography>
      </View>

      {/* Current Split Card */}
      {userSplit && (
        <Card shadow="sm" style={{ marginBottom: space.lg }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: space.sm }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
              <Icon name="Calendar" size={18} color={theme.textMuted} />
              <Typography variant="caption" color={theme.textMuted}>
                CURRENT SPLIT
              </Typography>
            </View>
            {!userSplit.split.isPrebuilt && (
              <TouchableOpacity
                onPress={() => navigation.navigate("CustomSplit", { splitId: userSplit.splitId })}
                style={{ padding: 4 }}
              >
                <Icon name="Pencil" size={18} color={theme.primary} />
              </TouchableOpacity>
            )}
            {userSplit.split.isPrebuilt && (
              <TouchableOpacity
                onPress={() => navigation.navigate("CustomSplit", { splitId: userSplit.splitId, fromPrebuilt: true })}
                style={{ padding: 4 }}
              >
                <Icon name="Pencil" size={18} color={theme.primary} />
              </TouchableOpacity>
            )}
          </View>
          <Typography variant="heading3" color={theme.textPrimary}>
            {userSplit.split.name}
          </Typography>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginTop: space.sm }}>
            <Icon name="Clock" size={14} color={theme.textMuted} />
            <Typography variant="caption" color={theme.textMuted}>
              {userSplit.split.daysPerWeek} days/week
            </Typography>
          </View>
        </Card>
      )}

      {/* Menu */}
      <Card shadow="sm" style={{ marginBottom: space.lg, padding: 0 }}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={item.label}
            onPress={item.onPress}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: space.md,
              borderBottomWidth: index < menuItems.length - 1 ? 1 : 0,
              borderBottomColor: theme.border,
              gap: space.md,
            }}
          >
            <Icon name={item.icon} size={20} color={theme.textSecondary} />
            <Typography variant="body" color={theme.textPrimary} style={{ flex: 1 }}>
              {item.label}
            </Typography>
            <Icon name="ChevronRight" size={20} color={theme.textMuted} />
          </TouchableOpacity>
        ))}
      </Card>

      {/* Actions */}
      <View style={{ gap: space.md }}>
        <Button
          title="Log Out"
          onPress={logout}
          variant="secondary"
          size="md"
          icon={<Icon name="LogOut" size={20} color={theme.secondaryText} />}
        />
        <Button
          title="Delete Account"
          onPress={handleDeleteAccount}
          variant="danger"
          size="sm"
        />
      </View>
    </Screen>
  );
}
