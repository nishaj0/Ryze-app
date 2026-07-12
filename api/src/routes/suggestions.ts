import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { wrap } from "../utils/asyncHandler";
import * as splitSuggestionController from "../controllers/splitSuggestionController";

const router = Router();

router.post(
  "/generate",
  wrap(splitSuggestionController.generateSuggestions)
);

router.get(
  "/",
  authMiddleware,
  wrap(splitSuggestionController.getSuggestions)
);

router.post(
  "/:id/accept",
  authMiddleware,
  wrap(splitSuggestionController.acceptSuggestion)
);

router.post(
  "/:id/dismiss",
  authMiddleware,
  wrap(splitSuggestionController.dismissSuggestion)
);

export default router;
