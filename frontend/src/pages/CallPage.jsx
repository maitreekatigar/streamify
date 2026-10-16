import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";

import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallControls,
  SpeakerLayout,
  StreamTheme,
} from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import toast from "react-hot-toast";
import PageLoader from "../components/PageLoader";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const CallPage = () => {
  const { id: callId } = useParams();
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);

  const { authUser, isLoading } = useAuthUser();

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
    if (isLoading || tokenLoading) return;

    if (!tokenData?.token || !authUser || !callId || !STREAM_API_KEY) {
      setIsConnecting(false);
      return;
    }

    const active = { cancelled: false, call: null, client: null };

    const initCall = async () => {
      try {
        const user = {
          id: authUser._id,
          name: authUser.fullName,
          image: authUser.profilePic,
        };

        const videoClient = new StreamVideoClient({
          apiKey: STREAM_API_KEY,
          user,
          token: tokenData.token,
        });
        active.client = videoClient;

        const callInstance = videoClient.call("default", callId);
        active.call = callInstance;

        await callInstance.join({ create: true });

        if (active.cancelled) {
          await callInstance.leave().catch(() => {});
          await videoClient.disconnectUser().catch(() => {});
          return;
        }

        setClient(videoClient);
        setCall(callInstance);
      } catch (error) {
        console.error("Error joining call:", error);
        if (!active.cancelled) toast.error("Could not join the call. Please try again.");
      } finally {
        if (!active.cancelled) setIsConnecting(false);
      }
    };

    setIsConnecting(true);
    initCall();

    return () => {
      active.cancelled = true;
      active.call?.leave().catch(() => {});
      active.client?.disconnectUser().catch(() => {});
    };
  }, [tokenData, tokenLoading, authUser, callId, isLoading]);

  if (isLoading || tokenLoading || isConnecting) return <PageLoader />;

  return (
    <div className="h-full w-full">
      {client && call ? (
        <StreamVideo client={client}>
          <StreamCall call={call}>
            <CallContent />
          </StreamCall>
        </StreamVideo>
      ) : (
        <div className="flex items-center justify-center h-full p-6 text-center">
          <p>
            {tokenError
              ? tokenQueryError?.response?.data?.message
              : "Could not initialize call. Please refresh or try again later."}
          </p>
        </div>
      )}
    </div>
  );
};

const CallContent = () => {
  const navigate = useNavigate();

  return (
    <StreamTheme className="h-full w-full">
      <SpeakerLayout />
      <CallControls onLeave={() => navigate("/")} />
    </StreamTheme>
  );
};

export default CallPage;
