import { Router, Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/auth";
import * as splitSuggestionController from "../controllers/splitSuggestionController";

const router = Router();

const wrap = (
  fn: (req: any, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: any, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

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
