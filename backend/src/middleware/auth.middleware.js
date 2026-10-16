import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { tokenFromRequest } from "../lib/auth-token.js";

export const protectRoute = async (req, res, next) => {
  try {
    // A browser cookie is shared by every window. A tab that logged in as
    // someone else sends its own Bearer token so the other window stays signed in.
    const token = tokenFromRequest(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No token provided",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Invalid or expired token",
      });
    }

    // ✅ find user
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - User not found",
      });
    }

    // ✅ attach user to request
    req.user = user;

    next();
  } catch (error) {
    console.log("❌ Error in protectRoute middleware:", error.message);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};