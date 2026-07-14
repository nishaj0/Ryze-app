import React, { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { Button, Card, Input, Screen, Typography } from "../../components";
import { ChatMessage, getChatMessages, resolveChatProposal, sendChatMessage } from "../../api/chat";
import { useTheme } from "../../theme/themeStore";
import { space } from "../../theme/spacing";

export default function CoachChatScreen() {
  const theme = useTheme(); const [messages, setMessages] = useState<ChatMessage[]>([]); const [text, setText] = useState(""); const [sending, setSending] = useState(false);
  const load = () => getChatMessages().then(({ messages }) => setMessages(messages)).catch(() => {});
  useEffect(load, []);
  const send = async () => { if (!text.trim() || sending) return; const content = text.trim(); setText(""); setSending(true); setMessages(current => [...current, { id: `local-${Date.now()}`, role: "USER", content, createdAt: new Date().toISOString() }]); try { await sendChatMessage(content); await load(); } finally { setSending(false); } };
  const resolve = async (id: string, confirm: boolean) => { await resolveChatProposal(id, confirm); await load(); };
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}><Screen scroll={false}><ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}><Typography variant="body" color={theme.textSecondary}>Ask about your training, progress, split, or check-ins.</Typography>{messages.map(message => <View key={message.id} style={{ alignSelf: message.role === "USER" ? "flex-end" : "flex-start", maxWidth: "88%" }}><Card padding="md" shadow="none" style={{ backgroundColor: message.role === "USER" ? theme.primary : theme.surfaceSecondary }}><Typography variant="body" color={message.role === "USER" ? theme.primaryText : theme.textPrimary}>{message.content}</Typography></Card>{message.action && !message.outcome && <Card padding="md" style={{ marginTop: space.sm, borderColor: theme.primary, borderWidth: 1 }}><Typography variant="caption" color={theme.primary} weight="700">CONFIRM CHANGE</Typography><Typography variant="body" color={theme.textPrimary} style={{ marginTop: space.xs }}>{message.action.summary}</Typography><View style={{ flexDirection: "row", gap: space.sm, marginTop: space.md }}><Button title="Confirm" onPress={() => resolve(message.id, true)} size="sm" style={{ flex: 1 }} /><Button title="Cancel" onPress={() => resolve(message.id, false)} variant="secondary" size="sm" style={{ flex: 1 }} /></View></Card>}</View>)}</ScrollView><View style={{ padding: space.md, borderTopWidth: 1, borderTopColor: theme.border }}><Input value={text} onChangeText={setText} placeholder="Ask Ryze Coach…" onSubmitEditing={send} /><Button title={sending ? "Thinking…" : "Send"} onPress={send} disabled={sending} style={{ marginTop: space.sm }} /></View></Screen></KeyboardAvoidingView>;
}
