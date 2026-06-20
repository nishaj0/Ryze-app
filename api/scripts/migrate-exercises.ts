import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";
import axios from "axios";
import * as fs from "fs";
import * as path from "path";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const prisma = new PrismaClient();

const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

const MUSCLES = [
  "abdominals",
  "abductors",
  "adductors",
  "biceps",
  "calves",
  "chest",
  "forearms",
  "glutes",
  "hamstrings",
  "lats",
  "lower back",
  "middle back",
  "neck",
  "quadriceps",
  "shoulders",
  "traps",
  "triceps",
];

interface SourceExercise {
  id: string;
  name: string;
  force: string | null;
  level: string;
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[];
}

async function uploadImageToCloudinary(imagePath: string, exerciseId: string, index: number): Promise<{ url: string; publicId: string }> {
  const url = GITHUB_RAW_BASE + imagePath;
  const response = await axios.get(url, { responseType: "arraybuffer" });
  const buffer = Buffer.from(response.data);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "ryze/exercises",
        public_id: `${exerciseId}_${index}`,
        resource_type: "image",
        overwrite: false,
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("Upload failed"));
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );
    uploadStream.end(buffer);
  });
}

async function migrate() {
  console.log("Starting exercise migration...");

  const exercisesPath = path.join(__dirname, "../free-exercise-db/dist/exercises.json");
  const exercisesData: SourceExercise[] = JSON.parse(fs.readFileSync(exercisesPath, "utf-8"));

  console.log(`Found ${exercisesData.length} exercises to migrate.`);

  console.log("Clearing existing data...");
  await prisma.setLog.deleteMany();
  await prisma.exerciseLog.deleteMany();
  await prisma.workoutSession.deleteMany();
  await prisma.personalRecord.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.exerciseImage.deleteMany();
  await prisma.exerciseMuscle.deleteMany();
  await prisma.muscle.deleteMany();
  await prisma.exerciseAlternative.deleteMany();
  await prisma.splitDayExercise.deleteMany();
  await prisma.splitDay.deleteMany();
  await prisma.userSplit.deleteMany();
  await prisma.split.deleteMany();
  await prisma.exercise.deleteMany();
  console.log("Cleared existing data.");

  console.log("Creating muscles...");
  const muscleMap: Record<string, string> = {};
  for (const muscleName of MUSCLES) {
    const muscle = await prisma.muscle.create({
      data: { name: muscleName },
    });
    muscleMap[muscleName] = muscle.id;
  }
  console.log(`Created ${MUSCLES.length} muscles.`);

  console.log("Migrating exercises...");
  const exerciseIdMap: Record<string, string> = {};
  let processedCount = 0;
  let successCount = 0;
  let failCount = 0;

  for (const sourceEx of exercisesData) {
    processedCount++;
    const exerciseNum = `${processedCount}/${exercisesData.length}`;
    
    if (processedCount % 10 === 0) {
      console.log(`\n[${exerciseNum}] Processing: ${sourceEx.name}...`);
    }

    const exercise = await prisma.exercise.create({
      data: {
        name: sourceEx.name,
        force: sourceEx.force,
        level: sourceEx.level,
        mechanic: sourceEx.mechanic,
        equipment: sourceEx.equipment,
        category: sourceEx.category,
        instructions: sourceEx.instructions.join("\n"),
      },
    });

    exerciseIdMap[sourceEx.id] = exercise.id;

    for (const muscleName of sourceEx.primaryMuscles) {
      const muscleId = muscleMap[muscleName];
      if (muscleId) {
        await prisma.exerciseMuscle.create({
          data: {
            exerciseId: exercise.id,
            muscleId,
            isPrimary: true,
          },
        });
      }
    }

    for (const muscleName of sourceEx.secondaryMuscles) {
      const muscleId = muscleMap[muscleName];
      if (muscleId) {
        const existing = await prisma.exerciseMuscle.findUnique({
          where: {
            exerciseId_muscleId: {
              exerciseId: exercise.id,
              muscleId,
            },
          },
        });
        if (!existing) {
          await prisma.exerciseMuscle.create({
            data: {
              exerciseId: exercise.id,
              muscleId,
              isPrimary: false,
            },
          });
        }
      }
    }

    let imageIndex = 0;
    for (const imagePath of sourceEx.images) {
      try {
        if (processedCount % 10 === 0) {
          console.log(`  Uploading image ${imageIndex + 1}/${sourceEx.images.length}: ${imagePath}`);
        }
        const { url, publicId } = await uploadImageToCloudinary(imagePath, exercise.id, imageIndex);
        await prisma.exerciseImage.create({
          data: {
            exerciseId: exercise.id,
            url,
            publicId,
            order: imageIndex,
          },
        });
        imageIndex++;
        successCount++;
      } catch (error) {
        failCount++;
        console.warn(`  ✗ Failed to upload ${imagePath}:`, (error as Error).message);
      }
    }

    if (processedCount % 10 === 0) {
      console.log(`  ✓ Completed ${sourceEx.name} (${successCount} images uploaded, ${failCount} failed)`);
    }
  }

  console.log(`Migrated ${processedCount} exercises.`);

  console.log("Creating sample splits...");
  const allExerciseIds = Object.values(exerciseIdMap);

  const getRandomExercises = (count: number): string[] => {
    const shuffled = [...allExerciseIds].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };

  const sampleSplit = await prisma.split.create({
    data: {
      name: "Sample Full Body",
      description: "Auto-generated sample split from migrated exercises.",
      type: "FULL_BODY",
      daysPerWeek: 3,
      isPrebuilt: true,
    },
  });

  for (let dayNum = 1; dayNum <= 7; dayNum++) {
    const isRest = dayNum === 2 || dayNum === 4 || dayNum === 6 || dayNum === 7;
    const splitDay = await prisma.splitDay.create({
      data: {
        splitId: sampleSplit.id,
        dayNumber: dayNum,
        name: isRest ? "Rest Day" : `Day ${dayNum}`,
        muscleGroups: JSON.stringify([]),
        isRest,
      },
    });

    if (!isRest) {
      const randomExercises = getRandomExercises(6);
      for (let i = 0; i < randomExercises.length; i++) {
        await prisma.splitDayExercise.create({
          data: {
            splitDayId: splitDay.id,
            exerciseId: randomExercises[i],
            order: i,
            targetSets: 3,
            targetRepsMin: 8,
            targetRepsMax: 12,
          },
        });
      }
    }
  }

  console.log("Created sample split.");
  console.log("Migration complete!");
}

migrate()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
