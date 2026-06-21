import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { submitSupportTicket, getMyTickets } from "../controllers/settingsController";

const router = Router();

router.use(authMiddleware);

router.post("/tickets", submitSupportTicket);
router.get("/my-tickets", getMyTickets);

export default router;
