# Graph Report - Ryze  (2026-06-20)

## Corpus Check
- 109 files · ~46,515 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 665 nodes · 1289 edges · 37 communities (33 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ba8169a3`
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
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]

## God Nodes (most connected - your core abstractions)
1. `LightTheme` - 43 edges
2. `space` - 34 edges
3. `useAuthStore` - 22 edges
4. `radius` - 21 edges
5. `useOnboarding()` - 17 edges
6. `compilerOptions` - 15 edges
7. `expo` - 13 edges
8. `AuthRequest` - 12 edges
9. `authMiddleware()` - 11 edges
10. `scripts` - 11 edges

## Surprising Connections (you probably didn't know these)
- `RootNavigator()` --calls--> `useAuthStore`  [EXTRACTED]
  expo-app/src/navigation/RootNavigator.tsx → expo-app/src/store/authStore.ts
- `LoginScreen()` --calls--> `useAuthStore`  [EXTRACTED]
  expo-app/src/screens/auth/LoginScreen.tsx → expo-app/src/store/authStore.ts
- `RegisterScreen()` --calls--> `useAuthStore`  [EXTRACTED]
  expo-app/src/screens/auth/RegisterScreen.tsx → expo-app/src/store/authStore.ts
- `EditProfileScreen()` --calls--> `useAuthStore`  [EXTRACTED]
  expo-app/src/screens/profile/EditProfileScreen.tsx → expo-app/src/store/authStore.ts
- `ProfileScreen()` --calls--> `useAuthStore`  [EXTRACTED]
  expo-app/src/screens/profile/ProfileScreen.tsx → expo-app/src/store/authStore.ts

## Import Cycles
- None detected.

## Communities (37 total, 4 thin omitted)

### Community 0 - "Frontend API Client"
Cohesion: 0.09
Nodes (15): client, deleteBodyMetric(), getBodyMetrics(), logBodyMetric(), Props, { width: screenW }, AuthState, BodyMetric (+7 more)

### Community 1 - "Auth & Splits Routes"
Cohesion: 0.08
Nodes (35): completeOnboarding(), getRecommendedSplits(), ScreenProps, screenOptions, Stack, OnboardingStackParamList, ScreenProps, BodyStatsContent() (+27 more)

### Community 2 - "Onboarding Flow"
Cohesion: 0.05
Nodes (43): dependencies, axios, expo, expo-camera, expo-font, @expo-google-fonts/inter, expo-image-manipulator, expo-image-picker (+35 more)

### Community 3 - "Expo App Dependencies"
Cohesion: 0.08
Nodes (31): createSplit(), getActiveSplit(), getSplit(), listSplits(), IconName, IconProps, DashboardScreenSkeleton(), ExerciseProgressScreenSkeleton() (+23 more)

### Community 4 - "API Server Dependencies"
Cohesion: 0.07
Nodes (46): listExercises(), addExercise(), completeSession(), createSession(), deleteSet(), getCalendarSessions(), getSession(), logSet() (+38 more)

### Community 5 - "Community 5"
Cohesion: 0.24
Nodes (8): TypographyProps, Variant, spacing, fontFamily, fontSize, fontWeight, lineHeight, typography

### Community 6 - "Backend Controllers Core"
Cohesion: 0.06
Nodes (32): dependencies, axios, bcryptjs, cloudinary, cors, dotenv, express, jsonwebtoken (+24 more)

### Community 7 - "Expo App Configuration"
Cohesion: 0.18
Nodes (7): validate(), loginSchema, registerSchema, router, bodyMetricSchema, router, router

### Community 8 - "API TypeScript Config"
Cohesion: 0.10
Nodes (21): backgroundColor, adaptiveIcon, package, expo, android, icon, ios, name (+13 more)

### Community 9 - "Middleware & Route Setup"
Cohesion: 0.21
Nodes (8): deletePhoto(), prisma, uploadPhoto(), router, storage, upload, deleteFromCloudinary(), uploadToCloudinary()

### Community 10 - "Root Package Scripts"
Cohesion: 0.11
Nodes (17): compilerOptions, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution (+9 more)

### Community 11 - "Photos Feature"
Cohesion: 0.18
Nodes (6): prisma, AppError, errorHandler(), onboardingSchema, router, app

### Community 12 - "Workout Session Controller"
Cohesion: 0.12
Nodes (16): devDependencies, concurrently, name, private, scripts, api:build, api:db:migrate, api:db:seed (+8 more)

### Community 13 - "Community 13"
Cohesion: 0.09
Nodes (22): computedHash, skillPath, source, sourceType, computedHash, skillPath, source, sourceType (+14 more)

### Community 14 - "Skills Lock Registry"
Cohesion: 0.13
Nodes (5): calculate1RM(), completeSession(), createSession(), getLastSessionLogs(), prisma

### Community 16 - "Notifications Feature"
Cohesion: 0.40
Nodes (10): computedHash, skillPath, source, sourceType, skills, caveman, find-skills, supabase (+2 more)

### Community 17 - "Photo Controller & Cloudinary"
Cohesion: 0.32
Nodes (4): generateToken(), login(), prisma, register()

### Community 18 - "Progress Analytics Controller"
Cohesion: 0.33
Nodes (3): prisma, sendPushNotification(), triggerReminders()

### Community 19 - "Database Seed Data"
Cohesion: 0.28
Nodes (4): calculateStreak(), getOverview(), getThisWeekWorkouts(), prisma

### Community 20 - "Personal Records Feature"
Cohesion: 0.22
Nodes (7): broSplit, ExerciseData, exercises, fullBodySplit, pplSplit, prisma, upperLowerSplit

### Community 21 - "Expo TypeScript Config"
Cohesion: 0.13
Nodes (7): prisma, authMiddleware(), prisma, router, router, router, router

### Community 22 - "Exercise Controller"
Cohesion: 0.29
Nodes (6): compilerOptions, moduleResolution, paths, strict, extends, @/*

### Community 23 - "Community 23"
Cohesion: 0.11
Nodes (17): getExerciseProgress(), getHeatmap(), getMuscleVolume(), getOverview(), getVolumeHistory(), getRecords(), ProgressStackParamList, Props (+9 more)

### Community 30 - "Community 30"
Cohesion: 0.07
Nodes (22): deletePhoto(), getPhotos(), uploadPhoto(), headerStyle, headerTitleStyle, HomeStackNav, PhotosStackNav, ProfileStackNav (+14 more)

### Community 31 - "Community 31"
Cohesion: 0.20
Nodes (3): prisma, prisma, AuthRequest

### Community 32 - "Community 32"
Cohesion: 0.18
Nodes (9): deleteAccount(), login(), register(), LoginScreen(), Props, Props, RegisterScreen(), Stack (+1 more)

### Community 38 - "Community 38"
Cohesion: 0.25
Nodes (4): RootNavigator(), Stack, RootStackParamList, queryClient

### Community 39 - "Community 39"
Cohesion: 0.19
Nodes (6): BarChartProps, BarItem, HeatmapDay, HeatmapProps, ChartPoint, LineChartProps

### Community 40 - "Community 40"
Cohesion: 0.13
Nodes (9): RingChartProps, ButtonProps, Size, Variant, CardProps, InputProps, Props, LightTheme (+1 more)

### Community 41 - "Community 41"
Cohesion: 0.19
Nodes (11): updateProfile(), MetricsScreen(), EditProfileScreen(), equipmentOptions, experienceLevels, genders, goals, Props (+3 more)

## Knowledge Gaps
- **258 isolated node(s):** `target`, `module`, `lib`, `outDir`, `rootDir` (+253 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `setActiveSplit()` connect `Community 29` to `Community 40`, `Expo App Dependencies`?**
  _High betweenness centrality (0.251) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Backend Controllers Core` to `Middleware & Route Setup`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Why does `AuthRequest` connect `Community 31` to `Middleware & Route Setup`, `Photos Feature`, `Skills Lock Registry`, `Auth Controller`, `Photo Controller & Cloudinary`, `Progress Analytics Controller`, `Database Seed Data`, `Expo TypeScript Config`, `Community 29`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **What connects `target`, `module`, `lib` to the rest of the system?**
  _258 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend API Client` be split into smaller, more focused modules?**
  _Cohesion score 0.08712121212121213 - nodes in this community are weakly interconnected._
- **Should `Auth & Splits Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.07539450613676213 - nodes in this community are weakly interconnected._
- **Should `Onboarding Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.045454545454545456 - nodes in this community are weakly interconnected._