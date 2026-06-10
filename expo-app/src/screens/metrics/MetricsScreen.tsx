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

type Props = NativeStackScreenProps<ProfileStackParamList, "Metrics">;

const { width: screenW } = Dimensions.get("window");

export default function MetricsScreen({ navigation }: Props) {
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const res = await getBodyMetrics();
      setMetrics(res.metrics);
    } catch (err) {
      console.error("[Metrics] load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLog = async () => {
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

  const handleDelete = (id: string) => {
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

  const sortedMetrics = [...metrics].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const latestWeight = sortedMetrics.length > 0 ? sortedMetrics[sortedMetrics.length - 1].weightKg : null;
  const firstWeight = sortedMetrics.length > 0 ? sortedMetrics[0].weightKg : null;
  const change = latestWeight !== null && firstWeight !== null ? latestWeight - firstWeight : 0;
  const changePct = firstWeight && firstWeight > 0 ? (change / firstWeight) * 100 : 0;

  const chartData = sortedMetrics.map((m, i) => ({
    label: `${i + 1}`,
    value: m.weightKg,
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
            Body Weight
          </Typography>
        </View>

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
                    backgroundColor: change < 0 ? lightTheme.successBg : lightTheme.errorBg,
                  }}
                >
                  <Icon
                    name={change < 0 ? "TrendingDown" : "TrendingUp"}
                    size={14}
                    color={change < 0 ? lightTheme.success.DEFAULT : lightTheme.danger.DEFAULT}
                  />
                  <Typography
                    variant="bodySmall"
                    color={change < 0 ? lightTheme.success.DEFAULT : lightTheme.danger.DEFAULT}
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
        {chartData.length > 1 && (
          <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
            <Card shadow="sm" style={{ padding: space.lg }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.md }}>
                <Icon name="TrendingUp" size={16} color={lightTheme.textMuted} />
                <Typography variant="caption" color={lightTheme.textMuted} weight="700">
                  WEIGHT TREND
                </Typography>
              </View>
              <LineChart
                data={chartData}
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

        {/* History */}
        <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.md }}>
            <Icon name="History" size={18} color={lightTheme.textPrimary} />
            <Typography variant="heading3" color={lightTheme.textPrimary}>
              History
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
                No entries yet
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
                    onPress={() => handleDelete(m.id)}
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

        {/* Add Button */}
        <View style={{ paddingHorizontal: space.lg }}>
          <Button
            title="Log Weight"
            onPress={() => setModalVisible(true)}
            variant="primary"
            size="lg"
            icon={<Icon name="Plus" size={20} color={lightTheme.primaryText} />}
          />
        </View>
      </ScrollView>

      {/* Add Modal */}
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
              onPress={handleLog}
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
