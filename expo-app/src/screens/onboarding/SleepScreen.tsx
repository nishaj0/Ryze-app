import React, { useState } from "react";
import { View, TouchableOpacity } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../../navigation/types";
import { useOnboarding, OnboardingProvider } from "./OnboardingContext";
import { Screen, Typography, Button, Card, Icon } from "../../components";
import { lightTheme } from "../../theme/colors";
import { space } from "../../theme/spacing";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Sleep">;

function SleepContent({ navigation }: Props) {
  const { data, update } = useOnboarding();
  const [hours, setHours] = useState(data.sleepHours);

  return (
    <Screen scroll padding="lg">
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Typography variant="heading2" color={lightTheme.textPrimary} style={{ marginBottom: space.sm }}>
          Sleep hours?
        </Typography>
        <Typography variant="body" color={lightTheme.textSecondary} style={{ marginBottom: space.xl }}>
          Recovery starts with sleep.
        </Typography>

        {/* Big Number Display */}
        <Card
          padding="lg"
          border={false}
          shadow="sm"
          style={{ alignItems: "center", marginBottom: space.xl, backgroundColor: lightTheme.primaryLight }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.sm }}>
            <Icon name="Moon" size={24} color={lightTheme.primary} />
          </View>
          <Typography variant="display" color={lightTheme.primary} style={{ fontSize: 72 }}>
            {hours}
          </Typography>
          <Typography variant="body" color={lightTheme.textSecondary}>
            hours per night
          </Typography>
        </Card>

        {/* Hour Selector */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: space.md, marginBottom: space.xl }}>
          {[4, 5, 6, 7, 8, 9, 10].map((h) => (
            <TouchableOpacity
              key={h}
              onPress={() => setHours(h)}
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: hours === h ? lightTheme.primary : lightTheme.surfaceSecondary,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: hours === h ? 2 : 1,
                borderColor: hours === h ? lightTheme.primary : lightTheme.border,
              }}
            >
              <Typography variant="heading3" color={hours === h ? lightTheme.primaryText : lightTheme.textPrimary}>
                {h}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title="Continue"
          onPress={() => {
            update({ sleepHours: hours });
            navigation.navigate("SplitSelection");
          }}
          variant="primary"
          size="lg"
        />
      </View>
    </Screen>
  );
}

export default function SleepScreen(props: Props) {
  return (
    <OnboardingProvider>
      <SleepContent {...props} />
    </OnboardingProvider>
  );
}
