import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, TouchableOpacity, View } from "react-native";
import { BarChart, LineChart } from "../../components/charts";
import { Card, Icon, Typography } from "../../components";
import { getOverloadFilters, getOverloadHistory } from "../../api/progress";
import { OverloadFilterOption, OverloadHistoryPoint, OverloadPR, OverloadTopSet } from "../../types";
import { useTheme } from "../../theme/themeStore";
import { radius, space } from "../../theme/spacing";

type FilterMode = "muscle" | "split";
type ChartMetric = "weight" | "volume" | "oneRm";

const dateLabel = (date: string) => new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export default function ProgressiveOverloadCard() {
  const theme = useTheme();
  const [mode, setMode] = useState<FilterMode>("muscle");
  const [metric, setMetric] = useState<ChartMetric>("weight");
  const [muscles, setMuscles] = useState<OverloadFilterOption[]>([]);
  const [splitDays, setSplitDays] = useState<OverloadFilterOption[]>([]);
  const [filter, setFilter] = useState<OverloadFilterOption | null>(null);
  const [exercise, setExercise] = useState<{ id: string; name: string } | null>(null);
  const [latestTopSet, setLatestTopSet] = useState<OverloadTopSet | null>(null);
  const [history, setHistory] = useState<OverloadHistoryPoint[]>([]);
  const [prs, setPrs] = useState<OverloadPR[]>([]);

  useEffect(() => {
    getOverloadFilters()
      .then((data) => {
        setMuscles(data.muscles);
        setSplitDays(data.splitDays);
      })
      .catch((error) => console.error("[Overload] filters error:", error));
  }, []);

  useEffect(() => {
    setFilter(null);
    setExercise(null);
    setLatestTopSet(null);
    setHistory([]);
    setPrs([]);
  }, [mode]);

  useEffect(() => {
    if (!exercise) return;
    getOverloadHistory(exercise.id, mode === "split" && filter?.splitDayId ? { id: filter.splitDayId, name: filter.name } : undefined)
      .then((data) => {
        setLatestTopSet(data.latestTopSet);
        setHistory(data.history);
        setPrs(data.prs);
      })
      .catch((error) => console.error("[Overload] history error:", error));
  }, [exercise, filter?.id, filter?.name, mode]);

  const filters = mode === "muscle" ? muscles : splitDays;
  const chartData = useMemo(() => history.map((point) => ({
    label: dateLabel(point.date),
    value: metric === "weight" ? point.topSet?.weightKg ?? 0 : metric === "volume" ? point.totalVolume : point.estimated1rm,
    annotation: point.isDeload ? "Deload" : metric === "weight" && point.topSet ? `×${point.topSet.reps}` : undefined,
    highlighted: metric === "weight" && point.isPR,
  })), [history, metric]);

  return (
    <Card shadow="sm" style={{ padding: space.lg }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.md }}>
        <Icon name="TrendingUp" size={16} color={theme.textMuted} />
        <Typography variant="caption" color={theme.textMuted} weight="600">PROGRESSIVE OVERLOAD</Typography>
      </View>

      <SegmentedControl
        options={[{ label: "By Muscle", value: "muscle" }, { label: "By Split Day", value: "split" }]}
        value={mode}
        onChange={setMode}
      />

      <View style={{ gap: space.sm, marginTop: space.md }}>
        <Dropdown
          label={mode === "muscle" ? "Muscle Group" : "Split Day"}
          value={filter?.name}
          options={filters.map((item) => ({ label: item.name, value: item.id }))}
          onChange={(id) => {
            setFilter(filters.find((item) => item.id === id) ?? null);
            setExercise(null);
          }}
        />
        <Dropdown
          label="Exercise"
          value={exercise?.name}
          disabled={!filter}
          options={(filter?.exercises ?? []).map((item) => ({ label: item.name, value: item.id }))}
          onChange={(id) => setExercise(filter?.exercises.find((item) => item.id === id) ?? null)}
        />
      </View>

      {latestTopSet && (
        <View style={{ flexDirection: "row", gap: space.md, marginTop: space.lg, paddingTop: space.md, borderTopWidth: 1, borderTopColor: theme.border }}>
          <Snapshot label="CURRENT" value={`${latestTopSet.weightKg}kg × ${latestTopSet.reps}`} />
          <Snapshot label="EST. 1RM" value={`${latestTopSet.estimated1rm}kg`} />
        </View>
      )}

      <View style={{ marginTop: space.lg }}>
        {exercise && history.length >= 2 && (
          <SegmentedControl
            options={[{ label: "Weight", value: "weight" }, { label: "Volume", value: "volume" }, { label: "Est. 1RM", value: "oneRm" }]}
            value={metric}
            onChange={setMetric}
          />
        )}

        <View style={{ minHeight: 190, justifyContent: "center", marginTop: exercise && history.length >= 2 ? space.md : 0 }}>
          {!exercise ? (
            <EmptyPrompt text="Select a muscle group and exercise to see your progress" />
          ) : history.length < 2 ? (
            <EmptyPrompt text="Log this exercise a couple more times to see your progression" />
          ) : metric === "volume" ? (
            <BarChart data={chartData} height={190} color={theme.primary} showValues={false} yAxisFormatter={(value) => `${Math.round(value)}kg`} />
          ) : (
            <LineChart data={chartData} height={190} color={theme.primary} yAxisFormatter={(value) => `${Math.round(value)}kg`} />
          )}
        </View>
      </View>

      {prs.length > 0 && (
        <View style={{ marginTop: space.md }}>
          <Typography variant="caption" color={theme.textMuted} weight="600">RECENT PRS</Typography>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingTop: space.sm }}>
            {prs.map((pr) => (
              <View key={pr.id} style={{ backgroundColor: theme.warningBg, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: space.sm, minWidth: 96 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Icon name="Trophy" size={13} color={theme.warning} />
                  <Typography variant="bodySmall" color={theme.textPrimary} weight="700">{pr.weightKg}kg×{pr.reps}</Typography>
                </View>
                <Typography variant="caption" color={theme.textMuted} style={{ marginTop: 2 }}>{dateLabel(pr.achievedAt)}</Typography>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </Card>
  );
}

function Snapshot({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return <View style={{ flex: 1 }}><Typography variant="caption" color={theme.textMuted}>{label}</Typography><Typography variant="heading3" color={theme.textPrimary}>{value}</Typography></View>;
}

function EmptyPrompt({ text }: { text: string }) {
  const theme = useTheme();
  return <Typography variant="bodySmall" color={theme.textMuted} align="center">{text}</Typography>;
}

function SegmentedControl<T extends string>({ options, value, onChange }: { options: { label: string; value: T }[]; value: T; onChange: (value: T) => void }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", backgroundColor: theme.surfaceTertiary, borderRadius: radius.md, padding: 3 }}>
      {options.map((option) => (
        <TouchableOpacity key={option.value} accessibilityRole="button" accessibilityState={{ selected: value === option.value }} onPress={() => onChange(option.value)} style={{ flex: 1, minHeight: 38, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, backgroundColor: value === option.value ? theme.surface : "transparent" }}>
          <Typography variant="bodySmall" color={value === option.value ? theme.textPrimary : theme.textMuted} weight="600">{option.label}</Typography>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function Dropdown({ label, value, options, onChange, disabled = false }: { label: string; value?: string; options: { label: string; value: string }[]; onChange: (value: string) => void; disabled?: boolean }) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  return (
    <>
      <TouchableOpacity disabled={disabled} accessibilityRole="button" accessibilityLabel={label} onPress={() => setVisible(true)} style={{ minHeight: 46, paddingHorizontal: space.md, borderWidth: 1, borderColor: theme.border, borderRadius: radius.md, flexDirection: "row", alignItems: "center", justifyContent: "space-between", opacity: disabled ? 0.5 : 1 }}>
        <Typography variant="bodySmall" color={value ? theme.textPrimary : theme.textMuted}>{value || label}</Typography>
        <Icon name="ChevronDown" size={16} color={theme.textMuted} />
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable onPress={() => setVisible(false)} style={{ flex: 1, justifyContent: "center", padding: space.lg, backgroundColor: "rgba(0,0,0,0.35)" }}>
          <Pressable onPress={(event) => event.stopPropagation()} style={{ backgroundColor: theme.surface, borderRadius: radius.lg, maxHeight: "70%", padding: space.md }}>
            <Typography variant="heading3" color={theme.textPrimary} style={{ marginBottom: space.sm }}>{label}</Typography>
            <ScrollView>
              {options.map((option) => (
                <TouchableOpacity key={option.value} onPress={() => { onChange(option.value); setVisible(false); }} style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: space.sm }}>
                  <Typography variant="body" color={theme.textPrimary}>{option.label}</Typography>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
