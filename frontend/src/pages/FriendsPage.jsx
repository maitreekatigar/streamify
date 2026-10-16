import { Users, UserPlus, MessageSquare, CheckCircleIcon, MapPinIcon } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  getFriendRequests,
  getRecommendedUsers,
  getOutgoingFriendReqs,
  getUserFriends,
  sendFriendRequest,
} from "../lib/api";
import { Link, useNavigate } from "react-router";
import { useSocket } from "../hooks/useSocket";
import { capitialize } from "../lib/utils";
import { getLanguageFlag } from "../lib/language";
import toast from "react-hot-toast";

const FriendsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [outgoingRequestsIds, setOutgoingRequestsIds] = useState(new Set());

  const { data: friends = [], isLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const { data: recommendedUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: getRecommendedUsers,
  });

  const { data: outgoingFriendReqs } = useQuery({
    queryKey: ["outgoingFriendReqs"],
    queryFn: getOutgoingFriendReqs,
  });

  const { data: friendRequests } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
  });

  const { mutate: sendRequestMutation, isPending } = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] }),
    onError: (error) => {
      toast.error(error.response?.data?.message || "Could not send friend request");
    },
  });

  const { onlineUsers } = useSocket();

  useEffect(() => {
    const outgoingIds = new Set();
    if (outgoingFriendReqs && outgoingFriendReqs.length > 0) {
      outgoingFriendReqs.forEach((req) => {
        if (req.recipient?._id) outgoingIds.add(req.recipient._id);
      });
    }
    setOutgoingRequestsIds(outgoingIds);
  }, [outgoingFriendReqs]);

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-base-content">Your Friends</h1>

        <Link to="/notifications" className="btn btn-outline btn-primary flex items-center gap-2">
          <UserPlus size={18} />
          Friend Requests
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : (
        <>
          {friends.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {friends.map((friend) => (
                <div
                  key={friend._id}
                  className="card bg-base-200 border border-base-300 shadow-sm hover:shadow-md transition"
                >
                  <div className="card-body items-center text-center">
                    <div className="relative">
                      <div className="avatar">
                        <div className="w-16 rounded-full">
                          <img src={friend.profilePic} alt={friend.fullName} />
                        </div>
                      </div>

                      {onlineUsers.includes(friend._id) && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-base-200 rounded-full"></span>
                      )}
                    </div>

                    <h2 className="card-title mt-2">{friend.fullName}</h2>

                    <p className="text-sm opacity-70">
                      {capitialize(friend.nativeLanguage)} → {capitialize(friend.learningLanguage)}
                    </p>

                    <div className="mt-3">
                      <button
                        className="btn btn-sm btn-primary flex items-center gap-2"
                        onClick={() => navigate(`/chat/${friend._id}`)}
                      >
                        <MessageSquare size={16} />
                        Message
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-base-200 rounded-xl p-6 text-center border border-base-300">
              <Users size={40} className="mx-auto mb-3 text-primary" />

              <h2 className="text-xl font-semibold text-base-content">No friends yet</h2>

              <p className="text-base-content/70 mt-2">
                Connect with language partners below to start practicing together!
              </p>
            </div>
          )}
        </>
      )}

      <div>
        <h2 className="text-2xl font-bold text-base-content mb-2">Meet New Learners</h2>

        <p className="text-base-content/70 mb-4">
          Discover perfect language exchange partners based on your profile
        </p>

        {loadingUsers ? (
          <div className="flex justify-center py-10">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : recommendedUsers.length === 0 ? (
          <div className="bg-base-200 rounded-xl p-6 text-center border border-base-300">
            <h3 className="text-lg font-semibold text-base-content">No recommendations available</h3>

            <p className="text-base-content/70 mt-2">Check back later for new language partners!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedUsers.map((user) => {
              const hasRequestBeenSent = outgoingRequestsIds.has(user._id);
              const incomingRequest = friendRequests?.incomingReqs?.find(
                (request) => request.sender?._id === user._id
              );

              return (
                <div
                  key={user._id}
                  className="card bg-base-200 border border-base-300 shadow-sm"
                >
                  <div className="card-body">
                    <div className="flex items-center gap-3">
                      <div className="avatar">
                        <div className="w-12 rounded-full">
                          <img src={user.profilePic} alt={user.fullName} />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold">{user.fullName}</h3>
                        {user.location && (
                          <p className="text-xs opacity-70 flex items-center gap-1">
                            <MapPinIcon className="size-3" />
                            {user.location}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      <span className="badge badge-secondary badge-sm">
                        {getLanguageFlag(user.nativeLanguage)}
                        Native: {capitialize(user.nativeLanguage)}
                      </span>
                      <span className="badge badge-outline badge-sm">
                        {getLanguageFlag(user.learningLanguage)}
                        Learning: {capitialize(user.learningLanguage)}
                      </span>
                    </div>

                    {incomingRequest ? (
                      <Link to="/notifications" className="btn btn-sm btn-secondary mt-3">
                        Respond to request
                      </Link>
                    ) : (
                      <button
                        className={`btn btn-sm mt-3 ${hasRequestBeenSent ? "btn-disabled" : "btn-primary"}`}
                        onClick={() => sendRequestMutation(user._id)}
                        disabled={hasRequestBeenSent || isPending}
                      >
                        {hasRequestBeenSent ? (
                          <>
                            <CheckCircleIcon className="size-4 mr-1" />
                            Request Sent
                          </>
                        ) : (
                          <>
                            <UserPlus className="size-4 mr-1" />
                            Send Friend Request
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsPage;
