import { Router, Response, NextFunction } from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/auth";
import * as photoController from "../controllers/photoController";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

const wrap = (fn: (req: any, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: any, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

router.post("/", authMiddleware, upload.single("photo"), wrap(photoController.uploadPhoto));
router.get("/", authMiddleware, wrap(photoController.getPhotos));
router.delete("/:id", authMiddleware, wrap(photoController.deletePhoto));

export default router;
