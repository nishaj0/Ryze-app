import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "./types";
import GenderScreen from "../screens/onboarding/GenderScreen";
import GoalScreen from "../screens/onboarding/GoalScreen";
import ExperienceScreen from "../screens/onboarding/ExperienceScreen";
import DaysScreen from "../screens/onboarding/DaysScreen";
import EquipmentScreen from "../screens/onboarding/EquipmentScreen";
import BodyStatsScreen from "../screens/onboarding/BodyStatsScreen";
import SleepScreen from "../screens/onboarding/SleepScreen";
import SplitSelectionScreen from "../screens/onboarding/SplitSelectionScreen";
import OnboardingCustomSplitScreen from "../screens/onboarding/OnboardingCustomSplitScreen";
import AISplitBuilderScreen from "../screens/onboarding/AISplitBuilderScreen";

import { OnboardingProvider } from "../screens/onboarding/OnboardingContext";
import { useTheme } from "../theme/themeStore";

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function OnboardingStack() {
  const theme = useTheme();
  const screenOptions = {
    headerStyle: { backgroundColor: theme.bg },
    headerTintColor: theme.textPrimary,
    headerTitleStyle: { fontFamily: "Inter", fontWeight: "600" as const, fontSize: 18, color: theme.textPrimary },
    headerBackTitle: "Back",
  };

  return (
    <OnboardingProvider>
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="Gender" component={GenderScreen} options={{ title: "Your Gender" }} />
        <Stack.Screen name="Goal" component={GoalScreen} options={{ title: "Your Goal" }} />
        <Stack.Screen name="Experience" component={ExperienceScreen} options={{ title: "Experience Level" }} />
        <Stack.Screen name="Days" component={DaysScreen} options={{ title: "Days Per Week" }} />
        <Stack.Screen name="Equipment" component={EquipmentScreen} options={{ title: "Equipment Access" }} />
        <Stack.Screen name="BodyStats" component={BodyStatsScreen} options={{ title: "Body Stats" }} />
        <Stack.Screen name="Sleep" component={SleepScreen} options={{ title: "Sleep Hours" }} />
        <Stack.Screen name="SplitSelection" component={SplitSelectionScreen} options={{ title: "Choose Your Split" }} />
        <Stack.Screen name="OnboardingCustomSplit" component={OnboardingCustomSplitScreen} options={{ title: "Create Your Plan" }} />
        <Stack.Screen name="AISplitBuilder" component={AISplitBuilderScreen} options={{ title: "Build with AI" }} />
      </Stack.Navigator>
    </OnboardingProvider>
  );
}

