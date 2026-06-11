import React, { useEffect, useState } from "react";
import { View, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../../navigation/types";
import { getSplit, setActiveSplit } from "../../api/splits";
import { Split } from "../../types";
import { Typography, Card, Icon, Button, Input } from "../../components";
import { lightTheme } from "../../theme/colors";
import { space, radius } from "../../theme/spacing";

type Props = NativeStackScreenProps<ProfileStackParamList, "SplitDetails">;

export default function SplitDetailsScreen({ route, navigation }: Props) {
  const { splitId, splitName } = route.params;
  const [split, setSplit] = useState<Split | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [phaseModalVisible, setPhaseModalVisible] = useState(false);
  const [phase, setPhase] = useState("");

  useEffect(() => {
    loadSplitDetails();
  }, [splitId]);

  const loadSplitDetails = async () => {
    try {
      const res = await getSplit(splitId);
      setSplit(res.split);
    } catch (err) {
      Alert.alert("Error", "Failed to load split details");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchSplit = async () => {
    setSwitching(true);
    setPhaseModalVisible(false);
    try {
      await setActiveSplit(splitId, phase || undefined);
      Alert.alert("Success", `Switched to "${splitName}"!`, [
        { text: "OK", onPress: () => navigation.getParent()?.getParent()?.navigate("Home", { screen: "HomeMain" }) },
      ]);
    } catch (err) {
      Alert.alert("Error", "Failed to switch split");
    } finally {
      setSwitching(false);
    }
  };

  if (loading || !split) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: lightTheme.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={lightTheme.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: lightTheme.bg }} edges={["top"]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: space.lg, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ marginBottom: space.lg }}>
          <Typography variant="caption" color={lightTheme.textMuted} weight="600">
            SPLIT PROGRAM
          </Typography>
          <Typography variant="heading1" color={lightTheme.textPrimary} style={{ marginTop: space.xs }}>
            {split.name}
          </Typography>
          {split.description && (
            <Typography variant="body" color={lightTheme.textSecondary} style={{ marginTop: space.sm }}>
              {split.description}
            </Typography>
          )}
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.md, marginTop: space.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Icon name="Calendar" size={14} color={lightTheme.textMuted} />
              <Typography variant="bodySmall" color={lightTheme.textMuted}>
                {split.daysPerWeek} days/week
              </Typography>
            </View>
            <View style={{ backgroundColor: lightTheme.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
              <Typography variant="caption" color={lightTheme.primary} weight="700">
                {split.type.replace("_", " ")}
              </Typography>
            </View>
          </View>
        </View>

        {/* Days List */}
        <Typography variant="heading3" color={lightTheme.textPrimary} style={{ marginBottom: space.md }}>
          Training Days
        </Typography>

        <View style={{ gap: space.md }}>
          {split.days.map((day) => {
            const muscleGroups = (() => {
              try {
                return JSON.parse(day.muscleGroups);
              } catch {
                return [];
              }
            })();

            return (
              <Card key={day.id} shadow="sm" style={{ padding: space.md }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: space.sm }}>
                  <Typography variant="heading3" color={lightTheme.textPrimary}>
                    Day {day.dayNumber}: {day.name}
                  </Typography>
                  {day.isRest ? (
                    <View style={{ backgroundColor: lightTheme.successBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Icon name="Moon" size={12} color={lightTheme.success.DEFAULT} />
                      <Typography variant="caption" color={lightTheme.success.DEFAULT} weight="700">
                        REST
                      </Typography>
                    </View>
                  ) : (
                    <Typography variant="caption" color={lightTheme.textMuted}>
                      WORKOUT
                    </Typography>
                  )}
                </View>

                {!day.isRest && muscleGroups.length > 0 && (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.xs, marginBottom: space.sm }}>
                    {muscleGroups.map((mg: string) => (
                      <View key={mg} style={{ backgroundColor: lightTheme.surfaceSecondary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Typography variant="caption" color={lightTheme.textSecondary} style={{ textTransform: "capitalize" }}>
                          {mg}
                        </Typography>
                      </View>
                    ))}
                  </View>
                )}

                {!day.isRest && day.exercises && day.exercises.length > 0 ? (
                  <View style={{ marginTop: space.sm, borderTopWidth: 1, borderTopColor: lightTheme.border, paddingTop: space.sm, gap: space.xs }}>
                    {day.exercises.map((dayEx, idx) => (
                      <View key={dayEx.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="bodySmall" color={lightTheme.textPrimary} weight="500">
                          {idx + 1}. {dayEx.exercise.name}
                        </Typography>
                        <Typography variant="caption" color={lightTheme.textMuted}>
                          {dayEx.targetSets} sets × {dayEx.targetRepsMin}-{dayEx.targetRepsMax} reps
                        </Typography>
                      </View>
                    ))}
                  </View>
                ) : !day.isRest ? (
                  <Typography variant="bodySmall" color={lightTheme.textMuted}>
                    No exercises added yet
                  </Typography>
                ) : null}
              </Card>
            );
          })}
        </View>
      </ScrollView>

      {/* Switch Split Button */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: lightTheme.surface, borderTopWidth: 1, borderTopColor: lightTheme.border, padding: space.lg }}>
        <Button
          title="Switch to this Split"
          onPress={() => setPhaseModalVisible(true)}
          loading={switching}
          disabled={switching}
          variant="primary"
          size="lg"
          icon={<Icon name="Play" size={20} color={lightTheme.primaryText} />}
        />
      </View>

      {/* Phase Modal */}
      <Modal visible={phaseModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: lightTheme.bgOverlay }}>
          <View style={{ backgroundColor: lightTheme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: space.lg }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: space.md }}>
              <Typography variant="heading2" color={lightTheme.textPrimary}>
                Training Phase (Optional)
              </Typography>
              <TouchableOpacity onPress={() => setPhaseModalVisible(false)}>
                <Icon name="X" size={24} color={lightTheme.textMuted} />
              </TouchableOpacity>
            </View>

            <Typography variant="body" color={lightTheme.textSecondary} style={{ marginBottom: space.md }}>
              Specify the phase for this split (e.g. "Bulk Phase", "Cut Phase", "Strength Block") to save in your history.
            </Typography>

            <Input
              label="Phase Name"
              value={phase}
              onChangeText={setPhase}
              placeholder="e.g. Bulk Phase"
              icon={<Icon name="Target" size={20} color={lightTheme.textMuted} />}
            />

            <View style={{ flexDirection: "row", gap: space.md, marginTop: space.lg }}>
              <Button
                title="Cancel"
                onPress={() => setPhaseModalVisible(false)}
                variant="secondary"
                size="md"
                style={{ flex: 1 }}
              />
              <Button
                title="Activate Split"
                onPress={handleSwitchSplit}
                variant="primary"
                size="md"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
