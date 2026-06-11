import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../../navigation/types";
import { useOnboarding, OnboardingProvider } from "./OnboardingContext";
import { getRecommendedSplits, completeOnboarding } from "../../api/onboarding";
import { useAuthStore } from "../../store/authStore";
import { Split } from "../../types";
import { Screen, Typography, Card, Button, Icon } from "../../components";
import { lightTheme } from "../../theme/colors";
import { space } from "../../theme/spacing";

type Props = NativeStackScreenProps<OnboardingStackParamList, "SplitSelection">;

function SplitSelectionContent({ navigation }: Props) {
  const { data } = useOnboarding();
  const { setAuth, token } = useAuthStore();
  const [splits, setSplits] = useState<Split[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recommendedType, setRecommendedType] = useState<string | null>(null);

  useEffect(() => {
    loadSplits();
  }, []);

  const loadSplits = async () => {
    try {
      const res = await getRecommendedSplits(data.experienceLevel, data.daysAvailable);
      setSplits(res.splits);
      setRecommendedType(res.recommendedType);
      if (res.splits.length > 0) {
        setSelected(res.splits[0].id);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to load splits");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await completeOnboarding({ ...data, splitId: selected });
      await setAuth(token!, res.user);
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Failed to complete onboarding");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Screen scroll={false} padding="none">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={lightTheme.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll padding="lg">
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Typography variant="heading2" color={lightTheme.textPrimary} style={{ marginBottom: space.sm }}>
          Choose your split
        </Typography>
        <Typography variant="body" color={lightTheme.textSecondary} style={{ marginBottom: space.xl }}>
          Based on your answers, we recommend the highlighted split.
        </Typography>

        {splits.map((split) => {
          const isRecommended = split.type === recommendedType;
          const isSelected = selected === split.id;

          return (
            <TouchableOpacity
              key={split.id}
              onPress={() => setSelected(split.id)}
              style={{ marginBottom: space.md }}
              activeOpacity={0.8}
            >
              <Card
                padding="lg"
                border={true}
                shadow={isSelected ? "sm" : "none"}
                style={{
                  backgroundColor: isSelected ? lightTheme.primaryLight : lightTheme.surface,
                  borderColor: isSelected ? lightTheme.primary : isRecommended ? lightTheme.primary : lightTheme.border,
                  borderWidth: isSelected ? 2 : isRecommended ? 1.5 : 1,
                }}
              >
                {isRecommended && (
                  <View
                    style={{
                      backgroundColor: lightTheme.success.DEFAULT,
                      borderRadius: 8,
                      paddingHorizontal: space.sm,
                      paddingVertical: space.xs,
                      alignSelf: "flex-start",
                      marginBottom: space.sm,
                    }}
                  >
                    <Typography variant="caption" color={lightTheme.primaryText} weight="600">
                      RECOMMENDED
                    </Typography>
                  </View>
                )}
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                  <View style={{ flex: 1 }}>
                    <Typography variant="heading3" color={isSelected ? lightTheme.primary : lightTheme.textPrimary}>
                      {split.name}
                    </Typography>
                    <Typography variant="bodySmall" color={lightTheme.textSecondary} style={{ marginTop: space.xs }}>
                      {split.description}
                    </Typography>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginTop: space.sm }}>
                      <Icon name="Calendar" size={14} color={lightTheme.textMuted} />
                      <Typography variant="caption" color={lightTheme.textMuted}>
                        {split.daysPerWeek} days/week
                      </Typography>
                    </View>
                  </View>
                  {isSelected && <Icon name="CheckCircle2" size={24} color={lightTheme.primary} />}
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}

        <View style={{ marginTop: space.lg }}>
          <Button
            title="Start Training"
            onPress={handleComplete}
            loading={submitting}
            disabled={!selected}
            variant="primary"
            size="lg"
            icon={<Icon name="Rocket" size={20} color={lightTheme.primaryText} />}
          />
        </View>
      </View>
    </Screen>
  );
}

export default function SplitSelectionScreen(props: Props) {
  return <SplitSelectionContent {...props} />;
}
