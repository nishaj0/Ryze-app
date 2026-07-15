import React, { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, ScrollView, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Button, Card, CoachResponseBlocks, ExerciseDetailSheet, Icon, Input, Screen, Typography } from "../../components";
import { ChatMessage, ChatResponseBlock, Conversation, createConversation, getChatMessages, getConversations, resolveChatProposal, sendChatMessage } from "../../api/chat";
import { Exercise } from "../../types";
import { useTheme } from "../../theme/themeStore";
import { radius, space } from "../../theme/spacing";

export default function CoachChatScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [exerciseDetailVisible, setExerciseDetailVisible] = useState(false);
  const [selectedExerciseDetail, setSelectedExerciseDetail] = useState<Exercise | null>(null);
  const abortRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  const loadConversations = () => getConversations().then(({ conversations: list }) => setConversations(list)).catch(() => {});
  const load = (convId?: string) => getChatMessages(convId || conversationId || undefined).then(({ messages: nextMessages, conversationId: returnedId }) => {
    if (returnedId && !conversationId) setConversationId(returnedId);
    setMessages(nextMessages);
  }).catch(() => {});

  useEffect(() => { void loadConversations(); void load(); }, []);

  const send = async () => {
    if (!text.trim() || sending) return;
    const content = text.trim();
    setText("");
    setSending(true);
    abortRef.current = { cancelled: false };
    const currentAbort = abortRef.current;
    setMessages((current) => [...current, { id: `local-${Date.now()}`, role: "USER", content, createdAt: new Date().toISOString() }]);
    try {
      const result = await sendChatMessage(content, conversationId || undefined);
      if (currentAbort.cancelled) return;
      if (result.conversationId && !conversationId) setConversationId(result.conversationId);
      await load(result.conversationId || conversationId || undefined);
      void loadConversations();
    } finally { setSending(false); }
  };

  const handleNewChat = async () => {
    abortRef.current.cancelled = true;
    setSending(false);
    setMessages([]);
    setConversationId(null);
    try {
      const { conversation } = await createConversation();
      setConversationId(conversation.id);
      void loadConversations();
    } catch {}
  };

  const handleSelectConversation = (conv: Conversation) => {
    setConversationId(conv.id);
    setHistoryVisible(false);
    void load(conv.id);
  };

  const resolve = async (id: string, confirm: boolean) => { await resolveChatProposal(id, confirm); await load(); };
  const blocksFor = (message: ChatMessage): ChatResponseBlock[] => message.toolCalls?.response?.blocks || [
    { type: "text", content: message.content },
    ...(message.action && !message.outcome ? [{ type: "confirmation_card" as const, action: message.action.type === "SWAP_EXERCISE" ? "swap_exercise" as const : message.action.type === "REST_DAY" ? "mark_rest_day" as const : "regenerate_split" as const, data: { summary: message.action.summary } }] : []),
  ];
  const handleViewExercise = (exercise: Exercise) => {
    setSelectedExerciseDetail(exercise);
    setExerciseDetailVisible(true);
  };

  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}><Screen scroll={false}>
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.sm }}>
      <Typography variant="heading3" color={theme.textPrimary}>Ryze Coach</Typography>
      <View style={{ flexDirection: "row", gap: space.sm }}>
        <TouchableOpacity onPress={() => setHistoryVisible(true)} style={{ padding: space.xs }}><Icon name="History" size={22} color={theme.textSecondary} /></TouchableOpacity>
        <TouchableOpacity onPress={handleNewChat} style={{ padding: space.xs }}><Icon name="Plus" size={22} color={theme.textSecondary} /></TouchableOpacity>
      </View>
    </View>
    <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }}>
      {messages.length === 0 && <Typography variant="body" color={theme.textSecondary}>Ask about your training, progress, split, or check-ins.</Typography>}
      {messages.map((message) => <View key={message.id} style={{ alignSelf: message.role === "USER" ? "flex-end" : "flex-start", maxWidth: "88%" }}>
        {message.role === "USER" ? <Card padding="md" shadow="none" style={{ backgroundColor: theme.primary }}><Typography variant="body" color={theme.primaryText}>{message.content}</Typography></Card> : <CoachResponseBlocks blocks={blocksFor(message)} onResolve={(confirm) => resolve(message.id, confirm)} onNavigate={(screen, params) => navigation.navigate(screen, params)} onViewExercise={handleViewExercise} />}
      </View>)}
    </ScrollView>
    <View style={{ padding: space.md, borderTopWidth: 1, borderTopColor: theme.border }}><Input value={text} onChangeText={setText} placeholder="Ask Ryze Coach…" onSubmitEditing={send} /><Button title={sending ? "Thinking…" : "Send"} onPress={send} disabled={sending} style={{ marginTop: space.sm }} /></View>
    <ExerciseDetailSheet exercise={selectedExerciseDetail} visible={exerciseDetailVisible} onClose={() => setExerciseDetailVisible(false)} />
    <Modal visible={historyVisible} transparent animationType="slide" onRequestClose={() => setHistoryVisible(false)}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: theme.bgOverlay }}>
        <View style={{ backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "70%", paddingBottom: space.xl }}>
          <View style={{ alignItems: "center", paddingVertical: space.sm }}><View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border }} /></View>
          <View style={{ paddingHorizontal: space.lg, paddingBottom: space.md, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="heading3" color={theme.textPrimary}>Conversations</Typography>
            <TouchableOpacity onPress={() => setHistoryVisible(false)}><Icon name="X" size={20} color={theme.textSecondary} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: space.lg, gap: space.sm }}>
            {conversations.length === 0 && <Typography variant="body" color={theme.textSecondary}>No conversations yet.</Typography>}
            {conversations.map((conv) => <TouchableOpacity key={conv.id} onPress={() => handleSelectConversation(conv)} style={{ padding: space.md, backgroundColor: theme.surfaceSecondary, borderRadius: radius.md, borderWidth: 1, borderColor: conv.id === conversationId ? theme.primary : theme.border }}>
              <Typography variant="body" color={theme.textPrimary} numberOfLines={1}>{conv.title || "Chat"}</Typography>
              <Typography variant="caption" color={theme.textSecondary} style={{ marginTop: space.xs }}>{new Date(conv.lastActiveAt).toLocaleDateString()}</Typography>
            </TouchableOpacity>)}
          </ScrollView>
        </View>
      </View>
    </Modal>
  </Screen></KeyboardAvoidingView>;
}
