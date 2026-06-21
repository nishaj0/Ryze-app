import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { uploadToCloudinary } from "../utils/cloudinary";

const prisma = new PrismaClient();

export const requestExercise = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const {
    name,
    description,
    force,
    level,
    mechanic,
    equipment,
    category,
    instructions,
    primaryMuscles,
    secondaryMuscles,
    referenceImages,
  } = req.body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    throw new AppError("Exercise name is required", 400);
  }

  const exerciseRequest = await prisma.exerciseRequest.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      force: force || null,
      level: level || null,
      mechanic: mechanic || null,
      equipment: equipment?.trim() || null,
      category: category || null,
      instructions: instructions?.trim() || null,
      primaryMuscles: Array.isArray(primaryMuscles) ? primaryMuscles.join(",") : primaryMuscles || null,
      secondaryMuscles: Array.isArray(secondaryMuscles) ? secondaryMuscles.join(",") : secondaryMuscles || null,
      referenceImages: referenceImages || null,
      requestedById: userId,
    },
  });

  res.status(201).json({ exerciseRequest });
};

export const uploadExerciseImage = async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    throw new AppError("No file uploaded", 400);
  }

  const result = await uploadToCloudinary(req.file.buffer, "exercise-requests", req.file.originalname);

  res.json({ url: result.url, publicId: result.publicId });
};
