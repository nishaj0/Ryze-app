import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { prisma } from "../utils/db";
import { callGeminiWithTools, GeminiFunctionDeclaration } from "../utils/gemini";
import { createLogger } from "../utils/logger";

type ReadToolName = "getRecentSessions" | "getExerciseHistory" | "getProgressSummary" | "getCurrentSplit" | "getCheckInHistory";
type WriteToolName = "proposeSwapExercise" | "proposeMarkRestDay" | "proposeSplitRegeneration";
type NavigationToolName = "openSplitDetails" | "openExerciseDetail" | "openSessionSummary" | "openPhotosTab" | "openSplitSwitcher" | "openProgressDashboard" | "openBrowseExercises" | "openSettings";
type ToolName = ReadToolName | WriteToolName | NavigationToolName;
type Proposal = { type: "SWAP_EXERCISE" | "REST_DAY" | "SPLIT_REGENERATION"; payload: Record<string, unknown>; summary: string };
type DeepLink = { screen: string; params: Record<string, unknown> };
type ChatResponseBlock =
  | { type: "text"; content: string }
  | { type: "data_card"; cardType: "split" | "session" | "exercise" | "progress"; data: Record<string, unknown>; deepLink?: DeepLink }
  | { type: "confirmation_card"; action: "swap_exercise" | "mark_rest_day" | "regenerate_split"; data: Record<string, unknown> }
  | { type: "navigation_action"; label: string; screen: string; params: Record<string, unknown> };
type ChatResponse = { blocks: ChatResponseBlock[] };

const log = createLogger("coach");
const READ_TOOLS = new Set<ReadToolName>(["getRecentSessions", "getExerciseHistory", "getProgressSummary", "getCurrentSplit", "getCheckInHistory"]);
const asJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const TOOLS: GeminiFunctionDeclaration[] = [
  { name: "getRecentSessions", description: "Get the user's recent completed or skipped workout sessions.", parameters: { type: "object", properties: {} } },
  { name: "getExerciseHistory", description: "Get the user's logged history for one exercise.", parameters: { type: "object", properties: { exerciseName: { type: "string", description: "The exercise name." } }, required: ["exerciseName"] } },
  { name: "getProgressSummary", description: "Get a factual summary of the user's last 30 days of training progress.", parameters: { type: "object", properties: {} } },
  { name: "getCurrentSplit", description: "Get the user's active workout split and its days and exercises.", parameters: { type: "object", properties: {} } },
  { name: "getCheckInHistory", description: "Get the user's recent post-workout check-ins.", parameters: { type: "object", properties: {} } },
  { name: "proposeSwapExercise", description: "Create a confirmation-only proposal to swap an exercise in the active split. Never performs the swap.", parameters: { type: "object", properties: { splitDayId: { type: "string" }, currentExerciseId: { type: "string" } }, required: ["splitDayId", "currentExerciseId"] } },
  { name: "proposeMarkRestDay", description: "Create a confirmation-only proposal to mark a date as a rest day. Never writes until confirmed.", parameters: { type: "object", properties: { date: { type: "string" }, reason: { type: "string" } }, required: ["date"] } },
  { name: "proposeSplitRegeneration", description: "Create a confirmation-only proposal to regenerate a split preview. Never writes until confirmed.", parameters: { type: "object", properties: { description: { type: "string" } } } },
  { name: "openSplitDetails", description: "Offer a shortcut to the user's active split details.", parameters: { type: "object", properties: {} } },
  { name: "openExerciseDetail", description: "Offer a shortcut to an exercise detail screen.", parameters: { type: "object", properties: { exerciseId: { type: "string" } }, required: ["exerciseId"] } },
  { name: "openSessionSummary", description: "Offer a shortcut to a completed workout summary.", parameters: { type: "object", properties: { sessionId: { type: "string" } }, required: ["sessionId"] } },
  { name: "openPhotosTab", description: "Offer a shortcut to progress photos.", parameters: { type: "object", properties: {} } },
  { name: "openSplitSwitcher", description: "Offer a shortcut to switch workout splits.", parameters: { type: "object", properties: {} } },
  { name: "openProgressDashboard", description: "Offer a shortcut to the progress dashboard.", parameters: { type: "object", properties: {} } },
  { name: "openBrowseExercises", description: "Offer a shortcut to browse exercises.", parameters: { type: "object", properties: {} } },
  { name: "openSettings", description: "Offer a shortcut to settings.", parameters: { type: "object", properties: {} } },
];

