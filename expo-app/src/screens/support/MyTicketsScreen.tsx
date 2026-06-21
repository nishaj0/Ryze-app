import React, { useEffect, useState, useCallback } from "react";
import { View, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../../navigation/types";
import { getMyTickets, SupportTicket } from "../../api/support";
import { Typography, Card, Icon } from "../../components";
import { useTheme } from "../../theme/themeStore";
import { space, radius } from "../../theme/spacing";

type Props = NativeStackScreenProps<ProfileStackParamList, "MyTickets">;

export default function MyTicketsScreen({ navigation }: Props) {
  const theme = useTheme();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  const loadTickets = useCallback(async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) setLoading(true);
    try {
      const data = await getMyTickets();
      setTickets(data);
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTickets(false);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "RESOLVED":
        return { bg: theme.successBg, text: theme.successText, label: "Resolved" };
      case "IN_PROGRESS":
        return { bg: theme.primaryLight, text: theme.primary, label: "In Progress" };
      default:
        return { bg: theme.warningBg, text: theme.warningText, label: "Pending" };
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "BUG":
        return "Bug Report";
      case "HELP":
        return "Help Request";
      case "EXERCISE_REQUEST":
        return "Exercise Request";
      default:
        return type;
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedTicketId((prev) => (prev === id ? null : id));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["bottom"]}>
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: space.lg, gap: space.md }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          }
        >
          <View style={{ marginBottom: space.sm }}>
            <Typography variant="heading2" color={theme.textPrimary}>
              My Support Tickets
            </Typography>
            <Typography variant="caption" color={theme.textMuted} style={{ marginTop: 2 }}>
              Tap a ticket to view conversation details and admin replies.
            </Typography>
          </View>

          {tickets.length === 0 ? (
            <Card style={{ padding: space.xl, alignItems: "center", justifyContent: "center", gap: space.md, marginTop: space.lg }}>
              <Icon name="MessageSquare" size={32} color={theme.textMuted} />
              <Typography variant="body" color={theme.textSecondary} align="center">
                You have not submitted any support tickets yet.
              </Typography>
            </Card>
          ) : (
            tickets.map((ticket) => {
              const status = getStatusConfig(ticket.status);
              const isExpanded = expandedTicketId === ticket.id;

              return (
                <TouchableOpacity
                  key={ticket.id}
                  activeOpacity={0.9}
                  onPress={() => toggleExpand(ticket.id)}
                >
                  <Card
                    style={{
                      padding: space.md,
                      borderColor: isExpanded ? theme.primary : theme.border,
                      borderWidth: isExpanded ? 1.5 : 1,
                    }}
                  >
                    {/* Ticket Header Row */}
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Typography variant="caption" color={theme.textMuted} weight="700">
                          {getTypeLabel(ticket.type).toUpperCase()}
                        </Typography>
                        <Typography variant="body" color={theme.textPrimary} weight="600" numberOfLines={1}>
                          {ticket.title}
                        </Typography>
                      </View>
                      <View style={{ paddingHorizontal: space.sm, paddingVertical: 4, borderRadius: radius.sm, backgroundColor: status.bg }}>
                        <Typography variant="caption" color={status.text} weight="700" style={{ fontSize: 10 }}>
                          {status.label.toUpperCase()}
                        </Typography>
                      </View>
                    </View>

                    {/* Expandable Body */}
                    {isExpanded && (
                      <View style={{ marginTop: space.md, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: space.md, gap: space.md }}>
                        {/* Description */}
                        <View style={{ gap: space.xs }}>
                          <Typography variant="caption" color={theme.textMuted} weight="700">
                            YOUR DESCRIPTION
                          </Typography>
                          <Typography variant="body" color={theme.textPrimary} style={{ lineHeight: 20 }}>
                            {ticket.description}
                          </Typography>
                        </View>

                        {/* Admin Response */}
                        <View style={{ 
                          padding: space.md, 
                          backgroundColor: theme.surfaceSecondary, 
                          borderRadius: radius.md,
                          borderLeftWidth: 3,
                          borderLeftColor: ticket.adminResponse ? theme.success : theme.textMuted,
                          gap: space.xs
                        }}>
                          <Typography variant="caption" color={ticket.adminResponse ? theme.successText : theme.textMuted} weight="700">
                            {ticket.adminResponse ? "ADMIN RESPONSE" : "AWAITING ADMIN RESPONSE"}
                          </Typography>
                          <Typography variant="body" color={ticket.adminResponse ? theme.textPrimary : theme.textSecondary} style={{ lineHeight: 20 }}>
                            {ticket.adminResponse || "Our support team hasn't responded to this ticket yet. We will get back to you shortly."}
                          </Typography>
                        </View>

                        {/* Footer details */}
                        <Typography variant="caption" color={theme.textMuted} align="right">
                          Submitted on {new Date(ticket.createdAt).toLocaleDateString()}
                        </Typography>
                      </View>
                    )}
                  </Card>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
