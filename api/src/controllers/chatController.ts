import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { prisma } from "../utils/db";
import { callGemini } from "../utils/gemini";

type ToolName = "getRecentSessions" | "getExerciseHistory" | "getProgressSummary" | "getCurrentSplit" | "getCheckInHistory" | "proposeSwapExercise" | "proposeMarkRestDay" | "proposeSplitRegeneration";
type Proposal = { type: "SWAP_EXERCISE" | "REST_DAY" | "SPLIT_REGENERATION"; payload: Record<string, unknown>; summary: string };

const RESPONSE_SCHEMA = { type: "object", properties: { reply: { type: "string" }, tool: { type: ["string", "null"], enum: ["getRecentSessions", "getExerciseHistory", "getProgressSummary", "getCurrentSplit", "getCheckInHistory", "proposeSwapExercise", "proposeMarkRestDay", "proposeSplitRegeneration", null] }, arguments: { type: "object" } }, required: ["reply", "tool", "arguments"], additionalProperties: false };
const READ_TOOLS: ToolName[] = ["getRecentSessions", "getExerciseHistory", "getProgressSummary", "getCurrentSplit", "getCheckInHistory"];

async function findExercise(name: string) {
  const exact = await prisma.exercise.findUnique({ where: { name } });
  if (exact) return exact;
  const normalized = name.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return prisma.exercise.findFirst({ where: { name: { equals: name, mode: "insensitive" } } }) || prisma.exercise.findFirst({ where: { name: { contains: normalized, mode: "insensitive" } } });
}

async function runRead(userId: string, tool: ToolName, args: Record<string, any>) {
  if (tool === "getCurrentSplit") return prisma.userSplit.findFirst({ where: { userId, isActive: true }, include: { split: { include: { days: { include: { exercises: { include: { exercise: true } } } } } } } });
  if (tool === "getCheckInHistory") return prisma.checkIn.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 10 });
  if (tool === "getRecentSessions") return prisma.workoutSession.findMany({ where: { userId, status: { in: ["COMPLETED", "SKIPPED"] } }, include: { splitDay: true, exerciseLogs: { include: { exercise: true, setLogs: true } } }, orderBy: { date: "desc" }, take: 10 });
  if (tool === "getExerciseHistory") { const exercise = await findExercise(args.exerciseName || ""); if (!exercise) return { error: "Exercise not found" }; return prisma.exerciseLog.findMany({ where: { exerciseId: exercise.id, session: { userId } }, include: { session: true, setLogs: true }, orderBy: { session: { date: "desc" } }, take: 10 }); }
  const since = new Date(Date.now() - 30 * 86400000);
  const sessions = await prisma.workoutSession.findMany({ where: { userId, status: "COMPLETED", date: { gte: since } }, include: { exerciseLogs: { include: { setLogs: true } } } });
  return { period: "last 30 days", sessions: sessions.length, volume: sessions.flatMap(s => s.exerciseLogs).flatMap(l => l.setLogs).reduce((sum, set) => sum + set.weightKg * set.reps, 0), streak: sessions.length };
}

async function createProposal(userId: string, tool: ToolName, args: Record<string, any>): Promise<Proposal> {
  if (tool === "proposeMarkRestDay") { const date = new Date(args.date); if (Number.isNaN(date.valueOf()) || Math.abs(date.valueOf() - Date.now()) > 31 * 86400000) throw new AppError("Choose a date within the next or previous 31 days.", 400); return { type: "REST_DAY", payload: { date: date.toISOString(), reason: args.reason || null }, summary: `Mark ${date.toLocaleDateString()} as a rest day?` }; }
  if (tool === "proposeSwapExercise") { const entry = await prisma.splitDayExercise.findFirst({ where: { splitDayId: args.splitDayId, exerciseId: args.currentExerciseId }, include: { exercise: true, splitDay: true } }); if (!entry) throw new AppError("That exercise is no longer in this split day.", 409); const alternative = await prisma.exerciseAlternative.findFirst({ where: { exerciseId: entry.exerciseId }, include: { alternative: true } }); if (!alternative) throw new AppError("There is no approved alternative for that exercise.", 400); return { type: "SWAP_EXERCISE", payload: { splitDayExerciseId: entry.id, alternativeId: alternative.alternativeId }, summary: `Swap ${entry.exercise.name} for ${alternative.alternative.name} in ${entry.splitDay.name}?` }; }
  return { type: "SPLIT_REGENERATION", payload: { description: args.description || "" }, summary: "Create a new split preview from these requirements?" };
}

