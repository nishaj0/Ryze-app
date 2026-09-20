# Ryze App — Complete Redesign Specification & Implementation Checklist

**Brand Identity:** Chalk Athletic Modernism  
**Primary Accent:** `#c24914` (Terracotta) | **Base Canvas:** `#fcf9f3` (Warm Chalk) | **Font:** Outfit  
**Platform Target:** Expo (React Native) + Node.js / Express / PostgreSQL / Prisma  

---

## 1. Executive Summary & Architectural Overview

The redesign elevates Ryze from a basic utility logger into a modern, distraction-free athletic training ecosystem. It solves the critical UX issues seen in the baseline screenshots: visual crowding, cramped touch targets, repetitive 0-state charts, and lack of visual breathing room.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          GLOBAL APP SHELL                              │
│                                                                        │
│   [Workouts / Today]  [Analytics]  ★ COACH ★  [Visuals]  [Profile]     │
│        (Home)          (Progress)   (Center)   (Photos)  (Settings)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┴───────────────────────────────┐
    ▼                                                               ▼
[Active Flow]                                               [Rest Flow]
Pre-Workout Setup ──► Active Logger ──► Summary          Recovery Protocol & Readiness
```

---

## 2. High-Level Workflow Transformations

| Feature / Flow | Baseline UX (Screenshots) | Redesigned Experience | Core Benefit |
| :--- | :--- | :--- | :--- |
| **Design Language** | Raw white boxes, dark harsh borders, cramped padding. | **Chalk Athletic Modernism**: `#fcf9f3` warm chalk base, `#c24914` terracotta CTA, soft card elevation, generous whitespace rhythm. | Premium, high-focus feel comparable to WHOOP and Apple Fitness. |
| **Weekly Training Rhythm** | Isolated day indicators (`Day 1`, `Day 2`) without weekly context. | **7-Day Consistency Strip** (`M T W T F S S`) with soft state dots and completion counts (`4 of 5 Done`). | Athletes get an immediate mental model of weekly volume and momentum. |
| **Pre-Workout Preparation** | Lifters jumped directly into logging with fixed sequences. | **Dedicated Reordering & Deload Setup**: drag-to-reorder movements based on gym equipment availability. | Eliminates gym-floor equipment bottlenecks; enables seamless deload toggling. |
| **In-Gym Active Logging** | Small stepper inputs, cluttered buttons, cramped instruction sheets. | **High-Contrast Thumb-Friendly Logging**: large keypad/stepper selectors, warm-up tagging, RPE slider, and auto-rest timer. | Optimized for quick 1-thumb logging between heavy working sets. |
| **AI Coach Integration** | Blank empty chat box with no prompts or context (`IMAGE_42`). | **Centered Floating Tab** with contextual conversation chips, session memory, and **Safe Confirmation Cards**. | AI becomes an active co-pilot with safe boundaries (requires tap to confirm changes). |
| **Analytics & Muscle Load** | 3000px vertically stretched page with tiny repetitive bar charts. | **Calibrated Biomechanical Hub**: Top 3 KPIs, Front/Back anatomical muscle volume map, 8-week progressive load curve, 90-day heatmap. | Delivers actionable progressive overload insights rather than raw data dumps. |

---

## 3. Brand Tokens & Design System Reference

```css
/* Color Palette: Chalk Athletic */
--bg-chalk:            #fcf9f3; /* App global background */
--surface-card:        #ffffff; /* Elevated interactive cards */
--surface-subtle:      #f6f3ed; /* Secondary containers, inactive pills */
--surface-dim:         #dcdad4; /* Dividers and borders */

--accent-terracotta:   #c24914; /* Primary CTAs, active highlights */
--accent-hover:        #a83e0f; /* Button active/pressed states */
--accent-soft:         #fbeee8; /* Terracotta tint for badges */

--text-headline:       #1a1917; /* High-contrast headings (Outfit Bold) */
--text-body:           #49453a; /* Paragraphs and secondary labels */
--text-muted:          #7a766c; /* Captions, timestamps, unit labels */

--status-success:      #2d6a4f; /* PRs, completed checks */
--status-success-bg:   #e8f5e9; /* Success pill background */
```

---

## 4. Screen-by-Screen UX Changes & Specifications

### 4.1 Today Dashboard (`Today Dashboard - Balanced`)
* **Key Additions:**
  * Greeting header displaying dynamic date (`Wednesday, Sep 18`) and recovery state (`Peak Recovery • 92%`).
  * Hero card for active workout (`Full Body Power A`) with duration (`50 min`), lift volume (`6 lifts`), and target tags.
  * Side-by-side primary CTA (**Start Workout**) and low-friction secondary (**Rest Day**).
  * 7-day Weekly Rhythm strip showing weekly adherence (`4 of 5 Done`).
  * 2-column Biometrics widget: **Weight Trend** (`74.2 kg (+0.4 kg)`) and **Protein Goal** (`142 / 180g (78%)`).
  * Compact Ryze Coach note pill with direct gateway into the Coach tab.

