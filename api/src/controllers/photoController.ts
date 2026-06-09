import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

export const uploadPhoto = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { type, date, notes } = req.body;

  const file = req.file;
  if (!file) {
    throw new AppError("No file uploaded", 400);
  }

  const uploadDir = path.join(__dirname, "..", "..", "uploads", "photos", userId);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `${Date.now()}-${file.originalname}`;
  const filePath = path.join(uploadDir, filename);
  fs.writeFileSync(filePath, file.buffer);

  const cloudinaryUrl = `/uploads/photos/${userId}/${filename}`;

  const photo = await prisma.progressPhoto.create({
    data: {
      userId,
      date: date ? new Date(date) : new Date(),
      cloudinaryUrl,
      cloudinaryPublicId: filename,
      type,
      notes,
    },
  });

  res.status(201).json({ photo });
};

export const getPhotos = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { type } = req.query;

  const where: any = { userId };
  if (type) where.type = type;

  const photos = await prisma.progressPhoto.findMany({
    where,
    orderBy: { date: "desc" },
  });

  res.json({ photos });
};

export const deletePhoto = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const photo = await prisma.progressPhoto.findUnique({
    where: { id: req.params.id },
  });

  if (!photo || photo.userId !== userId) {
    throw new AppError("Photo not found", 404);
  }

  const filePath = path.join(__dirname, "..", "..", photo.cloudinaryUrl);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await prisma.progressPhoto.delete({ where: { id: photo.id } });
  res.json({ message: "Photo deleted" });
};
