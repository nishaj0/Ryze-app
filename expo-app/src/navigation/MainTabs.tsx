import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MainTabParamList, HomeStackParamList, WorkoutStackParamList, ProgressStackParamList, PhotosStackParamList, ProfileStackParamList } from "./types";
import { Text } from "react-native";

import HomeScreen from "../screens/home/HomeScreen";
import WorkoutLoggerScreen from "../screens/workout/WorkoutLoggerScreen";
import WorkoutSummaryScreen from "../screens/workout/WorkoutSummaryScreen";
import DashboardScreen from "../screens/progress/DashboardScreen";
import ExerciseProgressScreen from "../screens/progress/ExerciseProgressScreen";
import RecordsScreen from "../screens/progress/RecordsScreen";
import PhotosTimelineScreen from "../screens/photos/PhotosTimelineScreen";
import PhotoCaptureScreen from "../screens/photos/PhotoCaptureScreen";
import PhotoCompareScreen from "../screens/photos/PhotoCompareScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import EditProfileScreen from "../screens/profile/EditProfileScreen";
import SplitSwitcherScreen from "../screens/profile/SplitSwitcherScreen";
import SettingsScreen from "../screens/profile/SettingsScreen";
import MetricsScreen from "../screens/metrics/MetricsScreen";

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStackNav = createNativeStackNavigator<HomeStackParamList>();
const WorkoutStackNav = createNativeStackNavigator<WorkoutStackParamList>();
const ProgressStackNav = createNativeStackNavigator<ProgressStackParamList>();
const PhotosStackNav = createNativeStackNavigator<PhotosStackParamList>();
const ProfileStackNav = createNativeStackNavigator<ProfileStackParamList>();

const headerStyle = { backgroundColor: "#0F172A" as const };
const headerTintColor = "#fff";
const stackOpts = { headerStyle, headerTintColor };

function HomeStack() {
  return (
    <HomeStackNav.Navigator screenOptions={stackOpts}>
      <HomeStackNav.Screen name="HomeMain" component={HomeScreen} options={{ title: "Home", headerShown: false }} />
      <HomeStackNav.Screen name="WorkoutLogger" component={WorkoutLoggerScreen} options={{ title: "Workout" }} />
      <HomeStackNav.Screen name="WorkoutSummary" component={WorkoutSummaryScreen} options={{ title: "Summary", headerLeft: () => null }} />
    </HomeStackNav.Navigator>
  );
}

function WorkoutStack() {
  return (
    <WorkoutStackNav.Navigator screenOptions={stackOpts}>
      <WorkoutStackNav.Screen name="WorkoutLogger" component={WorkoutLoggerScreen} options={{ title: "Workout" }} />
      <WorkoutStackNav.Screen name="WorkoutSummary" component={WorkoutSummaryScreen} options={{ title: "Summary" }} />
    </WorkoutStackNav.Navigator>
  );
}

function ProgressStack() {
  return (
    <ProgressStackNav.Navigator screenOptions={stackOpts}>
      <ProgressStackNav.Screen name="Dashboard" component={DashboardScreen} options={{ title: "Progress" }} />
      <ProgressStackNav.Screen name="ExerciseProgress" component={ExerciseProgressScreen} options={{ title: "Exercise" }} />
      <ProgressStackNav.Screen name="Records" component={RecordsScreen} options={{ title: "Personal Records" }} />
    </ProgressStackNav.Navigator>
  );
}

function PhotosStack() {
  return (
    <PhotosStackNav.Navigator screenOptions={stackOpts}>
      <PhotosStackNav.Screen name="PhotosTimeline" component={PhotosTimelineScreen} options={{ title: "Progress Photos" }} />
      <PhotosStackNav.Screen name="PhotoCapture" component={PhotoCaptureScreen} options={{ title: "Take Photo" }} />
      <PhotosStackNav.Screen name="PhotoCompare" component={PhotoCompareScreen} options={{ title: "Compare" }} />
    </PhotosStackNav.Navigator>
  );
}

function ProfileStack() {
  return (
    <ProfileStackNav.Navigator screenOptions={stackOpts}>
      <ProfileStackNav.Screen name="ProfileMain" component={ProfileScreen} options={{ title: "Profile" }} />
      <ProfileStackNav.Screen name="EditProfile" component={EditProfileScreen} options={{ title: "Edit Profile" }} />
      <ProfileStackNav.Screen name="SplitSwitcher" component={SplitSwitcherScreen} options={{ title: "Switch Split" }} />
      <ProfileStackNav.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
      <ProfileStackNav.Screen name="Metrics" component={MetricsScreen} options={{ title: "Body Metrics" }} />
    </ProfileStackNav.Navigator>
  );
}

const TabIcon = ({ label, focused }: { label: string; focused: boolean }) => (
  <Text style={{ fontSize: 20 }}>{label}</Text>
);

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: "#1E293B", borderTopColor: "#334155" },
        tabBarActiveTintColor: "#6366F1",
        tabBarInactiveTintColor: "#94A3B8",
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeStack} options={{ tabBarLabel: "Home", tabBarIcon: (p: any) => <TabIcon label="🏠" focused={p.focused} /> }} />
      <Tab.Screen name="Progress" component={ProgressStack} options={{ tabBarLabel: "Progress", tabBarIcon: (p: any) => <TabIcon label="📊" focused={p.focused} /> }} />
      <Tab.Screen name="Photos" component={PhotosStack} options={{ tabBarLabel: "Photos", tabBarIcon: (p: any) => <TabIcon label="📷" focused={p.focused} /> }} />
      <Tab.Screen name="Profile" component={ProfileStack} options={{ tabBarLabel: "Profile", tabBarIcon: (p: any) => <TabIcon label="👤" focused={p.focused} /> }} />
    </Tab.Navigator>
  );
}