function isToolName(name: string): name is ToolName {
  return TOOLS.some((tool) => tool.name === name);
}

async function findExercise(name: string) {
  const exact = await prisma.exercise.findUnique({ where: { name } });
  if (exact) return exact;
  return prisma.exercise.findFirst({ where: { name: { contains: name.trim(), mode: "insensitive" } } });
}

async function runRead(userId: string, tool: ReadToolName, args: Record<string, unknown>) {
  if (tool === "getCurrentSplit") return prisma.userSplit.findFirst({ where: { userId, isActive: true }, include: { split: { include: { days: { include: { exercises: { include: { exercise: true } } } } } } } });
  if (tool === "getCheckInHistory") return prisma.checkIn.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 10 });
  if (tool === "getRecentSessions") return prisma.workoutSession.findMany({ where: { userId, status: { in: ["COMPLETED", "SKIPPED"] } }, include: { splitDay: true, exerciseLogs: { include: { exercise: true, setLogs: true } } }, orderBy: { date: "desc" }, take: 10 });
  if (tool === "getExerciseHistory") {
    const exercise = await findExercise(String(args.exerciseName || ""));
    if (!exercise) return { error: "Exercise not found" };
    const history = await prisma.exerciseLog.findMany({ where: { exerciseId: exercise.id, session: { userId } }, include: { session: true, setLogs: true }, orderBy: { session: { date: "desc" } }, take: 10 });
    return { exercise, history };
  }
  const since = new Date(Date.now() - 30 * 86400000);
  const sessions = await prisma.workoutSession.findMany({ where: { userId, status: "COMPLETED", date: { gte: since } }, include: { exerciseLogs: { include: { setLogs: true } } } });
  return { period: "last 30 days", sessions: sessions.length, volume: sessions.flatMap((session) => session.exerciseLogs).flatMap((log) => log.setLogs).reduce((sum, set) => sum + set.weightKg * set.reps, 0), streak: sessions.length };
}

async function createProposal(userId: string, tool: WriteToolName, args: Record<string, unknown>): Promise<Proposal> {
  if (tool === "proposeMarkRestDay") {
    const date = new Date(String(args.date));
    if (Number.isNaN(date.valueOf()) || Math.abs(date.valueOf() - Date.now()) > 31 * 86400000) throw new AppError("Choose a date within the next or previous 31 days.", 400);
    return { type: "REST_DAY", payload: { date: date.toISOString(), reason: typeof args.reason === "string" ? args.reason : null }, summary: `Mark ${date.toLocaleDateString()} as a rest day?` };
  }
  if (tool === "proposeSwapExercise") {
    const entry = await prisma.splitDayExercise.findFirst({ where: { splitDayId: String(args.splitDayId), exerciseId: String(args.currentExerciseId) }, include: { exercise: true, splitDay: true } });
    if (!entry) throw new AppError("That exercise is no longer in this split day.", 409);
    const alternative = await prisma.exerciseAlternative.findFirst({ where: { exerciseId: entry.exerciseId }, include: { alternative: true } });
    if (!alternative) throw new AppError("There is no approved alternative for that exercise.", 400);
    return { type: "SWAP_EXERCISE", payload: { splitDayExerciseId: entry.id, alternativeId: alternative.alternativeId }, summary: `Swap ${entry.exercise.name} for ${alternative.alternative.name} in ${entry.splitDay.name}?` };
  }
  return { type: "SPLIT_REGENERATION", payload: { description: typeof args.description === "string" ? args.description : "" }, summary: "Create a new split preview from these requirements?" };
}

