import React from "react";
import { View, TouchableOpacity } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../../navigation/types";
import { useOnboarding, OnboardingProvider } from "./OnboardingContext";
import { Screen, Typography, Card, Icon } from "../../components";
import { lightTheme } from "../../theme/colors";
import { space } from "../../theme/spacing";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Equipment">;

const options = [
  { value: "FULL_GYM", label: "Full Gym", desc: "Access to barbells, machines, cables, dumbbells", icon: "Dumbbell" as const },
  { value: "HOME", label: "Home Gym", desc: "Basic equipment: dumbbells, bench, maybe a barbell", icon: "Home" as const },
  { value: "LIMITED", label: "Limited", desc: "Minimal equipment or bodyweight only", icon: "Activity" as const },
];

function EquipmentContent({ navigation }: Props) {
  const { data, update } = useOnboarding();

  return (
    <Screen scroll padding="lg">
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Typography variant="heading2" color={lightTheme.textPrimary} style={{ marginBottom: space.sm }}>
          Equipment access?
        </Typography>
        <Typography variant="body" color={lightTheme.textSecondary} style={{ marginBottom: space.xl }}>
          This helps us suggest the right exercises.
        </Typography>

        {options.map((opt) => {
          const isSelected = data.equipmentAccess === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => {
                update({ equipmentAccess: opt.value as any });
                navigation.navigate("BodyStats");
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

export default function EquipmentScreen(props: Props) {
  return <EquipmentContent {...props} />;
}
