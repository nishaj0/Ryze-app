import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MainTabParamList, HomeStackParamList, WorkoutStackParamList, ProgressStackParamList, PhotosStackParamList, ProfileStackParamList } from "./types";
import { Icon } from "../components";
import { useTheme } from "../theme/themeStore";


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
      <HomeStackNav.Screen name="HomeMain" getComponent={() => require("../screens/home/HomeScreen").default} options={{ title: "Home", headerShown: false }} />
      <HomeStackNav.Screen name="WorkoutLogger" getComponent={() => require("../screens/workout/WorkoutLoggerScreen").default} options={{ title: "Workout" }} />
      <HomeStackNav.Screen name="WorkoutSummary" getComponent={() => require("../screens/workout/WorkoutSummaryScreen").default} options={{ title: "Summary", headerLeft: () => null }} />
      <HomeStackNav.Screen name="WorkoutHistory" getComponent={() => require("../screens/workout/WorkoutHistoryScreen").default} options={{ title: "Workout History" }} />
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
      <WorkoutStackNav.Screen name="WorkoutLogger" getComponent={() => require("../screens/workout/WorkoutLoggerScreen").default} options={{ title: "Workout" }} />
      <WorkoutStackNav.Screen name="WorkoutSummary" getComponent={() => require("../screens/workout/WorkoutSummaryScreen").default} options={{ title: "Summary" }} />
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
      <ProgressStackNav.Screen name="Dashboard" getComponent={() => require("../screens/progress/DashboardScreen").default} options={{ title: "Progress" }} />
      <ProgressStackNav.Screen name="ExerciseProgress" getComponent={() => require("../screens/progress/ExerciseProgressScreen").default} options={{ title: "Exercise" }} />
      <ProgressStackNav.Screen name="Records" getComponent={() => require("../screens/progress/RecordsScreen").default} options={{ title: "Personal Records" }} />
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
      <PhotosStackNav.Screen name="PhotosTimeline" getComponent={() => require("../screens/photos/PhotosTimelineScreen").default} options={{ title: "Progress Photos" }} />
      <PhotosStackNav.Screen name="PhotoCapture" getComponent={() => require("../screens/photos/PhotoCaptureScreen").default} options={{ title: "Take Photo" }} />
      <PhotosStackNav.Screen name="PhotoCompare" getComponent={() => require("../screens/photos/PhotoCompareScreen").default} options={{ title: "Compare" }} />
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
      <ProfileStackNav.Screen name="ProfileMain" getComponent={() => require("../screens/profile/ProfileScreen").default} options={{ title: "Profile" }} />
      <ProfileStackNav.Screen name="EditProfile" getComponent={() => require("../screens/profile/EditProfileScreen").default} options={{ title: "Edit Profile" }} />
      <ProfileStackNav.Screen name="SplitSwitcher" getComponent={() => require("../screens/profile/SplitSwitcherScreen").default} options={{ title: "Switch Split" }} />
      <ProfileStackNav.Screen name="SplitDetails" getComponent={() => require("../screens/profile/SplitDetailsScreen").default} options={{ title: "Split Details" }} />
      <ProfileStackNav.Screen name="CustomSplit" getComponent={() => require("../screens/profile/CustomSplitScreen").default} options={{ title: "Create Custom Split" }} />
      <ProfileStackNav.Screen name="AISplitBuilder" getComponent={() => require("../screens/onboarding/AISplitBuilderScreen").default} options={{ title: "Build with AI" }} />
      <ProfileStackNav.Screen name="Settings" getComponent={() => require("../screens/profile/SettingsScreen").default} options={{ title: "Settings" }} />
      <ProfileStackNav.Screen name="Metrics" getComponent={() => require("../screens/metrics/MetricsScreen").default} options={{ title: "Body Metrics" }} />
      <ProfileStackNav.Screen name="AllExercises" getComponent={() => require("../screens/exercises/AllExercisesScreen").default} options={{ title: "All Exercises" }} />
      <ProfileStackNav.Screen name="RequestExercise" getComponent={() => require("../screens/exercises/RequestExerciseScreen").default} options={{ title: "Request Exercise" }} />
      <ProfileStackNav.Screen name="ReportBug" getComponent={() => require("../screens/support/ReportBugScreen").default} options={{ title: "Report a Bug" }} />
      <ProfileStackNav.Screen name="RequestHelp" getComponent={() => require("../screens/support/RequestHelpScreen").default} options={{ title: "Request Help" }} />
      <ProfileStackNav.Screen name="MyTickets" getComponent={() => require("../screens/support/MyTicketsScreen").default} options={{ title: "My Support Tickets" }} />
    </ProfileStackNav.Navigator>
  );
}

export default function MainTabs() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        lazy: true,
        freezeOnBlur: true,
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
