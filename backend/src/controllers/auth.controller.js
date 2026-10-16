import { upsertStreamUser } from "../lib/stream.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { authCookieOptions, clearAuthCookie } from "../lib/cookies.js";
import { tokenFromRequest } from "../lib/auth-token.js";

// ================= SIGNUP =================
function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

async function findUserByEmail(email) {
  const lowered = normalizeEmail(email);
  if (!lowered) return null;

  const exact = await User.findOne({ email: lowered });
  if (exact) return exact;

  const escaped = lowered.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return User.findOne({ email: { $regex: `^${escaped}$`, $options: "i" } });
}

export async function signup(req, res) {
  const { password, fullName } = req.body;
  const email = normalizeEmail(req.body.email);

  try {
    if (!email || !password || !fullName?.trim()) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    // ✅ MODERN AVATAR
    const avatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(
      fullName + Math.random()
    )}`;

    const newUser = await User.create({
      email,
      fullName: fullName.trim(),
      password,
      profilePic: avatar,
    });

    // Stream user
    try {
      await upsertStreamUser({
        id: newUser._id.toString(),
        name: newUser.fullName,
        image: newUser.profilePic || "",
      });
      console.log(`✅ Stream user created for ${newUser.fullName}`);
    } catch (error) {
      console.log("❌ Stream error:", error.message);
    }

    // JWT
    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "7d" }
    );

    res.cookie("jwt", token, authCookieOptions(req));

    res.status(201).json({ success: true, user: newUser, token });
  } catch (error) {
    console.log("❌ Signup error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// ================= LOGIN =================
export async function login(req, res) {
  try {
    const { password } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordCorrect = await user.matchPassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "7d" }
    );

    res.cookie("jwt", token, authCookieOptions(req));

    res.status(200).json({ success: true, user, token });
  } catch (error) {
    console.log("❌ Login error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// ================= LOGOUT =================
export async function getMe(req, res) {
  try {
    const token = tokenFromRequest(req);
    if (!token) return res.status(200).json({ success: true, user: null });

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) return res.status(200).json({ success: true, user: null });

    return res.status(200).json({ success: true, user, token });
  } catch {
    return res.status(200).json({ success: true, user: null });
  }
}

export function logout(req, res) {
  clearAuthCookie(res, req);
  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
}

// ================= ONBOARD =================
export async function onboard(req, res) {
  try {
    const userId = req.user._id;

    const { fullName, bio, nativeLanguage, learningLanguage, location, profilePic } =
      req.body;

    if (!fullName || !bio || !nativeLanguage || !learningLanguage || !location) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        fullName,
        bio,
        nativeLanguage,
        learningLanguage,
        location,
        ...(profilePic ? { profilePic } : {}),
        isOnboarded: true,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Avatar fallback
    if (!updatedUser.profilePic) {
      updatedUser.profilePic = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(
        updatedUser.fullName
      )}`;
      await updatedUser.save();
    }

    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.profilePic || "",
      });
      console.log(`✅ Stream updated for ${updatedUser.fullName}`);
    } catch (error) {
      console.log("❌ Stream update error:", error.message);
    }

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("❌ Onboarding error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}