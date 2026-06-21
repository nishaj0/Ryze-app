# Graph Report - Ryze  (2026-06-21)

## Corpus Check
- 1009 files · ~3,556,108 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 694 nodes · 1336 edges · 50 communities (43 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2cea14ef`
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
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]

## God Nodes (most connected - your core abstractions)
1. `LightTheme` - 47 edges
2. `space` - 38 edges
3. `radius` - 25 edges
4. `useAuthStore` - 22 edges
5. `useOnboarding()` - 17 edges
6. `compilerOptions` - 15 edges
7. `expo` - 13 edges
8. `AuthRequest` - 12 edges
9. `authMiddleware()` - 11 edges
10. `scripts` - 11 edges

## Surprising Connections (you probably didn't know these)
- `EditProfileScreen()` --calls--> `useAuthStore`  [EXTRACTED]
  expo-app/src/screens/profile/EditProfileScreen.tsx → expo-app/src/store/authStore.ts
- `SetTrackerStripProps` --references--> `SetLog`  [EXTRACTED]
  expo-app/src/components/SetTrackerStrip.tsx → expo-app/src/types/index.ts
- `HomeScreen()` --calls--> `useAuthStore`  [EXTRACTED]
  expo-app/src/screens/home/HomeScreen.tsx → expo-app/src/store/authStore.ts
- `WorkoutLoggerScreen()` --calls--> `useAuthStore`  [EXTRACTED]
  expo-app/src/screens/workout/WorkoutLoggerScreen.tsx → expo-app/src/store/authStore.ts
- `WorkoutLoggerScreen()` --calls--> `getSetRecommendation()`  [EXTRACTED]
  expo-app/src/screens/workout/WorkoutLoggerScreen.tsx → expo-app/src/utils/progression.ts

## Import Cycles
- None detected.

## Communities (50 total, 7 thin omitted)

### Community 0 - "Frontend API Client"
Cohesion: 0.16
Nodes (9): client, AuthState, User, clearAuth(), getToken(), getUser(), saveToken(), saveUser() (+1 more)

### Community 1 - "Auth & Splits Routes"
Cohesion: 0.07
Nodes (32): completeOnboarding(), getRecommendedSplits(), screenOptions, Stack, OnboardingStackParamList, BodyStatsContent(), Props, DaysContent() (+24 more)

### Community 2 - "Onboarding Flow"
Cohesion: 0.05
Nodes (43): dependencies, axios, expo, expo-camera, expo-font, @expo-google-fonts/inter, expo-image-manipulator, expo-image-picker (+35 more)

### Community 3 - "Expo App Dependencies"
Cohesion: 0.14
Nodes (20): IconName, IconProps, DashboardScreenSkeleton(), ExerciseProgressScreenSkeleton(), HomeScreenSkeleton(), InlineListSkeleton(), MetricsScreenSkeleton(), PhotoCompareScreenSkeleton() (+12 more)

### Community 4 - "API Server Dependencies"
Cohesion: 0.22
Nodes (8): addExercise(), completeSession(), deleteSet(), logSet(), swapExercise(), ExerciseQueueItem, Props, { width: screenW, height: screenH }

### Community 5 - "Community 5"
Cohesion: 0.24
Nodes (8): TypographyProps, Variant, spacing, fontFamily, fontSize, fontWeight, lineHeight, typography

### Community 6 - "Backend Controllers Core"
Cohesion: 0.06
Nodes (32): dependencies, axios, bcryptjs, cloudinary, cors, dotenv, express, jsonwebtoken (+24 more)

### Community 7 - "Expo App Configuration"
Cohesion: 0.18
Nodes (7): validate(), loginSchema, registerSchema, router, onboardingSchema, router, router

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
Cohesion: 0.24
Nodes (4): prisma, AppError, errorHandler(), app

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
Cohesion: 0.22
Nodes (4): prisma, sendPushNotification(), triggerReminders(), router

### Community 19 - "Database Seed Data"
Cohesion: 0.28
Nodes (4): calculateStreak(), getOverview(), getThisWeekWorkouts(), prisma

### Community 20 - "Personal Records Feature"
Cohesion: 0.20
Nodes (5): listExercises(), createSplit(), AVAILABLE_MUSCLE_GROUPS, DayConfig, Props

### Community 21 - "Expo TypeScript Config"
Cohesion: 0.16
Nodes (6): prisma, authMiddleware(), prisma, router, router, router

### Community 22 - "Exercise Controller"
Cohesion: 0.29
Nodes (6): compilerOptions, moduleResolution, paths, strict, extends, @/*

### Community 23 - "Community 23"
Cohesion: 0.06
Nodes (30): getExerciseProgress(), getHeatmap(), getMuscleVolume(), getOverview(), getVolumeHistory(), getRecords(), headerStyle, headerTitleStyle (+22 more)

### Community 30 - "Community 30"
Cohesion: 0.18
Nodes (10): deletePhoto(), getPhotos(), uploadPhoto(), PhotosStackParamList, Props, Props, { width: screenW }, Props (+2 more)

### Community 31 - "Community 31"
Cohesion: 0.15
Nodes (5): prisma, prisma, AuthRequest, bodyMetricSchema, router

### Community 32 - "Community 32"
Cohesion: 0.15
Nodes (15): register(), LoginScreen(), Props, Props, RegisterScreen(), MetricsScreen(), Stack, RootNavigator() (+7 more)

### Community 33 - "Community 33"
Cohesion: 0.17
Nodes (11): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, resolveJsonModule, skipLibCheck (+3 more)

### Community 34 - "Community 34"
Cohesion: 0.22
Nodes (10): SetTrackerStripProps, styles, WorkoutState, ActiveSession, Exercise, ExerciseLog, SetLog, getSetRecommendation() (+2 more)

### Community 35 - "Community 35"
Cohesion: 0.40
Nodes (5): migrate(), MUSCLES, prisma, SourceExercise, uploadImageToCloudinary()

### Community 36 - "Community 36"
Cohesion: 0.18
Nodes (11): createSession(), markRestDay(), HomeScreen(), Props, useWorkoutStore, SplitDay, cache, initMMKV() (+3 more)

### Community 37 - "Community 37"
Cohesion: 0.20
Nodes (9): getCalendarSessions(), updateSession(), Colors, CalendarSession, DAYS, getMonthDays(), MONTHS, REST_REASONS (+1 more)

### Community 38 - "Community 38"
Cohesion: 0.25
Nodes (7): getActiveSplit(), Props, ExerciseAlternative, ExerciseImage, Muscle, SplitDayExercise, UserSplit

### Community 39 - "Community 39"
Cohesion: 0.16
Nodes (8): BarChartProps, BarItem, HeatmapDay, HeatmapProps, ChartPoint, LineChartProps, RingChartProps, LightTheme

### Community 40 - "Community 40"
Cohesion: 0.14
Nodes (10): getSplit(), listSplits(), CardProps, InputProps, ScreenProps, ProfileStackParamList, Props, Props (+2 more)

### Community 41 - "Community 41"
Cohesion: 0.18
Nodes (9): deleteAccount(), login(), updateProfile(), EditProfileScreen(), equipmentOptions, experienceLevels, genders, goals (+1 more)

### Community 42 - "Community 42"
Cohesion: 0.29
Nodes (6): deleteBodyMetric(), getBodyMetrics(), logBodyMetric(), Props, { width: screenW }, BodyMetric

### Community 43 - "Community 43"
Cohesion: 0.43
Nodes (6): getSession(), HomeStackParamList, WorkoutSession, WorkoutSummary, Props, { width: screenW }

### Community 44 - "Community 44"
Cohesion: 0.40
Nodes (4): ExerciseMetaBadgesProps, levelColors, styles, ExerciseMuscle

### Community 45 - "Community 45"
Cohesion: 0.40
Nodes (3): ButtonProps, Size, Variant

## Knowledge Gaps
- **273 isolated node(s):** `prisma`, `prisma`, `ExerciseImageCarouselProps`, `styles`, `levelColors` (+268 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `setActiveSplit()` connect `Community 29` to `Community 40`, `Personal Records Feature`, `Community 38`?**
  _High betweenness centrality (0.244) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Backend Controllers Core` to `Middleware & Route Setup`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `LightTheme` connect `Community 39` to `Auth & Splits Routes`, `Expo App Dependencies`, `API Server Dependencies`, `Community 5`, `Personal Records Feature`, `Community 23`, `Community 30`, `Community 32`, `Community 34`, `Community 36`, `Community 37`, `Community 38`, `Community 40`, `Community 41`, `Community 42`, `Community 43`, `Community 44`, `Community 45`, `Community 47`, `Community 48`, `Community 49`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **What connects `prisma`, `prisma`, `ExerciseImageCarouselProps` to the rest of the system?**
  _273 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auth & Splits Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.07315233785822021 - nodes in this community are weakly interconnected._
- **Should `Onboarding Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.045454545454545456 - nodes in this community are weakly interconnected._
- **Should `Expo App Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.14130434782608695 - nodes in this community are weakly interconnected._