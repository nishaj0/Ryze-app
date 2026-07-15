import React from "react";
import { View } from "react-native";
import { ChatResponseBlock } from "../api/chat";
import { useTheme } from "../theme/themeStore";
import { space } from "../theme/spacing";
import Button from "./Button";
import Card from "./Card";
import Typography from "./Typography";

type Props = { blocks: ChatResponseBlock[]; onResolve: (confirm: boolean) => void; onNavigate: (screen: string, params: Record<string, unknown>) => void };
const asObject = (value: unknown): Record<string, any> => value && typeof value === "object" ? value as Record<string, any> : {};
const asList = (value: unknown): Record<string, any>[] => Array.isArray(value) ? value.map(asObject) : [];

export default function CoachResponseBlocks({ blocks, onResolve, onNavigate }: Props) {
  const theme = useTheme();
  return <View style={{ gap: space.sm }}>{blocks.map((block, index) => {
    if (block.type === "text") return <Card key={`${block.type}-${index}`} padding="md" shadow="none" style={{ backgroundColor: theme.surfaceSecondary }}><Typography variant="body" color={theme.textPrimary}>{block.content}</Typography></Card>;
    if (block.type === "data_card") return <CoachDataCard key={`${block.type}-${index}`} block={block} onNavigate={onNavigate} />;
    if (block.type === "confirmation_card") return <ConfirmationCard key={`${block.type}-${index}`} block={block} onResolve={onResolve} />;
    return <Button key={`${block.type}-${index}`} title={block.label} variant="secondary" size="sm" onPress={() => onNavigate(block.screen, block.params)} />;
  })}</View>;
}

function CoachDataCard({ block, onNavigate }: { block: Extract<ChatResponseBlock, { type: "data_card" }>; onNavigate: Props["onNavigate"] }) {
  const theme = useTheme(); const data = asObject(block.data); const split = asObject(data.split); const sessions = asList(data.sessions); const history = asList(data.history); const checkIns = asList(data.checkIns);
  const title = block.cardType === "split" ? split.name || "Active split" : block.cardType === "session" ? "Recent workouts" : block.cardType === "exercise" ? data.exercise?.name || "Exercise history" : data.title || "Progress summary";
  return <Card padding="md" shadow="sm" style={{ borderWidth: 1, borderColor: theme.border }}><Typography variant="caption" color={theme.primary} weight="700">{block.cardType.toUpperCase()}</Typography><Typography variant="heading3" color={theme.textPrimary} style={{ marginTop: space.xs }}>{title}</Typography>
    {block.cardType === "split" && <View style={{ gap: space.xs, marginTop: space.sm }}>{asList(split.days).slice(0, 4).map((day) => <Typography key={day.id || day.dayNumber} variant="bodySmall" color={theme.textSecondary}>{day.isRest ? "Rest day" : day.name} · {asList(day.exercises).length} exercises</Typography>)}</View>}
    {block.cardType === "session" && <View style={{ gap: space.xs, marginTop: space.sm }}>{sessions.map((session) => <Typography key={session.id} variant="bodySmall" color={theme.textSecondary}>{session.splitDay?.name || "Workout"} · {new Date(session.date).toLocaleDateString()}</Typography>)}</View>}
    {block.cardType === "exercise" && <Typography variant="bodySmall" color={theme.textSecondary} style={{ marginTop: space.sm }}>{history.length} logged session{history.length === 1 ? "" : "s"} · latest: {history[0]?.session?.date ? new Date(history[0].session.date).toLocaleDateString() : "—"}</Typography>}
    {block.cardType === "progress" && <View style={{ gap: space.xs, marginTop: space.sm }}>{checkIns.length > 0 ? checkIns.slice(0, 2).map((checkIn) => <Typography key={checkIn.id} variant="bodySmall" color={theme.textSecondary}>{checkIn.rawText}</Typography>) : <><Typography variant="bodySmall" color={theme.textSecondary}>{data.sessions || 0} completed sessions · {Number(data.volume || 0).toLocaleString()} kg volume</Typography><Typography variant="bodySmall" color={theme.textSecondary}>{data.period || "Recent training"}</Typography></>}</View>}
    {block.deepLink && <View style={{ marginTop: space.md }}><Button title={`View full ${block.cardType}`} size="sm" variant="secondary" onPress={() => onNavigate(block.deepLink!.screen, block.deepLink!.params)} /></View>}
  </Card>;
}

function ConfirmationCard({ block, onResolve }: { block: Extract<ChatResponseBlock, { type: "confirmation_card" }>; onResolve: Props["onResolve"] }) {
  const theme = useTheme();
  return <Card padding="md" style={{ borderColor: theme.primary, borderWidth: 1 }}><Typography variant="caption" color={theme.primary} weight="700">CONFIRM CHANGE</Typography><Typography variant="body" color={theme.textPrimary} style={{ marginTop: space.xs }}>{String(block.data.summary || "Review this proposed change.")}</Typography><View style={{ flexDirection: "row", gap: space.sm, marginTop: space.md }}><Button title="Confirm" onPress={() => onResolve(true)} size="sm" style={{ flex: 1 }} /><Button title="Cancel" onPress={() => onResolve(false)} variant="secondary" size="sm" style={{ flex: 1 }} /></View></Card>;
}
