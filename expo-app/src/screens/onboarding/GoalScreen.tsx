import React from "react";
import { View, TouchableOpacity } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../../navigation/types";
import { useOnboarding, OnboardingProvider } from "./OnboardingContext";
import { Screen, Typography, Card, Icon } from "../../components";
import { useTheme } from "../../theme/themeStore";
import { space } from "../../theme/spacing";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Goal">;

const options = [
  { value: "MUSCLE_GAIN", label: "Build Muscle", desc: "Gain strength and size", icon: "Dumbbell" as const },
  { value: "WEIGHT_LOSS", label: "Lose Weight", desc: "Burn fat and get lean", icon: "Flame" as const },
  { value: "GET_FIT", label: "Get Fit", desc: "Improve overall fitness", icon: "Activity" as const },
  { value: "MAINTAIN", label: "Maintain", desc: "Keep current physique", icon: "Scale" as const },
];

function GoalContent({ navigation }: Props) {
  const theme = useTheme();
  const { data, update, setLastScreen } = useOnboarding();

  return (
    <Screen scroll padding="lg">
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Typography variant="heading2" color={theme.textPrimary} style={{ marginBottom: space.sm }}>
          What's your main goal?
        </Typography>
        <Typography variant="body" color={theme.textSecondary} style={{ marginBottom: space.xl }}>
          We'll tailor your program accordingly.
        </Typography>

        {options.map((opt) => {
          const isSelected = data.goal === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => {
                update({ goal: opt.value as any });
                setLastScreen("Experience");
                navigation.navigate("Experience");
              }}
              style={{ marginBottom: space.md }}
              activeOpacity={0.8}
            >
              <Card
                padding="lg"
                border={true}
                shadow={isSelected ? "sm" : "none"}
                style={{
                  backgroundColor: isSelected ? theme.primaryLight : theme.surface,
                  borderColor: isSelected ? theme.primary : theme.border,
                  borderWidth: isSelected ? 2 : 1,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      backgroundColor: isSelected ? theme.primary : theme.surfaceSecondary,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon name={opt.icon} size={24} color={isSelected ? theme.primaryText : theme.textSecondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="heading3" color={isSelected ? theme.primary : theme.textPrimary}>
                      {opt.label}
                    </Typography>
                    <Typography variant="bodySmall" color={theme.textSecondary} style={{ marginTop: space.xs }}>
                      {opt.desc}
                    </Typography>
                  </View>
                  {isSelected && <Icon name="CheckCircle2" size={24} color={theme.primary} />}
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}
      </View>
    </Screen>
  );
}

export default function GoalScreen(props: Props) {
  const theme = useTheme();
  return <GoalContent {...props} />;
}
