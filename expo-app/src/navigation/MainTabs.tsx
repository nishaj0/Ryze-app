import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MainTabParamList, HomeStackParamList, WorkoutStackParamList, ProgressStackParamList, PhotosStackParamList, ProfileStackParamList } from "./types";
import { Icon } from "../components";
import { useTheme } from "../theme/themeStore";

import HomeScreen from "../screens/home/HomeScreen";
import WorkoutLoggerScreen from "../screens/workout/WorkoutLoggerScreen";
import WorkoutSummaryScreen from "../screens/workout/WorkoutSummaryScreen";
import WorkoutHistoryScreen from "../screens/workout/WorkoutHistoryScreen";
import DashboardScreen from "../screens/progress/DashboardScreen";
import ExerciseProgressScreen from "../screens/progress/ExerciseProgressScreen";
import RecordsScreen from "../screens/progress/RecordsScreen";
import PhotosTimelineScreen from "../screens/photos/PhotosTimelineScreen";
import PhotoCaptureScreen from "../screens/photos/PhotoCaptureScreen";
import PhotoCompareScreen from "../screens/photos/PhotoCompareScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import EditProfileScreen from "../screens/profile/EditProfileScreen";
import SplitSwitcherScreen from "../screens/profile/SplitSwitcherScreen";
import SplitDetailsScreen from "../screens/profile/SplitDetailsScreen";
import CustomSplitScreen from "../screens/profile/CustomSplitScreen";
import SettingsScreen from "../screens/profile/SettingsScreen";
import MetricsScreen from "../screens/metrics/MetricsScreen";
import AllExercisesScreen from "../screens/exercises/AllExercisesScreen";
import RequestExerciseScreen from "../screens/exercises/RequestExerciseScreen";

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStackNav = createNativeStackNavigator<HomeStackParamList>();
const WorkoutStackNav = createNativeStackNavigator<WorkoutStackParamList>();
const ProgressStackNav = createNativeStackNavigator<ProgressStackParamList>();
const PhotosStackNav = createNativeStackNavigator<PhotosStackParamList>();
const ProfileStackNav = createNativeStackNavigator<ProfileStackParamList>();

const tabIcons: Record<string, { active: any; inactive: any }> = {
  Home: { active: "Home", inactive: "Home" },
  Progress: { active: "BarChart3", inactive: "BarChart3" },
  Photos: { active: "Camera", inactive: "Camera" },
  Profile: { active: "User", inactive: "User" },
};

function HomeStack() {
  const theme = useTheme();
  const stackOpts = {
    headerStyle: { backgroundColor: theme.bg },
    headerTintColor: theme.textPrimary,
    headerTitleStyle: { fontFamily: "Inter", fontWeight: "600" as const, fontSize: 18, color: theme.textPrimary },
  };
  return (
    <HomeStackNav.Navigator screenOptions={stackOpts}>
      <HomeStackNav.Screen name="HomeMain" component={HomeScreen} options={{ title: "Home", headerShown: false }} />
      <HomeStackNav.Screen name="WorkoutLogger" component={WorkoutLoggerScreen} options={{ title: "Workout" }} />
      <HomeStackNav.Screen name="WorkoutSummary" component={WorkoutSummaryScreen} options={{ title: "Summary", headerLeft: () => null }} />
      <HomeStackNav.Screen name="WorkoutHistory" component={WorkoutHistoryScreen} options={{ title: "Workout History" }} />
    </HomeStackNav.Navigator>
  );
}

function WorkoutStack() {
  const theme = useTheme();
  const stackOpts = {
    headerStyle: { backgroundColor: theme.bg },
    headerTintColor: theme.textPrimary,
    headerTitleStyle: { fontFamily: "Inter", fontWeight: "600" as const, fontSize: 18, color: theme.textPrimary },
  };
  return (
    <WorkoutStackNav.Navigator screenOptions={stackOpts}>
      <WorkoutStackNav.Screen name="WorkoutLogger" component={WorkoutLoggerScreen} options={{ title: "Workout" }} />
      <WorkoutStackNav.Screen name="WorkoutSummary" component={WorkoutSummaryScreen} options={{ title: "Summary" }} />
    </WorkoutStackNav.Navigator>
  );
}

