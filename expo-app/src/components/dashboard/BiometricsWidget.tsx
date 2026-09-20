import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Scale, Utensils } from "lucide-react-native";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";

export interface BiometricsWidgetProps {
  weightKg?: number;
  weightDeltaStr?: string;
  weightSubtitle?: string;
  currentProteinG?: number;
  targetProteinG?: number;
  onPressWeight?: () => void;
  onPressNutrition?: () => void;
}

export default function BiometricsWidget({
  weightKg = 74.2,
  weightDeltaStr = "+0.4 kg",
  weightSubtitle = "On track with lean mass target",
  currentProteinG = 142,
  targetProteinG = 180,
  onPressWeight,
  onPressNutrition,
}: BiometricsWidgetProps) {
  const proteinPercent = Math.min(100, Math.round((currentProteinG / (targetProteinG || 1)) * 100));

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Today's Biometrics</Text>
        <Text style={styles.updatedText}>DAILY STATS</Text>
      </View>

      <View style={styles.gridRow}>
        {/* Left Card: Weight Trend */}
        <TouchableOpacity
          onPress={onPressWeight}
          activeOpacity={0.75}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconTitleRow}>
              <Scale size={16} color="#7a766c" />
              <Text style={styles.cardTitle}>Weight</Text>
            </View>
            <View style={styles.deltaBadge}>
              <Text style={styles.deltaText}>{weightDeltaStr}</Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.valueRow}>
              <Text style={styles.mainValue}>{weightKg.toFixed(1)}</Text>
              <Text style={styles.unitText}>kg</Text>
            </View>

            {/* Mini Sparkline */}
            <View style={styles.sparklineContainer}>
              <Svg width={100} height={24} viewBox="0 0 100 24">
                <Defs>
                  <LinearGradient id="weightGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <Stop offset="0%" stopColor="#2d6a4f" stopOpacity={0.3} />
                    <Stop offset="100%" stopColor="#2d6a4f" stopOpacity={1} />
                  </LinearGradient>
                </Defs>
                <Path
                  d="M 0 18 Q 25 16, 45 12 T 75 8 T 100 4"
                  fill="none"
                  stroke="url(#weightGrad)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </Svg>
            </View>

            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {weightSubtitle}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Right Card: Protein / Nutrition */}
        <TouchableOpacity
          onPress={onPressNutrition}
          activeOpacity={0.75}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconTitleRow}>
              <Utensils size={16} color="#7a766c" />
              <Text style={styles.cardTitle}>Protein</Text>
            </View>
            <View style={styles.percentBadge}>
              <Text style={styles.percentText}>{proteinPercent}%</Text>
            </View>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.valueRow}>
              <Text style={styles.mainValue}>{currentProteinG}</Text>
              <Text style={styles.unitText}>/ {targetProteinG}g</Text>
            </View>

            {/* Horizontal Progress Bar */}
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${proteinPercent}%` },
                ]}
              />
            </View>

            <Text style={styles.cardSubtitle}>
              {targetProteinG - currentProteinG > 0
                ? `${targetProteinG - currentProteinG}g remaining`
                : "Target achieved!"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    paddingHorizontal: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "Outfit_700Bold",
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1917",
    letterSpacing: -0.2,
  },
  updatedText: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: "#7a766c",
    textTransform: "uppercase",
  },
  gridRow: {
    flexDirection: "row",
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dcdad4",
    padding: 14,
    shadowColor: "#1a1917",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
    justifyContent: "space-between",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  iconTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardTitle: {
    fontFamily: "Outfit_700Bold",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: "#7a766c",
    textTransform: "uppercase",
  },
  deltaBadge: {
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  deltaText: {
    fontFamily: "Outfit_700Bold",
    fontSize: 10,
    fontWeight: "700",
    color: "#2d6a4f",
  },
  percentBadge: {
    backgroundColor: "#fbeee8",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  percentText: {
    fontFamily: "Outfit_700Bold",
    fontSize: 10,
    fontWeight: "700",
    color: "#c24914",
  },
  cardBody: {
    gap: 6,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
  },
  mainValue: {
    fontFamily: "Outfit_700Bold",
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1917",
    letterSpacing: -0.5,
  },
  unitText: {
    fontFamily: "Outfit_500Medium",
    fontSize: 12,
    color: "#7a766c",
  },
  sparklineContainer: {
    height: 24,
    justifyContent: "center",
    marginVertical: 2,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "#f6f3ed",
    borderRadius: 3,
    overflow: "hidden",
    marginVertical: 4,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#c24914",
    borderRadius: 3,
  },
  cardSubtitle: {
    fontFamily: "Outfit_400Regular",
    fontSize: 11,
    color: "#7a766c",
    marginTop: 2,
  },
});
