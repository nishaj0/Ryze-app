import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Body from "react-native-body-highlighter";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Dumbbell,
  ShieldCheck,
  Layers,
  Flame,
  Play,
  Repeat,
} from "lucide-react-native";
import { Exercise } from "../../types";
import { getHighResUrl } from "../../utils/cloudinary";
import {
  COLORS,
  FONTS,
  WORKOUT_CONSTANTS,
  getMuscleHighlightData,
  isSlugVisibleOnSide,
} from "../../constants";

interface ExerciseFormSheetProps {
  exercise: Exercise | null;
  visible: boolean;
  onClose: () => void;
}

const { width: screenW } = Dimensions.get("window");

export default function ExerciseFormSheet({
  exercise,
  visible,
  onClose,
}: ExerciseFormSheetProps) {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const [activeSide, setActiveSide] = useState<"front" | "back">("front");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const images = exercise?.images && exercise.images.length > 0 ? exercise.images : [];

  // Reset when exercise changes or modal opens
  useEffect(() => {
    setActiveImageIndex(0);
    setCurrentStep(0);
  }, [exercise?.id, visible]);

  // Animate 2-image posture loop (rep motion)
  useEffect(() => {
    if (!visible || images.length <= 1) return;
    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % images.length);
    }, WORKOUT_CONSTANTS.POSTURE_ANIMATION_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [images.length, visible]);

  if (!exercise) return null;

  const primaryMuscles =
    exercise.muscles?.filter((m) => m.isPrimary).map((m) => m.muscle.name) || [];
  const secondaryMuscles =
    exercise.muscles?.filter((m) => !m.isPrimary).map((m) => m.muscle.name) || [];

  const muscleHighlights = [
    ...getMuscleHighlightData(secondaryMuscles, 1),
    ...getMuscleHighlightData(primaryMuscles, 2),
  ];

  const steps = exercise.instructions
    ? exercise.instructions
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    : [
        "Position yourself securely and align your spine.",
        "Maintain core tension and initiate the movement with control.",
        "Complete the repetition with deliberate eccentric tempo.",
      ];

  const goNext = () => setCurrentStep((prev) => (prev + 1) % steps.length);
  const goPrev = () => setCurrentStep((prev) => (prev - 1 + steps.length) % steps.length);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          {/* Drag Handle */}
          <View style={styles.dragPill} />

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.categoryTag}>
                {exercise.category?.toUpperCase() || "TECHNIQUE GUIDE"}
              </Text>
              <Text style={styles.title} numberOfLines={2}>
                {exercise.name}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color="#1a1917" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* 1. Large Animated Movement Card / Banner */}
            {images.length > 0 ? (
              <TouchableOpacity
                style={styles.imageCard}
                activeOpacity={0.9}
                onPress={() => {
                  if (images.length > 1) {
                    setActiveImageIndex((prev) => (prev + 1) % images.length);
                  }
                }}
              >
                {images.map((img, idx) => (
                  <Image
                    key={img.url + idx}
                    source={{ uri: getHighResUrl(img.url) }}
                    style={[
                      styles.exerciseImage,
                      { opacity: idx === activeImageIndex ? 1 : 0 },
                    ]}
                    resizeMode="contain"
                  />
                ))}

                {/* Looping indicator badge */}
                {images.length > 1 && (
                  <View style={styles.imageLoopBadge}>
                    <View style={styles.imageLoopDot} />
                    <Text style={styles.imageLoopBadgeText}>
                      {activeImageIndex === 0 ? "START" : activeImageIndex === 1 ? "PEAK" : `PHASE ${activeImageIndex + 1}`}
                    </Text>
                  </View>
                )}

                {/* Frame indicator dots */}
                {images.length > 1 && (
                  <View style={styles.imageFrameDots}>
                    {images.map((_, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.frameDot,
                          idx === activeImageIndex && styles.frameDotActive,
                        ]}
                      />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Dumbbell size={36} color="#c24914" />
                <Text style={styles.imagePlaceholderText}>Movement Visual Reference</Text>
              </View>
            )}

            {/* 2. Biomechanical Badges */}
            <View style={styles.badgesRow}>
              {exercise.mechanic && (
                <View style={styles.badgePill}>
                  <Layers size={13} color="#c24914" />
                  <Text style={styles.badgeText}>{exercise.mechanic.toUpperCase()}</Text>
                </View>
              )}
              {exercise.equipment && (
                <View style={styles.badgePill}>
                  <Dumbbell size={13} color="#2d6a4f" />
                  <Text style={styles.badgeTextForest}>{exercise.equipment}</Text>
                </View>
              )}
              {exercise.level && (
                <View style={styles.badgePillNeutral}>
                  <ShieldCheck size={13} color="#49453a" />
                  <Text style={styles.badgeTextNeutral}>{exercise.level}</Text>
                </View>
              )}
            </View>

            {/* 3. Muscle Activation Map */}
            <View style={styles.anatomyCard}>
              <View style={styles.anatomyHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Flame size={15} color="#c24914" />
                  <Text style={styles.sectionHeading}>Target Muscle Activation</Text>
                </View>
                <View style={styles.sideToggle}>
                  <TouchableOpacity
                    onPress={() => setActiveSide("front")}
                    style={[styles.sideToggleBtn, activeSide === "front" && styles.sideToggleBtnActive]}
                  >
                    <Text
                      style={[
                        styles.sideToggleText,
                        activeSide === "front" && styles.sideToggleTextActive,
                      ]}
                    >
                      Front
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setActiveSide("back")}
                    style={[styles.sideToggleBtn, activeSide === "back" && styles.sideToggleBtnActive]}
                  >
                    <Text
                      style={[
                        styles.sideToggleText,
                        activeSide === "back" && styles.sideToggleTextActive,
                      ]}
                    >
                      Back
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.anatomyBodyRow}>
                <View style={styles.anatomyHighlighterWrap}>
                  <Body
                    data={muscleHighlights}
                    side={activeSide}
                    scale={0.7}
                    colors={["#f4a261", "#c24914"]} // [Secondary: amber, Primary: terracotta]
                    border="#dcdad4"
                    defaultFill="#f6f3ed"
                  />
                </View>

                <View style={styles.muscleLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: "#c24914" }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.legendLabel}>PRIMARY</Text>
                      <Text style={styles.legendValue}>
                        {primaryMuscles.join(", ") || "Main mover"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: "#f4a261" }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.legendLabel}>SECONDARY</Text>
                      <Text style={styles.legendValue}>
                        {secondaryMuscles.join(", ") || "Synergists"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* 4. Paginated Step-by-Step Form Cues Carousel */}
            <View style={styles.formCuesCard}>
              <View style={styles.formCuesHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Sparkles size={15} color="#c24914" />
                  <Text style={styles.sectionHeading}>Technique & Form Cues</Text>
                </View>
                <Text style={styles.stepCounterText}>
                  Step {currentStep + 1} of {steps.length}
                </Text>
              </View>

              <View style={styles.stepBox}>
                <TouchableOpacity
                  onPress={goPrev}
                  disabled={steps.length <= 1}
                  style={styles.stepArrow}
                  activeOpacity={0.7}
                >
                  <ChevronLeft size={20} color={steps.length > 1 ? "#1a1917" : "#dcdad4"} />
                </TouchableOpacity>

                <View style={styles.stepTextWrapper}>
                  <Text style={styles.stepInstructionText}>{steps[currentStep]}</Text>
                </View>

                <TouchableOpacity
                  onPress={goNext}
                  disabled={steps.length <= 1}
                  style={styles.stepArrow}
                  activeOpacity={0.7}
                >
                  <ChevronRight size={20} color={steps.length > 1 ? "#1a1917" : "#dcdad4"} />
                </TouchableOpacity>
              </View>

              {/* Carousel Dots */}
              {steps.length > 1 && (
                <View style={styles.dotsRow}>
                  {steps.map((_, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => setCurrentStep(idx)}
                      style={[
                        styles.dot,
                        idx === currentStep ? styles.dotActive : styles.dotInactive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(26, 25, 23, 0.6)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "88%",
    paddingTop: 12,
  },
  dragPill: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#dcdad4",
    alignSelf: "center",
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f6f3ed",
  },
  categoryTag: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 10,
    color: "#c24914",
    letterSpacing: 0.8,
  },
  title: {
    fontFamily: "Outfit-Bold",
    fontSize: 20,
    color: "#1a1917",
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f6f3ed",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  imageCard: {
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#1a1917",
    borderWidth: 1,
    borderColor: "#dcdad4",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  exerciseImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  imageLoopBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(26, 25, 23, 0.75)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  imageLoopDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#c24914",
  },
  imageLoopBadgeText: {
    fontFamily: "Outfit-Bold",
    fontSize: 10,
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  imageFrameDots: {
    position: "absolute",
    bottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(26, 25, 23, 0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  frameDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  frameDotActive: {
    width: 14,
    backgroundColor: "#c24914",
  },
  imagePlaceholder: {
    height: 140,
    borderRadius: 16,
    backgroundColor: "#fbeee8",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#dcdad4",
  },
  imagePlaceholderText: {
    fontFamily: "Outfit-Medium",
    fontSize: 13,
    color: "#c24914",
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#fbeee8",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 11,
    color: "#c24914",
  },
  badgeTextForest: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 11,
    color: "#2d6a4f",
  },
  badgePillNeutral: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#f6f3ed",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeTextNeutral: {
    fontFamily: "Outfit-Medium",
    fontSize: 11,
    color: "#49453a",
  },

  /* Anatomy Card */
  anatomyCard: {
    backgroundColor: "#fcf9f3",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#dcdad4",
  },
  anatomyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionHeading: {
    fontFamily: "Outfit-Bold",
    fontSize: 14,
    color: "#1a1917",
  },
  sideToggle: {
    flexDirection: "row",
    backgroundColor: "#f6f3ed",
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: "#dcdad4",
  },
  sideToggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sideToggleBtnActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sideToggleText: {
    fontFamily: "Outfit-Medium",
    fontSize: 11,
    color: "#7a766c",
  },
  sideToggleTextActive: {
    color: "#c24914",
    fontFamily: "Outfit-Bold",
  },
  anatomyBodyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  anatomyHighlighterWrap: {
    width: 110,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  muscleLegend: {
    flex: 1,
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 3,
  },
  legendLabel: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 10,
    color: "#7a766c",
    letterSpacing: 0.6,
  },
  legendValue: {
    fontFamily: "Outfit-Medium",
    fontSize: 12,
    color: "#1a1917",
    marginTop: 1,
  },

  /* Form Cues Carousel */
  formCuesCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#dcdad4",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  formCuesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  stepCounterText: {
    fontFamily: "Outfit-Medium",
    fontSize: 11,
    color: "#7a766c",
  },
  stepBox: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 60,
  },
  stepArrow: {
    padding: 6,
  },
  stepTextWrapper: {
    flex: 1,
    paddingHorizontal: 8,
  },
  stepInstructionText: {
    fontFamily: "Outfit-Regular",
    fontSize: 13,
    lineHeight: 19,
    color: "#1a1917",
    textAlign: "center",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 16,
    backgroundColor: "#c24914",
  },
  dotInactive: {
    width: 6,
    backgroundColor: "#dcdad4",
  },
});
