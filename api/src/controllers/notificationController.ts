import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";
import axios from "axios";

const prisma = new PrismaClient();

const sendPushNotification = async (expoPushToken: string, title: string, body: string, data?: any) => {
  if (!expoPushToken || !expoPushToken.startsWith("ExponentPushToken")) {
    return;
  }
  try {
    await axios.post("https://exp.host/--/api/v2/push/send", {
      to: expoPushToken,
      sound: "default",
      title,
      body,
      data,
    });
  } catch (err) {
    console.error(`[Push Notification] Error sending to ${expoPushToken}:`, err);
  }
};

export const saveToken = async (req: AuthRequest, res: Response) => {
  const { token } = req.body;

  await prisma.user.update({
    where: { id: req.userId },
    data: { pushToken: token },
  });

  res.json({ message: "Token saved" });
};

export const updatePreferences = async (req: AuthRequest, res: Response) => {
  const { reminderTime, weeklyCheckin } = req.body;

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: {
      ...(reminderTime !== undefined && { reminderTime }),
      ...(weeklyCheckin !== undefined && { weeklyCheckin }),
    },
  });

  res.json({ preferences: { reminderTime: user.reminderTime, weeklyCheckin: user.weeklyCheckin } });
};

export const getPreferences = async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { reminderTime: true, weeklyCheckin: true },
  });

  res.json({ preferences: user });
};

export const triggerReminders = async (req: AuthRequest, res: Response) => {
  const users = await prisma.user.findMany({
    where: {
      pushToken: { not: null },
    },
    include: {
      userSplits: {
        where: { isActive: true },
        include: {
          split: {
            include: { days: true },
          },
        },
      },
    },
  });

  const sentCount = { workout: 0, checkin: 0 };
  const today = new Date();

  for (const user of users) {
    const activeSplitRelation = user.userSplits[0];
    const token = user.pushToken!;

    // 1. Daily Workout Reminder
    if (activeSplitRelation) {
      const split = activeSplitRelation.split;
      const days = split.days;
      const startDate = new Date(activeSplitRelation.startDate);
      const diffDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const dayIndex = ((today.getDay() - startDate.getDay() + 7) % 7 + diffDays) % 7;
      const adjustedIndex = dayIndex % days.length;
      const todaySplitDay = days[adjustedIndex] || days[0];

      if (todaySplitDay && !todaySplitDay.isRest) {
        await sendPushNotification(
          token,
          `Today is ${todaySplitDay.name} Day 💪`,
          `Time to hit your workout: ${todaySplitDay.name}. Tap to log sets!`,
          { screen: "WorkoutLogger", splitDayId: todaySplitDay.id, splitDayName: todaySplitDay.name }
        );
        sentCount.workout++;
      }
    }

    // 2. Weekly check-in (Weight and Progress Photo)
    if (user.weeklyCheckin && today.getDay() === 0) {
      await sendPushNotification(
        token,
        "Weekly Progress Check-in 📸",
        "It's Sunday! Log your body weight and capture your progress photos to track your gains.",
        { screen: "Metrics" }
      );
      sentCount.checkin++;
    }
  }

  res.json({ message: "Reminders triggered successfully", sentCount });
};
