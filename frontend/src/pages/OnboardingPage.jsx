import { useState, useEffect } from "react";
import useAuthUser from "../hooks/useAuthUser";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { completeOnboarding } from "../lib/api";
import {
  LoaderIcon,
  MapPinIcon,
  ShipWheelIcon,
  ShuffleIcon,
  CameraIcon,
} from "lucide-react";
import { LANGUAGES } from "../constants";

const OnboardingPage = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();

  const [formState, setFormState] = useState({
    fullName: authUser?.fullName || "",
    bio: authUser?.bio || "",
    nativeLanguage: authUser?.nativeLanguage || "",
    learningLanguage: authUser?.learningLanguage || "",
    location: authUser?.location || "",
    profilePic: authUser?.profilePic || "",
  });

  // ✅ DEFAULT AVATAR (MODERN STYLE)
  useEffect(() => {
    if (formState.profilePic || !authUser?.fullName) return;

    const defaultAvatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(
      authUser.fullName
    )}`;

    setFormState((prev) => ({
      ...prev,
      profilePic: prev.profilePic || defaultAvatar,
    }));
  }, [authUser?.fullName, formState.profilePic]);

  const { mutate: onboardingMutation, isPending } = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      toast.success("Profile onboarded successfully 🚀");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Something went wrong");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onboardingMutation(formState);
  };

  // ✅ RANDOM AVATAR (BETTER LOOKING)
  const handleRandomAvatar = () => {
    const name = formState.fullName || "User";

    const avatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(
      name + Math.random()
    )}`;

    setFormState((prev) => ({
      ...prev,
      profilePic: avatar,
    }));

    toast.success("New avatar generated 😎");
  };

  return (
    <div className="h-full overflow-y-auto bg-base-100 p-4">
      <div className="min-h-full flex items-center justify-center">
      <div className="card bg-base-200 w-full max-w-3xl shadow-xl">
        <div className="card-body p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-center mb-6">
            Complete Your Profile
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* AVATAR */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="size-32 rounded-full overflow-hidden border-4 border-primary shadow-lg">
                  {formState.profilePic ? (
                    <img
                      src={formState.profilePic}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${
                          formState.fullName || "User"
                        }`;
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-base-300">
                      <CameraIcon className="size-12 opacity-40" />
                    </div>
                  )}
                </div>

                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full border-2 border-primary opacity-30 blur-md"></div>
              </div>

              <button
                type="button"
                onClick={handleRandomAvatar}
                className="btn btn-accent"
              >
                <ShuffleIcon className="size-4 mr-2" />
                Generate Random Avatar
              </button>
            </div>

            {/* FULL NAME */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Full Name</span>
              </label>
              <input
                type="text"
                value={formState.fullName}
                onChange={(e) =>
                  setFormState({ ...formState, fullName: e.target.value })
                }
                className="input input-bordered w-full"
                placeholder="Your full name"
                required
              />
            </div>

            {/* BIO */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Bio</span>
              </label>
              <textarea
                value={formState.bio}
                onChange={(e) =>
                  setFormState({ ...formState, bio: e.target.value })
                }
                className="textarea textarea-bordered h-24"
                placeholder="Tell others about yourself"
                required
              />
            </div>

            {/* LANGUAGES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={formState.nativeLanguage}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    nativeLanguage: e.target.value,
                  })
                }
                className="select select-bordered"
                required
              >
                <option value="">Native Language</option>
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang.toLowerCase()}>
                    {lang}
                  </option>
                ))}
              </select>

              <select
                value={formState.learningLanguage}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    learningLanguage: e.target.value,
                  })
                }
                className="select select-bordered"
                required
              >
                <option value="">Learning Language</option>
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang.toLowerCase()}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* LOCATION */}
            <div className="form-control relative">
              <MapPinIcon className="absolute left-3 top-3 size-5 opacity-60" />
              <input
                type="text"
                value={formState.location}
                onChange={(e) =>
                  setFormState({ ...formState, location: e.target.value })
                }
                className="input input-bordered w-full pl-10"
                placeholder="City, Country"
                required
              />
            </div>

            {/* SUBMIT */}
            <button className="btn btn-primary w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <LoaderIcon className="animate-spin mr-2" />
                  Onboarding...
                </>
              ) : (
                <>
                  <ShipWheelIcon className="mr-2" />
                  Complete Onboarding
                </>
              )}
            </button>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
};

export default OnboardingPage;