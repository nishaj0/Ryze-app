import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  Moon,
  Droplets,
  Activity,
  Sparkles,
  CheckCircle2,
  Plus,
  Minus,
  Footprints,
  Compass,
  ArrowRight,
  ShieldAlert,
} from "lucide-react-native";

export default function RestDayScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  // Interactive bio-feedback hydration stepper
  const [hydrationLiters, setHydrationLiters] = useState(2.8);
  const targetHydration = 3.5;

  // Active recovery completion state
  const [completedRoutines, setCompletedRoutines] = useState<string[]>([]);

  const handleHydrationStep = (delta: number) => {
    setHydrationLiters((prev) => {
      const next = Math.max(0, Math.min(6.0, Math.round((prev + delta) * 10) / 10));
      return next;
    });
  };

  const handleToggleRoutine = (id: string, name: string) => {
    if (completedRoutines.includes(id)) {
      setCompletedRoutines((prev) => prev.filter((r) => r !== id));
    } else {
      setCompletedRoutines((prev) => [...prev, id]);
      Alert.alert("Recovery Logged", `Completed "${name}". Great work prioritizing active regeneration!`);
    }
  };

  const todayFormatted = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* 1. Screen Header */}
      <View style={styles.header}>
        <Text style={styles.headerDate}>{todayFormatted.toUpperCase()}</Text>
        <Text style={styles.headerTitle}>Rest & Regeneration</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Readiness Gauge Card */}
        <View style={styles.readinessCard}>
          <View style={styles.readinessTopRow}>
            {/* Circular Gauge Graphic */}
            <View style={styles.gaugeCircle}>
              <Text style={styles.gaugePercentage}>92%</Text>
              <Text style={styles.gaugeLabel}>READINESS</Text>
            </View>

            <View style={styles.readinessMeta}>
              <View style={styles.peakBadge}>
                <Sparkles size={12} color="#2d6a4f" />
                <Text style={styles.peakBadgeText}>Peak Recovery</Text>
              </View>
              <Text style={styles.readinessHeading}>Supercompensation Phase</Text>
              <Text style={styles.readinessSub}>
                CNS fatigue is minimal. Autonomic nervous system balance is primed.
              </Text>
            </View>
          </View>

          {/* Context priming message */}
          <View style={styles.primingNotice}>
            <View style={styles.primingDot} />
            <Text style={styles.primingText}>
              Your muscular system is priming for tomorrow's Upper Body session.
            </Text>
          </View>
        </View>

        {/* 3. 3-Column Aligned Bio-Feedback Widgets */}
        <View style={styles.bioSectionHeader}>
          <Text style={styles.sectionTitle}>Daily Bio-Feedback</Text>
          <Text style={styles.sectionSub}>Synced & Self-Reported</Text>
        </View>

        <View style={styles.bioWidgetsRow}>
          {/* Card 1: Sleep */}
          <View style={styles.bioCard}>
            <View style={styles.bioCardTop}>
              <Moon size={15} color="#c24914" />
              <Text style={styles.bioCardTag}>SLEEP</Text>
            </View>
            <View style={styles.bioCardMiddle}>
              <Text style={styles.bioMetricLarge}>8.2h</Text>
              <Text style={styles.bioMetricSub}>91% Quality</Text>
            </View>
            <Text style={styles.bioCardBottomLabel}>SLEEP LOGGED</Text>
          </View>

          {/* Card 2: DOMS Status */}
          <View style={styles.bioCard}>
            <View style={styles.bioCardTop}>
              <Activity size={15} color="#c24914" />
              <Text style={styles.bioCardTag}>SORENESS</Text>
            </View>
            <View style={styles.bioCardMiddle}>
              <Text style={styles.bioMetricLarge}>Delts</Text>
              <View style={styles.domsBadge}>
                <Text style={styles.domsBadgeText}>MID</Text>
              </View>
            </View>
            <Text style={styles.bioCardBottomLabel}>DOMS STATUS</Text>
          </View>

          {/* Card 3: Hydration */}
          <View style={styles.bioCard}>
            <View style={styles.bioCardTop}>
              <Droplets size={15} color="#2d6a4f" />
              <Text style={styles.bioCardTagForest}>HYDRATION</Text>
            </View>
            <View style={styles.bioCardMiddle}>
              <Text style={styles.bioMetricLarge}>{hydrationLiters.toFixed(1)}L</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  onPress={() => handleHydrationStep(-0.25)}
                  style={styles.stepBtn}
                  activeOpacity={0.7}
                >
                  <Minus size={11} color="#49453a" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleHydrationStep(0.25)}
                  style={styles.stepBtn}
                  activeOpacity={0.7}
                >
                  <Plus size={11} color="#49453a" />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.bioCardBottomLabel}>
              GOAL {targetHydration}L
            </Text>
          </View>
        </View>

        {/* 4. Active Recovery Recommendations */}
        <View style={styles.recoverySection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Active Recovery Recommendations</Text>
            <Text style={styles.sectionSub}>Low Stress & Vascular Flush</Text>
          </View>

          <View style={styles.routinesList}>
            {/* Routine 1: Mobility Flow */}
            <View style={styles.routineCard}>
              <View style={styles.routineIconWrap}>
                <Compass size={20} color="#c24914" />
              </View>
              <View style={styles.routineContent}>
                <View style={styles.routineMetaRow}>
                  <Text style={styles.routineCategory}>MOBILITY</Text>
                  <Text style={styles.routineDuration}>15 MIN</Text>
                </View>
                <Text style={styles.routineTitle}>15-Min Thoracic Mobility Flow</Text>
                <Text style={styles.routineSub}>
                  Decompresses thoracic spine, opens anterior delts & hip flexors.
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    handleToggleRoutine("routine-1", "15-Min Thoracic Mobility Flow")
                  }
                  style={[
                    styles.routineLogBtn,
                    completedRoutines.includes("routine-1") && styles.routineLogBtnDone,
                  ]}
                  activeOpacity={0.8}
                >
                  <CheckCircle2
                    size={14}
                    color={
                      completedRoutines.includes("routine-1") ? "#2d6a4f" : "#ffffff"
                    }
                  />
                  <Text
                    style={[
                      styles.routineLogBtnText,
                      completedRoutines.includes("routine-1") && styles.routineLogBtnTextDone,
                    ]}
                  >
                    {completedRoutines.includes("routine-1")
                      ? "Completed"
                      : "Log Recovery Activity"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Routine 2: Zone 2 Walk */}
            <View style={styles.routineCard}>
              <View style={styles.routineIconWrapForest}>
                <Footprints size={20} color="#2d6a4f" />
              </View>
              <View style={styles.routineContent}>
                <View style={styles.routineMetaRow}>
                  <Text style={styles.routineCategoryForest}>CARDIO FLUSH</Text>
                  <Text style={styles.routineDuration}>20 MIN</Text>
                </View>
                <Text style={styles.routineTitle}>20-Min Zone 2 Outdoor Walk</Text>
                <Text style={styles.routineSub}>
                  Promotes blood circulation, clears systemic metabolites, improves insulin sensitivity.
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    handleToggleRoutine("routine-2", "20-Min Zone 2 Outdoor Walk")
                  }
                  style={[
                    styles.routineLogBtn,
                    completedRoutines.includes("routine-2") && styles.routineLogBtnDone,
                  ]}
                  activeOpacity={0.8}
                >
                  <CheckCircle2
                    size={14}
                    color={
                      completedRoutines.includes("routine-2") ? "#2d6a4f" : "#ffffff"
                    }
                  />
                  <Text
                    style={[
                      styles.routineLogBtnText,
                      completedRoutines.includes("routine-2") && styles.routineLogBtnTextDone,
                    ]}
                  >
                    {completedRoutines.includes("routine-2")
                      ? "Completed"
                      : "Log Recovery Activity"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f6f3ed",
    backgroundColor: "#ffffff",
  },
  headerDate: {
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 20,
  },

  /* Readiness Gauge Card */
  readinessCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#dcdad4",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 14,
  },
  readinessTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  gaugeCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e8f5e9",
    borderWidth: 4,
    borderColor: "#2d6a4f",
    alignItems: "center",
    justifyContent: "center",
  },
  gaugePercentage: {
    fontFamily: "Outfit-Bold",
    fontSize: 22,
    color: "#2d6a4f",
  },
  gaugeLabel: {
    fontFamily: "Outfit-Bold",
    fontSize: 8,
    color: "#2d6a4f",
    letterSpacing: 0.6,
  },
  readinessMeta: {
    flex: 1,
    gap: 4,
  },
  peakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  peakBadgeText: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 10,
    color: "#2d6a4f",
  },
  readinessHeading: {
    fontFamily: "Outfit-Bold",
    fontSize: 15,
    color: "#1a1917",
  },
  readinessSub: {
    fontFamily: "Outfit-Regular",
    fontSize: 12,
    color: "#7a766c",
    lineHeight: 16,
  },
  primingNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fcf9f3",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dcdad4",
  },
  primingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#c24914",
  },
  primingText: {
    fontFamily: "Outfit-Medium",
    fontSize: 12,
    color: "#49453a",
    flex: 1,
  },

  /* 3-Column Aligned Bio-Widgets */
  bioSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: -8,
  },
  sectionTitle: {
    fontFamily: "Outfit-Bold",
    fontSize: 16,
    color: "#1a1917",
  },
  sectionSub: {
    fontFamily: "Outfit-Regular",
    fontSize: 11,
    color: "#7a766c",
  },
  bioWidgetsRow: {
    flexDirection: "row",
    gap: 8,
  },
  bioCard: {
    flex: 1,
    minHeight: 120,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#dcdad4",
    justifyContent: "space-between",
  },
  bioCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  bioCardTag: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 9,
    color: "#c24914",
    letterSpacing: 0.6,
  },
  bioCardTagForest: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 9,
    color: "#2d6a4f",
    letterSpacing: 0.6,
  },
  bioCardMiddle: {
    gap: 2,
    marginVertical: 4,
  },
  bioMetricLarge: {
    fontFamily: "Outfit-Bold",
    fontSize: 18,
    color: "#1a1917",
  },
  bioMetricSub: {
    fontFamily: "Outfit-Regular",
    fontSize: 10,
    color: "#7a766c",
  },
  domsBadge: {
    backgroundColor: "#fbeee8",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  domsBadgeText: {
    fontFamily: "Outfit-Bold",
    fontSize: 9,
    color: "#c24914",
  },
  stepperRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: 2,
  },
  stepBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#f6f3ed",
    borderWidth: 1,
    borderColor: "#dcdad4",
    alignItems: "center",
    justifyContent: "center",
  },
  bioCardBottomLabel: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 9,
    color: "#7a766c",
    letterSpacing: 0.5,
  },

  /* Active Recovery Section */
  recoverySection: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  routinesList: {
    gap: 12,
  },
  routineCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#dcdad4",
    gap: 12,
  },
  routineIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fbeee8",
    alignItems: "center",
    justifyContent: "center",
  },
  routineIconWrapForest: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
    justifyContent: "center",
  },
  routineContent: {
    flex: 1,
    gap: 4,
  },
  routineMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  routineCategory: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 10,
    color: "#c24914",
    letterSpacing: 0.5,
  },
  routineCategoryForest: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 10,
    color: "#2d6a4f",
    letterSpacing: 0.5,
  },
  routineDuration: {
    fontFamily: "Outfit-Medium",
    fontSize: 10,
    color: "#7a766c",
  },
  routineTitle: {
    fontFamily: "Outfit-Bold",
    fontSize: 14,
    color: "#1a1917",
  },
  routineSub: {
    fontFamily: "Outfit-Regular",
    fontSize: 12,
    color: "#7a766c",
    lineHeight: 16,
  },
  routineLogBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#c24914",
    borderRadius: 10,
    paddingVertical: 8,
    marginTop: 8,
  },
  routineLogBtnDone: {
    backgroundColor: "#e8f5e9",
    borderWidth: 1,
    borderColor: "#2d6a4f",
  },
  routineLogBtnText: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 12,
    color: "#ffffff",
  },
  routineLogBtnTextDone: {
    color: "#2d6a4f",
  },
});
