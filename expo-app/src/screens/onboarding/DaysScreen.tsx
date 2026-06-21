import React, { useState } from "react";
import { View, TouchableOpacity } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../../navigation/types";
import { useOnboarding, OnboardingProvider } from "./OnboardingContext";
import { Screen, Typography, Button, Card } from "../../components";
import { useTheme } from "../../theme/themeStore";
import { space } from "../../theme/spacing";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Days">;

function DaysContent({ navigation }: Props) {
  const theme = useTheme();
  const { data, update } = useOnboarding();
    const [days, setDays] = useState(data.daysAvailable);

  return (
    <Screen scroll padding="lg">
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Typography variant="heading2" color={theme.textPrimary} style={{ marginBottom: space.sm }}>
          How many days per week?
        </Typography>
        <Typography variant="body" color={theme.textSecondary} style={{ marginBottom: space.xl }}>
          How many days can you commit to working out?
        </Typography>

        {/* Big Number Display */}
        <Card
          padding="lg"
          border={false}
          shadow="sm"
          style={{ alignItems: "center", marginBottom: space.xl, backgroundColor: theme.primaryLight }}
        >
          <Typography variant="display" color={theme.primary} style={{ fontSize: 72 }}>
            {days}
          </Typography>
          <Typography variant="body" color={theme.textSecondary}>
            days per week
          </Typography>
        </Card>

        {/* Day Selector */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: space.md, marginBottom: space.xl }}>
          {[1, 2, 3, 4, 5, 6, 7].map((d) => (
            <TouchableOpacity
              key={d}
              onPress={() => setDays(d)}
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: days === d ? theme.primary : theme.surfaceSecondary,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: days === d ? 2 : 1,
                borderColor: days === d ? theme.primary : theme.border,
              }}
            >
              <Typography variant="heading3" color={days === d ? theme.primaryText : theme.textPrimary}>
                {d}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title="Continue"
          onPress={() => {
            update({ daysAvailable: days });
            navigation.navigate("Equipment");
          }}
          variant="primary"
          size="lg"
        />
      </View>
    </Screen>
  );
}

export default function DaysScreen(props: Props) {
  const theme = useTheme();
  return <DaysContent {...props} />;
}
