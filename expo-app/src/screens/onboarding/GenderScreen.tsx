import React from "react";
import { View, TouchableOpacity } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../../navigation/types";
import { useOnboarding, OnboardingProvider } from "./OnboardingContext";
import { Screen, Typography, Card, Icon } from "../../components";
import { lightTheme } from "../../theme/colors";
import { space } from "../../theme/spacing";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Gender">;

const options = [
  { value: "MALE", label: "Male", icon: "User" as const },
  { value: "FEMALE", label: "Female", icon: "User" as const },
  { value: "OTHER", label: "Other", icon: "Users" as const },
];

function GenderContent({ navigation }: Props) {
  const { data, update } = useOnboarding();

  return (
    <Screen scroll padding="lg">
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Typography variant="heading2" color={lightTheme.textPrimary} style={{ marginBottom: space.sm }}>
          What's your gender?
        </Typography>
        <Typography variant="body" color={lightTheme.textSecondary} style={{ marginBottom: space.xl }}>
          This helps us personalize your experience.
        </Typography>

        {options.map((opt) => {
          const isSelected = data.gender === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => {
                update({ gender: opt.value as any });
                navigation.navigate("Goal");
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
                  <Typography variant="heading3" color={isSelected ? lightTheme.primary : lightTheme.textPrimary}>
                    {opt.label}
                  </Typography>
                  {isSelected && <Icon name="CheckCircle2" size={24} color={lightTheme.primary} style={{ marginLeft: "auto" }} />}
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}
      </View>
    </Screen>
  );
}

export default function GenderScreen(props: Props) {
  return (
    <OnboardingProvider>
      <GenderContent {...props} />
    </OnboardingProvider>
  );
}
