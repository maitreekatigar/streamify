import { axiosInstance, clearSessionToken, getSessionToken, saveSessionToken } from "./axios";

// ================= AUTH =================

export const signup = async (signupData) => {
  const { data } = await axiosInstance.post("/auth/signup", signupData);
  saveSessionToken(data?.token);
  return data;
};

export const login = async (loginData) => {
  const { data } = await axiosInstance.post("/auth/login", loginData);
  saveSessionToken(data?.token);
  return data;
};

export const logout = async () => {
  const { data } = await axiosInstance.post("/auth/logout");
  clearSessionToken();
  return data;
};

export const getAuthUser = async () => {
  const sentToken = getSessionToken();
  try {
    const { data } = await axiosInstance.get("/auth/me");
    if (data?.user && data?.token) {
      saveSessionToken(data.token);
    } else if (sentToken && getSessionToken() === sentToken) {
      clearSessionToken();
    }
    return data;
  } catch (error) {
    console.log("Error in getAuthUser:", error?.response?.data || error.message);
    return null;
  }
};

export const completeOnboarding = async (userData) => {
  const { data } = await axiosInstance.post("/auth/onboarding", userData);
  return data;
};

export const updateProfile = async (profileData) => {
  const { data } = await axiosInstance.put("/users/me", profileData);
  return data;
};

// ================= USERS =================

export const getUserFriends = async () => {
  const { data } = await axiosInstance.get("/users/friends");
  return data;
};

export const getRecommendedUsers = async () => {
  const { data } = await axiosInstance.get("/users");
  return data;
};

export const getOutgoingFriendReqs = async () => {
  const { data } = await axiosInstance.get("/users/outgoing-friend-requests");
  return data;
};

export const sendFriendRequest = async (userId) => {
  const { data } = await axiosInstance.post(`/users/friend-request/${userId}`);
  return data;
};

export const getFriendRequests = async () => {
  const { data } = await axiosInstance.get("/users/friend-requests");
  return data;
};

export const acceptFriendRequest = async (requestId) => {
  const { data } = await axiosInstance.put(
    `/users/friend-request/${requestId}/accept`
  );
  return data;
};

// ================= STREAM =================

export const getStreamToken = async () => {
  const { data } = await axiosInstance.get("/chat/token");
  return data;
};

export const prepareDirectChat = async (userId) => {
  const { data } = await axiosInstance.post(`/chat/channel/${userId}`);
  return data;
};
// ================= LEARNING FEATURES =================
export const getLearningStreak = async () => (await axiosInstance.get("/users/streak")).data;
export const completeLanguagePractice = async () => (await axiosInstance.post("/users/streak/practice")).data;
export const getStreakLeaderboard = async () => (await axiosInstance.get("/users/leaderboard/streaks")).data;

// ================= CHARMS, DAILY QUIZ & LITERATURE NEWS =================
export const getCharmBalance = async () => (await axiosInstance.get("/users/charms")).data;
export const getDailyQuiz = async () => (await axiosInstance.get("/users/quiz/daily")).data;
export const submitDailyQuiz = async (answers) => (await axiosInstance.post("/users/quiz/daily/submit", { answers })).data;
export const getLiteratureNews = async () => (await axiosInstance.get("/users/news/literature")).data;
