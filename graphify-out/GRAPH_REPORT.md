# Graph Report - gym-tracker-app  (2026-06-10)

## Corpus Check
- 94 files · ~26,427 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 555 nodes · 846 edges · 39 communities (29 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2e04fbdb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]

## God Nodes (most connected - your core abstractions)
1. `useOnboarding()` - 17 edges
2. `useAuthStore` - 17 edges
3. `compilerOptions` - 15 edges
4. `Dashboard Design System Skill (Universal)` - 14 edges
5. `expo` - 12 edges
6. `Ryze - Gym Progress Tracker` - 12 edges
7. `AuthRequest` - 11 edges
8. `authMiddleware()` - 11 edges
9. `scripts` - 11 edges
10. `OnboardingStackParamList` - 10 edges

## Surprising Connections (you probably didn't know these)
- `RootNavigator()` --calls--> `useAuthStore`  [EXTRACTED]
  expo-app/src/navigation/RootNavigator.tsx → expo-app/src/store/authStore.ts
- `LoginScreen()` --calls--> `useAuthStore`  [EXTRACTED]
  expo-app/src/screens/auth/LoginScreen.tsx → expo-app/src/store/authStore.ts
- `RegisterScreen()` --calls--> `useAuthStore`  [EXTRACTED]
  expo-app/src/screens/auth/RegisterScreen.tsx → expo-app/src/store/authStore.ts
- `HomeScreen()` --calls--> `useAuthStore`  [EXTRACTED]
  expo-app/src/screens/home/HomeScreen.tsx → expo-app/src/store/authStore.ts
- `BodyStatsContent()` --calls--> `useOnboarding()`  [EXTRACTED]
  expo-app/src/screens/onboarding/BodyStatsScreen.tsx → expo-app/src/screens/onboarding/OnboardingContext.tsx

## Import Cycles
- None detected.

## Communities (39 total, 10 thin omitted)

### Community 5 - "Community 5"
Cohesion: 0.05
Nodes (38): deleteAccount(), login(), register(), updateProfile(), client, getActiveSplit(), listSplits(), setActiveSplit() (+30 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (39): listExercises(), getExerciseProgress(), getHeatmap(), getMuscleVolume(), getOverview(), getRecords(), addExercise(), completeSession() (+31 more)

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (33): completeOnboarding(), getRecommendedSplits(), screenOptions, Stack, MainTabParamList, OnboardingStackParamList, ScreenProps, WorkoutStackParamList (+25 more)

### Community 8 - "Community 8"
Cohesion: 0.05
Nodes (38): dependencies, axios, expo, expo-camera, expo-image-manipulator, expo-image-picker, expo-notifications, expo-secure-store (+30 more)

### Community 9 - "Community 9"
Cohesion: 0.06
Nodes (31): dependencies, bcryptjs, cors, dotenv, express, jsonwebtoken, multer, @prisma/client (+23 more)

### Community 10 - "Community 10"
Cohesion: 0.09
Nodes (16): deletePhoto(), getPhotos(), uploadPhoto(), headerStyle, HomeStackNav, PhotosStackNav, ProfileStackNav, ProgressStackNav (+8 more)

### Community 11 - "Community 11"
Cohesion: 0.06
Nodes (30): API Endpoints, Auth, Backend, Backend, Backend, Backend (api/.env), Database Schema, Development (+22 more)

### Community 12 - "Community 12"
Cohesion: 0.11
Nodes (18): backgroundColor, adaptiveIcon, package, expo, android, icon, ios, name (+10 more)

### Community 13 - "Community 13"
Cohesion: 0.11
Nodes (17): compilerOptions, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution (+9 more)

### Community 14 - "Community 14"
Cohesion: 0.12
Nodes (16): devDependencies, concurrently, name, private, scripts, api:build, api:db:migrate, api:db:seed (+8 more)

### Community 15 - "Community 15"
Cohesion: 0.13
Nodes (14): Accessibility, Brand, Component Rule Expectations, Dashboard Design System Skill (Universal), Example Constraint Language, Expected Behavior, Guideline Authoring Workflow, Mission (+6 more)

### Community 16 - "Community 16"
Cohesion: 0.18
Nodes (6): prisma, AppError, errorHandler(), onboardingSchema, router, app

### Community 17 - "Community 17"
Cohesion: 0.19
Nodes (5): authMiddleware(), router, router, router, router

### Community 18 - "Community 18"
Cohesion: 0.18
Nodes (7): validate(), loginSchema, registerSchema, router, bodyMetricSchema, router, router

### Community 19 - "Community 19"
Cohesion: 0.18
Nodes (5): calculate1RM(), completeSession(), createSession(), getLastSessionLogs(), prisma

### Community 20 - "Community 20"
Cohesion: 0.20
Nodes (9): 1. Install graphify, 2. Add graphify to PATH (Windows — required), 3. Build the initial graph, 4. Install the git hooks, 5. Install agent integrations (per agent), AI Coding Agents & Knowledge Graph, Daily workflow, Prerequisites (+1 more)

### Community 21 - "Community 21"
Cohesion: 0.20
Nodes (3): prisma, prisma, AuthRequest

### Community 22 - "Community 22"
Cohesion: 0.20
Nodes (4): prisma, router, storage, upload

### Community 24 - "Community 24"
Cohesion: 0.39
Nodes (5): deleteBodyMetric(), getBodyMetrics(), logBodyMetric(), Props, BodyMetric

### Community 25 - "Community 25"
Cohesion: 0.32
Nodes (4): generateToken(), login(), prisma, register()

### Community 26 - "Community 26"
Cohesion: 0.32
Nodes (4): calculateStreak(), getOverview(), getThisWeekWorkouts(), prisma

### Community 27 - "Community 27"
Cohesion: 0.25
Nodes (6): broSplit, ExerciseData, exercises, fullBodySplit, pplSplit, prisma

### Community 29 - "Community 29"
Cohesion: 0.29
Nodes (6): compilerOptions, baseUrl, paths, strict, extends, @/*

### Community 32 - "Community 32"
Cohesion: 0.50
Nodes (3): config, { getDefaultConfig }, { withNativeWind }

## Knowledge Gaps
- **246 isolated node(s):** `PreToolUse`, `$schema`, `plugin`, `@opencode-ai/plugin`, `name` (+241 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuthStore` connect `Community 5` to `Community 6`, `Community 7`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `AuthRequest` connect `Community 21` to `Community 16`, `Community 17`, `Community 19`, `Community 22`, `Community 23`, `Community 25`, `Community 26`, `Community 28`, `Community 30`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `useOnboarding()` connect `Community 7` to `Community 5`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **What connects `PreToolUse`, `$schema`, `plugin` to the rest of the system?**
  _246 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.05257936507936508 - nodes in this community are weakly interconnected._
- **Should `Community 6` be split into smaller, more focused modules?**
  _Cohesion score 0.06836158192090395 - nodes in this community are weakly interconnected._
- **Should `Community 7` be split into smaller, more focused modules?**
  _Cohesion score 0.0726764500349406 - nodes in this community are weakly interconnected._