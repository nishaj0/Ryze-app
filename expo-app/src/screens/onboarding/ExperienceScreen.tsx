import React from "react";
import { View, TouchableOpacity } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../../navigation/types";
import { useOnboarding, OnboardingProvider } from "./OnboardingContext";
import { Screen, Typography, Card, Icon } from "../../components";
import { lightTheme } from "../../theme/colors";
import { space } from "../../theme/spacing";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Experience">;

const options = [
  { value: "BEGINNER", label: "Beginner", desc: "Less than 6 months of training", icon: "Sprout" as const },
  { value: "INTERMEDIATE", label: "Intermediate", desc: "6 months to 2 years", icon: "TreePine" as const },
  { value: "ADVANCED", label: "Advanced", desc: "2+ years of consistent training", icon: "Mountain" as const },
];

function ExperienceContent({ navigation }: Props) {
  const { data, update } = useOnboarding();

  return (
    <Screen scroll padding="lg">
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Typography variant="heading2" color={lightTheme.textPrimary} style={{ marginBottom: space.sm }}>
          Experience level?
        </Typography>
        <Typography variant="body" color={lightTheme.textSecondary} style={{ marginBottom: space.xl }}>
          Be honest — we'll match the right program.
        </Typography>

        {options.map((opt) => {
          const isSelected = data.experienceLevel === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => {
                update({ experienceLevel: opt.value as any });
                navigation.navigate("Days");
              }}
              style={{ marginBottom: space.md }}
              activeOpacity={0.8}
            >
              <Card
                padding="lg"
                border={true}
                shadow={isSelected ? "sm" : "none"}
                style={{
                  backgroundColor: isSelected ? lightTheme.primaryLight : lightTheme.surface,
                  borderColor: isSelected ? lightTheme.primary : lightTheme.border,
                  borderWidth: isSelected ? 2 : 1,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      backgroundColor: isSelected ? lightTheme.primary : lightTheme.surfaceSecondary,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon name={opt.icon} size={24} color={isSelected ? lightTheme.primaryText : lightTheme.textSecondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="heading3" color={isSelected ? lightTheme.primary : lightTheme.textPrimary}>
                      {opt.label}
                    </Typography>
                    <Typography variant="bodySmall" color={lightTheme.textSecondary} style={{ marginTop: space.xs }}>
                      {opt.desc}
                    </Typography>
                  </View>
                  {isSelected && <Icon name="CheckCircle2" size={24} color={lightTheme.primary} />}
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}
      </View>
    </Screen>
  );
}

export default function ExperienceScreen(props: Props) {
  return (
    <OnboardingProvider>
      <ExperienceContent {...props} />
    </OnboardingProvider>
  );
}
