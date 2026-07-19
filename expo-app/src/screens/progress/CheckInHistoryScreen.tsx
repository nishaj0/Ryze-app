import React, { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getCheckInHistory } from "../../api/checkins";
import { Card, Icon, Typography } from "../../components";
import { useTheme } from "../../theme/themeStore";
import { radius, space } from "../../theme/spacing";

const presentation = {
  GOOD: { label: "Good", icon: "CheckCircle2" as const, color: "success" as const },
  NEUTRAL: { label: "Neutral", icon: "Circle" as const, color: "textSecondary" as const },
  STRUGGLED: { label: "Struggled", icon: "AlertTriangle" as const, color: "warning" as const },
};

export default function CheckInHistoryScreen() {
  const theme = useTheme();
  const [data, setData] = useState<Awaited<ReturnType<typeof getCheckInHistory>> | null>(null);

  useEffect(() => { getCheckInHistory().then(setData).catch(() => setData({ checkIns: [], summary: { GOOD: 0, NEUTRAL: 0, STRUGGLED: 0 }, days: 30 })); }, []);

  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["bottom"]}>
    <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
      <View>
        <Typography variant="caption" color={theme.textMuted} weight="700">LAST 30 DAYS</Typography>
        <Typography variant="heading2" color={theme.textPrimary}>How training has felt</Typography>
      </View>
      <View style={{ flexDirection: "row", gap: space.sm }}>
        {(["GOOD", "NEUTRAL", "STRUGGLED"] as const).map((sentiment) => <Card key={sentiment} shadow="none" style={{ flex: 1, padding: space.sm, alignItems: "center", backgroundColor: theme.surfaceSecondary }}>
          <Typography variant="heading3" color={theme.textPrimary}>{data?.summary[sentiment] ?? 0}</Typography>
          <Typography variant="caption" color={theme.textMuted}>{presentation[sentiment].label}</Typography>
        </Card>)}
      </View>
      {data?.checkIns.map((checkIn) => {
        const item = presentation[checkIn.sentiment];
        const color = theme[item.color];
        return <Card key={checkIn.id} shadow="sm" style={{ padding: space.md }}>
          <View style={{ flexDirection: "row", gap: space.sm, alignItems: "center" }}>
            <Icon name={item.icon} size={18} color={color} />
            <Typography variant="body" color={color} weight="700">{item.label}</Typography>
            <Typography variant="caption" color={theme.textMuted} style={{ marginLeft: "auto" }}>{new Date(checkIn.createdAt).toLocaleDateString()}</Typography>
          </View>
          <Typography variant="bodySmall" color={theme.textSecondary} style={{ marginTop: space.sm }}>{checkIn.rawText}</Typography>
          {checkIn.extractedIssues.length > 0 && <View style={{ marginTop: space.sm, flexDirection: "row", gap: space.xs, flexWrap: "wrap" }}>{checkIn.extractedIssues.map((issue) => <View key={issue} style={{ backgroundColor: theme.warningBg, borderRadius: radius.sm, paddingHorizontal: space.sm, paddingVertical: 3 }}><Typography variant="caption" color={theme.warningText}>{issue}</Typography></View>)}</View>}
        </Card>;
      })}
      {data && data.checkIns.length === 0 && <Card shadow="sm" style={{ padding: space.lg, alignItems: "center" }}><Typography variant="body" color={theme.textSecondary}>Complete a workout check-in to start seeing your training feel trend.</Typography></Card>}
    </ScrollView>
  </SafeAreaView>;
}
