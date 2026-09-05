import React, { useEffect, useState } from "react";
import { View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../../navigation/types";
import { listSplits, removeFromLibrary, publishSplit, unpublishSplit } from "../../api/splits";
import { UserSplit } from "../../types";
import { Typography, Card, Icon, SplitSwitcherScreenSkeleton } from "../../components";
import { useTheme } from "../../theme/themeStore";
import { space, radius } from "../../theme/spacing";

type Props = NativeStackScreenProps<ProfileStackParamList, "SplitSwitcher">;

export default function SplitSwitcherScreen({ navigation }: Props) {
  const [userSplits, setUserSplits] = useState<UserSplit[]>([]);
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadSplits();
  }, []);

  const loadSplits = async () => {
    try {
      const res = await listSplits();
      setUserSplits(res.userSplits);
    } catch (err) {
      console.error("[SplitSwitcher] load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (userSplit: UserSplit) => {
    if (userSplit.isActive) {
      Alert.alert("Choose another active split", "Activate another saved split before removing this one.");
      return;
    }
    Alert.alert(
      "Remove split",
      `Remove "${userSplit.split.name}" from your library?${userSplit.split.createdById ? " Your private copy will be deleted." : ""}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setUpdatingId(userSplit.splitId);
            try {
              await removeFromLibrary(userSplit.splitId);
              setUserSplits((current) => current.filter((item) => item.id !== userSplit.id));
            } catch (err) {
              Alert.alert("Error", "Failed to remove split");
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ]
    );
  };

  const handlePublication = async (split: UserSplit["split"]) => {
    setUpdatingId(split.id);
    try {
      if (split.visibility === "COMMUNITY") {
        await unpublishSplit(split.id);
      } else {
        await publishSplit(split.id);
      }
      await loadSplits();
    } catch (err: any) {
      Alert.alert("Could not update community sharing", err.response?.data?.error || "Please check that every training day has an exercise.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
        <SplitSwitcherScreenSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: space.lg, paddingBottom: space.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ marginBottom: space.xl, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flex: 1 }}>
            <Typography variant="caption" color={theme.textMuted} weight="600">
              YOUR LIBRARY
            </Typography>
            <Typography variant="heading1" color={theme.textPrimary} style={{ marginTop: space.xs }}>
              Switch Split
            </Typography>
            <Typography variant="body" color={theme.textSecondary} style={{ marginTop: space.xs }}>
              Saved programs stay here until you choose to activate one.
            </Typography>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate("CommunitySplits")}
            style={{
              backgroundColor: theme.surfaceTertiary,
              paddingHorizontal: space.md,
              paddingVertical: space.sm,
              borderRadius: radius.md,
              flexDirection: "row",
              alignItems: "center",
              gap: space.xs,
            }}
          >
            <Icon name="Users" size={14} color={theme.primary} />
            <Typography variant="bodySmall" color={theme.primary} weight="700">COMMUNITY</Typography>
          </TouchableOpacity>
          <View style={{ flexDirection: "row", gap: space.sm }}>
            <TouchableOpacity
              onPress={() => navigation.navigate("AISplitBuilder")}
              style={{
                backgroundColor: theme.warning,
                paddingHorizontal: space.md,
                paddingVertical: space.sm,
                borderRadius: radius.md,
                flexDirection: "row",
                alignItems: "center",
                gap: space.xs,
              }}
            >
              <Icon name="Sparkles" size={14} color={theme.primaryText} />
              <Typography variant="bodySmall" color={theme.primaryText} weight="700">
                AI
              </Typography>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("CustomSplit")}
              style={{
                backgroundColor: theme.primary,
                paddingHorizontal: space.md,
                paddingVertical: space.sm,
                borderRadius: radius.md,
                flexDirection: "row",
                alignItems: "center",
                gap: space.xs,
              }}
            >
              <Icon name="Plus" size={14} color={theme.primaryText} />
              <Typography variant="bodySmall" color={theme.primaryText} weight="700">
                CREATE
              </Typography>
            </TouchableOpacity>
          </View>
        </View>

        {userSplits.length === 0 ? (
          <Card padding="lg" shadow="sm" style={{ alignItems: "center" }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: theme.primaryLight,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: space.md,
              }}
            >
              <Icon name="Layers" size={36} color={theme.primary} />
            </View>
            <Typography variant="heading3" color={theme.textPrimary} align="center">
              Your library is empty
            </Typography>
            <Typography variant="bodySmall" color={theme.textSecondary} align="center" style={{ marginTop: space.xs }}>
              Browse community programs or create one to get started.
            </Typography>
          </Card>
        ) : (
          <View style={{ gap: space.md }}>
            {userSplits.map((userSplit) => {
              const split = userSplit.split;
              const canPublish = !split.isPrebuilt && split.createdById && !split.forkedFromSplitId;
              return (
              <TouchableOpacity
                key={userSplit.id}
                onPress={() => navigation.navigate("SplitDetails", { splitId: split.id, splitName: split.name })}
                activeOpacity={0.8}
              >
                <Card shadow="sm" style={{ padding: space.lg }}>
                  <View style={{ flexDirection: "row", alignItems: "flex-start", gap: space.md }}>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: radius.md,
                        backgroundColor: theme.primaryLight,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon name="Layers" size={24} color={theme.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Typography variant="heading3" color={theme.textPrimary}>
                        {split.name}
                      </Typography>
                      {split.description && (
                        <Typography variant="bodySmall" color={theme.textSecondary} style={{ marginTop: 4 }}>
                          {split.description}
                        </Typography>
                      )}
                      <View style={{ flexDirection: "row", alignItems: "center", gap: space.md, marginTop: space.sm }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <Icon name="Calendar" size={12} color={theme.textMuted} />
                          <Typography variant="caption" color={theme.textMuted}>
                            {split.daysPerWeek} days/week
                          </Typography>
                        </View>
                        <View
                          style={{
                            backgroundColor: theme.surfaceTertiary,
                            paddingHorizontal: 6,
                            paddingVertical: 1,
                            borderRadius: 4,
                          }}
                        >
                          <Typography variant="caption" color={theme.textSecondary} weight="600" style={{ textTransform: "capitalize", fontSize: 10 }}>
                            {split.type.replace("_", " ")}
                          </Typography>
                        </View>
                      </View>
                    </View>
                    {updatingId === split.id ? (
                      <ActivityIndicator color={theme.primary} />
                    ) : (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
                        {userSplit.isActive && (
                          <View style={{ backgroundColor: theme.successBg, paddingHorizontal: 6, paddingVertical: 3, borderRadius: radius.sm }}>
                            <Typography variant="caption" color={theme.success} weight="700">ACTIVE</Typography>
                          </View>
                        )}
                        {canPublish && (
                          <TouchableOpacity
                            onPress={() => handlePublication(split)}
                            style={{ padding: 6, borderRadius: radius.sm, backgroundColor: theme.surfaceTertiary }}
                          >
                            <Icon name={split.visibility === "COMMUNITY" ? "Download" : "Upload"} size={16} color={theme.primary} />
                          </TouchableOpacity>
                        )}
                        {!split.isPrebuilt && split.createdById === userSplit.userId && (
                          <TouchableOpacity
                            onPress={() => navigation.navigate("CustomSplit", { splitId: split.id })}
                            style={{ padding: 6, borderRadius: radius.sm, backgroundColor: theme.surfaceTertiary }}
                          >
                            <Icon name="Pencil" size={16} color={theme.primary} />
                          </TouchableOpacity>
                        )}
                        {split.isPrebuilt && (
                          <TouchableOpacity
                            onPress={() => navigation.navigate("CustomSplit", { splitId: split.id, fromPrebuilt: true })}
                            style={{ padding: 6, borderRadius: radius.sm, backgroundColor: theme.surfaceTertiary }}
                          >
                            <Icon name="Pencil" size={16} color={theme.primary} />
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          onPress={() => handleRemove(userSplit)}
                          style={{ padding: 6, borderRadius: radius.sm, backgroundColor: theme.surfaceTertiary }}
                        >
                          <Icon name="Trash2" size={16} color={theme.danger} />
                        </TouchableOpacity>
                        <Icon name="ChevronRight" size={20} color={theme.textMuted} />
                      </View>
                    )}
                  </View>
                </Card>
              </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
