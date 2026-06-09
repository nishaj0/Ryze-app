import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../store/authStore";
import { getActiveSplit } from "../../api/splits";
import { deleteAccount } from "../../api/auth";
import { UserSplit } from "../../types";

type Props = NativeStackScreenProps<ProfileStackParamList, "ProfileMain">;

export default function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuthStore();
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
    return <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0F172A" }}><ActivityIndicator color="#6366F1" /></View>;
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0F172A" }} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
      <View style={{ alignItems: "center", marginBottom: 32 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "#6366F1", justifyContent: "center", alignItems: "center", marginBottom: 16 }}>
          <Text style={{ color: "#fff", fontSize: 32, fontWeight: "bold" }}>{user?.name?.charAt(0)?.toUpperCase() || "U"}</Text>
        </View>
        <Text style={{ color: "#fff", fontSize: 24, fontWeight: "bold" }}>{user?.name || "User"}</Text>
        <Text style={{ color: "#94A3B8", fontSize: 14, marginTop: 4 }}>{user?.email}</Text>
      </View>

      {userSplit && (
        <View style={{ backgroundColor: "#1E293B", borderRadius: 16, padding: 16, marginBottom: 24 }}>
          <Text style={{ color: "#94A3B8", fontSize: 12, marginBottom: 4 }}>Current Split</Text>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600" }}>{userSplit.split.name}</Text>
          <Text style={{ color: "#94A3B8", fontSize: 14, marginTop: 4 }}>{userSplit.split.daysPerWeek} days/week</Text>
        </View>
      )}

      <View style={{ backgroundColor: "#1E293B", borderRadius: 16, marginBottom: 24 }}>
        <TouchableOpacity onPress={() => navigation.navigate("EditProfile")} style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#334155" }}>
          <Text style={{ color: "#fff", fontSize: 16 }}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("SplitSwitcher")} style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#334155" }}>
          <Text style={{ color: "#fff", fontSize: 16 }}>Switch Split</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Metrics")} style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#334155" }}>
          <Text style={{ color: "#fff", fontSize: 16 }}>Body Metrics</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Settings")} style={{ padding: 16 }}>
          <Text style={{ color: "#fff", fontSize: 16 }}>Settings</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={logout}
        style={{ backgroundColor: "#334155", borderRadius: 12, padding: 16, alignItems: "center", marginBottom: 12 }}
      >
        <Text style={{ color: "#94A3B8", fontSize: 16 }}>Log Out</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleDeleteAccount}
        style={{ backgroundColor: "#1E293B", borderRadius: 12, padding: 16, alignItems: "center" }}
      >
        <Text style={{ color: "#EF4444", fontSize: 14 }}>Delete Account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
