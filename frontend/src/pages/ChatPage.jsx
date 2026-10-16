import { useEffect, useState } from "react";
import { useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken, prepareDirectChat } from "../lib/api";

import {
  Channel,
  ChannelHeader,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";

import ChatLoader from "../components/ChatLoader";
import CallButton from "../components/CallButton";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

let connectTask = null;

function connectChatUser(client, user, token) {
  if (client.userID === user.id) return Promise.resolve();
  if (!connectTask) {
    connectTask = (async () => {
      if (client.userID && client.userID !== user.id) await client.disconnectUser();
      if (!client.userID) await client.connectUser(user, token);
    })().finally(() => {
      connectTask = null;
    });
  }
  return connectTask;
}

const ChatPage = () => {
  const { id: targetUserId } = useParams();

  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatError, setChatError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const { authUser } = useAuthUser();

  const {
    data: tokenData,
    isLoading: tokenLoading,
    isError: tokenError,
    error: tokenQueryError,
  } = useQuery({
    queryKey: ["streamToken", authUser?._id],
    queryFn: getStreamToken,
    enabled: !!authUser,
    retry: false,
  });

  useEffect(() => {
    if (!authUser || tokenLoading) return;

    if (targetUserId === authUser._id) {
      setChatError("You can't chat with yourself.");
      setLoading(false);
      return;
    }

    if (!tokenData?.token || !STREAM_API_KEY) {
      setChatError(tokenQueryError?.response?.data?.message || "Could not connect to chat. Please try again.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    const client = StreamChat.getInstance(STREAM_API_KEY);

    const initChat = async () => {
      try {
        setChatError("");
        await connectChatUser(
          client,
          {
            id: authUser._id,
            name: authUser.fullName,
            image: authUser.profilePic,
          },
          tokenData.token
        );

        // Register both people, then join the same way the original app did.
        // The other device can already be in this chat; that should not block this one.
        try {
          await prepareDirectChat(targetUserId);
        } catch (prepareError) {
          console.warn("prepareDirectChat:", prepareError?.response?.data?.message || prepareError.message);
        }

        const channelId = [authUser._id, targetUserId].sort().join("-");
        const currChannel = client.channel("messaging", channelId, {
          members: [authUser._id, targetUserId],
        });
        await currChannel.watch();

        if (cancelled) return;
        setChatClient(client);
        setChannel(currChannel);
      } catch (error) {
        console.error("Error initializing chat:", error);
        if (!cancelled) {
          const message =
            error?.response?.data?.message ||
            error?.message ||
            "Could not connect to chat. Please try again.";
          setChatError(message);
          toast.error(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setLoading(true);
    initChat();

    return () => {
      cancelled = true;
    };
  }, [tokenData, tokenLoading, authUser, targetUserId, attempt, tokenQueryError]);

  const handleVideoCall = () => {
    if (channel) {
      const callUrl = `${window.location.origin}/call/${channel.id}`;

      channel.sendMessage({
        text: `I've started a video call. Join me here: ${callUrl}`,
      });

      toast.success("Video call link sent successfully!");
    }
  };

  if (tokenLoading || loading) return <ChatLoader />;

  if (tokenError || chatError || !chatClient || !channel) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p>{chatError || tokenQueryError?.response?.data?.message || "Could not connect to chat. Please try again."}</p>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setAttempt((value) => value + 1)}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="h-full">
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <div className="w-full h-full min-h-0 relative flex flex-col">
            <CallButton handleVideoCall={handleVideoCall} />
            <Window>
              <ChannelHeader />
              <MessageList />
              <MessageInput focus />
            </Window>
          </div>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
};
export default ChatPage;
