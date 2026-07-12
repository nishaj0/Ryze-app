import React, { useState, createContext, useContext, useCallback } from "react";
import { OnboardingData } from "../../types";
import { OnboardingStackParamList } from "../../navigation/types";

interface OnboardingContextType {
  data: OnboardingData;
  update: (partial: Partial<OnboardingData>) => void;
  lastScreen: keyof OnboardingStackParamList | null;
  setLastScreen: (screen: keyof OnboardingStackParamList) => void;
}

export const defaultOnboardingData: OnboardingData = {
  gender: "MALE",
  goal: "GET_FIT",
  experienceLevel: "BEGINNER",
  daysAvailable: 3,
  equipmentAccess: "FULL_GYM",
  currentWeight: 70,
  height: 175,
  sleepHours: 7,
};

interface OnboardingProviderProps {
  children: React.ReactNode;
  initialData?: Partial<OnboardingData>;
  initialLastScreen?: keyof OnboardingStackParamList | null;
  onUpdate?: (data: OnboardingData, lastScreen: keyof OnboardingStackParamList | null) => void;
}

const OnboardingContext = createContext<OnboardingContextType>({
  data: defaultOnboardingData,
  update: () => {},
  lastScreen: null,
  setLastScreen: () => {},
});

export const useOnboarding = () => useContext(OnboardingContext);

export function OnboardingProvider({
  children,
  initialData,
  initialLastScreen = null,
  onUpdate,
}: OnboardingProviderProps) {
  const [data, setData] = useState<OnboardingData>({
    ...defaultOnboardingData,
    ...initialData,
  });
  const [lastScreen, setLastScreenState] = useState<keyof OnboardingStackParamList | null>(
    initialLastScreen
  );

  const update = useCallback(
    (partial: Partial<OnboardingData>) => {
      setData((prev) => {
        const next = { ...prev, ...partial };
        onUpdate?.(next, lastScreen);
        return next;
      });
    },
    [lastScreen, onUpdate]
  );

  const setLastScreen = useCallback(
    (screen: keyof OnboardingStackParamList) => {
      setLastScreenState(screen);
      onUpdate?.(data, screen);
    },
    [data, onUpdate]
  );

  return (
    <OnboardingContext.Provider value={{ data, update, lastScreen, setLastScreen }}>
      {children}
    </OnboardingContext.Provider>
  );
}
