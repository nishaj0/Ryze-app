import React, { useEffect, useState } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProgressStackParamList } from "../../navigation/types";
import { getRecords } from "../../api/records";
import { PersonalRecord } from "../../types";
import { Typography, Card, Icon, RecordsScreenSkeleton } from "../../components";
import { useTheme } from "../../theme/themeStore";
import { space, radius } from "../../theme/spacing";

type Props = NativeStackScreenProps<ProgressStackParamList, "Records">;

export default function RecordsScreen({ navigation }: Props) {
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const theme = useTheme();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const res = await getRecords();
      setRecords(res.records);
    } catch (err) {
      console.error("[Records] load error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
        <RecordsScreenSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: space.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.lg }}>
          <Typography variant="caption" color={theme.textMuted} weight="600">
            ALL TIME
          </Typography>
          <Typography variant="heading1" color={theme.textPrimary} style={{ marginTop: space.xs }}>
            Personal Records
          </Typography>
          <Typography variant="body" color={theme.textSecondary} style={{ marginTop: space.sm }}>
            {records.length} record{records.length !== 1 ? "s" : ""} achieved
          </Typography>
        </View>

        {records.length === 0 ? (
          <View style={{ paddingHorizontal: space.lg }}>
            <Card padding="lg" shadow="sm" style={{ alignItems: "center" }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: theme.warningBg,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: space.md,
                }}
              >
                <Icon name="Trophy" size={36} color={theme.warning} />
              </View>
              <Typography variant="heading3" color={theme.textPrimary} align="center">
                No records yet
              </Typography>
              <Typography variant="body" color={theme.textSecondary} align="center" style={{ marginTop: space.sm }}>
                Keep training hard — your first PR is just around the corner!
              </Typography>
            </Card>
          </View>
        ) : (
          <View style={{ paddingHorizontal: space.lg, gap: space.md }}>
            {records.map((pr) => (
              <TouchableOpacity
                key={pr.id}
                activeOpacity={0.8}
                onPress={() => pr.exercise?.id && navigation.navigate("ExerciseProgress", {
                  exerciseId: pr.exercise.id,
                  exerciseName: pr.exercise.name,
                })}
              >
                <Card shadow="sm" style={{ padding: space.md }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: radius.md,
                        backgroundColor: theme.warningBg,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon name="Trophy" size={24} color={theme.warning} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Typography variant="body" color={theme.textPrimary} weight="600">
                        {pr.exercise?.name || "Exercise"}
                      </Typography>
                      <Typography variant="caption" color={theme.textMuted} style={{ textTransform: "capitalize", marginTop: 2 }}>
                        {pr.exercise?.muscles?.find(m => m.isPrimary)?.muscle.name || ""}
                      </Typography>
                      <Typography variant="caption" color={theme.textMuted} style={{ marginTop: 4 }}>
                        {new Date(pr.achievedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </Typography>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Typography variant="heading2" color={theme.textPrimary}>
                        {pr.weightKg}<Typography variant="body" color={theme.textMuted}>kg</Typography>
                      </Typography>
                      <Typography variant="bodySmall" color={theme.primary} weight="600">
                        × {pr.reps} reps
                      </Typography>
                      <Typography variant="caption" color={theme.textMuted} style={{ marginTop: 2 }}>
                        ~{Math.round(pr.estimated1rm)}kg 1RM
                      </Typography>
                    </View>
                    <Icon name="ChevronRight" size={20} color={theme.textMuted} />
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
