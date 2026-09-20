import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  Camera,
  Calendar,
  Sparkles,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Trash2,
  Layers,
  ArrowRight,
} from "lucide-react-native";
import { getPhotos, deletePhoto } from "../api/photos";
import { ProgressPhoto } from "../types";

const { width: screenW } = Dimensions.get("window");

const POSE_FILTERS = [
  "All",
  "Front Relaxed",
  "Back Double Bicep",
  "Side Profile",
];

export default function PhysiqueVaultScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPose, setSelectedPose] = useState<string>("All");

  // Before & After comparison selection
  const [beforeIndex, setBeforeIndex] = useState(0);
  const [afterIndex, setAfterIndex] = useState(1);
  const [sliderPosition, setSliderPosition] = useState(50); // percentage 0-100

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      const res = await getPhotos();
      setPhotos(res.photos || []);
    } catch (err) {
      console.error("[PhysiqueVault] load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPhotos =
    selectedPose === "All"
      ? photos
      : photos.filter(
          (p) =>
            p.type?.toLowerCase() === selectedPose.toLowerCase() ||
            p.notes?.toLowerCase().includes(selectedPose.toLowerCase())
        );

  const beforePhoto = photos[beforeIndex] || photos[0];
  const afterPhoto = photos[afterIndex] || photos[photos.length - 1];

  const daysBetween =
    beforePhoto && afterPhoto
      ? Math.abs(
          Math.round(
            (new Date(afterPhoto.date).getTime() - new Date(beforePhoto.date).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 0;

  const handleDeletePhoto = (photoId: string) => {
    Alert.alert("Delete Photo", "Are you sure you want to delete this check-in photo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deletePhoto(photoId);
            setPhotos((prev) => prev.filter((p) => p.id !== photoId));
          } catch {
            Alert.alert("Error", "Failed to delete photo");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* 1. Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTag}>VISUAL PROGRESS TRACKER</Text>
          <Text style={styles.headerTitle}>Physique & Visuals Vault</Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate("PhotoCapture")}
          style={styles.captureBtn}
          activeOpacity={0.8}
        >
          <Camera size={16} color="#ffffff" />
          <Text style={styles.captureBtnText}>Capture</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Before & After Split Slider Comparison */}
        <View style={styles.sliderCard}>
          <View style={styles.sliderHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Sliders size={15} color="#c24914" />
              <Text style={styles.sectionHeading}>Before & After Comparison</Text>
            </View>
            <View style={styles.daysBadge}>
              <Text style={styles.daysBadgeText}>{daysBetween} Days Elapsed</Text>
            </View>
          </View>

          {photos.length >= 2 && beforePhoto && afterPhoto ? (
            <View style={styles.compareContainer}>
              <View style={styles.compareImagesRow}>
                {/* Before Image */}
                <View style={[styles.compareHalf, { flex: sliderPosition }]}>
                  <Image
                    source={{ uri: beforePhoto.url }}
                    style={styles.compareImg}
                    resizeMode="cover"
                  />
                  <View style={styles.dateOverlayBadgeLeft}>
                    <Text style={styles.dateOverlayText}>
                      BEFORE ·{" "}
                      {new Date(beforePhoto.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                </View>

                {/* Split Divider */}
                <View style={styles.sliderDivider}>
                  <View style={styles.sliderKnob}>
                    <ChevronLeft size={10} color="#ffffff" />
                    <ChevronRight size={10} color="#ffffff" />
                  </View>
                </View>

                {/* After Image */}
                <View style={[styles.compareHalf, { flex: 100 - sliderPosition }]}>
                  <Image
                    source={{ uri: afterPhoto.url }}
                    style={styles.compareImg}
                    resizeMode="cover"
                  />
                  <View style={styles.dateOverlayBadgeRight}>
                    <Text style={styles.dateOverlayText}>
                      AFTER ·{" "}
                      {new Date(afterPhoto.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Slider Adjuster Controls */}
              <View style={styles.sliderControls}>
                <TouchableOpacity
                  onPress={() => setSliderPosition(25)}
                  style={[styles.sliderPosBtn, sliderPosition === 25 && styles.sliderPosBtnActive]}
                >
                  <Text style={styles.sliderPosText}>25%</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSliderPosition(50)}
                  style={[styles.sliderPosBtn, sliderPosition === 50 && styles.sliderPosBtnActive]}
                >
                  <Text style={styles.sliderPosText}>50% (Equal)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSliderPosition(75)}
                  style={[styles.sliderPosBtn, sliderPosition === 75 && styles.sliderPosBtnActive]}
                >
                  <Text style={styles.sliderPosText}>75%</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.noCompareCard}>
              <Camera size={28} color="#dcdad4" />
              <Text style={styles.noCompareText}>
                Upload at least 2 check-in photos to activate the Before & After comparison slider.
              </Text>
            </View>
          )}
        </View>

        {/* 3. Pose Filter Chips */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionHeading}>Chronological Gallery</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.poseFilterScroll}
          >
            {POSE_FILTERS.map((pose) => {
              const isSelected = selectedPose === pose;
              return (
                <TouchableOpacity
                  key={pose}
                  onPress={() => setSelectedPose(pose)}
                  style={[styles.poseChip, isSelected && styles.poseChipActive]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.poseChipText,
                      isSelected && styles.poseChipTextActive,
                    ]}
                  >
                    {pose}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 4. Chronological Grid */}
        {loading ? (
          <ActivityIndicator size="small" color="#c24914" style={{ marginVertical: 24 }} />
        ) : filteredPhotos.length === 0 ? (
          <View style={styles.emptyGallery}>
            <Text style={styles.emptyGalleryText}>No progress photos match this filter.</Text>
          </View>
        ) : (
          <View style={styles.photoGrid}>
            {filteredPhotos.map((photo, index) => (
              <View key={photo.id || index} style={styles.gridCard}>
                <Image source={{ uri: photo.url }} style={styles.gridImg} resizeMode="cover" />
                <View style={styles.gridMeta}>
                  <Text style={styles.gridDate}>
                    {new Date(photo.date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                  {photo.type && <Text style={styles.gridPose}>{photo.type}</Text>}
                </View>

                {/* Quick actions */}
                <TouchableOpacity
                  onPress={() => handleDeletePhoto(photo.id)}
                  style={styles.gridDeleteBtn}
                  activeOpacity={0.7}
                >
                  <Trash2 size={12} color="#ffffff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fcf9f3",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f6f3ed",
    backgroundColor: "#ffffff",
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
  captureBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#c24914",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  captureBtnText: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 12,
    color: "#ffffff",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 20,
  },

  /* Before & After Slider Card */
  sliderCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#dcdad4",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionHeading: {
    fontFamily: "Outfit-Bold",
    fontSize: 15,
    color: "#1a1917",
  },
  daysBadge: {
    backgroundColor: "#fbeee8",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  daysBadgeText: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 11,
    color: "#c24914",
  },
  compareContainer: {
    gap: 12,
  },
  compareImagesRow: {
    flexDirection: "row",
    height: 260,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#f6f3ed",
  },
  compareHalf: {
    height: "100%",
    overflow: "hidden",
    position: "relative",
  },
  compareImg: {
    width: "100%",
    height: "100%",
  },
  dateOverlayBadgeLeft: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(26, 25, 23, 0.75)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dateOverlayBadgeRight: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(26, 25, 23, 0.75)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dateOverlayText: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 10,
    color: "#ffffff",
  },
  sliderDivider: {
    width: 2,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  sliderKnob: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#c24914",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  sliderControls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  sliderPosBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#f6f3ed",
    borderWidth: 1,
    borderColor: "#dcdad4",
  },
  sliderPosBtnActive: {
    backgroundColor: "#c24914",
    borderColor: "#c24914",
  },
  sliderPosText: {
    fontFamily: "Outfit-Medium",
    fontSize: 11,
    color: "#1a1917",
  },
  noCompareCard: {
    height: 160,
    borderRadius: 16,
    backgroundColor: "#fcf9f3",
    borderWidth: 1,
    borderColor: "#dcdad4",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  noCompareText: {
    fontFamily: "Outfit-Regular",
    fontSize: 13,
    color: "#7a766c",
    textAlign: "center",
    lineHeight: 18,
  },

  /* Pose Filters */
  filterSection: {
    gap: 10,
  },
  poseFilterScroll: {
    gap: 8,
  },
  poseChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dcdad4",
  },
  poseChipActive: {
    backgroundColor: "#c24914",
    borderColor: "#c24914",
  },
  poseChipText: {
    fontFamily: "Outfit-Medium",
    fontSize: 12,
    color: "#49453a",
  },
  poseChipTextActive: {
    color: "#ffffff",
    fontFamily: "Outfit-SemiBold",
  },

  /* Photo Grid */
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridCard: {
    width: (screenW - 52) / 2,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#dcdad4",
    position: "relative",
  },
  gridImg: {
    width: "100%",
    height: 170,
  },
  gridMeta: {
    padding: 10,
    gap: 2,
  },
  gridDate: {
    fontFamily: "Outfit-Bold",
    fontSize: 12,
    color: "#1a1917",
  },
  gridPose: {
    fontFamily: "Outfit-Regular",
    fontSize: 11,
    color: "#7a766c",
  },
  gridDeleteBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(26, 25, 23, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyGallery: {
    paddingVertical: 30,
    alignItems: "center",
  },
  emptyGalleryText: {
    fontFamily: "Outfit-Regular",
    fontSize: 13,
    color: "#7a766c",
  },
});
