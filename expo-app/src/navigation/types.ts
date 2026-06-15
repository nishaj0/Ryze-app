import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { CompositeScreenProps, NavigatorScreenParams } from "@react-navigation/native";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type OnboardingStackParamList = {
  Gender: undefined;
  Goal: undefined;
  Experience: undefined;
  Days: undefined;
  Equipment: undefined;
  BodyStats: undefined;
  Sleep: undefined;
  SplitSelection: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  WorkoutLogger: { splitDayId: string; splitDayName: string };
  WorkoutSummary: { sessionId: string };
  WorkoutHistory: undefined;
};

export type WorkoutStackParamList = {
  WorkoutLogger: { splitDayId: string; splitDayName: string };
  ExerciseDetail: { exerciseId: string };
  WorkoutSummary: { sessionId: string };
};

export type ProgressStackParamList = {
  Dashboard: undefined;
  ExerciseProgress: { exerciseId: string; exerciseName: string };
  Records: undefined;
};

export type PhotosStackParamList = {
  PhotosTimeline: undefined;
  PhotoCapture: undefined;
  PhotoCompare: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  SplitSwitcher: undefined;
  SplitDetails: { splitId: string; splitName: string };
  CustomSplit: undefined;
  Settings: undefined;
  Metrics: undefined;
};

export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Workout: NavigatorScreenParams<WorkoutStackParamList>;
  Progress: NavigatorScreenParams<ProgressStackParamList>;
  Photos: NavigatorScreenParams<PhotosStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;
