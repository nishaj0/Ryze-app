import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { wrap } from "../utils/asyncHandler";
import * as chat from "../controllers/chatController";
const router = Router();
router.get("/messages", authMiddleware, wrap(chat.listMessages));
router.post("/messages", authMiddleware, wrap(chat.sendMessage));
router.post("/messages/:id/resolve", authMiddleware, wrap(chat.resolveProposal));
export default router;
