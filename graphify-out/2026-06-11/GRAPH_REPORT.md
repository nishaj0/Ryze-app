# Graph Report - Ryze  (2026-06-11)

## Corpus Check
- 86 files · ~23,729 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 475 nodes · 788 edges · 30 communities (26 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f10fdfac`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Frontend API Client|Frontend API Client]]
- [[_COMMUNITY_Auth & Splits Routes|Auth & Splits Routes]]
- [[_COMMUNITY_Onboarding Flow|Onboarding Flow]]
- [[_COMMUNITY_Expo App Dependencies|Expo App Dependencies]]
- [[_COMMUNITY_API Server Dependencies|API Server Dependencies]]
- [[_COMMUNITY_Auth Store & Config|Auth Store & Config]]
- [[_COMMUNITY_Backend Controllers Core|Backend Controllers Core]]
- [[_COMMUNITY_Expo App Configuration|Expo App Configuration]]
- [[_COMMUNITY_API TypeScript Config|API TypeScript Config]]
- [[_COMMUNITY_Middleware & Route Setup|Middleware & Route Setup]]
- [[_COMMUNITY_Root Package Scripts|Root Package Scripts]]
- [[_COMMUNITY_Photos Feature|Photos Feature]]
- [[_COMMUNITY_Workout Session Controller|Workout Session Controller]]
- [[_COMMUNITY_Validation Middleware|Validation Middleware]]
- [[_COMMUNITY_Skills Lock Registry|Skills Lock Registry]]
- [[_COMMUNITY_Auth Controller|Auth Controller]]
- [[_COMMUNITY_Notifications Feature|Notifications Feature]]
- [[_COMMUNITY_Photo Controller & Cloudinary|Photo Controller & Cloudinary]]
- [[_COMMUNITY_Progress Analytics Controller|Progress Analytics Controller]]
- [[_COMMUNITY_Database Seed Data|Database Seed Data]]
- [[_COMMUNITY_Personal Records Feature|Personal Records Feature]]
- [[_COMMUNITY_Expo TypeScript Config|Expo TypeScript Config]]
- [[_COMMUNITY_Exercise Controller|Exercise Controller]]
- [[_COMMUNITY_Auth Routes & Schemas|Auth Routes & Schemas]]
- [[_COMMUNITY_Metro Bundler Config|Metro Bundler Config]]
- [[_COMMUNITY_Device Detection|Device Detection]]

## God Nodes (most connected - your core abstractions)
1. `useOnboarding()` - 17 edges
2. `useAuthStore` - 16 edges
3. `compilerOptions` - 14 edges
4. `expo` - 13 edges
5. `AuthRequest` - 11 edges
6. `authMiddleware()` - 11 edges
7. `scripts` - 11 edges
8. `OnboardingStackParamList` - 10 edges
9. `AppError` - 9 edges
10. `OnboardingProvider()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `LoginScreen()` --calls--> `useAuthStore`  [EXTRACTED]
  expo-app/src/screens/auth/LoginScreen.tsx → expo-app/src/store/authStore.ts
- `RegisterScreen()` --calls--> `useAuthStore`  [EXTRACTED]
  expo-app/src/screens/auth/RegisterScreen.tsx → expo-app/src/store/authStore.ts
- `HomeScreen()` --calls--> `useAuthStore`  [EXTRACTED]
  expo-app/src/screens/home/HomeScreen.tsx → expo-app/src/store/authStore.ts
- `RootNavigator()` --calls--> `useAuthStore`  [EXTRACTED]
  expo-app/src/navigation/RootNavigator.tsx → expo-app/src/store/authStore.ts
- `ProfileScreen()` --calls--> `useAuthStore`  [EXTRACTED]
  expo-app/src/screens/profile/ProfileScreen.tsx → expo-app/src/store/authStore.ts

## Import Cycles
- None detected.

## Communities (30 total, 4 thin omitted)

### Community 0 - "Frontend API Client"
Cohesion: 0.06
Nodes (33): deleteAccount(), login(), register(), updateProfile(), getActiveSplit(), listSplits(), setActiveSplit(), LoginScreen() (+25 more)

### Community 1 - "Auth & Splits Routes"
Cohesion: 0.09
Nodes (29): completeOnboarding(), getRecommendedSplits(), screenOptions, Stack, OnboardingStackParamList, BodyStatsContent(), Props, DaysContent() (+21 more)

### Community 2 - "Onboarding Flow"
Cohesion: 0.05
Nodes (40): dependencies, axios, expo, expo-camera, expo-image-manipulator, expo-image-picker, @expo/metro-runtime, expo-notifications (+32 more)

### Community 3 - "Expo App Dependencies"
Cohesion: 0.26
Nodes (8): deletePhoto(), getPhotos(), uploadPhoto(), PhotosStackParamList, Props, Props, Props, ProgressPhoto

### Community 4 - "API Server Dependencies"
Cohesion: 0.07
Nodes (43): listExercises(), deleteBodyMetric(), getBodyMetrics(), logBodyMetric(), getExerciseProgress(), getHeatmap(), getMuscleVolume(), getOverview() (+35 more)

### Community 5 - "Auth Store & Config"
Cohesion: 0.12
Nodes (9): client, AuthState, User, clearAuth(), getToken(), getUser(), saveToken(), saveUser() (+1 more)

### Community 6 - "Backend Controllers Core"
Cohesion: 0.06
Nodes (30): dependencies, bcryptjs, cors, dotenv, express, jsonwebtoken, multer, @prisma/client (+22 more)

### Community 7 - "Expo App Configuration"
Cohesion: 0.19
Nodes (6): validate(), bodyMetricSchema, router, onboardingSchema, router, router

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
Cohesion: 0.16
Nodes (5): prisma, prisma, prisma, AuthRequest, AppError

### Community 12 - "Workout Session Controller"
Cohesion: 0.12
Nodes (16): devDependencies, concurrently, name, private, scripts, api:build, api:db:migrate, api:db:seed (+8 more)

### Community 13 - "Validation Middleware"
Cohesion: 0.14
Nodes (8): authMiddleware(), router, router, storage, upload, router, router, app

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
Cohesion: 0.32
Nodes (4): calculateStreak(), getOverview(), getThisWeekWorkouts(), prisma

### Community 20 - "Personal Records Feature"
Cohesion: 0.25
Nodes (6): broSplit, ExerciseData, exercises, fullBodySplit, pplSplit, prisma

### Community 22 - "Exercise Controller"
Cohesion: 0.29
Nodes (6): compilerOptions, baseUrl, paths, strict, extends, @/*

### Community 23 - "Auth Routes & Schemas"
Cohesion: 0.40
Nodes (3): loginSchema, registerSchema, router

### Community 24 - "Metro Bundler Config"
Cohesion: 0.50
Nodes (3): config, { getDefaultConfig }, { withNativeWind }

## Knowledge Gaps
- **191 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+186 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `setActiveSplit()` connect `Frontend API Client` to `Photos Feature`?**
  _High betweenness centrality (0.253) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Backend Controllers Core` to `Middleware & Route Setup`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Why does `AuthRequest` connect `Photos Feature` to `Middleware & Route Setup`, `Skills Lock Registry`, `Auth Controller`, `Photo Controller & Cloudinary`, `Progress Analytics Controller`, `Database Seed Data`, `Expo TypeScript Config`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _191 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend API Client` be split into smaller, more focused modules?**
  _Cohesion score 0.06077694235588972 - nodes in this community are weakly interconnected._
- **Should `Auth & Splits Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.08686868686868687 - nodes in this community are weakly interconnected._
- **Should `Onboarding Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._