async function navigationAction(userId: string, tool: NavigationToolName, args: Record<string, unknown>): Promise<ChatResponseBlock | null> {
  const fixed: Record<NavigationToolName, { label: string; screen: string; params: Record<string, unknown> }> = {
    openSplitDetails: { label: "View split details", screen: "Profile", params: {} },
    openExerciseDetail: { label: "View exercise", screen: "Profile", params: {} },
    openSessionSummary: { label: "View workout summary", screen: "Home", params: {} },
    openPhotosTab: { label: "Open progress photos", screen: "Photos", params: { screen: "PhotosTimeline" } },
    openSplitSwitcher: { label: "Switch workout split", screen: "Profile", params: { screen: "SplitSwitcher" } },
    openProgressDashboard: { label: "Open progress dashboard", screen: "Progress", params: { screen: "Dashboard" } },
    openBrowseExercises: { label: "Browse exercises", screen: "Profile", params: { screen: "AllExercises" } },
    openSettings: { label: "Open settings", screen: "Profile", params: { screen: "Settings" } },
  };
  const target = fixed[tool];
  if (!target) return null;
  if (tool === "openSplitDetails") {
    const active = await prisma.userSplit.findFirst({ where: { userId, isActive: true }, include: { split: true } });
    if (!active) return null;
    target.params = { screen: "SplitDetails", params: { splitId: active.splitId, splitName: active.split.name } };
  }
  if (tool === "openExerciseDetail") {
    if (!args.exerciseId) return null;
    target.params = { screen: "ExerciseDetail", params: { exerciseId: String(args.exerciseId) } };
  }
  if (tool === "openSessionSummary") {
    if (!args.sessionId) return null;
    target.params = { screen: "WorkoutSummary", params: { sessionId: String(args.sessionId) } };
  }
  return { type: "navigation_action", ...target };
}

function readBlocks(tool: ReadToolName, result: any): ChatResponseBlock[] {
  if (tool === "getCurrentSplit") {
    if (!result) return [{ type: "text", content: "You don't have an active split yet." }];
    return [{ type: "data_card", cardType: "split", data: asJson({ split: result.split }), deepLink: { screen: "Profile", params: { screen: "SplitDetails", params: { splitId: result.splitId, splitName: result.split.name } } } }];
  }
  if (tool === "getRecentSessions") {
    if (!result?.length) return [{ type: "text", content: "You don't have any completed workouts yet." }];
    const first = result[0];
    return [{ type: "data_card", cardType: "session", data: asJson({ sessions: result.slice(0, 3) }), deepLink: { screen: "Home", params: { screen: "WorkoutSummary", params: { sessionId: first.id } } } }];
  }
  if (tool === "getExerciseHistory") {
    if (result?.error) return [{ type: "text", content: result.error }];
    if (!result?.history?.length) return [{ type: "text", content: `You haven't logged ${result?.exercise?.name || "that exercise"} yet.` }];
    return [{ type: "data_card", cardType: "exercise", data: asJson(result), deepLink: { screen: "Profile", params: { screen: "ExerciseDetail", params: { exerciseId: result.exercise.id } } } }];
  }
  if (tool === "getCheckInHistory") {
    if (!result?.length) return [{ type: "text", content: "You don't have any post-workout check-ins yet." }];
    return [{ type: "data_card", cardType: "progress", data: asJson({ title: "Recent check-ins", checkIns: result }) }];
  }
  if (!result?.sessions) return [{ type: "text", content: "You don't have enough completed workouts in the last 30 days for a progress summary yet." }];
  return [{ type: "data_card", cardType: "progress", data: asJson(result), deepLink: { screen: "Progress", params: { screen: "Dashboard" } } }];
}

function requiredReadFor(content: string): ReadToolName | null {
  const normalized = content.toLowerCase();
  if (/\b(split|routine|program)\b/.test(normalized)) return "getCurrentSplit";
  if (/\b(back|chest|legs|shoulders|exercise|lift)\b/.test(normalized)) return "getCurrentSplit";
  if (/\b(progress|streak|volume|pr|history)\b/.test(normalized)) return "getProgressSummary";
  return null;
}

function targetLabel(block: ChatResponseBlock) {
  return block.type === "navigation_action" ? block.label : "Open feature";
}

