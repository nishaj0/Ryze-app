# Graph Report - Ryze  (2026-06-21)

## Corpus Check
- 1010 files · ~3,556,971 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 715 nodes · 1525 edges · 38 communities (35 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f8b6acc0`
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
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 43|Community 43]]

## God Nodes (most connected - your core abstractions)
1. `useTheme()` - 109 edges
2. `LightTheme` - 48 edges
3. `space` - 38 edges
4. `radius` - 25 edges
5. `useAuthStore` - 22 edges
6. `useOnboarding()` - 17 edges
7. `compilerOptions` - 15 edges
8. `expo` - 13 edges
9. `AuthRequest` - 12 edges
10. `authMiddleware()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `useTheme()`  [EXTRACTED]
  expo-app/src/App.tsx → expo-app/src/theme/themeStore.ts
- `Screen()` --calls--> `useTheme()`  [EXTRACTED]
  expo-app/src/components/Screen.tsx → expo-app/src/theme/themeStore.ts
- `SetTrackerStripProps` --references--> `SetLog`  [EXTRACTED]
  expo-app/src/components/SetTrackerStrip.tsx → expo-app/src/types/index.ts
- `Typography()` --calls--> `useTheme()`  [EXTRACTED]
  expo-app/src/components/Typography.tsx → expo-app/src/theme/themeStore.ts
- `BarChart()` --calls--> `useTheme()`  [EXTRACTED]
  expo-app/src/components/charts/BarChart.tsx → expo-app/src/theme/themeStore.ts

## Import Cycles
- None detected.

## Communities (38 total, 3 thin omitted)

### Community 0 - "Frontend API Client"
Cohesion: 0.08
Nodes (17): client, deleteBodyMetric(), getBodyMetrics(), logBodyMetric(), MetricsScreen(), Props, theme, { width: screenW } (+9 more)

### Community 1 - "Auth & Splits Routes"
Cohesion: 0.06
Nodes (59): deleteAccount(), login(), register(), updateProfile(), LoginScreen(), Props, Props, RegisterScreen() (+51 more)

### Community 2 - "Onboarding Flow"
Cohesion: 0.05
Nodes (43): dependencies, axios, expo, expo-camera, expo-font, @expo-google-fonts/inter, expo-image-manipulator, expo-image-picker (+35 more)

### Community 3 - "Expo App Dependencies"
Cohesion: 0.06
Nodes (51): Button(), ButtonProps, Size, Variant, Card(), CardProps, ExerciseImageCarousel(), ExerciseImageCarouselProps (+43 more)

### Community 4 - "API Server Dependencies"
Cohesion: 0.14
Nodes (10): listExercises(), addExercise(), completeSession(), deleteSet(), logSet(), swapExercise(), ExerciseQueueItem, Props (+2 more)

### Community 5 - "Community 5"
Cohesion: 0.32
Nodes (5): getRecords(), ProgressStackParamList, Props, RecordsScreen(), PersonalRecord

### Community 6 - "Backend Controllers Core"
Cohesion: 0.06
Nodes (32): dependencies, axios, bcryptjs, cloudinary, cors, dotenv, express, jsonwebtoken (+24 more)

### Community 7 - "Expo App Configuration"
Cohesion: 0.12
Nodes (11): authMiddleware(), validate(), loginSchema, registerSchema, router, bodyMetricSchema, router, onboardingSchema (+3 more)

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
Cohesion: 0.16
Nodes (5): prisma, prisma, AppError, errorHandler(), app

### Community 12 - "Workout Session Controller"
Cohesion: 0.12
Nodes (16): devDependencies, concurrently, name, private, scripts, api:build, api:db:migrate, api:db:seed (+8 more)

### Community 13 - "Community 13"
Cohesion: 0.09
Nodes (22): computedHash, skillPath, source, sourceType, computedHash, skillPath, source, sourceType (+14 more)

### Community 14 - "Skills Lock Registry"
Cohesion: 0.11
Nodes (6): calculate1RM(), completeSession(), createSession(), getLastSessionLogs(), prisma, router

### Community 16 - "Notifications Feature"
Cohesion: 0.40
Nodes (10): computedHash, skillPath, source, sourceType, skills, caveman, find-skills, supabase (+2 more)

### Community 17 - "Photo Controller & Cloudinary"
Cohesion: 0.32
Nodes (4): generateToken(), login(), prisma, register()

### Community 18 - "Progress Analytics Controller"
Cohesion: 0.22
Nodes (4): prisma, sendPushNotification(), triggerReminders(), router

### Community 19 - "Database Seed Data"
Cohesion: 0.28
Nodes (4): calculateStreak(), getOverview(), getThisWeekWorkouts(), prisma

### Community 20 - "Personal Records Feature"
Cohesion: 0.50
Nodes (4): getSetRecommendation(), getWeightIncrement(), RecommendationResult, WorkoutLoggerScreen()

### Community 21 - "Expo TypeScript Config"
Cohesion: 0.18
Nodes (5): prisma, prisma, AuthRequest, prisma, router

### Community 22 - "Exercise Controller"
Cohesion: 0.29
Nodes (6): compilerOptions, moduleResolution, paths, strict, extends, @/*

### Community 23 - "Community 23"
Cohesion: 0.13
Nodes (16): getExerciseProgress(), getHeatmap(), getMuscleVolume(), getOverview(), getVolumeHistory(), Props, StatCardProps, theme (+8 more)

### Community 29 - "Community 29"
Cohesion: 0.08
Nodes (21): completeOnboarding(), getRecommendedSplits(), createSplit(), getActiveSplit(), getSplit(), listSplits(), setActiveSplit(), prisma (+13 more)

### Community 30 - "Community 30"
Cohesion: 0.08
Nodes (28): deletePhoto(), getPhotos(), uploadPhoto(), HomeStack(), HomeStackNav, MainTabs(), PhotosStack(), PhotosStackNav (+20 more)

### Community 33 - "Community 33"
Cohesion: 0.17
Nodes (11): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, resolveJsonModule, skipLibCheck (+3 more)

### Community 34 - "Community 34"
Cohesion: 0.32
Nodes (10): WorkoutState, ActiveSession, Exercise, ExerciseAlternative, ExerciseImage, ExerciseLog, Muscle, SetLog (+2 more)

### Community 35 - "Community 35"
Cohesion: 0.40
Nodes (5): migrate(), MUSCLES, prisma, SourceExercise, uploadImageToCloudinary()

### Community 36 - "Community 36"
Cohesion: 0.22
Nodes (8): createSession(), markRestDay(), HomeScreen(), Props, SplitDay, cache, initMMKV(), mmkv

### Community 37 - "Community 37"
Cohesion: 0.18
Nodes (10): getCalendarSessions(), updateSession(), colors, CalendarSession, DAYS, getMonthDays(), MONTHS, REST_REASONS (+2 more)

### Community 39 - "Community 39"
Cohesion: 0.08
Nodes (31): BarChart(), BarChartProps, BarItem, Heatmap(), HeatmapDay, HeatmapProps, ChartPoint, LineChart() (+23 more)

### Community 43 - "Community 43"
Cohesion: 0.31
Nodes (8): getSession(), HomeStackParamList, useWorkoutStore, WorkoutSummary, Props, theme, { width: screenW }, WorkoutSummaryScreen()

## Knowledge Gaps
- **284 isolated node(s):** `queryClient`, `Variant`, `Size`, `ButtonProps`, `CardProps` (+279 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useTheme()` connect `Expo App Dependencies` to `Frontend API Client`, `Auth & Splits Routes`, `Community 36`, `Community 5`, `Community 37`, `Community 39`, `API Server Dependencies`, `Community 43`, `Community 23`, `Community 29`, `Community 30`?**
  _High betweenness centrality (0.122) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Backend Controllers Core` to `Middleware & Route Setup`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **What connects `queryClient`, `Variant`, `Size` to the rest of the system?**
  _284 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend API Client` be split into smaller, more focused modules?**
  _Cohesion score 0.08067226890756303 - nodes in this community are weakly interconnected._
- **Should `Auth & Splits Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.05663474692202462 - nodes in this community are weakly interconnected._
- **Should `Onboarding Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.045454545454545456 - nodes in this community are weakly interconnected._
- **Should `Expo App Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06284153005464481 - nodes in this community are weakly interconnected._