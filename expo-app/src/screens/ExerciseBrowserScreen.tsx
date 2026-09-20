import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  Search,
  X,
  Dumbbell,
  Layers,
  ChevronRight,
  Filter,
  Sparkles,
} from "lucide-react-native";
import { listExercises, getDistinctMuscles } from "../api/exercises";
import { Exercise } from "../types";
import { getThumbnailUrl } from "../utils/cloudinary";
import ExerciseFormSheet from "../components/exercises/ExerciseFormSheet";
import { MUSCLE_GROUPS, WORKOUT_CONSTANTS, COLORS, FONTS } from "../constants";

export default function ExerciseBrowserScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<string>("All");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [availableMuscles, setAvailableMuscles] = useState<string[]>([...MUSCLE_GROUPS]);

  // Form sheet state
  const [formSheetVisible, setFormSheetVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getDistinctMuscles()
      .then((res) => {
        if (res.muscles && res.muscles.length > 0) {
          const merged = ["All", ...res.muscles.filter((m) => m && m.toLowerCase() !== "all")];
          setAvailableMuscles(merged);
        }
      })
      .catch(() => {});
  }, []);

  const fetchExercises = async (pageNum: number, reset: boolean = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const muscleParam = selectedMuscle === "All" ? undefined : selectedMuscle;
      const searchParam = searchQuery.trim() || undefined;

      const res = await listExercises({
        page: pageNum,
        limit: 20,
        muscle: muscleParam,
        search: searchParam,
      });

      if (reset) {
        setExercises(res.exercises || []);
      } else {
        setExercises((prev) => [...prev, ...(res.exercises || [])]);
      }

      setPage(pageNum);
      setHasMore(pageNum < (res.totalPages || 1));
    } catch (err) {
      console.error("[ExerciseBrowser] fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchExercises(1, true);
    }, WORKOUT_CONSTANTS.SEARCH_DEBOUNCE_MS);
  }, [searchQuery, selectedMuscle]);

  useEffect(() => {
    debouncedSearch();
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery, selectedMuscle]);

  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setFormSheetVisible(true);
  };

  const renderExerciseCard = ({ item }: { item: Exercise }) => {
    const primaryMuscles =
      item.muscles?.filter((m) => m.isPrimary).map((m) => m.muscle.name) || [];
    const imageUrl =
      item.images && item.images.length > 0 ? getThumbnailUrl(item.images[0].url) : null;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleSelectExercise(item)}
        activeOpacity={0.75}
      >
        {/* Posture Thumbnail */}
        <View style={styles.thumbnailWrap}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.thumbnail} resizeMode="cover" />
          ) : (
            <View style={styles.thumbPlaceholder}>
              <Dumbbell size={20} color="#c24914" />
            </View>
          )}
        </View>

        {/* Content Info */}
        <View style={styles.cardInfo}>
          <Text style={styles.exerciseName} numberOfLines={1}>
            {item.name}
          </Text>

          <Text style={styles.targetMuscle} numberOfLines={1}>
            {primaryMuscles.join(", ") || item.category || "Full Body"}
          </Text>

          {/* Badges Row */}
          <View style={styles.tagsRow}>
            {item.equipment && (
              <View style={styles.tagEquipment}>
                <Text style={styles.tagEquipmentText}>{item.equipment}</Text>
              </View>
            )}

            {item.mechanic && (
              <View
                style={[
                  styles.tagMechanic,
                  item.mechanic.toLowerCase() === "compound"
                    ? styles.tagCompound
                    : styles.tagIsolation,
                ]}
              >
                <Text
                  style={[
                    styles.tagMechanicText,
                    item.mechanic.toLowerCase() === "compound"
                      ? styles.tagCompoundText
                      : styles.tagIsolationText,
                  ]}
                >
                  {item.mechanic}
                </Text>
              </View>
            )}
          </View>
        </View>

        <ChevronRight size={16} color="#7a766c" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* 1. Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTag}>EXERCISE ENCYCLOPEDIA</Text>
          <Text style={styles.headerTitle}>Browse Exercises</Text>
        </View>
      </View>

      {/* 2. Debounced Search Bar */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchBar}>
          <Search size={16} color="#7a766c" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, muscle, or equipment..."
            placeholderTextColor="#7a766c"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} activeOpacity={0.7}>
              <X size={16} color="#7a766c" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 3. Horizontal Category Chips */}
      <View style={styles.categoriesWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {availableMuscles.map((muscle) => {
            const isSelected = selectedMuscle === muscle;
            return (
              <TouchableOpacity
                key={muscle}
                onPress={() => setSelectedMuscle(muscle)}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected && styles.categoryChipTextActive,
                  ]}
                >
                  {muscle}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 4. Exercise Card Stream */}
      <FlatList
        data={exercises}
        keyExtractor={(item) => item.id}
        renderItem={renderExerciseCard}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (hasMore && !loading) {
            fetchExercises(page + 1);
          }
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loading ? (
            <View style={styles.loadingFooter}>
              <ActivityIndicator size="small" color="#c24914" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Dumbbell size={36} color="#dcdad4" />
              <Text style={styles.emptyStateTitle}>No exercises found</Text>
              <Text style={styles.emptyStateSub}>
                Try adjusting your search query or selecting a different muscle group.
              </Text>
            </View>
          ) : null
        }
      />

      {/* 5. Technique & Form Bottom Sheet */}
      <ExerciseFormSheet
        exercise={selectedExercise}
        visible={formSheetVisible}
        onClose={() => setFormSheetVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fcf9f3",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTag: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 10,
    color: "#c24914",
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontFamily: "Outfit-Bold",
    fontSize: 22,
    color: "#1a1917",
    marginTop: 2,
  },
  searchBarWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dcdad4",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Outfit-Regular",
    fontSize: 13,
    color: "#1a1917",
    padding: 0,
  },
  categoriesWrapper: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f6f3ed",
  },
  categoriesScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dcdad4",
  },
  categoryChipActive: {
    backgroundColor: "#c24914",
    borderColor: "#c24914",
  },
  categoryChipText: {
    fontFamily: "Outfit-Medium",
    fontSize: 12,
    color: "#49453a",
  },
  categoryChipTextActive: {
    color: "#ffffff",
    fontFamily: "Outfit-SemiBold",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#dcdad4",
    gap: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  thumbnailWrap: {
    width: 54,
    height: 54,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f6f3ed",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  thumbPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fbeee8",
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  exerciseName: {
    fontFamily: "Outfit-Bold",
    fontSize: 14,
    color: "#1a1917",
  },
  targetMuscle: {
    fontFamily: "Outfit-Regular",
    fontSize: 12,
    color: "#7a766c",
  },
  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  tagEquipment: {
    backgroundColor: "#f6f3ed",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagEquipmentText: {
    fontFamily: "Outfit-Medium",
    fontSize: 10,
    color: "#49453a",
  },
  tagMechanic: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagCompound: {
    backgroundColor: "#fbeee8",
  },
  tagIsolation: {
    backgroundColor: "#e8f5e9",
  },
  tagMechanicText: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 10,
  },
  tagCompoundText: {
    color: "#c24914",
  },
  tagIsolationText: {
    color: "#2d6a4f",
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 8,
  },
  emptyStateTitle: {
    fontFamily: "Outfit-Bold",
    fontSize: 16,
    color: "#1a1917",
  },
  emptyStateSub: {
    fontFamily: "Outfit-Regular",
    fontSize: 13,
    color: "#7a766c",
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
