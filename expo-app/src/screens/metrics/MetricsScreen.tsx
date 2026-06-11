import React, { useEffect, useState } from "react";
import { View, ScrollView, TouchableOpacity, Modal, Alert, ActivityIndicator, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../../navigation/types";
import { getBodyMetrics, logBodyMetric, deleteBodyMetric } from "../../api/metrics";
import { BodyMetric } from "../../types";
import { Typography, Card, Button, Icon, Input } from "../../components";
import { LineChart } from "../../components/charts";
import { lightTheme } from "../../theme/colors";
import { space, radius } from "../../theme/spacing";
import { useAuthStore } from "../../store/authStore";

type Props = NativeStackScreenProps<ProfileStackParamList, "Metrics">;

const { width: screenW } = Dimensions.get("window");

export default function MetricsScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"weight" | "nutrition">("weight");
  
  // Weight metrics state
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Nutrition state
  const [nutritionLogs, setNutritionLogs] = useState<any[]>([]);
  const [nutritionModalVisible, setNutritionModalVisible] = useState(false);
  const [caloriesInput, setCaloriesInput] = useState("");
  const [proteinInput, setProteinInput] = useState("");
  const [nutritionNotes, setNutritionNotes] = useState("");

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const { getNutritionLogs } = require("../../api/metrics");
      const [bodyRes, nutrRes] = await Promise.all([
        getBodyMetrics(),
        getNutritionLogs().catch(() => ({ logs: [] })),
      ]);
      setMetrics(bodyRes.metrics || []);
      setNutritionLogs(nutrRes.logs || []);
    } catch (err) {
      console.error("[Metrics] load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogWeight = async () => {
    const w = parseFloat(weight);
    if (!w || w <= 0) {
      Alert.alert("Error", "Please enter a valid weight");
      return;
    }
    setSubmitting(true);
    try {
      await logBodyMetric(w, new Date().toISOString(), notes || undefined);
      setModalVisible(false);
      setWeight("");
      setNotes("");
      loadMetrics();
    } catch (err) {
      Alert.alert("Error", "Failed to log weight");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogNutrition = async () => {
    const cal = caloriesInput ? parseInt(caloriesInput) : undefined;
    const prot = proteinInput ? parseInt(proteinInput) : undefined;
    if (!cal && !prot) {
      Alert.alert("Error", "Please enter calories or protein");
      return;
    }
    setSubmitting(true);
    try {
      const { logNutrition } = require("../../api/metrics");
      await logNutrition(cal, prot, new Date().toISOString(), nutritionNotes || undefined);
      setNutritionModalVisible(false);
      setCaloriesInput("");
      setProteinInput("");
      setNutritionNotes("");
      loadMetrics();
    } catch (err) {
      Alert.alert("Error", "Failed to log nutrition");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMetric = (id: string) => {
    Alert.alert("Delete", "Delete this entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteBodyMetric(id);
            setMetrics((prev) => prev.filter((m) => m.id !== id));
          } catch (err) {
            Alert.alert("Error", "Failed to delete");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: lightTheme.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={lightTheme.primary} size="large" />
      </SafeAreaView>
    );
  }

  // Weight Trend logic
  const sortedMetrics = [...metrics].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const latestWeight = sortedMetrics.length > 0 ? sortedMetrics[sortedMetrics.length - 1].weightKg : null;
  const firstWeight = sortedMetrics.length > 0 ? sortedMetrics[0].weightKg : null;
  const change = latestWeight !== null && firstWeight !== null ? latestWeight - firstWeight : 0;
  const changePct = firstWeight && firstWeight > 0 ? (change / firstWeight) * 100 : 0;

  // Personal goal matching trend color logic
  const isTrendGood = () => {
    const userGoal = user?.goal?.toLowerCase() || "";
    if (userGoal.includes("loss") || userGoal.includes("lose")) {
      return change <= 0;
    }
    if (userGoal.includes("gain") || userGoal.includes("bulk")) {
      return change >= 0;
    }
    if (userGoal.includes("maintain") || userGoal.includes("fit")) {
      return Math.abs(change) <= 1.0;
    }
    return true;
  };

  const trendGood = isTrendGood();
  const trendBgColor = trendGood ? lightTheme.successBg : lightTheme.errorBg;
  const trendTextColor = trendGood ? lightTheme.success.DEFAULT : lightTheme.danger.DEFAULT;
  const trendIcon = trendGood ? (change <= 0 && user?.goal?.toLowerCase().includes("loss") ? "TrendingDown" : "TrendingUp") : (change > 0 ? "TrendingUp" : "TrendingDown");

  const weightChartData = sortedMetrics.map((m, i) => ({
    label: `${i + 1}`,
    value: m.weightKg,
  }));

  // Nutrition formatting logic
  const sortedNutrition = [...nutritionLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const getDayLabel = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  const calChartData = sortedNutrition.filter(l => l.calories).map((l) => ({
    label: getDayLabel(l.date),
    value: l.calories || 0,
  }));

  const protChartData = sortedNutrition.filter(l => l.proteinG).map((l) => ({
    label: getDayLabel(l.date),
    value: l.proteinG || 0,
  }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: lightTheme.bg }} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: space.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.lg }}>
          <Typography variant="caption" color={lightTheme.textMuted} weight="600">
            TRACK OVER TIME
          </Typography>
          <Typography variant="heading1" color={lightTheme.textPrimary} style={{ marginTop: space.xs }}>
            Metrics & Logs
          </Typography>
        </View>

        {/* Tab Selector */}
        <View style={{ flexDirection: "row", paddingHorizontal: space.lg, gap: space.sm, marginBottom: space.lg }}>
          <TouchableOpacity
            onPress={() => setActiveTab("weight")}
            style={{
              flex: 1,
              paddingVertical: space.md,
              backgroundColor: activeTab === "weight" ? lightTheme.primary : lightTheme.surfaceSecondary,
              borderRadius: radius.md,
              alignItems: "center",
              borderWidth: 1,
              borderColor: activeTab === "weight" ? lightTheme.primary : lightTheme.border,
            }}
          >
            <Typography variant="body" color={activeTab === "weight" ? lightTheme.primaryText : lightTheme.textPrimary} weight="700">
              Weight
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("nutrition")}
            style={{
              flex: 1,
              paddingVertical: space.md,
              backgroundColor: activeTab === "nutrition" ? lightTheme.primary : lightTheme.surfaceSecondary,
              borderRadius: radius.md,
              alignItems: "center",
              borderWidth: 1,
              borderColor: activeTab === "nutrition" ? lightTheme.primary : lightTheme.border,
            }}
          >
            <Typography variant="body" color={activeTab === "nutrition" ? lightTheme.primaryText : lightTheme.textPrimary} weight="700">
              Nutrition
            </Typography>
          </TouchableOpacity>
        </View>

        {activeTab === "weight" ? (
          /* WEIGHT TAB CONTENT */
          <View>
            {latestWeight !== null && (
              <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
                <Card padding="lg" shadow="sm" style={{ alignItems: "center" }}>
                  <Typography variant="caption" color={lightTheme.textMuted} style={{ marginBottom: space.sm }}>
                    CURRENT WEIGHT
                  </Typography>
                  <Typography variant="display" color={lightTheme.textPrimary} style={{ fontSize: 56, lineHeight: 64 }}>
                    {latestWeight.toFixed(1)}
                    <Typography variant="body" color={lightTheme.textMuted}>kg</Typography>
                  </Typography>
                  {change !== 0 && sortedMetrics.length > 1 && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: space.sm,
                        gap: 4,
                        paddingHorizontal: space.md,
                        paddingVertical: space.xs,
                        borderRadius: radius.full,
                        backgroundColor: trendBgColor,
                      }}
                    >
                      <Icon
                        name={trendIcon}
                        size={14}
                        color={trendTextColor}
                      />
                      <Typography
                        variant="bodySmall"
                        color={trendTextColor}
                        weight="700"
                      >
                        {change > 0 ? "+" : ""}{change.toFixed(1)}kg ({changePct > 0 ? "+" : ""}{changePct.toFixed(1)}%)
                      </Typography>
                    </View>
                  )}
                </Card>
              </View>
            )}

            {/* Weight Trend Chart */}
            {weightChartData.length > 1 && (
              <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
                <Card shadow="sm" style={{ padding: space.lg }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.md }}>
                    <Icon name="TrendingUp" size={16} color={lightTheme.textMuted} />
                    <Typography variant="caption" color={lightTheme.textMuted} weight="700">
                      WEIGHT TREND
                    </Typography>
                  </View>
                  <LineChart
                    data={weightChartData}
                    width={screenW - 80}
                    height={200}
                    color={lightTheme.primary}
                    yAxisFormatter={(v) => `${v.toFixed(0)}`}
                  />
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: space.md, paddingTop: space.md, borderTopWidth: 1, borderTopColor: lightTheme.border }}>
                    <View>
                      <Typography variant="caption" color={lightTheme.textMuted}>START</Typography>
                      <Typography variant="body" color={lightTheme.textPrimary} weight="700">
                        {firstWeight?.toFixed(1)}kg
                      </Typography>
                    </View>
                    <View>
                      <Typography variant="caption" color={lightTheme.textMuted} align="center" style={{ textAlign: "right" }}>ENTRIES</Typography>
                      <Typography variant="body" color={lightTheme.textPrimary} weight="700" align="center" style={{ textAlign: "right" }}>
                        {sortedMetrics.length}
                      </Typography>
                    </View>
                    <View>
                      <Typography variant="caption" color={lightTheme.textMuted} align="right" style={{ textAlign: "right" }}>LATEST</Typography>
                      <Typography variant="body" color={lightTheme.textPrimary} weight="700" align="right" style={{ textAlign: "right" }}>
                        {latestWeight?.toFixed(1)}kg
                      </Typography>
                    </View>
                  </View>
                </Card>
              </View>
            )}

            {/* Weight History */}
            <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.md }}>
                <Icon name="History" size={18} color={lightTheme.textPrimary} />
                <Typography variant="heading3" color={lightTheme.textPrimary}>
                  Weight History
                </Typography>
              </View>

              {sortedMetrics.length === 0 ? (
                <Card padding="lg" shadow="sm" style={{ alignItems: "center" }}>
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      backgroundColor: lightTheme.primaryLight,
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: space.md,
                    }}
                  >
                    <Icon name="Scale" size={28} color={lightTheme.primary} />
                  </View>
                  <Typography variant="body" color={lightTheme.textMuted} align="center">
                    No weight entries yet
                  </Typography>
                </Card>
              ) : (
                sortedMetrics.slice().reverse().map((m) => (
                  <Card key={m.id} shadow="sm" style={{ marginBottom: space.sm, padding: space.md }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: radius.md,
                          backgroundColor: lightTheme.primaryLight,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon name="Scale" size={20} color={lightTheme.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Typography variant="body" color={lightTheme.textPrimary} weight="600">
                          {new Date(m.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </Typography>
                        {m.notes && (
                          <Typography variant="caption" color={lightTheme.textMuted} style={{ marginTop: 2 }}>
                            {m.notes}
                          </Typography>
                        )}
                      </View>
                      <Typography variant="heading3" color={lightTheme.textPrimary}>
                        {m.weightKg}<Typography variant="body" color={lightTheme.textMuted}>kg</Typography>
                      </Typography>
                      <TouchableOpacity
                        onPress={() => handleDeleteMetric(m.id)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: lightTheme.errorBg,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon name="Trash2" size={14} color={lightTheme.danger.DEFAULT} />
                      </TouchableOpacity>
                    </View>
                  </Card>
                ))
              )}
            </View>

            <View style={{ paddingHorizontal: space.lg }}>
              <Button
                title="Log Weight"
                onPress={() => setModalVisible(true)}
                variant="primary"
                size="lg"
                icon={<Icon name="Plus" size={20} color={lightTheme.primaryText} />}
              />
            </View>
          </View>
        ) : (
          /* NUTRITION TAB CONTENT */
          <View>
            {/* Nutrition Charts */}
            {calChartData.length > 1 && (
              <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
                <Card shadow="sm" style={{ padding: space.lg }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.md }}>
                    <Icon name="Flame" size={16} color={lightTheme.warning} />
                    <Typography variant="caption" color={lightTheme.textMuted} weight="700">
                      CALORIES TREND (KCAL)
                    </Typography>
                  </View>
                  <LineChart
                    data={calChartData}
                    width={screenW - 80}
                    height={160}
                    color={lightTheme.warning}
                    yAxisFormatter={(v) => `${Math.round(v)}`}
                  />
                </Card>
              </View>
            )}

            {protChartData.length > 1 && (
              <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
                <Card shadow="sm" style={{ padding: space.lg }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.md }}>
                    <Icon name="Activity" size={16} color={lightTheme.primary} />
                    <Typography variant="caption" color={lightTheme.textMuted} weight="700">
                      PROTEIN TREND (G)
                    </Typography>
                  </View>
                  <LineChart
                    data={protChartData}
                    width={screenW - 80}
                    height={160}
                    color={lightTheme.primary}
                    yAxisFormatter={(v) => `${Math.round(v)}g`}
                  />
                </Card>
              </View>
            )}

            {/* Nutrition History */}
            <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.md }}>
                <Icon name="History" size={18} color={lightTheme.textPrimary} />
                <Typography variant="heading3" color={lightTheme.textPrimary}>
                  Nutrition History
                </Typography>
              </View>

              {sortedNutrition.length === 0 ? (
                <Card padding="lg" shadow="sm" style={{ alignItems: "center" }}>
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      backgroundColor: lightTheme.primaryLight,
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: space.md,
                    }}
                  >
                    <Icon name="Flame" size={28} color={lightTheme.primary} />
                  </View>
                  <Typography variant="body" color={lightTheme.textMuted} align="center">
                    No nutrition logs yet
                  </Typography>
                </Card>
              ) : (
                sortedNutrition.slice().reverse().map((log) => (
                  <Card key={log.id} shadow="sm" style={{ marginBottom: space.sm, padding: space.md }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: radius.md,
                          backgroundColor: lightTheme.primaryLight,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon name="Flame" size={20} color={lightTheme.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Typography variant="body" color={lightTheme.textPrimary} weight="600">
                          {new Date(log.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </Typography>
                        {log.notes && (
                          <Typography variant="caption" color={lightTheme.textMuted} style={{ marginTop: 2 }}>
                            {log.notes}
                          </Typography>
                        )}
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        {log.calories && (
                          <Typography variant="body" color={lightTheme.textPrimary} weight="700">
                            {log.calories} <Typography variant="caption" color={lightTheme.textMuted}>kcal</Typography>
                          </Typography>
                        )}
                        {log.proteinG && (
                          <Typography variant="body" color={lightTheme.primary} weight="700">
                            {log.proteinG} <Typography variant="caption" color={lightTheme.textMuted}>g protein</Typography>
                          </Typography>
                        )}
                      </View>
                    </View>
                  </Card>
                ))
              )}
            </View>

            <View style={{ paddingHorizontal: space.lg }}>
              <Button
                title="Log Daily Nutrition"
                onPress={() => setNutritionModalVisible(true)}
                variant="primary"
                size="lg"
                icon={<Icon name="Plus" size={20} color={lightTheme.primaryText} />}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Log Weight Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: lightTheme.bgOverlay }}>
          <View
            style={{
              backgroundColor: lightTheme.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: space.lg,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: space.lg }}>
              <Typography variant="heading2" color={lightTheme.textPrimary}>
                Log Weight
              </Typography>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="X" size={24} color={lightTheme.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: space.md, marginBottom: space.lg }}>
              <Input
                label="Weight (kg)"
                value={weight}
                onChangeText={setWeight}
                placeholder="70.5"
                keyboardType="decimal-pad"
                icon={<Icon name="Scale" size={20} color={lightTheme.textMuted} />}
              />
              <Input
                label="Notes (optional)"
                value={notes}
                onChangeText={setNotes}
                placeholder="How are you feeling?"
                icon={<Icon name="MessageSquare" size={20} color={lightTheme.textMuted} />}
              />
            </View>

            <Button
              title="Save Entry"
              onPress={handleLogWeight}
              loading={submitting}
              disabled={submitting}
              variant="primary"
              size="lg"
              icon={<Icon name="Save" size={20} color={lightTheme.primaryText} />}
            />
          </View>
        </View>
      </Modal>

      {/* Log Nutrition Modal */}
      <Modal visible={nutritionModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: lightTheme.bgOverlay }}>
          <View
            style={{
              backgroundColor: lightTheme.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: space.lg,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: space.lg }}>
              <Typography variant="heading2" color={lightTheme.textPrimary}>
                Log Daily Nutrition
              </Typography>
              <TouchableOpacity onPress={() => setNutritionModalVisible(false)}>
                <Icon name="X" size={24} color={lightTheme.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: space.md, marginBottom: space.lg }}>
              <Input
                label="Calories (kcal)"
                value={caloriesInput}
                onChangeText={setCaloriesInput}
                placeholder="2500"
                keyboardType="number-pad"
                icon={<Icon name="Flame" size={20} color={lightTheme.textMuted} />}
              />
              <Input
                label="Protein (g)"
                value={proteinInput}
                onChangeText={setProteinInput}
                placeholder="150"
                keyboardType="number-pad"
                icon={<Icon name="Activity" size={20} color={lightTheme.textMuted} />}
              />
              <Input
                label="Notes (optional)"
                value={nutritionNotes}
                onChangeText={setNutritionNotes}
                placeholder="e.g. High carb day, bulking meals"
                icon={<Icon name="MessageSquare" size={20} color={lightTheme.textMuted} />}
              />
            </View>

            <Button
              title="Save Entry"
              onPress={handleLogNutrition}
              loading={submitting}
              disabled={submitting}
              variant="primary"
              size="lg"
              icon={<Icon name="Save" size={20} color={lightTheme.primaryText} />}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
