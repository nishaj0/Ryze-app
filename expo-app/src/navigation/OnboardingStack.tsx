import React, { useEffect, useState, useCallback } from "react";
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
import CommunitySplitsScreen from "../screens/profile/CommunitySplitsScreen";

import {
  OnboardingProvider,
  defaultOnboardingData,
} from "../screens/onboarding/OnboardingContext";
import { useAuthStore } from "../store/authStore";
import {
  getOnboardingProgress,
  saveOnboardingProgress,
} from "../utils/storage";
import { useTheme } from "../theme/themeStore";
import { OnboardingData } from "../types";

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

// Screens that are resumable (everything up to SplitSelection)
const RESUMABLE_SCREENS: Array<keyof OnboardingStackParamList> = [
  "Goal",
  "Experience",
  "Days",
  "Equipment",
  "BodyStats",
  "Sleep",
  "SplitSelection",
];

export default function OnboardingStack() {
  const theme = useTheme();
  const { user } = useAuthStore();
  const userId = user?.id ?? "anonymous";

  const [initialData, setInitialData] = useState<Partial<OnboardingData>>(defaultOnboardingData);
  const [resumeScreen, setResumeScreen] = useState<keyof OnboardingStackParamList | null>(null);
  const [ready, setReady] = useState(false);

  // Load any saved progress on mount
  useEffect(() => {
    (async () => {
      const saved = await getOnboardingProgress(userId);
      if (saved) {
        setInitialData(saved.data as Partial<OnboardingData>);
        const screen = saved.lastScreen as keyof OnboardingStackParamList;
        if (RESUMABLE_SCREENS.includes(screen)) {
          setResumeScreen(screen);
        }
      }
      setReady(true);
    })();
  }, [userId]);

  // Persist on every context update
  const handleUpdate = useCallback(
    (data: OnboardingData, lastScreen: keyof OnboardingStackParamList | null) => {
      if (lastScreen) {
        saveOnboardingProgress(userId, data, lastScreen);
      }
    },
    [userId]
  );

  const screenOptions = {
    headerStyle: { backgroundColor: theme.bg },
    headerTintColor: theme.textPrimary,
    headerTitleStyle: {
      fontFamily: "Inter",
      fontWeight: "600" as const,
      fontSize: 18,
      color: theme.textPrimary,
    },
    headerBackTitle: "Back",
  };

  if (!ready) return null;

  return (
    <OnboardingProvider
      initialData={initialData}
      initialLastScreen={resumeScreen}
      onUpdate={handleUpdate}
    >
      <Stack.Navigator
        screenOptions={screenOptions}
        initialRouteName={resumeScreen ?? "Gender"}
      >
        <Stack.Screen name="Gender" component={GenderScreen} options={{ title: "Your Gender" }} />
        <Stack.Screen name="Goal" component={GoalScreen} options={{ title: "Your Goal" }} />
        <Stack.Screen
          name="Experience"
          component={ExperienceScreen}
          options={{ title: "Experience Level" }}
        />
        <Stack.Screen name="Days" component={DaysScreen} options={{ title: "Days Per Week" }} />
        <Stack.Screen
          name="Equipment"
          component={EquipmentScreen}
          options={{ title: "Equipment Access" }}
        />
        <Stack.Screen name="BodyStats" component={BodyStatsScreen} options={{ title: "Body Stats" }} />
        <Stack.Screen name="Sleep" component={SleepScreen} options={{ title: "Sleep Hours" }} />
        <Stack.Screen
          name="SplitSelection"
          component={SplitSelectionScreen}
          options={{ title: "Choose Your Split" }}
        />
        <Stack.Screen
          name="OnboardingCustomSplit"
          component={OnboardingCustomSplitScreen}
          options={{ title: "Create Your Plan" }}
        />
        <Stack.Screen
          name="AISplitBuilder"
          component={AISplitBuilderScreen}
          options={{ title: "Build with AI" }}
        />
        <Stack.Screen
          name="CommunitySplits"
          component={CommunitySplitsScreen}
          options={{ title: "Community Splits" }}
        />
      </Stack.Navigator>
    </OnboardingProvider>
  );
}