### 4.2 Active Workout Logger (`Active Workout Logger`)
* **Key Additions:**
  * High-contrast set progress pill bar (`Set 1 of 3`, `Set 2`, `Set 3`).
  * Large weight and rep steppers optimized for one-thumb gym operation.
  * Optional RPE rating selector (`1–10`) and dedicated **Mark warm-up** toggle.
  * Automatic Rest Interval countdown timer (`0:04`) with prominent **Start Next Set** and **Skip rest** controls.
  * Floating bottom utilities: **Switch Exercise** and **Replace with Alternative**.

### 4.3 Pre-Workout Routine Setup (`Pre-Workout Routine Setup`)
* **Key Additions:**
  * Reorderable exercise card queue with thumbnail, scheduled sets, target rep ranges, and equipment badges.
  * Up/Down reorder handles to reorganize exercises based on gym machine availability.
  * Global **Mark as Deload** toggle button to adjust prescribed loads downwards by 30%.
  * Fixed bottom CTA: **Begin Session**.

### 4.4 Workout Complete Summary (`Workout Complete Summary`)
* **Key Additions:**
  * Top celebration card highlighting total tonnage lifted (`195 kg`), completed sets (`1 set`), and duration (`1 min`).
  * Visual volume distribution bars breaking down load by completed movement.
  * Collapsible qualitative input cards: **Session Notes** and **How did today feel?** (directly feeding AI Coach memory).
  * Full exercise completion list with checkmark states and logged weight totals.

### 4.5 Analytics & Progress (`Analytics & Progress - Balanced`)
* **Key Additions:**
  * Top 3 KPI cards: Volume (`14.8k kg (+8%)`), Sessions (`4 done`), Total PRs (`6 hit`).
  * Target Load anatomical visualization with toggle for **Front** and **Back** muscular chains.
  * Muscle load volume distribution bars (`Shoulders: 4,200 kg`, `Chest: 3,850 kg`, etc.).
  * 8-week progressive load curve with highlighted active week (`W8 • 14.8k`).
  * 90-day GitHub-style consistency commit grid celebrating active streaks (`14 Day Streak 🔥`).
  * Recent PR highlights with delta improvements (`+2.5 kg`, `+3 reps`).

### 4.6 Workout History Calendar (`Workout History Calendar`)
* **Key Additions:**
  * Month-by-month calendar view with active training day badges (green dots) and rest days (terracotta dots).
  * Dual KPI summary cards: **Workouts Completed** and **Rest Days Logged**.
  * Selected-date card preview showing exercises logged and duration.

### 4.7 Browse Exercises & Form Sheet (`Browse Exercises`, `Exercise Detail & Form Sheet`)
* **Key Additions:**
  * Horizontal chip filtering across 17 muscle groups (`All`, `Abdominals`, `Abductors`, etc.).
  * Debounced search bar querying 873+ exercises.
  * Exercise list items displaying thumbnail, target muscle, mechanics (`Compound` / `Isolation`), and equipment.
  * Modal bottom sheet featuring:
    * High-resolution movement posture image.
    * Muscle map highlighting primary and secondary muscle activation.
    * Multi-step instructional form carousel with paginated dot indicators.

### 4.8 Program & Split Library (`Program & Split Library`)
* **Key Additions:**
  * Active Split highlight card (`Sample Full Body • 3 days/wk`) with quick edit and delete actions.
  * Top action pills for **Community Library**, **Build with AI**, and **Create Custom Split**.
  * Card metadata tags for weekly frequency and training archetype (`PPL`, `Full Body`, `Bro Split`).

### 4.9 Ryze AI Coach (`Ryze AI Coach`)
* **Key Additions:**
  * Prominent center navigation placement with glowing terracotta action button.
  * Contextual prompt starter pills (*"Analyze my bench progress"*, *"Suggest deload"*, *"Swap today's shoulder exercise"*).
  * Athlete vs. Coach message bubbles with distinct avatar styling.
  * Interactive **Confirmation Cards** embedded in messages for approved exercise substitutions (`Confirm Swap` / `Decline`).

### 4.10 Athlete Profile & Settings (`Athlete Profile & Settings`, `Edit Profile`)
* **Key Additions:**
  * Athlete avatar card with email and active split shortcut.
  * Segmented preferences for Units (`Kilograms` vs `Pounds`) and Theme (`Chalk (Light)` vs `Iron (Dark)`).
  * Notification controls: Weekly check-in reminders and custom time picker.
  * Structured Edit Profile form: Goals, training frequency, equipment access, and medical/training limitations.

### 4.11 Physique & Visuals Vault (`Physique & Visuals Vault`)
* **Key Additions:**
  * Before & After comparison slider to compare progress photos across time.
  * Chronological photo timeline grouped by check-in date.
  * Private visual notes and pose tags (`Front Relaxed`, `Back Double Bicep`, `Side Profile`).

