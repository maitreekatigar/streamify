import mongoose from "mongoose";
import User from "../models/User.js";
import { ensureDirectChannel, generateStreamToken, upsertStreamUser } from "../lib/stream.js";

export async function getStreamToken(req, res) {
  try {
    await upsertStreamUser({
      id: req.user.id,
      name: req.user.fullName,
      image: req.user.profilePic || "",
    });

    const token = generateStreamToken(req.user.id);

    if (!token) {
      return res.status(503).json({
        message: "Chat and video are not configured. Add Stream API keys to the server.",
      });
    }

    res.status(200).json({ token });
  } catch (error) {
    console.log("Error in getStreamToken controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function prepareDirectChat(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: "User not found" });
    }

    const target = await User.findById(req.params.id).select("fullName profilePic");
    if (!target) return res.status(404).json({ message: "User not found" });
    if (target.id === req.user.id) {
      return res.status(400).json({ message: "You can't chat with yourself" });
    }

    const channelId = await ensureDirectChannel(
      {
        id: req.user.id,
        name: req.user.fullName,
        image: req.user.profilePic || "",
      },
      {
        id: target.id,
        name: target.fullName,
        image: target.profilePic || "",
      }
    );

    if (!channelId) {
      return res.status(503).json({
        message: "Chat and video are not configured. Add Stream API keys to the server.",
      });
    }

    res.status(200).json({ channelId });
  } catch (error) {
    console.log("Error in prepareDirectChat controller:", error.message);
    res.status(500).json({ message: "Could not start chat" });
  }
}