export async function sendMessage(req: AuthRequest, res: Response) {
  const userId = req.userId!; const content = String(req.body.content || "").trim(); if (!content) throw new AppError("A message is required", 400);
  await prisma.chatMessage.create({ data: { userId, role: "USER", content } });
  const history = await prisma.chatMessage.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 10 });
  const systemPrompt = "You are Ryze Coach: encouraging, concise, and not clinical. You may select ONLY one fixed tool: getRecentSessions, getExerciseHistory, getProgressSummary, getCurrentSplit, getCheckInHistory, proposeSwapExercise, proposeMarkRestDay, proposeSplitRegeneration. Never invent data or actions. Reads are for factual questions. Writes only when the user clearly asks to change something; otherwise ask a clarifying question. Return JSON matching the schema.";
  const model = await callGemini<{ reply: string; tool: ToolName | null; arguments: Record<string, any> }>({ systemPrompt, userPrompt: JSON.stringify({ history: history.reverse().map(m => ({ role: m.role, content: m.content })), message: content }), responseSchema: RESPONSE_SCHEMA });
  let proposal: Proposal | undefined; let result: unknown;
  if (model.tool && READ_TOOLS.includes(model.tool)) result = await runRead(userId, model.tool, model.arguments || {});
  if (model.tool && !READ_TOOLS.includes(model.tool)) proposal = await createProposal(userId, model.tool, model.arguments || {});
  const toolCalls = model.tool ? JSON.parse(JSON.stringify({ tool: model.tool, result })) : undefined;
  const message = await prisma.chatMessage.create({ data: { userId, role: "ASSISTANT", content: model.reply, toolCalls, action: proposal as any } });
  res.status(201).json({ message, proposal });
}

export async function listMessages(req: AuthRequest, res: Response) { const messages = await prisma.chatMessage.findMany({ where: { userId: req.userId! }, orderBy: { createdAt: "asc" } }); res.json({ messages }); }
export async function resolveProposal(req: AuthRequest, res: Response) { const userId = req.userId!; const messageId = String(req.params.id); const message = await prisma.chatMessage.findFirst({ where: { id: messageId, userId } }); if (!message?.action || message.outcome) throw new AppError("This proposal is no longer available.", 409); if (req.body.confirm !== true) { const cancelled = await prisma.chatMessage.update({ where: { id: message.id }, data: { outcome: "CANCELLED" } }); return res.json({ message: cancelled }); } const action = message.action as Proposal; if (action.type === "SWAP_EXERCISE") { const payload = action.payload as any; await prisma.splitDayExercise.update({ where: { id: payload.splitDayExerciseId }, data: { exerciseId: payload.alternativeId } }); } if (action.type === "REST_DAY") { const payload = action.payload as any; const active = await prisma.userSplit.findFirst({ where: { userId, isActive: true }, include: { split: { include: { days: true } } } }); const day = active?.split.days.find(d => !d.isRest); if (!day) throw new AppError("No active training day found.", 409); await prisma.workoutSession.create({ data: { userId, splitDayId: day.id, date: new Date(payload.date), status: "SKIPPED", restReason: payload.reason } }); } if (action.type === "SPLIT_REGENERATION") throw new AppError("Split previews must be reviewed in the split builder before switching.", 409); const resolved = await prisma.chatMessage.update({ where: { id: message.id }, data: { outcome: "CONFIRMED" } }); res.json({ message: resolved }); }
