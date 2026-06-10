# Graph Report - Ryze  (2026-06-11)

## Corpus Check
- 102 files · ~31,962 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 566 nodes · 1078 edges · 34 communities (31 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `543a3674`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Frontend API Client|Frontend API Client]]
- [[_COMMUNITY_Auth & Splits Routes|Auth & Splits Routes]]
- [[_COMMUNITY_Onboarding Flow|Onboarding Flow]]
- [[_COMMUNITY_Expo App Dependencies|Expo App Dependencies]]
- [[_COMMUNITY_API Server Dependencies|API Server Dependencies]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Backend Controllers Core|Backend Controllers Core]]
- [[_COMMUNITY_Expo App Configuration|Expo App Configuration]]
- [[_COMMUNITY_API TypeScript Config|API TypeScript Config]]
- [[_COMMUNITY_Middleware & Route Setup|Middleware & Route Setup]]
- [[_COMMUNITY_Root Package Scripts|Root Package Scripts]]
- [[_COMMUNITY_Photos Feature|Photos Feature]]
- [[_COMMUNITY_Workout Session Controller|Workout Session Controller]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Skills Lock Registry|Skills Lock Registry]]
- [[_COMMUNITY_Auth Controller|Auth Controller]]
- [[_COMMUNITY_Notifications Feature|Notifications Feature]]
- [[_COMMUNITY_Photo Controller & Cloudinary|Photo Controller & Cloudinary]]
- [[_COMMUNITY_Progress Analytics Controller|Progress Analytics Controller]]
- [[_COMMUNITY_Database Seed Data|Database Seed Data]]
- [[_COMMUNITY_Personal Records Feature|Personal Records Feature]]
- [[_COMMUNITY_Expo TypeScript Config|Expo TypeScript Config]]
- [[_COMMUNITY_Exercise Controller|Exercise Controller]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Metro Bundler Config|Metro Bundler Config]]
- [[_COMMUNITY_Device Detection|Device Detection]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]

## God Nodes (most connected - your core abstractions)
1. `LightTheme` - 39 edges
2. `space` - 30 edges
3. `useAuthStore` - 17 edges
4. `useOnboarding()` - 17 edges
5. `radius` - 16 edges
6. `compilerOptions` - 14 edges
7. `expo` - 13 edges
8. `AuthRequest` - 11 edges
9. `authMiddleware()` - 11 edges
10. `scripts` - 11 edges

## Surprising Connections (you probably didn't know these)
- `ProfileScreen()` --calls--> `useAuthStore`  [EXTRACTED]
  expo-app/src/screens/profile/ProfileScreen.tsx → expo-app/src/store/authStore.ts
- `RootNavigator()` --calls--> `useAuthStore`  [EXTRACTED]
  expo-app/src/navigation/RootNavigator.tsx → expo-app/src/store/authStore.ts
- `LoginScreen()` --calls--> `useAuthStore`  [EXTRACTED]
  expo-app/src/screens/auth/LoginScreen.tsx → expo-app/src/store/authStore.ts
- `RegisterScreen()` --calls--> `useAuthStore`  [EXTRACTED]
  expo-app/src/screens/auth/RegisterScreen.tsx → expo-app/src/store/authStore.ts
- `HomeScreen()` --calls--> `useAuthStore`  [EXTRACTED]
  expo-app/src/screens/home/HomeScreen.tsx → expo-app/src/store/authStore.ts

## Import Cycles
- None detected.

## Communities (34 total, 3 thin omitted)

### Community 0 - "Frontend API Client"
Cohesion: 0.15
Nodes (9): client, AuthState, User, clearAuth(), getToken(), getUser(), saveToken(), saveUser() (+1 more)

### Community 1 - "Auth & Splits Routes"
Cohesion: 0.08
Nodes (31): completeOnboarding(), getRecommendedSplits(), screenOptions, Stack, MainTabParamList, OnboardingStackParamList, ScreenProps, WorkoutStackParamList (+23 more)

### Community 2 - "Onboarding Flow"
Cohesion: 0.04
Nodes (44): dependencies, axios, expo, expo-camera, expo-font, @expo-google-fonts/inter, expo-image-manipulator, expo-image-picker (+36 more)

### Community 3 - "Expo App Dependencies"
Cohesion: 0.06
Nodes (40): deletePhoto(), getPhotos(), uploadPhoto(), Props, ButtonProps, Size, Variant, CardProps (+32 more)