### 4.12 Rest Day Protocol (`Rest Day & Recovery Protocol`)
* **Key Additions:**
  * Circular readiness score dial (`92% Readiness • Peak Recovery`).
  * 1-tap subjective recovery loggers for Sleep quality, Soreness level, and Hydration.
  * Recommended active recovery routines (15-min Mobility Flow, Light Zone 2 Walking).

---

## 5. Actionable Implementation Checklist

### Phase 1: Theme & Design System Setup
- [ ] **1.1 Tokens:** Configure Tailwind / NativeWind theme in `tailwind.config.js` with Chalk palette:
  - Background: `#fcf9f3`
  - Cards: `#ffffff`
  - Subtle Surface: `#f6f3ed`
  - Terracotta Accent: `#c24914`
  - Success: `#2d6a4f`
- [ ] **1.2 Radii:** Enforce global corner radiuses: `rounded-2xl` for cards, `rounded-xl` for buttons/chips, `rounded-full` for badges.
- [ ] **1.3 Typography:** Configure `Outfit` font weights (Regular 400, Medium 500, SemiBold 600, Bold 700).

### Phase 2: Shell & Bottom Navigation
- [ ] **2.1 Tab Layout:** Update `expo-app/src/navigation/TabNavigator.tsx` to 5-tab structure:
  - Tab 1: `Today` (Home icon)
  - Tab 2: `Analytics` (Bar chart icon)
  - Tab 3 (Center): `Coach` (Raised circular button with terracotta gradient & star icon)
  - Tab 4: `Visuals` (Camera icon)
  - Tab 5: `Profile` (User icon)
- [ ] **2.2 App Headers:** Implement standardized Top App Bar with back button, page title, and notification bell.

### Phase 3: Today Dashboard (`Today Dashboard - Balanced`)
- [ ] **3.1 Header:** Build greeting header displaying date and readiness pill (`Peak Recovery • 92%`).
- [ ] **3.2 Hero Workout Card:** Display active workout title, duration, exercises count, and target muscle tags.
- [ ] **3.3 Primary CTAs:** Add side-by-side **Start Workout** and **Rest Day** buttons.
- [ ] **3.4 Weekly Rhythm:** Build horizontal 7-day strip linked to weekly session completion states.
- [ ] **3.5 Biometrics Card:** Build 2-column widget (Weight with delta indicator and Protein goal bar).
- [ ] **3.6 Coach Insight:** Add compact AI Coach recommendation banner linking to Coach tab.

### Phase 4: Active Workout & Routine Setup Suite
- [ ] **4.1 Pre-Workout Setup:** Build exercise reordering screen using React Native Draggable FlatList.
- [ ] **4.2 Deload Toggle:** Add deload toggle reducing suggested target weights by 30%.
- [ ] **4.3 Active Logger:** Build set logging rows with large weight/rep steppers and warm-up toggles.
- [ ] **4.4 Rest Timer:** Implement auto-triggering rest countdown with haptic feedback on completion.
- [ ] **4.5 Exercise Actions:** Add modal sheets for "Switch Exercise" and "Replace with Alternative".
- [ ] **4.6 Workout Complete:** Build summary screen with tonnage volume, duration, and feeling notes.

### Phase 5: Analytics & Biomechanical Hub
- [ ] **5.1 Top KPIs:** Build top 3-card metric row (Volume, Sessions, PRs).
- [ ] **5.2 Muscle Anatomy:** Integrate Front/Back SVG anatomical body map with muscle load color intensities.
- [ ] **5.3 Volume Trend:** Implement 8-week progressive load curve using `react-native-svg` / Victory Native.
- [ ] **5.4 Consistency Heatmap:** Build 90-day commit-style heatmap grid.
- [ ] **5.5 PRs List:** Build personal record cards displaying weight/rep deltas.

### Phase 6: Ryze AI Coach & Safe Action Cards
- [ ] **6.1 Starter Chips:** Add quick-prompt pills at top of chat (*"Analyze my bench"*, *"Suggest deload"*).
- [ ] **6.2 Safe Confirmation Cards:** Build actionable message cards with `Confirm` and `Decline` buttons.
- [ ] **6.3 Backend Endpoint:** Connect confirmation cards to `POST /api/chat/messages/:id/resolve`.

### Phase 7: Exercise Library, Programs & Visuals
- [ ] **7.1 Category Chips:** Add horizontal muscle group filter chips (17 categories).
- [ ] **7.2 Search:** Implement instant client-side debounced search across all 873 exercises.
- [ ] **7.3 Form Sheet:** Build modal bottom sheet with posture image, muscle map, and technique cues.
- [ ] **7.4 Program Library:** Build program management screen with Active Split badge and creation buttons.
- [ ] **7.5 Physique Vault:** Implement before/after photo comparison slider.
- [ ] **7.6 Rest Day Hub:** Build recovery protocol screen with readiness dial and subjective bio-loggers.
