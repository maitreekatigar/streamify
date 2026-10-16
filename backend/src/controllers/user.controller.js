import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import { upsertStreamUser } from "../lib/stream.js";

export async function getRecommendedUsers(req, res) {
  try {
    const currentUserId = req.user._id;
    const currentUser = req.user;

    const recommendedUsers = await User.find({
      $and: [
        { _id: { $ne: currentUserId } }, //exclude current user
        { _id: { $nin: currentUser.friends } }, // exclude current user's friends
        { isOnboarded: true },
      ],
    }).select("-password");
    res.status(200).json(recommendedUsers);
  } catch (error) {
    console.error("Error in getRecommendedUsers controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getMyFriends(req, res) {
  try {
    const user = await User.findById(req.user.id)
      .select("friends")
      .populate("friends", "fullName profilePic nativeLanguage learningLanguage");

    res.status(200).json(user.friends);
  } catch (error) {
    console.error("Error in getMyFriends controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function sendFriendRequest(req, res) {
  try {
    const myId = req.user.id;
    const { id: recipientId } = req.params;

    // prevent sending req to yourself
    if (myId === recipientId) {
      return res.status(400).json({ message: "You can't send friend request to yourself" });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    // Friend ids are ObjectIds. Comparing them to a string with includes() never matches,
    // so people could send another request to someone they are already friends with.
    const alreadyFriends = recipient.friends.some((friendId) => friendId.toString() === myId);
    if (alreadyFriends) {
      return res.status(400).json({ message: "You are already friends with this user" });
    }

    // check if a req already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: myId, recipient: recipientId },
        { sender: recipientId, recipient: myId },
      ],
    });

    if (existingRequest) {
      return res
        .status(400)
        .json({ message: "A friend request already exists between you and this user" });
    }

    const friendRequest = await FriendRequest.create({
      sender: myId,
      recipient: recipientId,
    });

    res.status(201).json(friendRequest);
  } catch (error) {
    console.error("Error in sendFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function acceptFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    // Verify the current user is the recipient
    if (friendRequest.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not authorized to accept this request" });
    }

    friendRequest.status = "accepted";
    await friendRequest.save();

    // add each user to the other's friends array
    // $addToSet: adds elements to an array only if they do not already exist.
    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.recipient },
    });

    await User.findByIdAndUpdate(friendRequest.recipient, {
      $addToSet: { friends: friendRequest.sender },
    });

    res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    console.log("Error in acceptFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getFriendRequests(req, res) {
  try {
    const incomingReqs = await FriendRequest.find({
      recipient: req.user.id,
      status: "pending",
    }).populate("sender", "fullName profilePic nativeLanguage learningLanguage");

    const acceptedReqs = await FriendRequest.find({
      sender: req.user.id,
      status: "accepted",
    }).populate("recipient", "fullName profilePic");

    res.status(200).json({ incomingReqs, acceptedReqs });
  } catch (error) {
    console.log("Error in getPendingFriendRequests controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

const PROFILE_FIELDS = [
  "fullName",
  "bio",
  "nativeLanguage",
  "learningLanguage",
  "location",
  "profilePic",
];

export async function updateProfile(req, res) {
  try {
    const updates = {};
    for (const field of PROFILE_FIELDS) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    if (updates.fullName !== undefined && !String(updates.fullName).trim()) {
      return res.status(400).json({ message: "Name cannot be empty" });
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.profilePic || "",
      });
    } catch (error) {
      console.log("Stream update error:", error.message);
    }

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error in updateProfile controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getOutgoingFriendReqs(req, res) {
  try {
    const outgoingRequests = await FriendRequest.find({
      sender: req.user.id,
      status: "pending",
    }).populate("recipient", "fullName profilePic nativeLanguage learningLanguage");

    res.status(200).json(outgoingRequests);
  } catch (error) {
    console.log("Error in getOutgoingFriendReqs controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}


function streakDateKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const v = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${v.year}-${v.month}-${v.day}`;
}
function priorDateKey(key) {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export async function getLearningStreak(req, res) {
  try {
    const user = await User.findById(req.user._id).select(
      "currentStreak longestStreak lastPracticeDate practiceDates"
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    const today = streakDateKey();
    const yesterday = priorDateKey(today);
    res.status(200).json({
      currentStreak: user.lastPracticeDate === today || user.lastPracticeDate === yesterday ? (user.currentStreak || 0) : 0,
      longestStreak: user.longestStreak || 0,
      lastPracticeDate: user.lastPracticeDate || "",
      practiceDates: user.practiceDates || [],
    });
  } catch (error) {
    console.error("Error fetching streak:", error.message);
    res.status(500).json({ message: "Could not fetch learning streak" });
  }
}

export async function completeLanguagePractice(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const today = streakDateKey();
    const yesterday = priorDateKey(today);
    if (user.lastPracticeDate === today) {
      return res.status(200).json({
        message: "Today's practice is already recorded!",
        currentStreak: user.currentStreak || 0,
        longestStreak: user.longestStreak || 0,
        lastPracticeDate: user.lastPracticeDate,
        practiceDates: user.practiceDates || [],
      });
    }
    user.currentStreak = user.lastPracticeDate === yesterday ? (user.currentStreak || 0) + 1 : 1;
    user.longestStreak = Math.max(user.longestStreak || 0, user.currentStreak);
    user.lastPracticeDate = today;
    user.practiceDates = [...new Set([...(user.practiceDates || []), today])];
    await user.save();
    res.status(200).json({
      message: "Practice recorded. Keep it up!",
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastPracticeDate: user.lastPracticeDate,
      practiceDates: user.practiceDates,
    });
  } catch (error) {
    console.error("Error recording practice:", error.message);
    res.status(500).json({ message: "Could not record practice" });
  }
}

export async function getStreakLeaderboard(req, res) {
  try {
    const users = await User.find({ isOnboarded: true })
      .select("fullName profilePic bio nativeLanguage learningLanguage currentStreak longestStreak lastPracticeDate")
      .sort({ longestStreak: -1, currentStreak: -1, fullName: 1 })
      .limit(20);
    const today = streakDateKey();
    const yesterday = priorDateKey(today);
    const ranked = users.map((user) => ({
      _id: user._id,
      fullName: user.fullName,
      profilePic: user.profilePic,
      bio: user.bio,
      nativeLanguage: user.nativeLanguage,
      learningLanguage: user.learningLanguage,
      currentStreak: user.lastPracticeDate === today || user.lastPracticeDate === yesterday ? (user.currentStreak || 0) : 0,
      longestStreak: user.longestStreak || 0,
    }));
    ranked.sort((a, b) => b.longestStreak - a.longestStreak || b.currentStreak - a.currentStreak);
    res.status(200).json(ranked);
  } catch (error) {
    console.error("Error loading leaderboard:", error.message);
    res.status(500).json({ message: "Could not load leaderboard" });
  }
}


function getCharmDateKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

const dailyLanguageQuiz = [
  { id: 1, question: 'What does the Spanish word "biblioteca" mean?', options: ["Bookshop", "Library", "Notebook", "School"], answer: 1, explanation: "Biblioteca means library." },
  { id: 2, question: 'In Italian, what does " buongiorno" mean?', options: ["Good morning / good day", "Good night", "Goodbye", "Please"], answer: 0, explanation: "Buongiorno is a daytime greeting." },
  { id: 3, question: 'What is the French word "merci" in English?', options: ["Sorry", "Hello", "Thank you", "Welcome"], answer: 2, explanation: "Merci means thank you." },
  { id: 4, question: 'The Spanish word "agua" means…', options: ["Fire", "Water", "Air", "Earth"], answer: 1, explanation: "Agua means water." },
  { id: 5, question: 'What does Italian "libro" mean?', options: ["Letter", "Library", "Book", "Word"], answer: 2, explanation: "Libro means book." },
];

export async function getDailyQuiz(req, res) {
  res.status(200).json({
    date: getCharmDateKey(),
    questions: dailyLanguageQuiz.map(({ answer, explanation, ...question }) => question),
  });
}

export async function submitDailyQuiz(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const today = getCharmDateKey();
    if (user.quizCompletedDate === today) {
      return res.status(409).json({ message: "You have already completed today's quiz.", charms: user.charms || 0 });
    }
    const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
    if (answers.length !== dailyLanguageQuiz.length) {
      return res.status(400).json({ message: "Please answer all five questions." });
    }
    let correct = 0;
    const results = dailyLanguageQuiz.map((question, index) => {
      const isCorrect = Number(answers[index]) === question.answer;
      if (isCorrect) correct += 1;
      return { id: question.id, correct: isCorrect, correctAnswer: question.answer, explanation: question.explanation };
    });
    user.charms = (user.charms || 0) + correct;
    user.quizCompletedDate = today;
    user.charmHistory = [...(user.charmHistory || []), `${today}:quiz:${correct}`].slice(-100);
    await user.save();
    res.status(200).json({ correct, total: dailyLanguageQuiz.length, charmsEarned: correct, charms: user.charms, results, message: `You earned ${correct} star charm${correct === 1 ? "" : "s"}!` });
  } catch (error) {
    console.error("Error submitting daily quiz:", error.message);
    res.status(500).json({ message: "Could not submit quiz" });
  }
}

export async function getCharmBalance(req, res) {
  try {
    const user = await User.findById(req.user._id).select("charms quizCompletedDate");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ charms: user.charms || 0, quizCompletedToday: user.quizCompletedDate === getCharmDateKey() });
  } catch (error) {
    res.status(500).json({ message: "Could not load charms" });
  }
}

// A small live news feed from public RSS sources; if a source is unavailable, the UI can show a friendly fallback.
export async function getLiteratureNews(req, res) {
  const sources = [
    { name: "The Guardian — Books", url: "https://www.theguardian.com/books/rss" },
    { name: "The Guardian — History", url: "https://www.theguardian.com/science/history/rss" },
  ];
  try {
    const feeds = await Promise.all(sources.map(async (source) => {
      try {
        const response = await fetch(source.url, { signal: AbortSignal.timeout(4500) });
        if (!response.ok) return [];
        const xml = await response.text();
        const items = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].slice(0, 8).map((match) => {
          const block = match[1];
          const field = (tag) => {
            const found = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"));
            return found ? found[1].replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim() : "";
          };
          return { title: field("title"), url: field("link"), date: field("pubDate"), source: source.name, description: field("description").slice(0, 220) };
        }).filter((item) => item.title && item.url);
        return items;
      } catch { return []; }
    }));
    const articles = feeds.flat().sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 12);
    res.set("Cache-Control", "public, max-age=900");
    res.status(200).json({ articles, updatedAt: new Date().toISOString(), unavailable: articles.length === 0 });
  } catch {
    res.status(200).json({ articles: [], unavailable: true });
  }
}
