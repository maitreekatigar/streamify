import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  acceptFriendRequest,
  getFriendRequests,
  getLearningStreak,
  completeLanguagePractice,
  getStreakLeaderboard,
  getDailyQuiz,
  submitDailyQuiz,
  getCharmBalance,
  getLiteratureNews,
  getMyFriends,
  getOutgoingFriendReqs,
  getRecommendedUsers,
  sendFriendRequest,
  updateProfile,
} from "../controllers/user.controller.js";

const router = express.Router();

// apply auth middleware to all routes
router.use(protectRoute);

router.get("/", getRecommendedUsers);
router.get("/streak", getLearningStreak);
router.post("/streak/practice", completeLanguagePractice);
router.get("/leaderboard/streaks", getStreakLeaderboard);
router.get("/charms", getCharmBalance);
router.get("/quiz/daily", getDailyQuiz);
router.post("/quiz/daily/submit", submitDailyQuiz);
router.get("/news/literature", getLiteratureNews);
router.get("/friends", getMyFriends);
router.put("/me", updateProfile);

router.post("/friend-request/:id", sendFriendRequest);
router.put("/friend-request/:id/accept", acceptFriendRequest);

router.get("/friend-requests", getFriendRequests);
router.get("/outgoing-friend-requests", getOutgoingFriendReqs);

export default router;
