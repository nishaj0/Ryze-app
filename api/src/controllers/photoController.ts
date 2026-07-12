import { Response } from "express";
import { prisma } from "../utils/db";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary";


export const uploadPhoto = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { type, date, notes } = req.body;

  const file = req.file;
  if (!file) {
    throw new AppError("No file uploaded", 400);
  }

  const filename = `${Date.now()}-${file.originalname}`;

  const { url, publicId } = await uploadToCloudinary(file.buffer, `photos/${userId}`, filename);

  const photo = await prisma.progressPhoto.create({
    data: {
      userId,
      date: date ? new Date(date) : new Date(),
      cloudinaryUrl: url,
      cloudinaryPublicId: publicId,
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
    where: { id: req.params.id as string },
  });

  if (!photo || photo.userId !== userId) {
    throw new AppError("Photo not found", 404);
  }

  if (photo.cloudinaryPublicId) {
    await deleteFromCloudinary(photo.cloudinaryPublicId);
  }

  await prisma.progressPhoto.delete({ where: { id: photo.id } });
  res.json({ message: "Photo deleted" });
};
