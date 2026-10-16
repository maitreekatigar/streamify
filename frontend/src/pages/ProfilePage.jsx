import { useState } from "react";
import useAuthUser from "../hooks/useAuthUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfile, getLearningStreak, getUserFriends } from "../lib/api";
import { useQuery } from "@tanstack/react-query";
import { Flame, Trophy, Users } from "lucide-react";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();
  const { data: streak } = useQuery({ queryKey: ["learningStreak"], queryFn: getLearningStreak });
  const { data: friends = [] } = useQuery({ queryKey: ["friends"], queryFn: getUserFriends });

  const [name, setName] = useState(authUser?.fullName || "");
  const [bio, setBio] = useState(authUser?.bio || "");
  const [avatar, setAvatar] = useState(authUser?.profilePic || "");

  const { mutate: saveProfile, isPending } = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      toast.success("Profile updated");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Could not update profile");
    },
  });

  const handleAvatar = () => {
    const newAvatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(
      (name || "User") + Math.random()
    )}`;
    setAvatar(newAvatar);
  };

  const handleSave = (e) => {
    e.preventDefault();
    saveProfile({
      fullName: name,
      bio,
      profilePic: avatar,
    });
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">My Profile</h1>
      <p className="opacity-70 mb-6">Your language-learning identity and progress.</p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl bg-base-200 p-3 text-center"><Flame className="mx-auto text-orange-500"/><p className="text-xl font-bold">{streak?.currentStreak ?? 0}</p><p className="text-xs opacity-70">Current streak</p></div>
        <div className="rounded-xl bg-base-200 p-3 text-center"><Trophy className="mx-auto text-warning"/><p className="text-xl font-bold">{streak?.longestStreak ?? 0}</p><p className="text-xs opacity-70">Best streak</p></div>
        <div className="rounded-xl bg-base-200 p-3 text-center"><Users className="mx-auto text-primary"/><p className="text-xl font-bold">{friends.length}</p><p className="text-xs opacity-70">Friends</p></div>
      </div>
      <div className="rounded-xl border border-base-300 p-4 mb-6 space-y-1">
        <p><span className="font-semibold">Native language:</span> {authUser?.nativeLanguage || "Not set"}</p>
        <p><span className="font-semibold">Learning language:</span> {authUser?.learningLanguage || "Not set"}</p>
        <p><span className="font-semibold">Bio:</span> {bio || "Add a short introduction below."}</p>
      </div>

      <form onSubmit={handleSave}>
        <div className="text-center mb-4">
          <img src={avatar} alt="" className="w-24 h-24 rounded-full mx-auto" />
          <button type="button" className="btn btn-sm mt-2" onClick={handleAvatar}>
            Change Avatar
          </button>
        </div>

        <input
          type="text"
          className="input input-bordered w-full mb-3"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full Name"
          required
        />

        <textarea
          className="textarea textarea-bordered w-full mb-3"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Bio"
        />

        <button className="btn btn-primary w-full" type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

export default ProfilePage;
