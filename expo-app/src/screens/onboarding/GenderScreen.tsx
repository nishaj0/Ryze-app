import React from "react";
import { View, TouchableOpacity } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../../navigation/types";
import { useOnboarding, OnboardingProvider } from "./OnboardingContext";
import { Screen, Typography, Card, Icon } from "../../components";
import { useTheme } from "../../theme/themeStore";
import { space } from "../../theme/spacing";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Gender">;

const options = [
  { value: "MALE", label: "Male", icon: "User" as const },
  { value: "FEMALE", label: "Female", icon: "User" as const },
  { value: "OTHER", label: "Other", icon: "Users" as const },
];

function GenderContent({ navigation }: Props) {
  const theme = useTheme();
  const { data, update } = useOnboarding();

  return (
    <Screen scroll padding="lg">
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Typography variant="heading2" color={theme.textPrimary} style={{ marginBottom: space.sm }}>
          What's your gender?
        </Typography>
        <Typography variant="body" color={theme.textSecondary} style={{ marginBottom: space.xl }}>
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
                  <Typography variant="heading3" color={isSelected ? theme.primary : theme.textPrimary}>
                    {opt.label}
                  </Typography>
                  {isSelected && <View style={{ marginLeft: "auto" }}><Icon name="CheckCircle2" size={24} color={theme.primary} /></View>}
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
  return <GenderContent {...props} />;
}
