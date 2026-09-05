import React, { useEffect, useState } from "react";
import { View, ScrollView, Alert, TouchableOpacity, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../../navigation/types";
import { forkCommunitySplit, getCommunitySplit, getSplit, setActiveSplit, toggleSplitLike } from "../../api/splits";
import { getExercise } from "../../api/exercises";
import { Split, Exercise } from "../../types";
import { Typography, Card, Icon, Button, Input, SplitDetailsScreenSkeleton, ExerciseDetailSheet } from "../../components";
import { useTheme } from "../../theme/themeStore";
import { space, radius } from "../../theme/spacing";

type Props = NativeStackScreenProps<ProfileStackParamList, "SplitDetails">;

export default function SplitDetailsScreen({ route, navigation }: Props) {
  const { splitId, splitName, community = false } = route.params;
  const theme = useTheme();
  const [split, setSplit] = useState<Split | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [savingCopy, setSavingCopy] = useState(false);
  const [phaseModalVisible, setPhaseModalVisible] = useState(false);
  const [phase, setPhase] = useState("");
  const [exerciseDetailVisible, setExerciseDetailVisible] = useState(false);
  const [selectedExerciseDetail, setSelectedExerciseDetail] = useState<Exercise | null>(null);
  const [loadingExercise, setLoadingExercise] = useState(false);

  const handleExerciseTap = async (exerciseId: string) => {
    if (loadingExercise) return;
    setLoadingExercise(true);
    try {
      const res = await getExercise(exerciseId);
      setSelectedExerciseDetail(res.exercise);
      setExerciseDetailVisible(true);
    } catch (err) {
      console.error("[SplitDetails] failed to load exercise details:", err);
      Alert.alert("Error", "Failed to load exercise details");
    } finally {
      setLoadingExercise(false);
    }
  };

  useEffect(() => {
    loadSplitDetails();
  }, [splitId]);

  const loadSplitDetails = async () => {
    try {
      const res = community ? await getCommunitySplit(splitId) : await getSplit(splitId);
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

  const handleSaveCommunityCopy = async () => {
    setSavingCopy(true);
    try {
      await forkCommunitySplit(splitId);
      Alert.alert("Saved to your library", "You now have a private copy. Activate it whenever you're ready.", [
        { text: "View library", onPress: () => navigation.navigate("SplitSwitcher") },
        { text: "Stay here" },
      ]);
    } catch (err: any) {
      Alert.alert("Could not save split", err.response?.data?.error || "Please try again.");
    } finally {
      setSavingCopy(false);
    }
  };

  const handleCommunityLike = async () => {
    try {
      const result = await toggleSplitLike(splitId);
      setSplit((current) => current ? { ...current, liked: result.liked, likeCount: result.likeCount } : current);
    } catch {
      Alert.alert("Could not update like", "Please try again.");
    }
  };

  if (loading || !split) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
        <SplitDetailsScreenSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: space.lg, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ marginBottom: space.lg }}>
          <Typography variant="caption" color={theme.textMuted} weight="600">
            SPLIT PROGRAM
          </Typography>
          <Typography variant="heading1" color={theme.textPrimary} style={{ marginTop: space.xs }}>
            {split.name}
          </Typography>
          {split.description && (
            <Typography variant="body" color={theme.textSecondary} style={{ marginTop: space.sm }}>
              {split.description}
            </Typography>
          )}
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.md, marginTop: space.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Icon name="Calendar" size={14} color={theme.textMuted} />
              <Typography variant="bodySmall" color={theme.textMuted}>
                {split.daysPerWeek} days/week
              </Typography>
            </View>
            <View style={{ backgroundColor: theme.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
              <Typography variant="caption" color={theme.primary} weight="700">
                {split.type.replace("_", " ")}
              </Typography>
            </View>
            {community && (
              <TouchableOpacity onPress={handleCommunityLike} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Icon name="Heart" size={14} color={split.liked ? theme.primary : theme.textMuted} />
                <Typography variant="bodySmall" color={theme.textMuted}>{split.likeCount ?? 0}</Typography>
              </TouchableOpacity>
            )}
          </View>
          {community && (
            <Typography variant="bodySmall" color={theme.textMuted} style={{ marginTop: space.sm }}>
              Shared by {split.creatorDisplayName || "Ryze member"}. Saving creates an independent private copy.
            </Typography>
          )}
        </View>

        {/* Days List */}
        <Typography variant="heading3" color={theme.textPrimary} style={{ marginBottom: space.md }}>
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
                  <Typography variant="heading3" color={theme.textPrimary}>
                    Day {day.dayNumber}: {day.name}
                  </Typography>
                  {day.isRest ? (
                    <View style={{ backgroundColor: theme.successBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Icon name="Moon" size={12} color={theme.success} />
                      <Typography variant="caption" color={theme.success} weight="700">
                        REST
                      </Typography>
                    </View>
                  ) : (
                    <Typography variant="caption" color={theme.textMuted}>
                      WORKOUT
                    </Typography>
                  )}
                </View>

                {!day.isRest && muscleGroups.length > 0 && (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.xs, marginBottom: space.sm }}>
                    {muscleGroups.map((mg: string) => (
                      <View key={mg} style={{ backgroundColor: theme.surfaceSecondary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Typography variant="caption" color={theme.textSecondary} style={{ textTransform: "capitalize" }}>
                          {mg}
                        </Typography>
                      </View>
                    ))}
                  </View>
                )}

                {!day.isRest && day.exercises && day.exercises.length > 0 ? (
                  <View style={{ marginTop: space.sm, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: space.sm, gap: space.xs }}>
                    {day.exercises.map((dayEx, idx) => (
                      <TouchableOpacity
                        key={dayEx.id}
                        onPress={() => handleExerciseTap(dayEx.exercise.id)}
                        activeOpacity={0.7}
                        style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: space.xs }}
                      >
                        <Typography variant="bodySmall" color={theme.primary} weight="600">
                          {idx + 1}. {dayEx.exercise.name}
                        </Typography>
                        <Typography variant="caption" color={theme.textMuted}>
                          {dayEx.targetSets} sets × {dayEx.targetRepsMin}-{dayEx.targetRepsMax} reps
                        </Typography>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : !day.isRest ? (
                  <Typography variant="bodySmall" color={theme.textMuted}>
                    No exercises added yet
                  </Typography>
                ) : null}
              </Card>
            );
          })}
        </View>
      </ScrollView>

      {/* Switch Split Button + Edit */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: theme.surface, borderTopWidth: 1, borderTopColor: theme.border, padding: space.lg }}>
        {community && (
          <Button
            title="Save private copy"
            onPress={handleSaveCommunityCopy}
            loading={savingCopy}
            variant="primary"
            size="lg"
            icon={<Icon name="Save" size={20} color={theme.primaryText} />}
          />
        )}
        {!community && split.isPrebuilt && (
          <View style={{ flexDirection: "row", gap: space.md }}>
            <Button
              title="Switch"
              onPress={() => setPhaseModalVisible(true)}
              loading={switching}
              disabled={switching}
              variant="primary"
              size="lg"
              icon={<Icon name="Play" size={20} color={theme.primaryText} />}
              style={{ flex: 1 }}
            />
            <Button
              title="Edit"
              onPress={() => navigation.navigate("CustomSplit", { splitId: split.id, fromPrebuilt: true })}
              variant="outline"
              size="lg"
              icon={<Icon name="Pencil" size={20} color={theme.primary} />}
              style={{ flex: 1 }}
              fullWidth={false}
            />
          </View>
        )}
        {!community && !split.isPrebuilt && (
          <View style={{ flexDirection: "row", gap: space.md }}>
            <Button
              title="Switch"
              onPress={() => setPhaseModalVisible(true)}
              loading={switching}
              disabled={switching}
              variant="primary"
              size="lg"
              icon={<Icon name="Play" size={20} color={theme.primaryText} />}
              style={{ flex: 1 }}
            />
            <Button
              title="Edit"
              onPress={() => navigation.navigate("CustomSplit", { splitId: split.id })}
              variant="outline"
              size="lg"
              icon={<Icon name="Pencil" size={20} color={theme.primary} />}
              style={{ flex: 1 }}
              fullWidth={false}
            />
          </View>
        )}
      </View>

      {/* Phase Modal */}
      <Modal visible={phaseModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: theme.bgOverlay }}>
          <View style={{ backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: space.lg }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: space.md }}>
              <Typography variant="heading2" color={theme.textPrimary}>
                Training Phase (Optional)
              </Typography>
              <TouchableOpacity onPress={() => setPhaseModalVisible(false)}>
                <Icon name="X" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <Typography variant="body" color={theme.textSecondary} style={{ marginBottom: space.md }}>
              Specify the phase for this split (e.g. "Bulk Phase", "Cut Phase", "Strength Block") to save in your history.
            </Typography>

            <Input
              label="Phase Name"
              value={phase}
              onChangeText={setPhase}
              placeholder="e.g. Bulk Phase"
              icon={<Icon name="Target" size={20} color={theme.textMuted} />}
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

      {/* Exercise Detail Sheet */}
      <ExerciseDetailSheet
        exercise={selectedExerciseDetail}
        visible={exerciseDetailVisible}
        onClose={() => setExerciseDetailVisible(false)}
      />
    </SafeAreaView>
  );
}
