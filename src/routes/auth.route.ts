import { Router } from "express";
import { register, login, me } from "../controllers/authController";
import { authRequired } from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authRequired, me);

export default router;
