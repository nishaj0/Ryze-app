import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  Sparkles,
  Layers,
  Plus,
  Users,
  Wand2,
  CheckCircle2,
  ChevronRight,
  Trash2,
  Edit3,
  Calendar,
  Dumbbell,
} from "lucide-react-native";
import {
  listSplits,
  removeFromLibrary,
  setActiveSplit,
} from "../api/splits";
import { UserSplit, Split } from "../types";

export default function ProgramLibraryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const [userSplits, setUserSplits] = useState<UserSplit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  useEffect(() => {
    loadSplits();
  }, []);

  const loadSplits = async () => {
    try {
      const res = await listSplits();
      setUserSplits(res.userSplits || []);
    } catch (err) {
      console.error("[ProgramLibrary] load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (splitId: string) => {
    setActivatingId(splitId);
    try {
      await setActiveSplit(splitId);
      setUserSplits((prev) =>
        prev.map((us) => ({
          ...us,
          isActive: us.splitId === splitId,
        }))
      );
      Alert.alert("Active Split Changed", "Your active training routine has been updated.");
    } catch (err) {
      Alert.alert("Error", "Failed to activate split.");
    } finally {
      setActivatingId(null);
    }
  };

  const handleDelete = (userSplit: UserSplit) => {
    if (userSplit.isActive) {
      Alert.alert("Cannot Remove Active Split", "Activate another program before removing this one.");
      return;
    }

    Alert.alert(
      "Remove Program",
      `Are you sure you want to remove "${userSplit.split.name}" from your library?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeFromLibrary(userSplit.splitId);
              setUserSplits((prev) => prev.filter((item) => item.id !== userSplit.id));
            } catch (err) {
              Alert.alert("Error", "Failed to remove program.");
            }
          },
        },
      ]
    );
  };

  const activeUserSplit = userSplits.find((us) => us.isActive);
  const otherUserSplits = userSplits.filter((us) => !us.isActive);

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* 1. Header */}
      <View style={styles.header}>
        <Text style={styles.headerTag}>PROGRAM MANAGEMENT</Text>
        <Text style={styles.headerTitle}>Split & Program Library</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Quick Action 3-Button Row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate("CommunitySplits")}
            activeOpacity={0.75}
          >
            <Users size={16} color="#c24914" />
            <Text style={styles.actionBtnText}>Community Library</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate("AISplitBuilder")}
            activeOpacity={0.75}
          >
            <Wand2 size={16} color="#c24914" />
            <Text style={styles.actionBtnText}>Build with AI</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate("CustomSplit")}
            activeOpacity={0.75}
          >
            <Plus size={16} color="#c24914" />
            <Text style={styles.actionBtnText}>Custom Split</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Highlighted Active Split Card */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeading}>Current Training Program</Text>
          <Text style={styles.sectionSub}>Active in Gym Logger</Text>
        </View>

        {activeUserSplit ? (
          <View style={styles.activeCard}>
            <View style={styles.activeCardHeader}>
              <View style={styles.activeBadge}>
                <CheckCircle2 size={12} color="#2d6a4f" />
                <Text style={styles.activeBadgeText}>ACTIVE PROGRAM</Text>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("SplitDetails", {
                      splitId: activeUserSplit.splitId,
                      splitName: activeUserSplit.split.name,
                    })
                  }
                  style={styles.iconBtn}
                  activeOpacity={0.7}
                >
                  <Edit3 size={15} color="#49453a" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.activeSplitTitle}>{activeUserSplit.split.name}</Text>
            {activeUserSplit.split.description && (
              <Text style={styles.activeSplitDesc} numberOfLines={2}>
                {activeUserSplit.split.description}
              </Text>
            )}

            {/* Archetype & Days Meta Tags */}
            <View style={styles.metaTagsRow}>
              <View style={styles.metaTagTerracotta}>
                <Layers size={12} color="#c24914" />
                <Text style={styles.metaTagTerracottaText}>
                  {activeUserSplit.split.type || "Full Body"}
                </Text>
              </View>

              <View style={styles.metaTag}>
                <Calendar size={12} color="#49453a" />
                <Text style={styles.metaTagText}>
                  {activeUserSplit.split.daysPerWeek || activeUserSplit.split.days?.length || 3} days/wk
                </Text>
              </View>

              <View style={styles.metaTag}>
                <Dumbbell size={12} color="#49453a" />
                <Text style={styles.metaTagText}>
                  {activeUserSplit.split.days?.reduce(
                    (acc, d) => acc + (d.exercises?.length || 0),
                    0
                  ) || 18}{" "}
                  Exercises
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.noActiveCard}>
            <Text style={styles.noActiveTitle}>No Active Program Selected</Text>
            <Text style={styles.noActiveSub}>
              Choose a split from your saved library below or generate one with AI.
            </Text>
          </View>
        )}

        {/* 4. Saved Program Library List */}
        <View style={[styles.sectionHeader, { marginTop: 10 }]}>
          <Text style={styles.sectionHeading}>Saved Programs in Library</Text>
          <Text style={styles.sectionSub}>Tap to switch routines</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color="#c24914" style={{ marginVertical: 20 }} />
        ) : otherUserSplits.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>No other saved splits in your library.</Text>
          </View>
        ) : (
          <View style={styles.splitsList}>
            {otherUserSplits.map((us) => (
              <View key={us.id} style={styles.splitCard}>
                <View style={styles.splitCardContent}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.splitName}>{us.split.name}</Text>
                    <View style={styles.splitSubTags}>
                      <Text style={styles.splitTag}>
                        {us.split.type || "Custom"} · {us.split.daysPerWeek || 3} days/wk
                      </Text>
                    </View>
                  </View>

                  <View style={styles.splitCardRightActions}>
                    <TouchableOpacity
                      onPress={() => handleActivate(us.splitId)}
                      disabled={activatingId === us.splitId}
                      style={styles.activateBtn}
                      activeOpacity={0.8}
                    >
                      {activatingId === us.splitId ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={styles.activateBtnText}>Activate</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDelete(us)}
                      style={styles.deleteBtn}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={15} color="#7a766c" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fcf9f3",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f6f3ed",
    backgroundColor: "#ffffff",
  },
  headerTag: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 10,
    color: "#c24914",
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontFamily: "Outfit-Bold",
    fontSize: 22,
    color: "#1a1917",
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },

  /* 3-Button Action Row */
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dcdad4",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  actionBtnText: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 11,
    color: "#1a1917",
    textAlign: "center",
  },

  /* Section Header */
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 4,
  },
  sectionHeading: {
    fontFamily: "Outfit-Bold",
    fontSize: 15,
    color: "#1a1917",
  },
  sectionSub: {
    fontFamily: "Outfit-Regular",
    fontSize: 11,
    color: "#7a766c",
  },

  /* Active Card */
  activeCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "#c24914",
    shadowColor: "#c24914",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    gap: 10,
  },
  activeCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 10,
    color: "#2d6a4f",
    letterSpacing: 0.5,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f6f3ed",
    alignItems: "center",
    justifyContent: "center",
  },
  activeSplitTitle: {
    fontFamily: "Outfit-Bold",
    fontSize: 18,
    color: "#1a1917",
  },
  activeSplitDesc: {
    fontFamily: "Outfit-Regular",
    fontSize: 13,
    color: "#7a766c",
    lineHeight: 18,
  },
  metaTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  metaTagTerracotta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#fbeee8",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaTagTerracottaText: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 11,
    color: "#c24914",
  },
  metaTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#f6f3ed",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaTagText: {
    fontFamily: "Outfit-Medium",
    fontSize: 11,
    color: "#49453a",
  },

  noActiveCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#dcdad4",
    alignItems: "center",
    gap: 4,
  },
  noActiveTitle: {
    fontFamily: "Outfit-Bold",
    fontSize: 15,
    color: "#1a1917",
  },
  noActiveSub: {
    fontFamily: "Outfit-Regular",
    fontSize: 12,
    color: "#7a766c",
    textAlign: "center",
  },

  /* Saved list */
  splitsList: {
    gap: 10,
  },
  splitCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#dcdad4",
  },
  splitCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  splitName: {
    fontFamily: "Outfit-Bold",
    fontSize: 15,
    color: "#1a1917",
  },
  splitSubTags: {
    marginTop: 3,
  },
  splitTag: {
    fontFamily: "Outfit-Regular",
    fontSize: 12,
    color: "#7a766c",
  },
  splitCardRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  activateBtn: {
    backgroundColor: "#c24914",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  activateBtnText: {
    fontFamily: "Outfit-SemiBold",
    fontSize: 12,
    color: "#ffffff",
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f6f3ed",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#dcdad4",
    alignItems: "center",
  },
  emptyCardText: {
    fontFamily: "Outfit-Regular",
    fontSize: 13,
    color: "#7a766c",
  },
});
