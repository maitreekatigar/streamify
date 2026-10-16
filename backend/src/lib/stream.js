import { StreamChat } from "stream-chat";
import "dotenv/config";

// ================= ENV VARIABLES =================
const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

// ================= VALIDATION =================
if (!apiKey || !apiSecret) {
  console.error("❌ Stream API key or Secret is missing in .env");
}

// ================= STREAM CLIENT =================
// Server-side client (requires BOTH key + secret)
const streamClient = StreamChat.getInstance(apiKey, apiSecret);

// ================= UPSERT USER =================
export const upsertStreamUser = async ({ id, name, image }) => {
  if (!apiKey || !apiSecret) {
    console.log("⚠️ Skipping Stream user creation (missing keys)");
    return null;
  }

  try {
    await streamClient.upsertUsers([
      {
        id: id.toString(), // ensure string
        name,
        image,
      },
    ]);

    return { id, name, image };
  } catch (error) {
    console.error("❌ Error upserting Stream user:", error.message);
    return null;
  }
};

// ================= GENERATE TOKEN =================
export const ensureDirectChannel = async (me, them) => {
  if (!apiKey || !apiSecret) return null;

  const savedMe = await upsertStreamUser(me);
  const savedThem = await upsertStreamUser(them);
  if (!savedMe || !savedThem) {
    throw new Error("Could not register chat users");
  }

  const channelId = [String(me.id), String(them.id)].sort().join("-");
  const members = [String(me.id), String(them.id)];
  const channel = streamClient.channel("messaging", channelId, {
    members,
    created_by_id: String(me.id),
  });

  try {
    await channel.create();
  } catch (error) {
    const message = String(error.message || "").toLowerCase();
    if (!message.includes("already")) throw error;
    try {
      await channel.addMembers(members);
    } catch (addError) {
      console.log("Channel members already present:", addError.message);
    }
  }

  return channelId;
};

export const generateStreamToken = (userId) => {
  if (!apiKey || !apiSecret) {
    console.log("⚠️ Cannot generate Stream token (missing keys)");
    return null;
  }

  try {
    return streamClient.createToken(userId.toString());
  } catch (error) {
    console.error("❌ Error generating Stream token:", error.message);
    return null;
  }
};

// ================= OPTIONAL: DELETE USER =================
export const deleteStreamUser = async (userId) => {
  try {
    await streamClient.deleteUser(userId.toString());
    console.log("✅ Stream user deleted:", userId);
  } catch (error) {
    console.error("❌ Error deleting Stream user:", error.message);
  }
};