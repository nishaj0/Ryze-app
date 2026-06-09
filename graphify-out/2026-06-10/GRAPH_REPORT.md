# Graph Report - .  (2026-06-10)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 466 nodes · 779 edges · 29 communities (27 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `26840ec7`
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
2. `useAuthStore` - 15 edges
3. `compilerOptions` - 14 edges
4. `expo` - 12 edges
5. `AuthRequest` - 11 edges
6. `authMiddleware()` - 11 edges
7. `scripts` - 11 edges
8. `OnboardingStackParamList` - 10 edges
9. `AppError` - 9 edges
10. `OnboardingProvider()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `RootNavigator()` --calls--> `useAuthStore`  [EXTRACTED]
  expo-app/src/navigation/RootNavigator.tsx → expo-app/src/store/authStore.ts
- `LoginScreen()` --calls--> `useAuthStore`  [EXTRACTED]
  expo-app/src/screens/auth/LoginScreen.tsx → expo-app/src/store/authStore.ts
- `HomeScreen()` --calls--> `useAuthStore`  [EXTRACTED]
  expo-app/src/screens/home/HomeScreen.tsx → expo-app/src/store/authStore.ts
- `BodyStatsContent()` --calls--> `useOnboarding()`  [EXTRACTED]
  expo-app/src/screens/onboarding/BodyStatsScreen.tsx → expo-app/src/screens/onboarding/OnboardingContext.tsx
- `DaysContent()` --calls--> `useOnboarding()`  [EXTRACTED]
  expo-app/src/screens/onboarding/DaysScreen.tsx → expo-app/src/screens/onboarding/OnboardingContext.tsx

## Import Cycles
- None detected.

## Communities (29 total, 2 thin omitted)

### Community 0 - "Frontend API Client"
Cohesion: 0.06
Nodes (31): deleteAccount(), login(), register(), updateProfile(), getActiveSplit(), listSplits(), setActiveSplit(), LoginScreen() (+23 more)

### Community 1 - "Auth & Splits Routes"
Cohesion: 0.09
Nodes (30): completeOnboarding(), getRecommendedSplits(), screenOptions, Stack, OnboardingStackParamList, BodyStatsContent(), Props, DaysContent() (+22 more)

### Community 2 - "Onboarding Flow"
Cohesion: 0.05
Nodes (37): dependencies, axios, expo, expo-camera, expo-image-manipulator, expo-image-picker, expo-notifications, expo-secure-store (+29 more)

### Community 3 - "Expo App Dependencies"
Cohesion: 0.11
Nodes (24): deletePhoto(), getPhotos(), uploadPhoto(), getExerciseProgress(), getHeatmap(), getMuscleVolume(), getOverview(), getRecords() (+16 more)

### Community 4 - "API Server Dependencies"
Cohesion: 0.11
Nodes (22): listExercises(), addExercise(), completeSession(), createSession(), deleteSet(), getSession(), logSet(), markRestDay() (+14 more)

### Community 5 - "Auth Store & Config"
Cohesion: 0.12
Nodes (9): client, AuthState, User, clearAuth(), getToken(), getUser(), saveToken(), saveUser() (+1 more)

### Community 6 - "Backend Controllers Core"
Cohesion: 0.09
Nodes (21): devDependencies, prisma, tsx, @types/bcryptjs, @types/cors, @types/express, @types/jsonwebtoken, @types/multer (+13 more)

### Community 7 - "Expo App Configuration"
Cohesion: 0.14
Nodes (10): validate(), loginSchema, registerSchema, router, bodyMetricSchema, router, onboardingSchema, router (+2 more)

### Community 8 - "API TypeScript Config"
Cohesion: 0.12
Nodes (17): adaptiveIcon, package, expo, android, icon, ios, name, newArchEnabled (+9 more)

### Community 9 - "Middleware & Route Setup"
Cohesion: 0.15
Nodes (14): dependencies, bcryptjs, cors, dotenv, express, jsonwebtoken, multer, @prisma/client (+6 more)

### Community 10 - "Root Package Scripts"
Cohesion: 0.12
Nodes (16): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, outDir (+8 more)

### Community 11 - "Photos Feature"
Cohesion: 0.14
Nodes (4): prisma, prisma, prisma, AppError

### Community 12 - "Workout Session Controller"
Cohesion: 0.12
Nodes (16): devDependencies, concurrently, name, private, scripts, api:build, api:db:migrate, api:db:seed (+8 more)

### Community 13 - "Validation Middleware"
Cohesion: 0.19
Nodes (5): authMiddleware(), router, router, router, router

### Community 14 - "Skills Lock Registry"
Cohesion: 0.18
Nodes (5): calculate1RM(), completeSession(), createSession(), getLastSessionLogs(), prisma

### Community 15 - "Auth Controller"
Cohesion: 0.18
Nodes (3): prisma, prisma, AuthRequest

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

### Community 21 - "Expo TypeScript Config"
Cohesion: 0.48
Nodes (5): deleteBodyMetric(), getBodyMetrics(), logBodyMetric(), Props, BodyMetric

### Community 22 - "Exercise Controller"
Cohesion: 0.29
Nodes (6): compilerOptions, baseUrl, paths, strict, extends, @/*

### Community 23 - "Auth Routes & Schemas"
Cohesion: 0.40
Nodes (3): router, storage, upload

### Community 24 - "Metro Bundler Config"
Cohesion: 0.50
Nodes (3): config, { getDefaultConfig }, { withNativeWind }

## Knowledge Gaps
- **185 isolated node(s):** `name`, `version`, `private`, `dev`, `build` (+180 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `setActiveSplit()` connect `Frontend API Client` to `Photos Feature`?**
  _High betweenness centrality (0.261) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Middleware & Route Setup` to `Backend Controllers Core`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `AuthRequest` connect `Auth Controller` to `Middleware & Route Setup`, `Photos Feature`, `Validation Middleware`, `Skills Lock Registry`, `Photo Controller & Cloudinary`, `Progress Analytics Controller`, `Database Seed Data`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _185 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend API Client` be split into smaller, more focused modules?**
  _Cohesion score 0.0632996632996633 - nodes in this community are weakly interconnected._
- **Should `Auth & Splits Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.08502415458937199 - nodes in this community are weakly interconnected._
- **Should `Onboarding Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._