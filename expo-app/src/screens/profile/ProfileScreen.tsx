import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../store/authStore";
import { getActiveSplit } from "../../api/splits";
import { deleteAccount } from "../../api/auth";
import { UserSplit } from "../../types";
import { Screen, Typography, Card, Button, Icon, ProfileScreenSkeleton } from "../../components";
import { useTheme } from "../../theme/themeStore";
import { space } from "../../theme/spacing";

type Props = NativeStackScreenProps<ProfileStackParamList, "ProfileMain">;

export default function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuthStore();
  const theme = useTheme();
  const [userSplit, setUserSplit] = useState<UserSplit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSplit();
  }, []);

  const loadSplit = async () => {
    try {
      const res = await getActiveSplit();
      setUserSplit(res.userSplit);
    } catch (err) {}
    finally { setLoading(false); }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. All your data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccount();
              await logout();
            } catch (err) {
              Alert.alert("Error", "Failed to delete account");
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

  const menuItems = [
    { label: "Edit Profile", icon: "User" as const, onPress: () => navigation.navigate("EditProfile") },
    { label: "Browse Exercises", icon: "Dumbbell" as const, onPress: () => navigation.navigate("AllExercises") },
    { label: "Workout History", icon: "Calendar" as const, onPress: () => (navigation as any).navigate("Home", { screen: "WorkoutHistory" }) },
    { label: "Switch Split", icon: "Repeat" as const, onPress: () => navigation.navigate("SplitSwitcher") },
    { label: "Body Metrics", icon: "Ruler" as const, onPress: () => navigation.navigate("Metrics") },
    { label: "Settings", icon: "Settings" as const, onPress: () => navigation.navigate("Settings") },
  ];

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
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.sm }}>
            <Icon name="Calendar" size={18} color={theme.textMuted} />
            <Typography variant="caption" color={theme.textMuted}>
              CURRENT SPLIT
            </Typography>
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
