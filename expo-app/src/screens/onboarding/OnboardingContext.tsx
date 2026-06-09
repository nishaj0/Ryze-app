import React, { useState, createContext, useContext } from "react";
import { OnboardingData } from "../../types";

interface OnboardingContextType {
  data: OnboardingData;
  update: (partial: Partial<OnboardingData>) => void;
}

const defaultData: OnboardingData = {
  gender: "MALE",
  goal: "GET_FIT",
  experienceLevel: "BEGINNER",
  daysAvailable: 3,
  equipmentAccess: "FULL_GYM",
  currentWeight: 70,
  height: 175,
  sleepHours: 7,
};

const OnboardingContext = createContext<OnboardingContextType>({
  data: defaultData,
  update: () => {},
});

export const useOnboarding = () => useContext(OnboardingContext);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<OnboardingData>(defaultData);

  const update = (partial: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  return (
    <OnboardingContext.Provider value={{ data, update }}>
      {children}
    </OnboardingContext.Provider>
  );
}