### Community 4 - "API Server Dependencies"
Cohesion: 0.10
Nodes (23): deleteBodyMetric(), getBodyMetrics(), logBodyMetric(), getExerciseProgress(), getHeatmap(), getMuscleVolume(), getVolumeHistory(), getRecords() (+15 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (18): BarChartProps, BarItem, HeatmapDay, HeatmapProps, ChartPoint, LineChartProps, RingChartProps, familyFor() (+10 more)

### Community 6 - "Backend Controllers Core"
Cohesion: 0.06
Nodes (30): dependencies, bcryptjs, cors, dotenv, express, jsonwebtoken, multer, @prisma/client (+22 more)

### Community 7 - "Expo App Configuration"
Cohesion: 0.14
Nodes (9): validate(), loginSchema, registerSchema, router, bodyMetricSchema, router, onboardingSchema, router (+1 more)

### Community 8 - "API TypeScript Config"
Cohesion: 0.10
Nodes (21): backgroundColor, adaptiveIcon, package, expo, android, icon, ios, name (+13 more)

### Community 9 - "Middleware & Route Setup"
Cohesion: 0.39
Nodes (5): deletePhoto(), prisma, uploadPhoto(), deleteFromCloudinary(), uploadToCloudinary()

### Community 10 - "Root Package Scripts"
Cohesion: 0.12
Nodes (16): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, outDir (+8 more)

### Community 11 - "Photos Feature"
Cohesion: 0.12
Nodes (8): setActiveSplit(), prisma, prisma, prisma, prisma, AuthRequest, prisma, AppError

### Community 12 - "Workout Session Controller"
Cohesion: 0.12
Nodes (16): devDependencies, concurrently, name, private, scripts, api:build, api:db:migrate, api:db:seed (+8 more)

### Community 13 - "Community 13"
Cohesion: 0.13
Nodes (16): listExercises(), addExercise(), completeSession(), deleteSet(), getSession(), logSet(), swapExercise(), HomeStackParamList (+8 more)

### Community 14 - "Skills Lock Registry"
Cohesion: 0.18
Nodes (5): calculate1RM(), completeSession(), createSession(), getLastSessionLogs(), prisma

### Community 16 - "Notifications Feature"
Cohesion: 0.40
Nodes (10): computedHash, skillPath, source, sourceType, skills, caveman, find-skills, supabase (+2 more)

### Community 17 - "Photo Controller & Cloudinary"
Cohesion: 0.32
Nodes (4): generateToken(), login(), prisma, register()

### Community 19 - "Database Seed Data"
Cohesion: 0.28
Nodes (4): calculateStreak(), getOverview(), getThisWeekWorkouts(), prisma

### Community 20 - "Personal Records Feature"
Cohesion: 0.25
Nodes (6): broSplit, ExerciseData, exercises, fullBodySplit, pplSplit, prisma

### Community 21 - "Expo TypeScript Config"
Cohesion: 0.14
Nodes (8): authMiddleware(), router, storage, upload, router, router, router, app

### Community 22 - "Exercise Controller"
Cohesion: 0.29
Nodes (6): compilerOptions, baseUrl, paths, strict, extends, @/*

### Community 23 - "Community 23"
Cohesion: 0.18
Nodes (9): LoginScreen(), RegisterScreen(), RootNavigator(), Stack, RootStackParamList, SplitSelectionContent(), SettingsScreen(), queryClient (+1 more)

### Community 24 - "Metro Bundler Config"
Cohesion: 0.50
Nodes (3): config, { getDefaultConfig }, { withNativeWind }

### Community 30 - "Community 30"
Cohesion: 0.22
Nodes (6): login(), register(), updateProfile(), Props, Stack, AuthStackParamList

### Community 31 - "Community 31"
Cohesion: 0.28
Nodes (6): deleteAccount(), getActiveSplit(), listSplits(), ProfileScreen(), Props, UserSplit

### Community 32 - "Community 32"
Cohesion: 0.29
Nodes (7): getOverview(), createSession(), markRestDay(), HomeScreen(), Props, useWorkoutStore, SplitDay

## Knowledge Gaps
- **222 isolated node(s):** `prisma`, `router`, `name`, `slug`, `version` (+217 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `setActiveSplit()` connect `Photos Feature` to `Expo App Dependencies`, `Community 31`?**
  _High betweenness centrality (0.258) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Backend Controllers Core` to `Middleware & Route Setup`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Why does `LightTheme` connect `Expo App Dependencies` to `Community 32`, `Auth & Splits Routes`, `API Server Dependencies`, `Community 5`, `Community 13`, `Community 23`, `Community 30`, `Community 31`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **What connects `prisma`, `router`, `name` to the rest of the system?**
  _222 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auth & Splits Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.07673469387755102 - nodes in this community are weakly interconnected._
- **Should `Onboarding Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._
- **Should `Expo App Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.055176890619928594 - nodes in this community are weakly interconnected._