import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ExerciseData {
  name: string;
  muscleGroup: string;
  secondaryMuscles: string[];
  equipmentNeeded: string;
  instructions?: string;
  alternatives: { name: string; reason: string }[];
}

const exercises: ExerciseData[] = [
  {
    name: "Barbell Bench Press",
    muscleGroup: "chest",
    secondaryMuscles: ["triceps", "shoulders"],
    equipmentNeeded: "barbell, bench",
    instructions: "Lie on bench, grip bar slightly wider than shoulder width. Lower to chest, press up.",
    alternatives: [
      { name: "Dumbbell Bench Press", reason: "recommended" },
      { name: "Push-ups", reason: "machine-free" },
      { name: "Machine Chest Press", reason: "beginner-friendly" },
    ],
  },
  {
    name: "Incline Dumbbell Press",
    muscleGroup: "chest",
    secondaryMuscles: ["triceps", "shoulders"],
    equipmentNeeded: "dumbbells, incline bench",
    instructions: "Set bench to 30-45 degrees. Press dumbbells up from chest level.",
    alternatives: [
      { name: "Incline Barbell Bench Press", reason: "recommended" },
      { name: "Incline Machine Press", reason: "beginner-friendly" },
    ],
  },
  {
    name: "Cable Fly",
    muscleGroup: "chest",
    secondaryMuscles: ["shoulders"],
    equipmentNeeded: "cable machine",
    instructions: "Stand between cables, bring handles together in front of chest with slight bend in elbows.",
    alternatives: [
      { name: "Dumbbell Fly", reason: "recommended" },
      { name: "Pec Deck Machine", reason: "beginner-friendly" },
    ],
  },
  {
    name: "Dumbbell Bench Press",
    muscleGroup: "chest",
    secondaryMuscles: ["triceps", "shoulders"],
    equipmentNeeded: "dumbbells, bench",
    instructions: "Lie on bench with dumbbells. Press up and lower with control.",
    alternatives: [
      { name: "Barbell Bench Press", reason: "recommended" },
      { name: "Push-ups", reason: "machine-free" },
    ],
  },
  {
    name: "Push-ups",
    muscleGroup: "chest",
    secondaryMuscles: ["triceps", "shoulders", "core"],
    equipmentNeeded: "none",
    instructions: "Hands shoulder-width apart, lower body until chest nearly touches floor, push back up.",
    alternatives: [
      { name: "Dumbbell Bench Press", reason: "recommended" },
      { name: "Machine Chest Press", reason: "beginner-friendly" },
    ],
  },
  {
    name: "Dips",
    muscleGroup: "chest",
    secondaryMuscles: ["triceps", "shoulders"],
    equipmentNeeded: "dip station",
    instructions: "Lean forward slightly, lower body until upper arms parallel to floor, press back up.",
    alternatives: [
      { name: "Close-Grip Bench Press", reason: "recommended" },
      { name: "Machine Dips", reason: "beginner-friendly" },
    ],
  },
  {
    name: "Pull-ups",
    muscleGroup: "back",
    secondaryMuscles: ["biceps", "forearms"],
    equipmentNeeded: "pull-up bar",
    instructions: "Hang from bar with overhand grip, pull body up until chin over bar.",
    alternatives: [
      { name: "Lat Pulldown", reason: "beginner-friendly" },
      { name: "Assisted Pull-ups", reason: "recommended" },
    ],
  },
  {
    name: "Lat Pulldown",
    muscleGroup: "back",
    secondaryMuscles: ["biceps", "forearms"],
    equipmentNeeded: "cable machine",
    instructions: "Sit at machine, pull bar down to upper chest, squeeze shoulder blades.",
    alternatives: [
      { name: "Pull-ups", reason: "recommended" },
      { name: "Pull-ups", reason: "machine-free" },
    ],
  },
  {
    name: "Barbell Row",
    muscleGroup: "back",
    secondaryMuscles: ["biceps", "forearms"],
    equipmentNeeded: "barbell",
    instructions: "Bend at hips, pull barbell to lower chest/upper abdomen, squeeze back.",
    alternatives: [
      { name: "Seated Cable Row", reason: "recommended" },
      { name: "Dumbbell Row", reason: "beginner-friendly" },
    ],
  },
  {
    name: "Seated Cable Row",
    muscleGroup: "back",
    secondaryMuscles: ["biceps", "forearms"],
    equipmentNeeded: "cable machine",
    instructions: "Sit upright, pull handle to abdomen, squeeze shoulder blades together.",
    alternatives: [
      { name: "Barbell Row", reason: "recommended" },
      { name: "Dumbbell Row", reason: "machine-free" },
    ],
  },
  {
    name: "Dumbbell Row",
    muscleGroup: "back",
    secondaryMuscles: ["biceps", "forearms"],
    equipmentNeeded: "dumbbell, bench",
    instructions: "One knee on bench, pull dumbbell to hip, squeeze back at top.",
    alternatives: [
      { name: "Seated Cable Row", reason: "recommended" },
      { name: "Barbell Row", reason: "recommended" },
    ],
  },
  {
    name: "Face Pull",
    muscleGroup: "back",
    secondaryMuscles: ["shoulders"],
    equipmentNeeded: "cable machine",
    instructions: "Pull rope to face level, externally rotate shoulders at end position.",
    alternatives: [
      { name: "Reverse Pec Deck", reason: "recommended" },
      { name: "Band Pull-apart", reason: "machine-free" },
    ],
  },
  {
    name: "T-Bar Row",
    muscleGroup: "back",
    secondaryMuscles: ["biceps", "forearms"],
    equipmentNeeded: "t-bar row machine",
    instructions: "Straddle bar, pull weight to lower chest, squeeze back.",
    alternatives: [
      { name: "Barbell Row", reason: "recommended" },
      { name: "Seated Cable Row", reason: "beginner-friendly" },
    ],
  },
  {
    name: "Overhead Press",
    muscleGroup: "shoulders",
    secondaryMuscles: ["triceps", "upper chest"],
    equipmentNeeded: "barbell",
    instructions: "Stand with bar at shoulder height, press overhead until arms locked out.",
    alternatives: [
      { name: "Dumbbell Shoulder Press", reason: "recommended" },
      { name: "Machine Shoulder Press", reason: "beginner-friendly" },
    ],
  },
  {
    name: "Dumbbell Shoulder Press",
    muscleGroup: "shoulders",
    secondaryMuscles: ["triceps"],
    equipmentNeeded: "dumbbells",
    instructions: "Sit or stand, press dumbbells from shoulder height to overhead.",
    alternatives: [
      { name: "Overhead Press", reason: "recommended" },
      { name: "Machine Shoulder Press", reason: "beginner-friendly" },
    ],
  },
  {
    name: "Lateral Raise",
    muscleGroup: "shoulders",
    secondaryMuscles: [],
    equipmentNeeded: "dumbbells",
    instructions: "Stand with dumbbells at sides, raise arms out to sides until parallel to floor.",
    alternatives: [
      { name: "Cable Lateral Raise", reason: "recommended" },
      { name: "Machine Lateral Raise", reason: "beginner-friendly" },
    ],
  },
  {
    name: "Front Raise",
    muscleGroup: "shoulders",
    secondaryMuscles: ["upper chest"],
    equipmentNeeded: "dumbbells",
    instructions: "Raise dumbbells straight in front to shoulder height, control the descent.",
    alternatives: [
      { name: "Plate Front Raise", reason: "recommended" },
      { name: "Cable Front Raise", reason: "recommended" },
    ],
  },
  {
    name: "Rear Delt Fly",
    muscleGroup: "shoulders",
    secondaryMuscles: ["back"],
    equipmentNeeded: "dumbbells",
    instructions: "Bend forward, raise dumbbells out to sides squeezing rear delts.",
    alternatives: [
      { name: "Reverse Pec Deck", reason: "recommended" },
      { name: "Face Pull", reason: "beginner-friendly" },
    ],
  },
  {
    name: "Barbell Squat",
    muscleGroup: "legs",
    secondaryMuscles: ["glutes", "core"],
    equipmentNeeded: "barbell, squat rack",
    instructions: "Bar on upper back, squat down until thighs parallel, drive back up.",
    alternatives: [
      { name: "Front Squat", reason: "recommended" },
      { name: "Goblet Squat", reason: "beginner-friendly" },
      { name: "Leg Press", reason: "recommended" },
    ],
  },
  {
    name: "Front Squat",
    muscleGroup: "legs",
    secondaryMuscles: ["glutes", "core"],
    equipmentNeeded: "barbell, squat rack",
    instructions: "Bar on front delts, squat down keeping torso upright, drive back up.",
    alternatives: [
      { name: "Barbell Squat", reason: "recommended" },
      { name: "Goblet Squat", reason: "beginner-friendly" },
    ],
  },
  {
    name: "Leg Press",
    muscleGroup: "legs",
    secondaryMuscles: ["glutes"],
    equipmentNeeded: "leg press machine",
    instructions: "Feet shoulder-width on platform, lower weight until 90 degrees, press back up.",
    alternatives: [
      { name: "Barbell Squat", reason: "recommended" },
      { name: "Goblet Squat", reason: "beginner-friendly" },
    ],
  },
  {
    name: "Romanian Deadlift",
    muscleGroup: "legs",
    secondaryMuscles: ["glutes", "lower back"],
    equipmentNeeded: "barbell",
    instructions: "Hold bar at hips, hinge forward keeping back straight, lower to shin level.",
    alternatives: [
      { name: "Dumbbell RDL", reason: "recommended" },
      { name: "Leg Curl", reason: "beginner-friendly" },
    ],
  },
  {
    name: "Lunges",
    muscleGroup: "legs",
    secondaryMuscles: ["glutes"],
    equipmentNeeded: "dumbbells",
    instructions: "Step forward, lower back knee toward floor, push back to start. Alternate legs.",
    alternatives: [
      { name: "Bulgarian Split Squat", reason: "recommended" },
      { name: "Walking Lunges", reason: "recommended" },
      { name: "Leg Press", reason: "beginner-friendly" },
    ],
  },
  {
    name: "Leg Extension",
    muscleGroup: "legs",
    secondaryMuscles: [],
    equipmentNeeded: "leg extension machine",
    instructions: "Sit at machine, extend legs until straight, squeeze quads at top.",
    alternatives: [
      { name: "Goblet Squat", reason: "recommended" },
      { name: "Leg Press", reason: "recommended" },
    ],
  },
  {
    name: "Leg Curl",
    muscleGroup: "legs",
    secondaryMuscles: [],
    equipmentNeeded: "leg curl machine",
    instructions: "Lie face down, curl legs up toward glutes, control the descent.",
    alternatives: [
      { name: "Romanian Deadlift", reason: "recommended" },
      { name: "Swiss Ball Hamstring Curl", reason: "machine-free" },
    ],
  },
  {
    name: "Calf Raise",
    muscleGroup: "legs",
    secondaryMuscles: [],
    equipmentNeeded: "calf raise machine",
    instructions: "Stand on edge of platform, raise up on toes, lower heels below platform.",
    alternatives: [
      { name: "Standing Dumbbell Calf Raise", reason: "recommended" },
      { name: "Seated Calf Raise", reason: "recommended" },
    ],
  },
  {
    name: "Hip Thrust",
    muscleGroup: "legs",
    secondaryMuscles: [],
    equipmentNeeded: "barbell, bench",
    instructions: "Upper back on bench, drive hips up squeezing glutes at top.",
    alternatives: [
      { name: "Glute Bridge", reason: "beginner-friendly" },
      { name: "Cable Kickback", reason: "recommended" },
    ],
  },
  {
    name: "Bulgarian Split Squat",
    muscleGroup: "legs",
    secondaryMuscles: ["glutes"],
    equipmentNeeded: "dumbbells, bench",
    instructions: "Rear foot on bench, lower body until front thigh parallel, drive back up.",
    alternatives: [
      { name: "Lunges", reason: "recommended" },
      { name: "Leg Press", reason: "beginner-friendly" },
    ],
  },
  {
    name: "Goblet Squat",
    muscleGroup: "legs",
    secondaryMuscles: ["glutes", "core"],
    equipmentNeeded: "dumbbell or kettlebell",
    instructions: "Hold weight at chest, squat down keeping torso upright, drive back up.",
    alternatives: [
      { name: "Barbell Squat", reason: "recommended" },
      { name: "Leg Press", reason: "recommended" },
    ],
  },
  {
    name: "Barbell Curl",
    muscleGroup: "arms",
    secondaryMuscles: ["forearms"],
    equipmentNeeded: "barbell",
    instructions: "Stand with bar, curl up keeping elbows stationary, lower with control.",
    alternatives: [
      { name: "Dumbbell Curl", reason: "recommended" },
      { name: "EZ Bar Curl", reason: "recommended" },
      { name: "Hammer Curl", reason: "beginner-friendly" },
    ],
  },
  {
    name: "Dumbbell Curl",
    muscleGroup: "arms",
    secondaryMuscles: ["forearms"],
    equipmentNeeded: "dumbbells",
    instructions: "Stand with dumbbells, curl up alternating or together, lower slowly.",
    alternatives: [
      { name: "Barbell Curl", reason: "recommended" },
      { name: "Hammer Curl", reason: "recommended" },
    ],
  },
  {
    name: "Hammer Curl",
    muscleGroup: "arms",
    secondaryMuscles: ["forearms"],
    equipmentNeeded: "dumbbells",
    instructions: "Hold dumbbells with neutral grip, curl up keeping palms facing each other.",
    alternatives: [
      { name: "Dumbbell Curl", reason: "recommended" },
      { name: "Cable Hammer Curl", reason: "recommended" },
    ],
  },
  {
    name: "Preacher Curl",
    muscleGroup: "arms",
    secondaryMuscles: ["forearms"],
    equipmentNeeded: "preacher bench, barbell",
    instructions: "Arms on preacher pad, curl bar up squeezing biceps, lower slowly.",
    alternatives: [
      { name: "Dumbbell Preacher Curl", reason: "recommended" },
      { name: "Concentration Curl", reason: "beginner-friendly" },
    ],
  },
  {
    name: "Tricep Pushdown",
    muscleGroup: "arms",
    secondaryMuscles: [],
    equipmentNeeded: "cable machine",
    instructions: "Push bar down until arms straight, squeeze triceps at bottom.",
    alternatives: [
      { name: "Overhead Tricep Extension", reason: "recommended" },
      { name: "Skull Crusher", reason: "recommended" },
      { name: "Dumbbell Kickback", reason: "beginner-friendly" },
    ],
  },
  {
    name: "Skull Crusher",
    muscleGroup: "arms",
    secondaryMuscles: [],
    equipmentNeeded: "barbell or dumbbells, bench",
    instructions: "Lie on bench, lower weight to forehead by bending elbows, extend back up.",
    alternatives: [
      { name: "Overhead Tricep Extension", reason: "recommended" },
      { name: "Tricep Pushdown", reason: "beginner-friendly" },
    ],
  },
  {
    name: "Overhead Tricep Extension",
    muscleGroup: "arms",
    secondaryMuscles: [],
    equipmentNeeded: "dumbbell or cable",
    instructions: "Hold weight overhead, lower behind head by bending elbows, extend back up.",
    alternatives: [
      { name: "Skull Crusher", reason: "recommended" },
      { name: "Tricep Pushdown", reason: "beginner-friendly" },
    ],
  },
  {
    name: "Close-Grip Bench Press",
    muscleGroup: "arms",
    secondaryMuscles: ["chest", "shoulders"],
    equipmentNeeded: "barbell, bench",
    instructions: "Grip bar shoulder-width, lower to chest, press up focusing on triceps.",
    alternatives: [
      { name: "Dips", reason: "recommended" },
      { name: "Tricep Pushdown", reason: "beginner-friendly" },
    ],
  },
  {
    name: "Plank",
    muscleGroup: "core",
    secondaryMuscles: ["shoulders"],
    equipmentNeeded: "none",
    instructions: "Hold push-up position on forearms, keep body straight, brace core.",
    alternatives: [
      { name: "Ab Wheel Rollout", reason: "recommended" },
      { name: "Dead Bug", reason: "beginner-friendly" },
    ],
  },
  {
    name: "Crunch",
    muscleGroup: "core",
    secondaryMuscles: [],
    equipmentNeeded: "none",
    instructions: "Lie on back, knees bent, curl shoulders off floor squeezing abs.",
    alternatives: [
      { name: "Cable Crunch", reason: "recommended" },
      { name: "Dead Bug", reason: "beginner-friendly" },
    ],
  },
  {
    name: "Hanging Leg Raise",
    muscleGroup: "core",
    secondaryMuscles: ["forearms"],
    equipmentNeeded: "pull-up bar",
    instructions: "Hang from bar, raise legs until parallel to floor, lower with control.",
    alternatives: [
      { name: "Lying Leg Raise", reason: "beginner-friendly" },
      { name: "Cable Crunch", reason: "recommended" },
    ],
  },
  {
    name: "Russian Twist",
    muscleGroup: "core",
    secondaryMuscles: [],
    equipmentNeeded: "dumbbell or medicine ball",
    instructions: "Sit with knees bent, lean back slightly, rotate torso side to side.",
    alternatives: [
      { name: "Cable Woodchop", reason: "recommended" },
      { name: "Bicycle Crunch", reason: "beginner-friendly" },
    ],
  },
  {
    name: "Cable Crunch",
    muscleGroup: "core",
    secondaryMuscles: [],
    equipmentNeeded: "cable machine",
    instructions: "Kneel below rope attachment, crunch down bringing elbows to knees.",
    alternatives: [
      { name: "Crunch", reason: "machine-free" },
      { name: "Weighted Crunch", reason: "recommended" },
    ],
  },
  {
    name: "Ab Wheel Rollout",
    muscleGroup: "core",
    secondaryMuscles: ["shoulders"],
    equipmentNeeded: "ab wheel",
    alternatives: [
      { name: "Plank", reason: "beginner-friendly" },
      { name: "Hanging Leg Raise", reason: "recommended" },
    ],
  },
  {
    name: "Deadlift",
    muscleGroup: "back",
    secondaryMuscles: ["legs", "glutes", "core"],
    equipmentNeeded: "barbell",
    instructions: "Stand with bar over mid-foot, hinge and grip bar, drive through heels to stand.",
    alternatives: [
      { name: "Romanian Deadlift", reason: "recommended" },
      { name: "Trap Bar Deadlift", reason: "beginner-friendly" },
    ],
  },
  {
    name: "Shrug",
    muscleGroup: "shoulders",
    secondaryMuscles: [],
    equipmentNeeded: "barbell or dumbbells",
    instructions: "Hold weight at sides, shrug shoulders up toward ears, lower with control.",
    alternatives: [
      { name: "Dumbbell Shrug", reason: "recommended" },
      { name: "Cable Shrug", reason: "recommended" },
    ],
  },
  {
    name: "Upright Row",
    muscleGroup: "shoulders",
    secondaryMuscles: ["biceps"],
    equipmentNeeded: "barbell",
    instructions: "Pull bar straight up to chin level, elbows high, lower with control.",
    alternatives: [
      { name: "Cable Upright Row", reason: "recommended" },
      { name: "Dumbbell Upright Row", reason: "recommended" },
    ],
  },
  {
    name: "Glute Bridge",
    muscleGroup: "legs",
    secondaryMuscles: [],
    equipmentNeeded: "none",
    instructions: "Lie on back, knees bent, drive hips up squeezing glutes at top.",
    alternatives: [
      { name: "Hip Thrust", reason: "recommended" },
      { name: "Cable Kickback", reason: "recommended" },
    ],
  },
  {
    name: "Concentration Curl",
    muscleGroup: "arms",
    secondaryMuscles: ["forearms"],
    equipmentNeeded: "dumbbell",
    instructions: "Sit with elbow braced against inner thigh, curl dumbbell up squeezing bicep.",
    alternatives: [
      { name: "Preacher Curl", reason: "recommended" },
      { name: "Dumbbell Curl", reason: "recommended" },
    ],
  },
  {
    name: "Good Morning",
    muscleGroup: "legs",
    secondaryMuscles: ["lower back", "glutes"],
    equipmentNeeded: "barbell",
    instructions: "Bar on upper back, hinge forward at hips keeping back straight.",
    alternatives: [
      { name: "Romanian Deadlift", reason: "recommended" },
      { name: "Back Extension", reason: "beginner-friendly" },
    ],
  },
  {
    name: "Reverse Pec Deck",
    muscleGroup: "shoulders",
    secondaryMuscles: ["back"],
    equipmentNeeded: "pec deck machine",
    instructions: "Sit facing pad, push arms back squeezing rear delts and upper back.",
    alternatives: [
      { name: "Rear Delt Fly", reason: "recommended" },
      { name: "Face Pull", reason: "beginner-friendly" },
    ],
  },
  {
    name: "Machine Chest Press",
    muscleGroup: "chest",
    secondaryMuscles: ["triceps", "shoulders"],
    equipmentNeeded: "chest press machine",
    instructions: "Sit at machine, press handles forward, squeeze chest, return with control.",
    alternatives: [
      { name: "Dumbbell Bench Press", reason: "recommended" },
      { name: "Push-ups", reason: "machine-free" },
    ],
  },
  {
    name: "Pec Deck Machine",
    muscleGroup: "chest",
    secondaryMuscles: ["shoulders"],
    equipmentNeeded: "pec deck machine",
    instructions: "Sit at machine, bring pads together in front of chest, squeeze and return.",
    alternatives: [
      { name: "Cable Fly", reason: "recommended" },
      { name: "Dumbbell Fly", reason: "recommended" },
    ],
  },
  {
    name: "Machine Shoulder Press",
    muscleGroup: "shoulders",
    secondaryMuscles: ["triceps"],
    equipmentNeeded: "shoulder press machine",
    instructions: "Sit at machine, press handles overhead, lower with control.",
    alternatives: [
      { name: "Dumbbell Shoulder Press", reason: "recommended" },
      { name: "Overhead Press", reason: "recommended" },
    ],
  },
  {
    name: "Cable Lateral Raise",
    muscleGroup: "shoulders",
    secondaryMuscles: [],
    equipmentNeeded: "cable machine",
    instructions: "Stand sideways to cable, raise arm out to side until shoulder height.",
    alternatives: [
      { name: "Dumbbell Lateral Raise", reason: "recommended" },
    ],
  },
  {
    name: "EZ Bar Curl",
    muscleGroup: "arms",
    secondaryMuscles: ["forearms"],
    equipmentNeeded: "ez curl bar",
    instructions: "Hold EZ bar at shoulder width, curl up keeping elbows stationary.",
    alternatives: [
      { name: "Barbell Curl", reason: "recommended" },
      { name: "Dumbbell Curl", reason: "recommended" },
    ],
  },
];