export async function sendMessage(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const content = String(req.body.content || "").trim();
  if (!content) throw new AppError("A message is required", 400);

  await prisma.chatMessage.create({ data: { userId, role: "USER", content } });
  const [history, profile] = await Promise.all([
    prisma.chatMessage.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.user.findUnique({ where: { id: userId }, select: { goal: true, experienceLevel: true, daysAvailable: true, equipmentAccess: true } }),
  ]);
  const systemPrompt = `You are Ryze Coach: encouraging, concise, and not clinical. You have real tools. When the user asks about workouts, split, progress, check-ins, exercises, or history, you MUST call the relevant read tool before responding. Never say you could show data or ask permission to show read-only information: retrieve it immediately. For fitness advice, first call getCurrentSplit or getExerciseHistory and reference the returned exercises. Use the supplied profile context to match the user's experience level. Only use proposal tools for writes, and explain that those changes require confirmation. When the user asks how to reach a dedicated app feature, call one fixed open* navigation tool and keep the text brief. Never invent data, tool results, raw routes, or navigation names.`;
  let proposal: Proposal | undefined;
  const navigationBlocks: ChatResponseBlock[] = [];
  const toolResultBlocks: ChatResponseBlock[] = [];
  const model = await callGeminiWithTools({
    systemPrompt,
    userPrompt: JSON.stringify({ profile, history: history.reverse().map((message) => ({ role: message.role, content: message.content })), message: content }),
    tools: TOOLS,
    execute: async (name, args) => {
      if (!isToolName(name)) {
        log.warn({ name, args }, "coach:invalid-tool-call");
        return { error: "This action is not available." };
      }
      if (READ_TOOLS.has(name as ReadToolName)) {
        const result = await runRead(userId, name as ReadToolName, args);
        toolResultBlocks.push(...readBlocks(name as ReadToolName, result));
        return result;
      }
      if (name.startsWith("propose")) {
        proposal = await createProposal(userId, name as WriteToolName, args);
        return { proposal: proposal.summary };
      }
      const action = await navigationAction(userId, name as NavigationToolName, args);
      if (!action) {
        log.warn({ name, args }, "coach:invalid-navigation-call");
        return { error: "That destination is unavailable." };
      }
      navigationBlocks.push(action);
      return { label: targetLabel(action) };
    },
  });

  if (toolResultBlocks.length === 0 && !proposal && navigationBlocks.length === 0) {
    const required = requiredReadFor(content);
    if (required) {
      const result = await runRead(userId, required, {});
      toolResultBlocks.push(...readBlocks(required, result));
      log.warn({ required, content }, "coach:required-read-fallback");
    }
  }

  const blocks: ChatResponseBlock[] = model.reply ? [{ type: "text", content: model.reply }, ...toolResultBlocks] : [...toolResultBlocks];
  if (proposal) {
    const action = proposal.type === "SWAP_EXERCISE" ? "swap_exercise" : proposal.type === "REST_DAY" ? "mark_rest_day" : "regenerate_split";
    blocks.push({ type: "confirmation_card", action, data: { summary: proposal.summary } });
  }
  blocks.push(...navigationBlocks);
  const response: ChatResponse = { blocks };
  const message = await prisma.chatMessage.create({ data: { userId, role: "ASSISTANT", content: model.reply, toolCalls: asJson({ response, calls: model.calls }) as any, action: proposal as any } });
  res.status(201).json({ message, response, proposal });
}

export async function listMessages(req: AuthRequest, res: Response) {
  const messages = await prisma.chatMessage.findMany({ where: { userId: req.userId! }, orderBy: { createdAt: "asc" } });
  res.json({ messages });
}

export async function resolveProposal(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const messageId = String(req.params.id);
  const message = await prisma.chatMessage.findFirst({ where: { id: messageId, userId } });
  if (!message?.action || message.outcome) throw new AppError("This proposal is no longer available.", 409);
  if (req.body.confirm !== true) {
    const cancelled = await prisma.chatMessage.update({ where: { id: message.id }, data: { outcome: "CANCELLED" } });
    return res.json({ message: cancelled });
  }
  const action = message.action as Proposal;
  if (action.type === "SWAP_EXERCISE") {
    const payload = action.payload as { splitDayExerciseId: string; alternativeId: string };
    await prisma.splitDayExercise.update({ where: { id: payload.splitDayExerciseId }, data: { exerciseId: payload.alternativeId } });
  }
  if (action.type === "REST_DAY") {
    const payload = action.payload as { date: string; reason?: string | null };
    const active = await prisma.userSplit.findFirst({ where: { userId, isActive: true }, include: { split: { include: { days: true } } } });
    const day = active?.split.days.find((splitDay) => !splitDay.isRest);
    if (!day) throw new AppError("No active training day found.", 409);
    await prisma.workoutSession.create({ data: { userId, splitDayId: day.id, date: new Date(payload.date), status: "SKIPPED", restReason: payload.reason || null } });
  }
  if (action.type === "SPLIT_REGENERATION") throw new AppError("Split previews must be reviewed in the split builder before switching.", 409);
  const resolved = await prisma.chatMessage.update({ where: { id: message.id }, data: { outcome: "CONFIRMED" } });
  res.json({ message: resolved });
}
