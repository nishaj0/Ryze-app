import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Body from "react-native-body-highlighter";
import { MuscleVolume } from "../../types";
import {
  getWeeklyVolumeHighlightData,
  isSlugVisibleOnSide,
  MuscleHighlightData,
} from "../../constants/muscleHighlighterMapping";

export interface AnatomyMapProps {
  weeklyMuscleVolumes?: MuscleVolume[];
  gender?: "male" | "female";
}

export default function AnatomyMap({
  weeklyMuscleVolumes = [],
  gender = "male",
}: AnatomyMapProps) {
  const [side, setSide] = useState<"front" | "back">("front");

  // Format highlight data for body highlighter
  const highlightData: MuscleHighlightData[] = useMemo(() => {
    if (!weeklyMuscleVolumes || weeklyMuscleVolumes.length === 0) {
      // Demo highlight data if empty to showcase active groups
      return [
        { slug: "chest", intensity: 3 },
        { slug: "deltoids", intensity: 2 },
        { slug: "quadriceps", intensity: 3 },
        { slug: "upper-back", intensity: 2 },
        { slug: "hamstring", intensity: 1 },
      ];
    }
    return getWeeklyVolumeHighlightData(weeklyMuscleVolumes);
  }, [weeklyMuscleVolumes]);

  const visibleHighlights = useMemo(() => {
    return highlightData.filter((item) => isSlugVisibleOnSide(item.slug, side));
  }, [highlightData, side]);

  // Top 5 muscle groups for horizontal tonnage list
  const sortedMuscles = useMemo(() => {
    const list = [...weeklyMuscleVolumes].sort((a, b) => (b.volume || 0) - (a.volume || 0));
    if (list.length === 0) {
      return [
        { muscleGroup: "Chest", volume: 4850 },
        { muscleGroup: "Quads", volume: 4200 },
        { muscleGroup: "Lats & Back", volume: 3600 },
        { muscleGroup: "Shoulders", volume: 2150 },
      ];
    }
    return list.slice(0, 5);
  }, [weeklyMuscleVolumes]);

  const maxVolume = Math.max(...sortedMuscles.map((m) => m.volume || 0), 1);

  return (
    <View style={styles.cardContainer}>
      {/* Header & Segmented Toggle */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Biomechanical Volume Map</Text>
          <Text style={styles.subtitle}>Weekly load intensity per muscle group</Text>
        </View>

        <View style={styles.segmentedToggle}>
          <TouchableOpacity
            onPress={() => setSide("front")}
            style={[styles.toggleBtn, side === "front" && styles.toggleBtnActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.toggleText, side === "front" && styles.toggleTextActive]}>
              Front
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSide("back")}
            style={[styles.toggleBtn, side === "back" && styles.toggleBtnActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.toggleText, side === "back" && styles.toggleTextActive]}>
              Back
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Anatomical Vector Model */}
      <View style={styles.modelContainer}>
        <Body
          data={visibleHighlights}
          gender={gender}
          side={side}
          scale={0.92}
          colors={["#dcdad4", "#fbeee8", "#e08d6c", "#c24914"]}
        />
      </View>

      {/* Horizontal Tonnage Bars */}
      <View style={styles.tonnageList}>
        <Text style={styles.tonnageSectionHeader}>Tonnage by Muscle Group</Text>
        {sortedMuscles.map((item, idx) => {
          const vol = item.volume || 0;
          const pct = Math.min(100, Math.round((vol / maxVolume) * 100));
          const name = item.muscleGroup.charAt(0).toUpperCase() + item.muscleGroup.slice(1);

          return (
            <View key={idx} style={styles.muscleRow}>
              <View style={styles.muscleTextRow}>
                <Text style={styles.muscleName}>{name}</Text>
                <Text style={styles.muscleVolText}>{vol.toLocaleString()} kg</Text>
              </View>
              <View style={styles.muscleTrack}>
                <View style={[styles.muscleFill, { width: `${pct}%` }]} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#dcdad4",
    padding: 18,
    marginBottom: 20,
    shadowColor: "#1a1917",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontFamily: "Outfit_700Bold",
    fontSize: 16,
    color: "#1a1917",
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: "Outfit_400Regular",
    fontSize: 12,
    color: "#7a766c",
  },
  segmentedToggle: {
    flexDirection: "row",
    backgroundColor: "#f6f3ed",
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: "#dcdad4",
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#1a1917",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleText: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 11,
    color: "#7a766c",
  },
  toggleTextActive: {
    color: "#c24914",
    fontFamily: "Outfit_700Bold",
  },
  modelContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "#fcf9f3",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#f6f3ed",
    marginBottom: 16,
  },
  tonnageList: {
    borderTopWidth: 1,
    borderTopColor: "#f6f3ed",
    paddingTop: 12,
  },
  tonnageSectionHeader: {
    fontFamily: "Outfit_700Bold",
    fontSize: 12,
    color: "#7a766c",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  muscleRow: {
    marginBottom: 10,
  },
  muscleTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  muscleName: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 13,
    color: "#1a1917",
  },
  muscleVolText: {
    fontFamily: "Outfit_700Bold",
    fontSize: 12,
    color: "#c24914",
  },
  muscleTrack: {
    height: 7,
    backgroundColor: "#f6f3ed",
    borderRadius: 3.5,
    overflow: "hidden",
  },
  muscleFill: {
    height: "100%",
    backgroundColor: "#c24914",
    borderRadius: 3.5,
  },
});
