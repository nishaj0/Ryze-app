import React, { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Button, Card, CoachResponseBlocks, Input, Screen, Typography } from "../../components";
import { ChatMessage, ChatResponseBlock, getChatMessages, resolveChatProposal, sendChatMessage } from "../../api/chat";
import { useTheme } from "../../theme/themeStore";
import { space } from "../../theme/spacing";

export default function CoachChatScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const load = () => getChatMessages().then(({ messages: nextMessages }) => setMessages(nextMessages)).catch(() => {});

  useEffect(() => { void load(); }, []);

  const send = async () => {
    if (!text.trim() || sending) return;
    const content = text.trim();
    setText("");
    setSending(true);
    setMessages((current) => [...current, { id: `local-${Date.now()}`, role: "USER", content, createdAt: new Date().toISOString() }]);
    try { await sendChatMessage(content); await load(); } finally { setSending(false); }
  };
  const resolve = async (id: string, confirm: boolean) => { await resolveChatProposal(id, confirm); await load(); };
  const blocksFor = (message: ChatMessage): ChatResponseBlock[] => message.toolCalls?.response?.blocks || [
    { type: "text", content: message.content },
    ...(message.action && !message.outcome ? [{ type: "confirmation_card" as const, action: message.action.type === "SWAP_EXERCISE" ? "swap_exercise" as const : message.action.type === "REST_DAY" ? "mark_rest_day" as const : "regenerate_split" as const, data: { summary: message.action.summary } }] : []),
  ];

  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}><Screen scroll={false}>
    <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
      <Typography variant="body" color={theme.textSecondary}>Ask about your training, progress, split, or check-ins.</Typography>
      {messages.map((message) => <View key={message.id} style={{ alignSelf: message.role === "USER" ? "flex-end" : "flex-start", maxWidth: "88%" }}>
        {message.role === "USER" ? <Card padding="md" shadow="none" style={{ backgroundColor: theme.primary }}><Typography variant="body" color={theme.primaryText}>{message.content}</Typography></Card> : <CoachResponseBlocks blocks={blocksFor(message)} onResolve={(confirm) => resolve(message.id, confirm)} onNavigate={(screen, params) => navigation.navigate(screen, params)} />}
      </View>)}
    </ScrollView>
    <View style={{ padding: space.md, borderTopWidth: 1, borderTopColor: theme.border }}><Input value={text} onChangeText={setText} placeholder="Ask Ryze Coach…" onSubmitEditing={send} /><Button title={sending ? "Thinking…" : "Send"} onPress={send} disabled={sending} style={{ marginTop: space.sm }} /></View>
  </Screen></KeyboardAvoidingView>;
}
