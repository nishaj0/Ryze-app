# Graph Report - gym-tracker-app  (2026-06-10)

## Corpus Check
- 138 files · ~37,661 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 731 nodes · 978 edges · 86 communities (42 shown, 44 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `56ffb6f4`
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
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]

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
- `ProfileScreen()` --calls--> `useAuthStore`  [EXTRACTED]
  expo-app/src/screens/profile/ProfileScreen.tsx → expo-app/src/store/authStore.ts
- `LoginScreen()` --calls--> `useAuthStore`  [EXTRACTED]
  expo-app/src/screens/auth/LoginScreen.tsx → expo-app/src/store/authStore.ts
- `RegisterScreen()` --calls--> `useAuthStore`  [EXTRACTED]
  expo-app/src/screens/auth/RegisterScreen.tsx → expo-app/src/store/authStore.ts
- `HomeScreen()` --calls--> `useAuthStore`  [EXTRACTED]
  expo-app/src/screens/home/HomeScreen.tsx → expo-app/src/store/authStore.ts

## Import Cycles
- None detected.

## Communities (86 total, 44 thin omitted)

### Community 5 - "Community 5"
Cohesion: 0.15
Nodes (14): login(), register(), updateProfile(), LoginScreen(), Props, Props, RegisterScreen(), Stack (+6 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (39): listExercises(), getExerciseProgress(), getHeatmap(), getMuscleVolume(), getOverview(), getRecords(), addExercise(), completeSession() (+31 more)

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (32): completeOnboarding(), getRecommendedSplits(), screenOptions, Stack, OnboardingStackParamList, BodyStatsContent(), Props, DaysContent() (+24 more)

### Community 8 - "Community 8"
Cohesion: 0.05
Nodes (38): dependencies, axios, expo, expo-camera, expo-image-manipulator, expo-image-picker, expo-notifications, expo-secure-store (+30 more)

### Community 9 - "Community 9"
Cohesion: 0.06
Nodes (31): dependencies, bcryptjs, cors, dotenv, express, jsonwebtoken, multer, @prisma/client (+23 more)

### Community 10 - "Community 10"
Cohesion: 0.12
Nodes (8): headerStyle, HomeStackNav, PhotosStackNav, ProfileStackNav, ProgressStackNav, stackOpts, Tab, WorkoutStackNav

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
Cohesion: 0.09
Nodes (22): computedHash, skillPath, source, sourceType, computedHash, skillPath, source, sourceType (+14 more)

### Community 17 - "Community 17"
Cohesion: 0.22
Nodes (4): errorHandler(), router, router, app

### Community 18 - "Community 18"
Cohesion: 0.15
Nodes (10): authMiddleware(), validate(), loginSchema, registerSchema, router, bodyMetricSchema, router, onboardingSchema (+2 more)

### Community 19 - "Community 19"
Cohesion: 0.18
Nodes (5): calculate1RM(), completeSession(), createSession(), getLastSessionLogs(), prisma

### Community 20 - "Community 20"
Cohesion: 0.20
Nodes (9): 1. Install graphify, 2. Add graphify to PATH (Windows — required), 3. Build the initial graph, 4. Install the git hooks, 5. Install agent integrations (per agent), AI Coding Agents & Knowledge Graph, Daily workflow, Prerequisites (+1 more)

### Community 21 - "Community 21"
Cohesion: 0.19
Nodes (4): prisma, prisma, AuthRequest, router

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

### Community 31 - "Community 31"
Cohesion: 0.12
Nodes (9): client, AuthState, User, clearAuth(), getToken(), getUser(), saveToken(), saveUser() (+1 more)

### Community 32 - "Community 32"
Cohesion: 0.50
Nodes (3): config, { getDefaultConfig }, { withNativeWind }

### Community 39 - "Community 39"
Cohesion: 0.16
Nodes (12): deleteAccount(), getActiveSplit(), listSplits(), setActiveSplit(), MainTabParamList, ProfileStackParamList, ScreenProps, WorkoutStackParamList (+4 more)

### Community 40 - "Community 40"
Cohesion: 0.12
Nodes (15): 1. Concrete Transformation Patterns, 2. Error-First Structure, 3. Quantified Impact, 4. Self-Contained Examples, 5. Semantic Naming, Code Example Standards, Comments, Impact Level Guidelines (+7 more)

### Community 41 - "Community 41"
Cohesion: 0.21
Nodes (8): deletePhoto(), getPhotos(), uploadPhoto(), PhotosStackParamList, Props, Props, Props, ProgressPhoto

### Community 42 - "Community 42"
Cohesion: 0.14
Nodes (13): Common Skill Categories, Find Skills, How to Help Users Find Skills, Step 1: Understand What They Need, Step 2: Check the Leaderboard First, Step 3: Search for Skills, Step 4: Verify Quality Before Recommending, Step 5: Present Options to the User (+5 more)

### Community 43 - "Community 43"
Cohesion: 0.20
Nodes (9): 1. Query Performance (query), 2. Connection Management (conn), 3. Security & RLS (security), 4. Schema Design (schema), 5. Concurrency & Locking (lock), 6. Data Access Patterns (data), 7. Monitoring & Diagnostics (monitor), 8. Advanced Features (advanced) (+1 more)

### Community 45 - "Community 45"
Cohesion: 0.25
Nodes (7): [0.1.3](https://github.com/supabase/agent-skills/compare/v0.1.2...v0.1.3) (2026-06-02), [0.1.4](https://github.com/supabase/agent-skills/compare/v0.1.3...v0.1.4) (2026-06-05), Bug Fixes, Bug Fixes, Changelog, Features, Features

### Community 46 - "Community 46"
Cohesion: 0.25
Nodes (7): [1.2.0](https://github.com/supabase/agent-skills/compare/v1.1.1...v1.2.0) (2026-06-02), [1.3.0](https://github.com/supabase/agent-skills/compare/v1.2.0...v1.3.0) (2026-06-05), Bug Fixes, Bug Fixes, Changelog, Features, Features

### Community 47 - "Community 47"
Cohesion: 0.25
Nodes (7): Core Principles, Making and Committing Schema Changes, Reference Guides, Supabase, Supabase CLI, Supabase Documentation, Supabase MCP Server

### Community 48 - "Community 48"
Cohesion: 0.29
Nodes (4): RootNavigator(), Stack, RootStackParamList, queryClient

### Community 49 - "Community 49"
Cohesion: 0.33
Nodes (5): caveman, Example output, How to invoke, See also, What it does

### Community 50 - "Community 50"
Cohesion: 0.33
Nodes (5): Auto-Clarity, Boundaries, Intensity, Persistence, Rules

### Community 51 - "Community 51"
Cohesion: 0.33
Nodes (5): How to Use, References, Rule Categories by Priority, Supabase Postgres Best Practices, When to Apply

### Community 52 - "Community 52"
Cohesion: 0.50
Nodes (3): Fix suggestion, Source, What happened

## Knowledge Gaps
- **357 isolated node(s):** `What it does`, `How to invoke`, `Example output`, `See also`, `Persistence` (+352 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **44 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuthStore` connect `Community 5` to `Community 6`, `Community 39`, `Community 7`, `Community 48`, `Community 31`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **Why does `AuthRequest` connect `Community 21` to `Community 44`, `Community 19`, `Community 22`, `Community 23`, `Community 25`, `Community 26`, `Community 28`, `Community 30`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **What connects `What it does`, `How to invoke`, `Example output` to the rest of the system?**
  _357 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 6` be split into smaller, more focused modules?**
  _Cohesion score 0.06836158192090395 - nodes in this community are weakly interconnected._
- **Should `Community 7` be split into smaller, more focused modules?**
  _Cohesion score 0.07164404223227752 - nodes in this community are weakly interconnected._
- **Should `Community 8` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `Community 9` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._