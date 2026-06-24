import React, { useEffect, useState } from "react";
import { View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../../navigation/types";
import { listSplits, setActiveSplit } from "../../api/splits";
import { Split } from "../../types";
import { Typography, Card, Icon, SplitSwitcherScreenSkeleton } from "../../components";
import { useTheme } from "../../theme/themeStore";
import { space, radius } from "../../theme/spacing";

type Props = NativeStackScreenProps<ProfileStackParamList, "SplitSwitcher">;

export default function SplitSwitcherScreen({ navigation }: Props) {
  const [splits, setSplits] = useState<Split[]>([]);
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);

  useEffect(() => {
    loadSplits();
  }, []);

  const loadSplits = async () => {
    try {
      const res = await listSplits();
      setSplits(res.splits);
    } catch (err) {
      console.error("[SplitSwitcher] load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitch = (splitId: string, splitName: string) => {
    Alert.alert(
      "Switch Split",
      `Switch to "${splitName}"? Your workout tracking will reset for the new split.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Switch",
          onPress: async () => {
            setSwitching(splitId);
            try {
              await setActiveSplit(splitId);
              Alert.alert("Success", "Split switched!", [{ text: "OK", onPress: () => navigation.goBack() }]);
            } catch (err) {
              Alert.alert("Error", "Failed to switch split");
            } finally {
              setSwitching(null);
            }
          },
        },
      ]
    );
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
              AVAILABLE SPLITS
            </Typography>
            <Typography variant="heading1" color={theme.textPrimary} style={{ marginTop: space.xs }}>
              Switch Split
            </Typography>
            <Typography variant="body" color={theme.textSecondary} style={{ marginTop: space.xs }}>
              Choose or create a program
            </Typography>
          </View>
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

        {splits.length === 0 ? (
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
              No splits available
            </Typography>
          </Card>
        ) : (
          <View style={{ gap: space.md }}>
            {splits.map((split) => (
              <TouchableOpacity
                key={split.id}
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
                    {switching === split.id ? (
                      <ActivityIndicator color={theme.primary} />
                    ) : (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
                        {!split.isPrebuilt && (
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
                        <Icon name="ChevronRight" size={20} color={theme.textMuted} />
                      </View>
                    )}
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
