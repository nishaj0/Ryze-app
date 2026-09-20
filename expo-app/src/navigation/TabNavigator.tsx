import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { createBottomTabNavigator, BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home, BarChart3, Sparkles, Camera, User } from "lucide-react-native";
import {
  MainTabParamList,
  HomeStackParamList,
  WorkoutStackParamList,
  ProgressStackParamList,
  PhotosStackParamList,
  ProfileStackParamList,
} from "./types";
import { useTheme } from "../theme/themeStore";

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStackNav = createNativeStackNavigator<HomeStackParamList>();
const WorkoutStackNav = createNativeStackNavigator<WorkoutStackParamList>();
const ProgressStackNav = createNativeStackNavigator<ProgressStackParamList>();
const PhotosStackNav = createNativeStackNavigator<PhotosStackParamList>();
const ProfileStackNav = createNativeStackNavigator<ProfileStackParamList>();

function HomeStack() {
  const theme = useTheme();
  const stackOpts = {
    headerStyle: { backgroundColor: theme.bg },
    headerTintColor: theme.textPrimary,
    headerTitleStyle: { fontFamily: "Outfit_600SemiBold", fontWeight: "600" as const, fontSize: 18, color: theme.textPrimary },
  };
  return (
    <HomeStackNav.Navigator screenOptions={stackOpts}>
      <HomeStackNav.Screen name="HomeMain" getComponent={() => require("../screens/home/HomeScreen").default} options={{ title: "Home", headerShown: false }} />
      <HomeStackNav.Screen name="PreWorkoutSetup" getComponent={() => require("../screens/workout/PreWorkoutSetupScreen").default} options={{ title: "Routine Setup", headerShown: false }} />
      <HomeStackNav.Screen name="WorkoutLogger" getComponent={() => require("../screens/workout/WorkoutLoggerScreen").default} options={{ title: "Workout", headerShown: false }} />
      <HomeStackNav.Screen name="WorkoutSummary" getComponent={() => require("../screens/workout/WorkoutSummaryScreen").default} options={{ title: "Summary", headerLeft: () => null }} />
      <HomeStackNav.Screen name="WorkoutHistory" getComponent={() => require("../screens/workout/WorkoutHistoryScreen").default} options={{ title: "Workout History" }} />
      <HomeStackNav.Screen name="RestDay" getComponent={() => require("../screens/RestDayScreen").default} options={{ title: "Rest & Recovery" }} />
    </HomeStackNav.Navigator>
  );
}

function WorkoutStack() {
  const theme = useTheme();
  const stackOpts = {
    headerStyle: { backgroundColor: theme.bg },
    headerTintColor: theme.textPrimary,
    headerTitleStyle: { fontFamily: "Outfit_600SemiBold", fontWeight: "600" as const, fontSize: 18, color: theme.textPrimary },
  };
  return (
    <WorkoutStackNav.Navigator screenOptions={stackOpts}>
      <WorkoutStackNav.Screen name="PreWorkoutSetup" getComponent={() => require("../screens/workout/PreWorkoutSetupScreen").default} options={{ title: "Routine Setup", headerShown: false }} />
      <WorkoutStackNav.Screen name="WorkoutLogger" getComponent={() => require("../screens/workout/WorkoutLoggerScreen").default} options={{ title: "Workout", headerShown: false }} />
      <WorkoutStackNav.Screen name="WorkoutSummary" getComponent={() => require("../screens/workout/WorkoutSummaryScreen").default} options={{ title: "Summary" }} />
    </WorkoutStackNav.Navigator>
  );
}

function ProgressStack() {
  const theme = useTheme();
  const stackOpts = {
    headerStyle: { backgroundColor: theme.bg },
    headerTintColor: theme.textPrimary,
    headerTitleStyle: { fontFamily: "Outfit_600SemiBold", fontWeight: "600" as const, fontSize: 18, color: theme.textPrimary },
  };
  return (
    <ProgressStackNav.Navigator screenOptions={stackOpts}>
      <ProgressStackNav.Screen name="Dashboard" getComponent={() => require("../screens/progress/DashboardScreen").default} options={{ title: "Progress" }} />
      <ProgressStackNav.Screen name="ExerciseProgress" getComponent={() => require("../screens/progress/ExerciseProgressScreen").default} options={{ title: "Exercise" }} />
      <ProgressStackNav.Screen name="Records" getComponent={() => require("../screens/progress/RecordsScreen").default} options={{ title: "Personal Records" }} />
      <ProgressStackNav.Screen name="CheckInHistory" getComponent={() => require("../screens/progress/CheckInHistoryScreen").default} options={{ title: "Training Feel" }} />
    </ProgressStackNav.Navigator>
  );
}

