import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../../navigation/types";
import { listExercises, getDistinctMuscles } from "../../api/exercises";
import { Exercise } from "../../types";
import { getAppSettings, AppSettings } from "../../api/app";
import { Typography, Card, Icon, ExerciseDetailSheet } from "../../components";
import { useTheme } from "../../theme/themeStore";
import { space, radius } from "../../theme/spacing";

type Props = NativeStackScreenProps<ProfileStackParamList, "AllExercises">;

export default function AllExercisesScreen({ navigation }: Props) {
  const theme = useTheme();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [loadingMuscles, setLoadingMuscles] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Exercise detail sheet state
  const [exerciseDetailVisible, setExerciseDetailVisible] = useState(false);
  const [selectedExerciseDetail, setSelectedExerciseDetail] = useState<Exercise | null>(null);

  useEffect(() => {
    getAppSettings()
      .then(setSettings)
      .catch(console.error);
    loadMuscleGroups();
  }, []);

  const loadMuscleGroups = async () => {
    setLoadingMuscles(true);
    try {
      const res = await getDistinctMuscles();
      setMuscleGroups(res.muscles);
    } catch (err) {
      console.error("[AllExercises] failed to load muscle groups:", err);
    } finally {
      setLoadingMuscles(false);
    }
  };

  const debouncedFetchExercises = useCallback((pageNum: number, reset: boolean = false) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchExercises(pageNum, reset);
    }, 300);
  }, [searchQuery, selectedMuscle]);

  useEffect(() => {
    debouncedFetchExercises(1, true);
  }, [searchQuery, selectedMuscle]);

  const fetchExercises = async (pageNum: number, reset: boolean = false) => {
    if (loading) return;
    setLoading(true);

    try {
      const params: any = { page: pageNum, limit: 20 };
      if (searchQuery) params.search = searchQuery;
      if (selectedMuscle) params.muscle = selectedMuscle;

      const response = await listExercises(params);
      const newExercises = response.exercises || [];

      if (reset) {
        setExercises(newExercises);
      } else {
        setExercises((prev) => [...prev, ...newExercises]);
      }

      setHasMore(newExercises.length === 20);
      setPage(pageNum);
    } catch (err) {
      console.error("Failed to fetch exercises:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchExercises(page + 1);
    }
  };

  const renderExercise = ({ item }: { item: Exercise }) => {
    const primaryMuscle = item.muscles?.find((m) => m.isPrimary)?.muscle.name || "Unknown";

    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedExerciseDetail(item);
          setExerciseDetailVisible(true);
        }}
        style={{ marginBottom: space.md }}
      >
        <Card shadow="sm" style={{ padding: space.md }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {item.images && item.images.length > 0 && (
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: radius.md,
                  overflow: "hidden",
                  marginRight: space.md,
                  backgroundColor: theme.surfaceSecondary,
                }}
              >
                {/* Image will be loaded here */}
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Typography variant="heading3" color={theme.textPrimary} style={{ marginBottom: 4 }}>
                {item.name}
              </Typography>
              <Typography variant="caption" color={theme.textMuted} style={{ textTransform: "capitalize" }}>
                {primaryMuscle}
              </Typography>
              {item.equipment && (
                <Typography variant="caption" color={theme.textSecondary} style={{ marginTop: 2 }}>
                  {item.equipment}
                </Typography>
              )}
            </View>
            <Icon name="ChevronRight" size={20} color={theme.textMuted} />
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
      <View style={{ padding: space.lg, paddingBottom: space.md }}>
        {/* Search */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: theme.surfaceSecondary,
            borderRadius: radius.lg,
            paddingHorizontal: space.md,
            marginBottom: space.md,
          }}
        >
          <Icon name="Search" size={20} color={theme.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search exercises..."
            placeholderTextColor={theme.textMuted}
            style={{
              flex: 1,
              paddingVertical: space.md,
              paddingHorizontal: space.sm,
              fontSize: 16,
              color: theme.textPrimary,
            }}
          />
          {searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Icon name="X" size={20} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Muscle Filter */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          <TouchableOpacity
            onPress={() => setSelectedMuscle(null)}
            style={{
              paddingHorizontal: space.md,
              paddingVertical: space.sm,
              borderRadius: radius.full,
              backgroundColor: !selectedMuscle ? theme.primary : theme.surfaceSecondary,
              borderWidth: 1,
              borderColor: !selectedMuscle ? theme.primary : theme.border,
            }}
          >
            <Typography
              variant="caption"
              color={!selectedMuscle ? theme.primaryText : theme.textSecondary}
              weight="600"
            >
              All
            </Typography>
          </TouchableOpacity>
          {muscleGroups.map((muscle) => (
            <TouchableOpacity
              key={muscle}
              onPress={() => setSelectedMuscle(muscle)}
              style={{
                paddingHorizontal: space.md,
                paddingVertical: space.sm,
                borderRadius: radius.full,
                backgroundColor: selectedMuscle === muscle ? theme.primary : theme.surfaceSecondary,
                borderWidth: 1,
                borderColor: selectedMuscle === muscle ? theme.primary : theme.border,
              }}
            >
              <Typography
                variant="caption"
                color={selectedMuscle === muscle ? theme.primaryText : theme.textSecondary}
                weight="600"
                style={{ textTransform: "capitalize" }}
              >
                {muscle}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Exercise List */}
      <FlatList
        data={exercises}
        renderItem={renderExercise}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: space.lg, paddingTop: 0 }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !loading ? (
            <View style={{ alignItems: "center", marginTop: space.xl }}>
              <Icon name="Dumbbell" size={48} color={theme.textMuted} />
              <Typography variant="body" color={theme.textMuted} style={{ marginTop: space.md }}>
                No exercises found
              </Typography>
            </View>
          ) : null
        }
      />

      {/* Request Exercise Button */}
      {(!settings || settings.exerciseRequestsEnabled) && (
        <TouchableOpacity
          onPress={() => navigation.navigate("RequestExercise")}
          style={{
            position: "absolute",
            bottom: space.xl,
            right: space.xl,
            backgroundColor: theme.primary,
            borderRadius: radius.full,
            padding: space.lg,
            shadowColor: theme.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          <Icon name="Plus" size={24} color={theme.primaryText} />
        </TouchableOpacity>
      )}

      {/* Exercise Detail Sheet */}
      <ExerciseDetailSheet
        exercise={selectedExerciseDetail}
        visible={exerciseDetailVisible}
        onClose={() => setExerciseDetailVisible(false)}
      />
    </SafeAreaView>
  );
}
