import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import Markdown from "react-native-markdown-display";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Dumbbell,
  TrendingUp,
  ChevronRight,
} from "lucide-react-native";
import { ChatResponseBlock, ChatAction } from "../api/chat";
import { Exercise } from "../types";

type Props = {
  blocks: ChatResponseBlock[];
  outcome?: string | null;
  action?: ChatAction;
  onResolve: (confirm: boolean) => void;
  onNavigate: (screen: string, params: Record<string, unknown>) => void;
  onViewExercise: (exercise: Exercise) => void;
};

const asObject = (value: unknown): Record<string, any> =>
  value && typeof value === "object" ? (value as Record<string, any>) : {};
const asList = (value: unknown): Record<string, any>[] =>
  Array.isArray(value) ? value.map(asObject) : [];

export default function CoachResponseBlocks({
  blocks,
  outcome,
  action,
  onResolve,
  onNavigate,
  onViewExercise,
}: Props) {
  const markdownStyles = StyleSheet.create({
    body: {
      fontSize: 14,
      fontFamily: "Outfit-Regular",
      lineHeight: 20,
      color: "#1a1917",
    },
    strong: {
      fontFamily: "Outfit-Bold",
      fontWeight: "700",
      color: "#1a1917",
    },
    heading1: {
      fontSize: 18,
      fontFamily: "Outfit-Bold",
      color: "#1a1917",
      marginTop: 8,
      marginBottom: 4,
    },
    heading2: {
      fontSize: 16,
      fontFamily: "Outfit-SemiBold",
      color: "#1a1917",
      marginTop: 6,
      marginBottom: 4,
    },
    heading3: {
      fontSize: 15,
      fontFamily: "Outfit-SemiBold",
      color: "#1a1917",
      marginTop: 4,
      marginBottom: 2,
    },
    bullet_list_icon: {
      color: "#c24914",
      fontSize: 14,
    },
    ordered_list_icon: {
      color: "#c24914",
      fontSize: 14,
    },
  });

  return (
    <View style={styles.container}>
      {blocks.map((block, index) => {
        if (block.type === "text") {
          return (
            <View key={`${block.type}-${index}`} style={styles.textContainer}>
              <Markdown style={markdownStyles}>{block.content}</Markdown>
            </View>
          );
        }
        if (block.type === "data_card") {
          return (
            <CoachDataCard
              key={`${block.type}-${index}`}
              block={block}
              onNavigate={onNavigate}
              onViewExercise={onViewExercise}
            />
          );
        }
        if (block.type === "confirmation_card") {
          return (
            <ConfirmationCard
              key={`${block.type}-${index}`}
              block={block}
              outcome={outcome}
              action={action}
              onResolve={onResolve}
            />
          );
        }
        return (
          <TouchableOpacity
            key={`${block.type}-${index}`}
            style={styles.navActionButton}
            onPress={() => onNavigate(block.screen, block.params)}
            activeOpacity={0.7}
          >
            <Text style={styles.navActionText}>{block.label}</Text>
            <ChevronRight size={14} color="#c24914" />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function CoachDataCard({
  block,
  onNavigate,
  onViewExercise,
}: {
  block: Extract<ChatResponseBlock, { type: "data_card" }>;
  onNavigate: Props["onNavigate"];
  onViewExercise: Props["onViewExercise"];
}) {
  const data = asObject(block.data);
  const split = asObject(data.split);
  const sessions = asList(data.sessions);
  const history = asList(data.history);
  const checkIns = asList(data.checkIns);
  const exercise = asObject(data.exercise);

  const title =
    block.cardType === "split"
      ? split.name || "Active Split"
      : block.cardType === "session"
      ? "Recent Workouts"
      : block.cardType === "exercise"
      ? data.exercise?.name || "Exercise History"
      : block.cardType === "exercise_detail"
      ? exercise.name || "Exercise"
      : data.title || "Progress Summary";

  return (
    <View style={styles.dataCard}>
      <View style={styles.dataCardHeader}>
        <Text style={styles.dataCardTag}>{block.cardType.toUpperCase()}</Text>
        <Text style={styles.dataCardTitle}>{title}</Text>
      </View>

      {block.cardType === "split" && (
        <View style={styles.dataCardBodyList}>
          {asList(split.days)
            .slice(0, 4)
            .map((day, i) => (
              <View key={day.id || i} style={styles.dataCardListItem}>
                <Text style={styles.dataCardListBullet}>•</Text>
                <Text style={styles.dataCardListText}>
                  {day.isRest ? "Rest day" : day.name} ({asList(day.exercises).length} exercises)
                </Text>
              </View>
            ))}
        </View>
      )}

      {block.cardType === "session" && (
        <View style={styles.dataCardBodyList}>
          {sessions.map((session, i) => (
            <View key={session.id || i} style={styles.dataCardListItem}>
              <Text style={styles.dataCardListBullet}>•</Text>
              <Text style={styles.dataCardListText}>
                {session.splitDay?.name || "Workout"} ·{" "}
                {new Date(session.date).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </Text>
            </View>
          ))}
        </View>
      )}

      {block.cardType === "exercise" && (
        <Text style={styles.dataCardBodyText}>
          {history.length} logged session{history.length === 1 ? "" : "s"} · latest:{" "}
          {history[0]?.session?.date
            ? new Date(history[0].session.date).toLocaleDateString()
            : "—"}
        </Text>
      )}

      {block.cardType === "exercise_detail" && (
        <View style={{ gap: 6, marginTop: 4 }}>
          <Text style={styles.dataCardBodyText}>
            {exercise.level || "Intermediate"} · {exercise.mechanic || "Compound"}
          </Text>
          <Text style={styles.dataCardBodySub}>
            Primary:{" "}
            {asList(exercise.muscles)
              .filter((m: any) => m.isPrimary)
              .map((m: any) => m.muscle?.name)
              .join(", ") || "Full Body"}
          </Text>
          <TouchableOpacity
            style={styles.dataCardInlineBtn}
            onPress={() => onViewExercise(exercise as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.dataCardInlineBtnText}>View Full Exercise</Text>
          </TouchableOpacity>
        </View>
      )}

      {block.cardType === "progress" && (
        <View style={styles.dataCardBodyList}>
          {checkIns.length > 0 ? (
            checkIns.slice(0, 2).map((ci, idx) => (
              <Text key={ci.id || idx} style={styles.dataCardBodyText}>
                "{ci.rawText}"
              </Text>
            ))
          ) : (
            <>
              <Text style={styles.dataCardBodyText}>
                {data.sessions || 0} completed sessions ·{" "}
                {Number(data.volume || 0).toLocaleString()} kg total volume
              </Text>
              <Text style={styles.dataCardBodySub}>{data.period || "Last 30 days"}</Text>
            </>
          )}
        </View>
      )}

      {block.deepLink && (
        <TouchableOpacity
          style={styles.dataCardFooterBtn}
          onPress={() => onNavigate(block.deepLink!.screen, block.deepLink!.params)}
          activeOpacity={0.7}
        >
          <Text style={styles.dataCardFooterBtnText}>Open in {block.cardType}</Text>
          <ChevronRight size={13} color="#c24914" />
        </TouchableOpacity>
      )}
    </View>
  );
}

function ConfirmationCard({
  block,
  outcome,
  action,
  onResolve,
}: {
  block: Extract<ChatResponseBlock, { type: "confirmation_card" }>;
  outcome?: string | null;
  action?: ChatAction;
  onResolve: Props["onResolve"];
}) {
  const payload = (action?.payload || block.data || {}) as Record<string, any>;
  const isSwap = block.action === "swap_exercise" || action?.type === "SWAP_EXERCISE";
  const isRest = block.action === "mark_rest_day" || action?.type === "REST_DAY";

  // Parse exercise swap data if available
  const currentEx = payload.currentExerciseName || "Current Exercise";
  const proposedEx = payload.proposedExerciseName || "Proposed Exercise";
  const reason = payload.reason || "Biomechanical optimization & muscle balance";

  const isConfirmed = outcome === "CONFIRMED";
  const isDeclined = outcome === "CANCELLED";
  const isPending = !isConfirmed && !isDeclined;

  return (
    <View
      style={[
        styles.confirmCard,
        isConfirmed && styles.confirmCardConfirmed,
        isDeclined && styles.confirmCardDeclined,
      ]}
    >
      {/* Header Tag */}
      <View style={styles.confirmHeader}>
        <View style={styles.confirmTagRow}>
          <Sparkles size={13} color="#c24914" />
          <Text style={styles.confirmTagText}>
            {isSwap
              ? "SUGGESTED EXERCISE SWAP"
              : isRest
              ? "SCHEDULE REST DAY"
              : "SUGGESTED MODIFICATION"}
          </Text>
        </View>

        {isConfirmed && (
          <View style={styles.statusBadgeConfirmed}>
            <CheckCircle2 size={12} color="#2d6a4f" />
            <Text style={styles.statusBadgeConfirmedText}>Confirmed & Updated</Text>
          </View>
        )}

        {isDeclined && (
          <View style={styles.statusBadgeDeclined}>
            <XCircle size={12} color="#7a766c" />
            <Text style={styles.statusBadgeDeclinedText}>Declined</Text>
          </View>
        )}
      </View>

      {/* Main Content Body */}
      {isSwap ? (
        <View style={styles.swapBody}>
          <View style={styles.swapRow}>
            <View style={styles.exerciseBox}>
              <Text style={styles.exerciseBoxLabel}>CURRENT</Text>
              <Text style={styles.exerciseBoxName} numberOfLines={2}>
                {currentEx}
              </Text>
            </View>

            <View style={styles.arrowCircle}>
              <ArrowRight size={14} color="#c24914" />
            </View>

            <View style={[styles.exerciseBox, styles.exerciseBoxProposed]}>
              <Text style={styles.exerciseBoxLabelProposed}>PROPOSED</Text>
              <Text style={styles.exerciseBoxNameProposed} numberOfLines={2}>
                {proposedEx}
              </Text>
            </View>
          </View>

          {/* Reasoning */}
          {reason && (
            <View style={styles.reasoningRow}>
              <AlertCircle size={13} color="#7a766c" />
              <Text style={styles.reasoningText}>Reason: {reason}</Text>
            </View>
          )}
        </View>
      ) : isRest ? (
        <View style={styles.restBody}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Calendar size={18} color="#c24914" />
            <Text style={styles.restDateText}>
              {payload.date
                ? new Date(payload.date).toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })
                : "Schedule Unplanned Rest Day"}
            </Text>
          </View>
          {payload.reason && (
            <Text style={styles.restReasonText}>Reason: {payload.reason}</Text>
          )}
        </View>
      ) : (
        <Text style={styles.confirmSummaryText}>
          {String(block.data?.summary || action?.summary || "Review this proposed modification.")}
        </Text>
      )}

      {/* Action Buttons (Only shown if pending) */}
      {isPending && (
        <View style={styles.confirmActionsRow}>
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={() => onResolve(true)}
            activeOpacity={0.8}
          >
            <CheckCircle2 size={15} color="#ffffff" />
            <Text style={styles.confirmBtnText}>
              {isSwap ? "Confirm Swap" : "Confirm Modification"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.declineBtn}
            onPress={() => onResolve(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.declineBtnText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  textContainer: {
    paddingVertical: 2,
  },
  navActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dcdad4",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
  },
  navActionText: {
    fontFamily: "Outfit-Medium",
    fontSize: 13,
    color: "#1a1917",
  },
  dataCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dcdad4",
    borderRadius: 14,
    padding: 12,
    marginTop: 4,
  },
  dataCardHeader: {
    marginBottom: 6,
  },
  dataCardTag: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 10,
    color: "#c24914",
    letterSpacing: 0.8,
  },
  dataCardTitle: {
    fontFamily: "Outfit-Bold",
    fontSize: 15,
    color: "#1a1917",
    marginTop: 2,
  },
  dataCardBodyList: {
    gap: 4,
    marginTop: 4,
  },
  dataCardListItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dataCardListBullet: {
    color: "#7a766c",
    fontSize: 12,
  },
  dataCardListText: {
    fontFamily: "Outfit-Regular",
    fontSize: 13,
    color: "#49453a",
  },
  dataCardBodyText: {
    fontFamily: "Outfit-Regular",
    fontSize: 13,
    color: "#49453a",
  },
  dataCardBodySub: {
    fontFamily: "Outfit-Regular",
    fontSize: 12,
    color: "#7a766c",
  },
  dataCardInlineBtn: {
    backgroundColor: "#f6f3ed",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  dataCardInlineBtnText: {
    fontFamily: "Outfit-Medium",
    fontSize: 12,
    color: "#1a1917",
  },
  dataCardFooterBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#f6f3ed",
    paddingTop: 8,
    marginTop: 8,
  },
  dataCardFooterBtnText: {
    fontFamily: "Outfit-Medium",
    fontSize: 12,
    color: "#c24914",
  },

  /* Safe Confirmation Card */
  confirmCard: {
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#c24914",
    borderRadius: 16,
    padding: 14,
    marginTop: 6,
    shadowColor: "#c24914",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  confirmCardConfirmed: {
    borderColor: "#2d6a4f",
    backgroundColor: "#ffffff",
  },
  confirmCardDeclined: {
    borderColor: "#dcdad4",
    backgroundColor: "#f6f3ed",
    opacity: 0.85,
  },
  confirmHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  confirmTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  confirmTagText: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 11,
    color: "#c24914",
    letterSpacing: 0.5,
  },
  statusBadgeConfirmed: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2d6a4f",
  },
  statusBadgeConfirmedText: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 11,
    color: "#2d6a4f",
  },
  statusBadgeDeclined: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#dcdad4",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusBadgeDeclinedText: {
    fontFamily: "Outfit-Medium",
    fontSize: 11,
    color: "#7a766c",
  },

  /* Swap layout */
  swapBody: {
    gap: 10,
  },
  swapRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  exerciseBox: {
    flex: 1,
    backgroundColor: "#f6f3ed",
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: "#dcdad4",
  },
  exerciseBoxProposed: {
    backgroundColor: "#fbeee8",
    borderColor: "#c24914",
  },
  exerciseBoxLabel: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 9,
    color: "#7a766c",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  exerciseBoxLabelProposed: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 9,
    color: "#c24914",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  exerciseBoxName: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 12,
    color: "#49453a",
  },
  exerciseBoxNameProposed: {
    fontFamily: "Outfit-Bold",
    fontSize: 12,
    color: "#c24914",
  },
  arrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#fbeee8",
    alignItems: "center",
    justifyContent: "center",
  },
  reasoningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 2,
  },
  reasoningText: {
    fontFamily: "Outfit-Regular",
    fontSize: 12,
    color: "#7a766c",
    fontStyle: "italic",
    flex: 1,
  },

  /* Rest Day layout */
  restBody: {
    gap: 6,
  },
  restDateText: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 14,
    color: "#1a1917",
  },
  restReasonText: {
    fontFamily: "Outfit-Regular",
    fontSize: 12,
    color: "#7a766c",
  },
  confirmSummaryText: {
    fontFamily: "Outfit-Regular",
    fontSize: 13,
    color: "#1a1917",
  },

  /* Actions */
  confirmActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  confirmBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#c24914",
    borderRadius: 12,
    paddingVertical: 10,
  },
  confirmBtnText: {
    fontFamily: "Outfit-Bold",
    fontSize: 13,
    color: "#ffffff",
  },
  declineBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f6f3ed",
    borderWidth: 1,
    borderColor: "#dcdad4",
    borderRadius: 12,
    paddingVertical: 10,
  },
  declineBtnText: {
    fontFamily: "Outfit-Medium",
    fontSize: 13,
    color: "#7a766c",
  },
});