function PhotosStack() {
  const theme = useTheme();
  const stackOpts = {
    headerStyle: { backgroundColor: theme.bg },
    headerTintColor: theme.textPrimary,
    headerTitleStyle: { fontFamily: "Outfit_600SemiBold", fontWeight: "600" as const, fontSize: 18, color: theme.textPrimary },
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
    headerTitleStyle: { fontFamily: "Outfit_600SemiBold", fontWeight: "600" as const, fontSize: 18, color: theme.textPrimary },
  };
  return (
    <ProfileStackNav.Navigator screenOptions={stackOpts}>
      <ProfileStackNav.Screen name="ProfileMain" getComponent={() => require("../screens/profile/ProfileScreen").default} options={{ title: "Profile" }} />
      <ProfileStackNav.Screen name="EditProfile" getComponent={() => require("../screens/profile/EditProfileScreen").default} options={{ title: "Edit Profile" }} />
      <ProfileStackNav.Screen name="SplitSwitcher" getComponent={() => require("../screens/profile/SplitSwitcherScreen").default} options={{ title: "Switch Split" }} />
      <ProfileStackNav.Screen name="CommunitySplits" getComponent={() => require("../screens/profile/CommunitySplitsScreen").default} options={{ title: "Community Splits" }} />
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

function CustomBottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 10);

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: bottomPadding }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        if (route.name === "Coach") {
          return (
            <View key={route.key} style={styles.centerTabWrapper}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel="AI Coach"
                testID="tab-coach"
                onPress={onPress}
                onLongPress={onLongPress}
                activeOpacity={0.88}
                style={styles.coachButton}
              >
                <Sparkles size={24} color="#ffffff" strokeWidth={2.2} />
              </TouchableOpacity>
            </View>
          );
        }

        let label = "Today";
        let IconComponent = Home;

        if (route.name === "Home") {
          label = "Today";
          IconComponent = Home;
        } else if (route.name === "Progress") {
          label = "Analytics";
          IconComponent = BarChart3;
        } else if (route.name === "Photos") {
          label = "Photos";
          IconComponent = Camera;
        } else if (route.name === "Profile") {
          label = "Profile";
          IconComponent = User;
        }

        const activeColor = "#c24914";
        const inactiveColor = "#7a766c";
        const color = isFocused ? activeColor : inactiveColor;

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={label}
            testID={`tab-${route.name.toLowerCase()}`}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.7}
            style={styles.tabItem}
          >
            <IconComponent size={22} color={color} strokeWidth={isFocused ? 2.3 : 1.8} />
            <Text style={[styles.tabLabel, { color }]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#dcdad4",
    paddingTop: 8,
    position: "relative",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  centerTabWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  coachButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#c24914",
    marginTop: -26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#ffffff",
    shadowColor: "#c24914",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  tabLabel: {
    fontFamily: "Outfit_500Medium",
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: -0.2,
    marginTop: 4,
  },
});

export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomBottomTabBar {...props} />}
      screenOptions={{
        lazy: true,
        freezeOnBlur: true,
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeStack} options={{ title: "Today" }} />
      <Tab.Screen name="Progress" component={ProgressStack} options={{ title: "Analytics" }} />
      <Tab.Screen name="Coach" getComponent={() => require("../screens/profile/CoachChatScreen").default} options={{ title: "Coach" }} />
      <Tab.Screen name="Photos" component={PhotosStack} options={{ title: "Photos" }} />
      <Tab.Screen name="Profile" component={ProfileStack} options={{ title: "Profile" }} />
    </Tab.Navigator>
  );
}