const fullBodySplit = {
  name: "Full Body 3x",
  description: "Perfect for beginners. Train your entire body 3 times per week with compound movements.",
  type: "FULL_BODY",
  daysPerWeek: 3,
  days: [
    {
      dayNumber: 1,
      name: "Full Body A",
      muscleGroups: ["chest", "back", "legs", "core"],
      isRest: false,
      exercises: [
        { name: "Barbell Bench Press", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 },
        { name: "Barbell Row", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 },
        { name: "Barbell Squat", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 },
        { name: "Overhead Press", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 },
        { name: "Plank", targetSets: 3, targetRepsMin: 30, targetRepsMax: 60 },
      ],
    },
    {
      dayNumber: 2,
      name: "Rest Day",
      muscleGroups: [],
      isRest: true,
      exercises: [],
    },
    {
      dayNumber: 3,
      name: "Full Body B",
      muscleGroups: ["back", "legs", "chest", "core"],
      isRest: false,
      exercises: [
        { name: "Deadlift", targetSets: 3, targetRepsMin: 5, targetRepsMax: 8 },
        { name: "Incline Dumbbell Press", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 },
        { name: "Lat Pulldown", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 },
        { name: "Lunges", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
        { name: "Crunch", targetSets: 3, targetRepsMin: 15, targetRepsMax: 20 },
      ],
    },
    {
      dayNumber: 4,
      name: "Rest Day",
      muscleGroups: [],
      isRest: true,
      exercises: [],
    },
    {
      dayNumber: 5,
      name: "Full Body C",
      muscleGroups: ["legs", "chest", "back", "shoulders"],
      isRest: false,
      exercises: [
        { name: "Leg Press", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
        { name: "Dumbbell Bench Press", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 },
        { name: "Seated Cable Row", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 },
        { name: "Lateral Raise", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15 },
        { name: "Barbell Curl", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
        { name: "Tricep Pushdown", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
      ],
    },
    {
      dayNumber: 6,
      name: "Rest Day",
      muscleGroups: [],
      isRest: true,
      exercises: [],
    },
    {
      dayNumber: 7,
      name: "Rest Day",
      muscleGroups: [],
      isRest: true,
      exercises: [],
    },
  ],
};

const pplSplit = {
  name: "Push/Pull/Legs",
  description: "Intermediate split training 6 days per week. Each muscle group hit twice per week for optimal growth.",
  type: "PPL",
  daysPerWeek: 6,
  days: [
    {
      dayNumber: 1,
      name: "Push A",
      muscleGroups: ["chest", "shoulders", "triceps"],
      isRest: false,
      exercises: [
        { name: "Barbell Bench Press", targetSets: 4, targetRepsMin: 6, targetRepsMax: 8 },
        { name: "Incline Dumbbell Press", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 },
        { name: "Cable Fly", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15 },
        { name: "Overhead Press", targetSets: 3, targetRepsMin: 8, targetRepsMax: 10 },
        { name: "Lateral Raise", targetSets: 4, targetRepsMin: 12, targetRepsMax: 15 },
        { name: "Tricep Pushdown", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
        { name: "Overhead Tricep Extension", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
      ],
    },
    {
      dayNumber: 2,
      name: "Pull A",
      muscleGroups: ["back", "biceps"],
      isRest: false,
      exercises: [
        { name: "Deadlift", targetSets: 3, targetRepsMin: 5, targetRepsMax: 6 },
        { name: "Pull-ups", targetSets: 3, targetRepsMin: 6, targetRepsMax: 10 },
        { name: "Barbell Row", targetSets: 3, targetRepsMin: 8, targetRepsMax: 10 },
        { name: "Face Pull", targetSets: 3, targetRepsMin: 15, targetRepsMax: 20 },
        { name: "Barbell Curl", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
        { name: "Hammer Curl", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
      ],
    },
    {
      dayNumber: 3,
      name: "Legs A",
      muscleGroups: ["legs", "core"],
      isRest: false,
      exercises: [
        { name: "Barbell Squat", targetSets: 4, targetRepsMin: 6, targetRepsMax: 8 },
        { name: "Romanian Deadlift", targetSets: 3, targetRepsMin: 8, targetRepsMax: 10 },
        { name: "Leg Press", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
        { name: "Leg Curl", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
        { name: "Calf Raise", targetSets: 4, targetRepsMin: 12, targetRepsMax: 15 },
        { name: "Hanging Leg Raise", targetSets: 3, targetRepsMin: 10, targetRepsMax: 15 },
      ],
    },
    {
      dayNumber: 4,
      name: "Push B",
      muscleGroups: ["chest", "shoulders", "triceps"],
      isRest: false,
      exercises: [
        { name: "Dumbbell Bench Press", targetSets: 4, targetRepsMin: 8, targetRepsMax: 10 },
        { name: "Incline Dumbbell Press", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
        { name: "Pec Deck Machine", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15 },
        { name: "Dumbbell Shoulder Press", targetSets: 3, targetRepsMin: 8, targetRepsMax: 10 },
        { name: "Cable Lateral Raise", targetSets: 4, targetRepsMin: 12, targetRepsMax: 15 },
        { name: "Skull Crusher", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
        { name: "Dips", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 },
      ],
    },
    {
      dayNumber: 5,
      name: "Pull B",
      muscleGroups: ["back", "biceps"],
      isRest: false,
      exercises: [
        { name: "Lat Pulldown", targetSets: 4, targetRepsMin: 8, targetRepsMax: 10 },
        { name: "Seated Cable Row", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 },
        { name: "Dumbbell Row", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 },
        { name: "Reverse Pec Deck", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15 },
        { name: "Dumbbell Curl", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
        { name: "Preacher Curl", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
      ],
    },
    {
      dayNumber: 6,
      name: "Legs B",
      muscleGroups: ["legs", "core"],
      isRest: false,
      exercises: [
        { name: "Front Squat", targetSets: 4, targetRepsMin: 6, targetRepsMax: 8 },
        { name: "Hip Thrust", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 },
        { name: "Bulgarian Split Squat", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
        { name: "Leg Extension", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15 },
        { name: "Calf Raise", targetSets: 4, targetRepsMin: 12, targetRepsMax: 15 },
        { name: "Cable Crunch", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15 },
      ],
    },
    {
      dayNumber: 7,
      name: "Rest Day",
      muscleGroups: [],
      isRest: true,
      exercises: [],
    },
  ],
};

const broSplit = {
  name: "Bro Split",
  description: "Classic bodybuilding split. Dedicate each day to specific muscle groups for maximum focus.",
  type: "BRO_SPLIT",
  daysPerWeek: 5,
  days: [
    {
      dayNumber: 1,
      name: "Chest & Triceps",
      muscleGroups: ["chest", "triceps"],
      isRest: false,
      exercises: [
        { name: "Barbell Bench Press", targetSets: 4, targetRepsMin: 6, targetRepsMax: 10 },
        { name: "Incline Dumbbell Press", targetSets: 4, targetRepsMin: 8, targetRepsMax: 12 },
        { name: "Cable Fly", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15 },
        { name: "Dips", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 },
        { name: "Tricep Pushdown", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
        { name: "Skull Crusher", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
      ],
    },
    {
      dayNumber: 2,
      name: "Back & Biceps",
      muscleGroups: ["back", "biceps"],
      isRest: false,
      exercises: [
        { name: "Pull-ups", targetSets: 4, targetRepsMin: 6, targetRepsMax: 10 },
        { name: "Barbell Row", targetSets: 4, targetRepsMin: 8, targetRepsMax: 10 },
        { name: "Lat Pulldown", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
        { name: "Seated Cable Row", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
        { name: "Face Pull", targetSets: 3, targetRepsMin: 15, targetRepsMax: 20 },
        { name: "Barbell Curl", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
        { name: "Hammer Curl", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
      ],
    },
    {
      dayNumber: 3,
      name: "Legs",
      muscleGroups: ["legs", "core"],
      isRest: false,
      exercises: [
        { name: "Barbell Squat", targetSets: 4, targetRepsMin: 6, targetRepsMax: 10 },
        { name: "Romanian Deadlift", targetSets: 4, targetRepsMin: 8, targetRepsMax: 10 },
        { name: "Leg Press", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
        { name: "Leg Extension", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15 },
        { name: "Leg Curl", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
        { name: "Calf Raise", targetSets: 4, targetRepsMin: 12, targetRepsMax: 15 },
        { name: "Hanging Leg Raise", targetSets: 3, targetRepsMin: 10, targetRepsMax: 15 },
      ],
    },
    {
      dayNumber: 4,
      name: "Shoulders & Abs",
      muscleGroups: ["shoulders", "core"],
      isRest: false,
      exercises: [
        { name: "Overhead Press", targetSets: 4, targetRepsMin: 6, targetRepsMax: 10 },
        { name: "Lateral Raise", targetSets: 4, targetRepsMin: 12, targetRepsMax: 15 },
        { name: "Front Raise", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15 },
        { name: "Rear Delt Fly", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15 },
        { name: "Shrug", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
        { name: "Cable Crunch", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15 },
        { name: "Russian Twist", targetSets: 3, targetRepsMin: 15, targetRepsMax: 20 },
      ],
    },
    {
      dayNumber: 5,
      name: "Arms",
      muscleGroups: ["arms"],
      isRest: false,
      exercises: [
        { name: "Close-Grip Bench Press", targetSets: 4, targetRepsMin: 8, targetRepsMax: 10 },
        { name: "Barbell Curl", targetSets: 4, targetRepsMin: 8, targetRepsMax: 10 },
        { name: "Skull Crusher", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
        { name: "Preacher Curl", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
        { name: "Overhead Tricep Extension", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
        { name: "Hammer Curl", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
        { name: "Tricep Pushdown", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15 },
      ],
    },
    {
      dayNumber: 6,
      name: "Rest Day",
      muscleGroups: [],
      isRest: true,
      exercises: [],
    },
    {
      dayNumber: 7,
      name: "Rest Day",
      muscleGroups: [],
      isRest: true,
      exercises: [],
    },
  ],
};

const upperLowerSplit = {
  name: "Upper/Lower Split",
  description: "Highly effective 4-day split for building muscle and strength. Separates upper body and lower body workouts.",
  type: "UPPER_LOWER",
  daysPerWeek: 4,
  days: [
    {
      dayNumber: 1,
      name: "Upper A",
      muscleGroups: ["chest", "back", "shoulders", "arms"],
      isRest: false,
      exercises: [
        { name: "Barbell Bench Press", targetSets: 4, targetRepsMin: 6, targetRepsMax: 8 },
        { name: "Barbell Row", targetSets: 4, targetRepsMin: 6, targetRepsMax: 8 },
        { name: "Overhead Press", targetSets: 3, targetRepsMin: 8, targetRepsMax: 10 },
        { name: "Pull-ups", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 },
        { name: "Barbell Curl", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
        { name: "Tricep Pushdown", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
      ],
    },
    {
      dayNumber: 2,
      name: "Lower A",
      muscleGroups: ["legs", "core"],
      isRest: false,
      exercises: [
        { name: "Barbell Squat", targetSets: 4, targetRepsMin: 6, targetRepsMax: 8 },
        { name: "Romanian Deadlift", targetSets: 4, targetRepsMin: 8, targetRepsMax: 10 },
        { name: "Leg Press", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
        { name: "Hanging Leg Raise", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15 },
        { name: "Plank", targetSets: 3, targetRepsMin: 30, targetRepsMax: 60 },
      ],
    },
    {
      dayNumber: 3,
      name: "Rest Day",
      muscleGroups: [],
      isRest: true,
      exercises: [],
    },
    {
      dayNumber: 4,
      name: "Upper B",
      muscleGroups: ["chest", "back", "shoulders", "arms"],
      isRest: false,
      exercises: [
        { name: "Incline Dumbbell Press", targetSets: 4, targetRepsMin: 8, targetRepsMax: 12 },
        { name: "Lat Pulldown", targetSets: 4, targetRepsMin: 8, targetRepsMax: 12 },
        { name: "Dumbbell Shoulder Press", targetSets: 3, targetRepsMin: 8, targetRepsMax: 10 },
        { name: "Dips", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 },
        { name: "Dumbbell Curl", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
        { name: "Skull Crusher", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
      ],
    },
    {
      dayNumber: 5,
      name: "Lower B",
      muscleGroups: ["legs", "core"],
      isRest: false,
      exercises: [
        { name: "Leg Press", targetSets: 4, targetRepsMin: 10, targetRepsMax: 12 },
        { name: "Lunges", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
        { name: "Leg Extension", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15 },
        { name: "Leg Curl", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12 },
        { name: "Crunch", targetSets: 3, targetRepsMin: 15, targetRepsMax: 20 },
      ],
    },
    {
      dayNumber: 6,
      name: "Rest Day",
      muscleGroups: [],
      isRest: true,
      exercises: [],
    },
    {
      dayNumber: 7,
      name: "Rest Day",
      muscleGroups: [],
      isRest: true,
      exercises: [],
    },
  ],
};

async function seed() {
  console.log("Seeding database...");

  await prisma.setLog.deleteMany();
  await prisma.exerciseLog.deleteMany();
  await prisma.workoutSession.deleteMany();
  await prisma.personalRecord.deleteMany();
  await prisma.progressPhoto.deleteMany();
  await prisma.bodyMetric.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.exerciseAlternative.deleteMany();
  await prisma.splitDayExercise.deleteMany();
  await prisma.splitDay.deleteMany();
  await prisma.userSplit.deleteMany();
  await prisma.split.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.user.deleteMany();

  console.log("Cleared existing data.");

  const exerciseMap: Record<string, string> = {};

  for (const ex of exercises) {
    const created = await prisma.exercise.create({
      data: {
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        secondaryMuscles: JSON.stringify(ex.secondaryMuscles),
        equipmentNeeded: ex.equipmentNeeded,
        instructions: ex.instructions,
      },
    });
    exerciseMap[ex.name] = created.id;
  }

  console.log(`Created ${Object.keys(exerciseMap).length} exercises.`);

  for (const ex of exercises) {
    const exerciseId = exerciseMap[ex.name];
    for (const alt of ex.alternatives) {
      const altId = exerciseMap[alt.name];
      if (altId && altId !== exerciseId) {
        await prisma.exerciseAlternative.create({
          data: {
            exerciseId,
            alternativeId: altId,
            reason: alt.reason,
          },
        });
      }
    }
  }

  console.log("Created exercise alternatives.");

  const splitDataList = [fullBodySplit, pplSplit, broSplit, upperLowerSplit];

  for (const splitData of splitDataList) {
    const split = await prisma.split.create({
      data: {
        name: splitData.name,
        description: splitData.description,
        type: splitData.type,
        daysPerWeek: splitData.daysPerWeek,
        isPrebuilt: true,
      },
    });

    for (const day of splitData.days) {
      const splitDay = await prisma.splitDay.create({
        data: {
          splitId: split.id,
          dayNumber: day.dayNumber,
          name: day.name,
          muscleGroups: JSON.stringify(day.muscleGroups),
          isRest: day.isRest,
        },
      });

      for (let i = 0; i < day.exercises.length; i++) {
        const ex = day.exercises[i];
        const exerciseId = exerciseMap[ex.name];
        if (exerciseId) {
          await prisma.splitDayExercise.create({
            data: {
              splitDayId: splitDay.id,
              exerciseId,
              order: i,
              targetSets: ex.targetSets,
              targetRepsMin: ex.targetRepsMin,
              targetRepsMax: ex.targetRepsMax,
            },
          });
        }
      }
    }

    console.log(`Created split: ${split.name}`);
  }

  console.log("Seed complete!");
}

seed()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
