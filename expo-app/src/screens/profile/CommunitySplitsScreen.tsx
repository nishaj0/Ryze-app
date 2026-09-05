import React, { useEffect, useState } from "react";
import { Alert, ActivityIndicator, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../theme/themeStore";
import { space, radius } from "../../theme/spacing";
import { Button, Card, Icon, Screen, Typography } from "../../components";
import { CommunitySplitSort, forkCommunitySplit, listCommunitySplits, toggleSplitLike } from "../../api/splits";
import { Split } from "../../types";
import { useOnboarding } from "../onboarding/OnboardingContext";
import { completeOnboarding } from "../../api/onboarding";
import { clearOnboardingProgress } from "../../utils/storage";
import { useAuthStore } from "../../store/authStore";

type Props = {
  navigation: any;
  route: { params?: { onboarding?: boolean; daysAvailable?: number } };
};

const types = ["All", "PPL", "BRO_SPLIT", "FULL_BODY", "UPPER_LOWER", "CUSTOM"];
const sorts: Array<{ id: CommunitySplitSort; label: string }> = [
  { id: "recent", label: "Recent" },
  { id: "liked", label: "Popular" },
  { id: "saved", label: "Most saved" },
];

export default function CommunitySplitsScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { data: onboardingData } = useOnboarding();
  const { user, token, setAuth } = useAuthStore();
  const onboarding = route.params?.onboarding === true;
  const [splits, setSplits] = useState<Split[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [sort, setSort] = useState<CommunitySplitSort>("recent");
  const [type, setType] = useState("All");
  const [daysPerWeek, setDaysPerWeek] = useState<number | undefined>(
    onboarding ? route.params?.daysAvailable ?? onboardingData.daysAvailable : undefined
  );

  const load = async (nextPage = 1, append = false) => {
    append ? setLoadingMore(true) : setLoading(true);
    try {
      const result = await listCommunitySplits({
        page: nextPage,
        daysPerWeek,
        splitTypeTag: type === "All" ? undefined : type,
        sort,
      });
      setSplits((current) => append ? [...current, ...result.splits] : result.splits);
      setPage(result.page);
      setHasMore(result.hasMore);
    } catch (error) {
      Alert.alert("Community unavailable", "We could not load community splits right now.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { load(); }, [sort, type, daysPerWeek]);

  const handleLike = async (split: Split) => {
    try {
      const result = await toggleSplitLike(split.id);
      setSplits((current) => current.map((item) => item.id === split.id
        ? { ...item, liked: result.liked, likeCount: result.likeCount }
        : item));
    } catch {
      Alert.alert("Could not update like", "Please try again.");
    }
  };

  const handleSave = async (split: Split) => {
    setSavingId(split.id);
    try {
      const result = await forkCommunitySplit(split.id, onboarding);
      if (onboarding) {
        const completed = await completeOnboarding({ ...onboardingData, splitId: result.split.id });
        if (user?.id) await clearOnboardingProgress(user.id);
        await setAuth(token!, completed.user);
        return;
      }
      Alert.alert("Saved to your library", `"${split.name}" is now a private copy. Activate it whenever you're ready.`, [
        { text: "View library", onPress: () => navigation.goBack() },
        { text: "Keep browsing" },
      ]);
      setSplits((current) => current.map((item) => item.id === split.id
        ? { ...item, saveCount: (item.saveCount ?? 0) + 1 }
        : item));
    } catch (error: any) {
      Alert.alert("Could not save split", error.response?.data?.error || "Please try again.");
    } finally {
      setSavingId(null);
    }
  };

  const chipStyle = (selected: boolean) => ({
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    borderRadius: radius.md,
    backgroundColor: selected ? theme.primary : theme.surfaceTertiary,
  });

  return (
    <Screen scroll padding="lg">
      <Typography variant="caption" color={theme.textMuted} weight="700">COMMUNITY LIBRARY</Typography>
      <Typography variant="heading1" color={theme.textPrimary} style={{ marginTop: space.xs }}>
        Find a program
      </Typography>
      <Typography variant="body" color={theme.textSecondary} style={{ marginTop: space.xs, marginBottom: space.md }}>
        Community programs become a private, independent copy when you save them.
      </Typography>

      {onboarding && (
        <Card padding="md" style={{ backgroundColor: theme.primaryLight, marginBottom: space.md }}>
          <Typography variant="bodySmall" color={theme.primary} weight="700">
            Showing {daysPerWeek} day/week programs for your onboarding plan
          </Typography>
        </Card>
      )}

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.xs, marginBottom: space.sm }}>
        {sorts.map((option) => (
          <TouchableOpacity key={option.id} onPress={() => setSort(option.id)} style={chipStyle(sort === option.id)}>
            <Typography variant="caption" color={sort === option.id ? theme.primaryText : theme.textSecondary} weight="700">{option.label}</Typography>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.xs, marginBottom: space.md }}>
        {types.map((option) => (
          <TouchableOpacity key={option} onPress={() => setType(option)} style={chipStyle(type === option)}>
            <Typography variant="caption" color={type === option ? theme.primaryText : theme.textSecondary} weight="700">{option.replace("_", " ")}</Typography>
          </TouchableOpacity>
        ))}
      </View>

      {!onboarding && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.xs, marginBottom: space.md }}>
          {[undefined, 2, 3, 4, 5, 6, 7].map((value) => (
            <TouchableOpacity key={value ?? "all-days"} onPress={() => setDaysPerWeek(value)} style={chipStyle(daysPerWeek === value)}>
              <Typography variant="caption" color={daysPerWeek === value ? theme.primaryText : theme.textSecondary} weight="700">
                {value ? `${value} days` : "Any days"}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading ? <ActivityIndicator color={theme.primary} style={{ marginTop: space.xl }} /> : splits.length === 0 ? (
        <Card padding="lg" style={{ alignItems: "center" }}>
          <Icon name="Search" size={32} color={theme.textMuted} />
          <Typography variant="heading3" color={theme.textPrimary} style={{ marginTop: space.sm }}>No matching programs</Typography>
          <Typography variant="bodySmall" color={theme.textSecondary} align="center" style={{ marginTop: space.xs }}>Try another filter or create a plan of your own.</Typography>
        </Card>
      ) : (
        <View style={{ gap: space.md }}>
          {splits.map((split) => (
            <Card key={split.id} padding="md" shadow="sm">
              <TouchableOpacity onPress={() => navigation.navigate("SplitDetails", { splitId: split.id, splitName: split.name, community: true })} activeOpacity={0.8}>
                <Typography variant="heading3" color={theme.textPrimary}>{split.name}</Typography>
                <Typography variant="bodySmall" color={theme.textSecondary} style={{ marginTop: 4 }} numberOfLines={2}>{split.description || "Community training program"}</Typography>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginTop: space.sm }}>
                  <Typography variant="caption" color={theme.textMuted}>{split.daysPerWeek} days/week</Typography>
                  <Typography variant="caption" color={theme.textMuted}>{split.splitTypeTag?.replace("_", " ") || split.type.replace("_", " ")}</Typography>
                  <Typography variant="caption" color={theme.textMuted}>by {split.creatorDisplayName || "Ryze member"}</Typography>
                </View>
              </TouchableOpacity>
              <View style={{ flexDirection: "row", gap: space.sm, marginTop: space.md }}>
                <TouchableOpacity onPress={() => handleLike(split)} style={{ ...chipStyle(Boolean(split.liked)), flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Icon name="Heart" size={15} color={split.liked ? theme.primaryText : theme.textSecondary} />
                  <Typography variant="caption" color={split.liked ? theme.primaryText : theme.textSecondary} weight="700">{split.likeCount ?? 0}</Typography>
                </TouchableOpacity>
                <Button title={onboarding ? "Save & start" : "Save copy"} onPress={() => handleSave(split)} loading={savingId === split.id} variant="primary" size="sm" style={{ flex: 1 }} />
              </View>
            </Card>
          ))}
          {hasMore && <Button title="Load more" onPress={() => load(page + 1, true)} loading={loadingMore} variant="secondary" size="md" />}
        </View>
      )}
    </Screen>
  );
}
