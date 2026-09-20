import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  Sparkles,
  Send,
  History,
  Plus,
  X,
  Dumbbell,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Zap,
} from "lucide-react-native";
import CoachResponseBlocks from "../components/CoachResponseBlocks";
import ExerciseDetailSheet from "../components/ExerciseDetailSheet";
import {
  ChatMessage,
  ChatResponseBlock,
  Conversation,
  createConversation,
  getChatMessages,
  getConversations,
  resolveChatProposal,
  sendChatMessage,
} from "../api/chat";
import { Exercise } from "../types";

const QUICK_PROMPTS = [
  { label: "Analyze my bench progress", icon: TrendingUp },
  { label: "Suggest deload", icon: RotateCcw },
  { label: "Swap today's shoulder exercise", icon: Dumbbell },
  { label: "Check weekly volume", icon: Zap },
];

export default function CoachScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [exerciseDetailVisible, setExerciseDetailVisible] = useState(false);
  const [selectedExerciseDetail, setSelectedExerciseDetail] = useState<Exercise | null>(null);
  const abortRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  const loadConversations = useCallback(() => {
    getConversations()
      .then(({ conversations: list }) => setConversations(list))
      .catch(() => {});
  }, []);

  const load = useCallback((convId?: string) => {
    return getChatMessages(convId || conversationId || undefined)
      .then(({ messages: nextMessages, conversationId: returnedId }) => {
        if (returnedId && !conversationId) setConversationId(returnedId);
        setMessages(nextMessages);
      })
      .catch(() => {});
  }, [conversationId]);

  useEffect(() => {
    loadConversations();
    load();
  }, []);

  const handleSend = async (customText?: string) => {
    const contentToSend = (customText || text).trim();
    if (!contentToSend || sending) return;

    setText("");
    setSending(true);
    abortRef.current = { cancelled: false };
    const currentAbort = abortRef.current;

    // Optimistic user message
    const localId = `local-${Date.now()}`;
    setMessages((current) => [
      ...current,
      {
        id: localId,
        role: "USER",
        content: contentToSend,
        createdAt: new Date().toISOString(),
      },
    ]);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const result = await sendChatMessage(contentToSend, conversationId || undefined);
      if (currentAbort.cancelled) return;
      if (result.conversationId && !conversationId) setConversationId(result.conversationId);
      await load(result.conversationId || conversationId || undefined);
      loadConversations();
    } catch (err: any) {
      console.error("[CoachScreen] Send error:", err);
      const isTimeout = err?.message?.includes("timeout") || err?.code === "ECONNABORTED";
      setMessages((current) => [
        ...current,
        {
          id: `error-${Date.now()}`,
          role: "ASSISTANT",
          content: isTimeout
            ? "The AI Coach request timed out. Please try sending your message again."
            : "I had trouble processing that request. Please try again.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleNewChat = async () => {
    abortRef.current.cancelled = true;
    setSending(false);
    setMessages([]);
    setConversationId(null);
    try {
      const { conversation } = await createConversation();
      setConversationId(conversation.id);
      loadConversations();
    } catch {}
  };

  const handleSelectConversation = (conv: Conversation) => {
    setConversationId(conv.id);
    setHistoryVisible(false);
    load(conv.id);
  };

  const handleResolve = async (messageId: string, confirm: boolean) => {
    try {
      await resolveChatProposal(messageId, confirm);
      await load();
    } catch (err) {
      console.error("[CoachScreen] Resolve error:", err);
    }
  };

  const blocksFor = (message: ChatMessage): ChatResponseBlock[] => {
    if (message.toolCalls?.response?.blocks && message.toolCalls.response.blocks.length > 0) {
      return message.toolCalls.response.blocks;
    }
    const fallback: ChatResponseBlock[] = [{ type: "text", content: message.content }];
    if (message.action) {
      fallback.push({
        type: "confirmation_card",
        action:
          message.action.type === "SWAP_EXERCISE"
            ? "swap_exercise"
            : message.action.type === "REST_DAY"
            ? "mark_rest_day"
            : "regenerate_split",
        data: { summary: message.action.summary, ...message.action.payload },
      });
    }
    return fallback;
  };

  const handleViewExercise = (exercise: Exercise) => {
    setSelectedExerciseDetail(exercise);
    setExerciseDetailVisible(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* 1. Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarIconCircle}>
            <Sparkles size={18} color="#ffffff" />
          </View>
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={styles.headerTitle}>Ryze AI Coach</Text>
              <View style={styles.statusDot} />
            </View>
            <Text style={styles.headerSubtitle}>Biomechanical Copilot</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setHistoryVisible(true)}
            style={styles.headerActionBtn}
            activeOpacity={0.7}
          >
            <History size={18} color="#49453a" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleNewChat}
            style={styles.headerActionBtn}
            activeOpacity={0.7}
          >
            <Plus size={18} color="#49453a" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Quick-Prompt Starter Pills Strip */}
      <View style={styles.pillsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsScroll}
        >
          {QUICK_PROMPTS.map((prompt, idx) => {
            const IconComp = prompt.icon;
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => handleSend(prompt.label)}
                style={styles.pillBtn}
                activeOpacity={0.75}
              >
                <IconComp size={13} color="#c24914" />
                <Text style={styles.pillText}>{prompt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Messages Stream */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Sparkles size={28} color="#c24914" />
              </View>
              <Text style={styles.emptyTitle}>How can I help your training today?</Text>
              <Text style={styles.emptySub}>
                Ask about volume progression, exercise swaps, fatigue deloads, or form mechanics.
              </Text>
            </View>
          )}

          {messages.map((message) => {
            const isUser = message.role === "USER";

            return (
              <View
                key={message.id}
                style={[
                  styles.messageRow,
                  isUser ? styles.messageRowUser : styles.messageRowCoach,
                ]}
              >
                {/* Coach Sparkle Avatar */}
                {!isUser && (
                  <View style={styles.coachAvatarMini}>
                    <Sparkles size={12} color="#ffffff" />
                  </View>
                )}

                <View
                  style={[
                    styles.messageBubble,
                    isUser ? styles.userBubble : styles.coachBubble,
                  ]}
                >
                  {isUser ? (
                    <Text style={styles.userMessageText}>{message.content}</Text>
                  ) : (
                    <CoachResponseBlocks
                      blocks={blocksFor(message)}
                      outcome={message.outcome}
                      action={message.action}
                      onResolve={(confirm) => handleResolve(message.id, confirm)}
                      onNavigate={(screen, params) => navigation.navigate(screen, params)}
                      onViewExercise={handleViewExercise}
                    />
                  )}
                </View>
              </View>
            );
          })}

          {/* Thinking / Typing indicator */}
          {sending && (
            <View style={[styles.messageRow, styles.messageRowCoach]}>
              <View style={styles.coachAvatarMini}>
                <Sparkles size={12} color="#ffffff" />
              </View>
              <View style={[styles.messageBubble, styles.coachBubble, styles.thinkingBubble]}>
                <ActivityIndicator size="small" color="#c24914" />
                <Text style={styles.thinkingText}>Ryze Coach is analyzing...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* 4. Bottom Chat Input Bar */}
        <View style={[styles.inputBarWrapper, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={text}
              onChangeText={setText}
              placeholder="Ask Ryze Coach…"
              placeholderTextColor="#7a766c"
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
              multiline={false}
            />
            <TouchableOpacity
              onPress={() => handleSend()}
              disabled={!text.trim() || sending}
              style={[
                styles.sendBtn,
                (!text.trim() || sending) && styles.sendBtnDisabled,
              ]}
              activeOpacity={0.8}
            >
              <Send size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Exercise Detail Sheet */}
      <ExerciseDetailSheet
        exercise={selectedExerciseDetail}
        visible={exerciseDetailVisible}
        onClose={() => setExerciseDetailVisible(false)}
      />

      {/* History Modal */}
      <Modal
        visible={historyVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setHistoryVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.dragPill} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Conversation History</Text>
              <TouchableOpacity
                onPress={() => setHistoryVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#1a1917" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.historyList}>
              {conversations.length === 0 && (
                <Text style={styles.noHistoryText}>No past conversations found.</Text>
              )}
              {conversations.map((conv) => {
                const isActive = conv.id === conversationId;
                return (
                  <TouchableOpacity
                    key={conv.id}
                    onPress={() => handleSelectConversation(conv)}
                    style={[
                      styles.historyItem,
                      isActive && styles.historyItemActive,
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.historyItemTitle,
                          isActive && styles.historyItemTitleActive,
                        ]}
                        numberOfLines={1}
                      >
                        {conv.title || "Chat Session"}
                      </Text>
                      <Text style={styles.historyItemDate}>
                        {new Date(conv.lastActiveAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                    <ArrowRight
                      size={14}
                      color={isActive ? "#c24914" : "#7a766c"}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fcf9f3",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f6f3ed",
    backgroundColor: "#ffffff",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#c24914",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Outfit-Bold",
    fontSize: 17,
    color: "#1a1917",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#2d6a4f",
  },
  headerSubtitle: {
    fontFamily: "Outfit-Regular",
    fontSize: 11,
    color: "#7a766c",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f6f3ed",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#dcdad4",
  },

  /* Starter Pills */
  pillsContainer: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#dcdad4",
    paddingVertical: 8,
  },
  pillsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fcf9f3",
    borderWidth: 1,
    borderColor: "#dcdad4",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pillText: {
    fontFamily: "Outfit-Medium",
    fontSize: 12,
    color: "#49453a",
  },

  /* Messages Stream */
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fbeee8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: "Outfit-Bold",
    fontSize: 18,
    color: "#1a1917",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySub: {
    fontFamily: "Outfit-Regular",
    fontSize: 13,
    color: "#7a766c",
    textAlign: "center",
    lineHeight: 18,
  },
  messageRow: {
    flexDirection: "row",
    gap: 8,
    maxWidth: "92%",
  },
  messageRowUser: {
    alignSelf: "flex-end",
  },
  messageRowCoach: {
    alignSelf: "flex-start",
  },
  coachAvatarMini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#c24914",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: "#c24914",
    borderBottomRightRadius: 4,
  },
  userMessageText: {
    fontFamily: "Outfit-Regular",
    fontSize: 14,
    lineHeight: 20,
    color: "#ffffff",
  },
  coachBubble: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dcdad4",
    borderBottomLeftRadius: 4,
    flex: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  thinkingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
  },
  thinkingText: {
    fontFamily: "Outfit-Regular",
    fontSize: 13,
    color: "#7a766c",
  },

  /* Input Bar */
  inputBarWrapper: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#dcdad4",
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fcf9f3",
    borderWidth: 1,
    borderColor: "#dcdad4",
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 6 : 2,
  },
  textInput: {
    flex: 1,
    fontFamily: "Outfit-Regular",
    fontSize: 14,
    color: "#1a1917",
    paddingVertical: 6,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#c24914",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  sendBtnDisabled: {
    backgroundColor: "#dcdad4",
  },

  /* History Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(26, 25, 23, 0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "75%",
    paddingTop: 12,
  },
  dragPill: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#dcdad4",
    alignSelf: "center",
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f6f3ed",
  },
  modalTitle: {
    fontFamily: "Outfit-Bold",
    fontSize: 17,
    color: "#1a1917",
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f6f3ed",
    alignItems: "center",
    justifyContent: "center",
  },
  historyList: {
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 8,
  },
  noHistoryText: {
    fontFamily: "Outfit-Regular",
    fontSize: 13,
    color: "#7a766c",
    textAlign: "center",
    marginVertical: 20,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fcf9f3",
    borderWidth: 1,
    borderColor: "#dcdad4",
    borderRadius: 12,
    padding: 12,
  },
  historyItemActive: {
    borderColor: "#c24914",
    backgroundColor: "#fbeee8",
  },
  historyItemTitle: {
    fontFamily: "Outfit-Medium",
    fontSize: 13,
    color: "#1a1917",
  },
  historyItemTitleActive: {
    color: "#c24914",
    fontFamily: "Outfit-Bold",
  },
  historyItemDate: {
    fontFamily: "Outfit-Regular",
    fontSize: 11,
    color: "#7a766c",
    marginTop: 2,
  },
});
