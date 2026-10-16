import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getStreamToken, prepareDirectChat } from "../controllers/chat.controller.js";

const router = express.Router();

router.get("/token", protectRoute, getStreamToken);
router.post("/channel/:id", protectRoute, prepareDirectChat);

export default router;