function ProgressStack() {
  const theme = useTheme();
  const stackOpts = {
    headerStyle: { backgroundColor: theme.bg },
    headerTintColor: theme.textPrimary,
    headerTitleStyle: { fontFamily: "Inter", fontWeight: "600" as const, fontSize: 18, color: theme.textPrimary },
  };
  return (
    <ProgressStackNav.Navigator screenOptions={stackOpts}>
      <ProgressStackNav.Screen name="Dashboard" component={DashboardScreen} options={{ title: "Progress" }} />
      <ProgressStackNav.Screen name="ExerciseProgress" component={ExerciseProgressScreen} options={{ title: "Exercise" }} />
      <ProgressStackNav.Screen name="Records" component={RecordsScreen} options={{ title: "Personal Records" }} />
    </ProgressStackNav.Navigator>
  );
}

function PhotosStack() {
  const theme = useTheme();
  const stackOpts = {
    headerStyle: { backgroundColor: theme.bg },
    headerTintColor: theme.textPrimary,
    headerTitleStyle: { fontFamily: "Inter", fontWeight: "600" as const, fontSize: 18, color: theme.textPrimary },
  };
  return (
    <PhotosStackNav.Navigator screenOptions={stackOpts}>
      <PhotosStackNav.Screen name="PhotosTimeline" component={PhotosTimelineScreen} options={{ title: "Progress Photos" }} />
      <PhotosStackNav.Screen name="PhotoCapture" component={PhotoCaptureScreen} options={{ title: "Take Photo" }} />
      <PhotosStackNav.Screen name="PhotoCompare" component={PhotoCompareScreen} options={{ title: "Compare" }} />
    </PhotosStackNav.Navigator>
  );
}

function ProfileStack() {
  const theme = useTheme();
  const stackOpts = {
    headerStyle: { backgroundColor: theme.bg },
    headerTintColor: theme.textPrimary,
    headerTitleStyle: { fontFamily: "Inter", fontWeight: "600" as const, fontSize: 18, color: theme.textPrimary },
  };
  return (
    <ProfileStackNav.Navigator screenOptions={stackOpts}>
      <ProfileStackNav.Screen name="ProfileMain" component={ProfileScreen} options={{ title: "Profile" }} />
      <ProfileStackNav.Screen name="EditProfile" component={EditProfileScreen} options={{ title: "Edit Profile" }} />
      <ProfileStackNav.Screen name="SplitSwitcher" component={SplitSwitcherScreen} options={{ title: "Switch Split" }} />
      <ProfileStackNav.Screen name="SplitDetails" component={SplitDetailsScreen} options={{ title: "Split Details" }} />
      <ProfileStackNav.Screen name="CustomSplit" component={CustomSplitScreen} options={{ title: "Create Custom Split" }} />
      <ProfileStackNav.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
      <ProfileStackNav.Screen name="Metrics" component={MetricsScreen} options={{ title: "Body Metrics" }} />
      <ProfileStackNav.Screen name="AllExercises" component={AllExercisesScreen} options={{ title: "All Exercises" }} />
      <ProfileStackNav.Screen name="RequestExercise" component={RequestExerciseScreen} options={{ title: "Request Exercise" }} />
    </ProfileStackNav.Navigator>
  );
}

export default function MainTabs() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: {
          fontFamily: "Inter",
          fontSize: 12,
          fontWeight: "500",
          marginTop: 4,
        },
        headerShown: false,
        tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => {
          const iconName = tabIcons[route.name]?.active || "Circle";
          return <Icon name={iconName} size={24} color={color} strokeWidth={focused ? 2.5 : 2} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} options={{ tabBarLabel: "Home" }} />
      <Tab.Screen name="Progress" component={ProgressStack} options={{ tabBarLabel: "Progress" }} />
      <Tab.Screen name="Photos" component={PhotosStack} options={{ tabBarLabel: "Photos" }} />
      <Tab.Screen name="Profile" component={ProfileStack} options={{ tabBarLabel: "Profile" }} />
    </Tab.Navigator>
  );
}
