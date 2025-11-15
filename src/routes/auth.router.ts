import express from "express";
import {
  login,
  logout,
  verify,
  changePassword,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/login", login);
router.post("/logout", logout);
router.get("/verify", verify);
router.post("/change-password", authMiddleware, changePassword);

export default router;
