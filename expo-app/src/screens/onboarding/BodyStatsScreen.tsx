import React, { useState } from "react";
import { View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../../navigation/types";
import { useOnboarding, OnboardingProvider } from "./OnboardingContext";
import { Screen, Typography, Input, Button } from "../../components";
import { lightTheme } from "../../theme/colors";
import { space } from "../../theme/spacing";

type Props = NativeStackScreenProps<OnboardingStackParamList, "BodyStats">;

function BodyStatsContent({ navigation }: Props) {
  const { data, update } = useOnboarding();
  const [weight, setWeight] = useState(String(data.currentWeight));
  const [height, setHeight] = useState(String(data.height));

  return (
    <Screen scroll padding="lg">
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Typography variant="heading2" color={lightTheme.textPrimary} style={{ marginBottom: space.sm }}>
          Body stats
        </Typography>
        <Typography variant="body" color={lightTheme.textSecondary} style={{ marginBottom: space.xl }}>
          We'll track these over time.
        </Typography>

        <View style={{ gap: space.md }}>
          <Input
            label="Current weight (kg)"
            value={weight}
            onChangeText={setWeight}
            placeholder="70"
            keyboardType="decimal-pad"
          />

          <Input
            label="Height (cm)"
            value={height}
            onChangeText={setHeight}
            placeholder="175"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={{ marginTop: space.lg }}>
          <Button
            title="Continue"
            onPress={() => {
              update({ currentWeight: parseFloat(weight) || 70, height: parseFloat(height) || 175 });
              navigation.navigate("Sleep");
            }}
            variant="primary"
            size="lg"
          />
        </View>
      </View>
    </Screen>
  );
}

export default function BodyStatsScreen(props: Props) {
  return (
    <OnboardingProvider>
      <BodyStatsContent {...props} />
    </OnboardingProvider>
  );
}
