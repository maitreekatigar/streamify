import { Link, useLocation, useNavigate } from "react-router";
import { Home, Users, Bell, User, LogOut, Trophy, Languages, Star, Newspaper } from "lucide-react";
import { useState } from "react";
import useAuthUser from "../hooks/useAuthUser";
import { useSocket } from "../hooks/useSocket";
import { useQuery } from "@tanstack/react-query";
import { getUserFriends } from "../lib/api";
import useLogout from "../hooks/useLogout";

const Sidebar = ({ onNavigate }) => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const navigate = useNavigate();
  const { logoutMutation } = useLogout();

  const [open, setOpen] = useState(false);

  const { onlineUsers } = useSocket();

  const { data: friends = [] } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const onlineFriends = friends.filter((f) =>
    onlineUsers.includes(f._id)
  );

  return (
    <aside className="w-64 h-full bg-base-100 border-r border-base-300 flex flex-col justify-between p-4">

      {/* TOP SECTION */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Streamify</h2>

        {/* NAVIGATION */}
        <div className="space-y-2">
          <Link
            to="/"
            onClick={onNavigate}
            className={`flex items-center gap-3 p-2 rounded-lg transition ${
              location.pathname === "/" ? "bg-primary text-white shadow" : "hover:bg-base-200"
            }`}
          >
            <Home size={18} />
            Home
          </Link>

          <Link
            to="/friends"
            onClick={onNavigate}
            className={`flex items-center gap-3 p-2 rounded-lg transition ${
              location.pathname === "/friends" ? "bg-primary text-white shadow" : "hover:bg-base-200"
            }`}
          >
            <Users size={18} />
            Friends
          </Link>

          <Link to="/leaderboard" onClick={onNavigate} className={`flex items-center gap-3 p-2 rounded-lg transition ${location.pathname === "/leaderboard" ? "bg-primary text-white shadow" : "hover:bg-base-200"}`}>
            <Trophy size={18} /> Streak Leaderboard
          </Link>
          <Link to="/translator" onClick={onNavigate} className={`flex items-center gap-3 p-2 rounded-lg transition ${location.pathname === "/translator" ? "bg-primary text-white shadow" : "hover:bg-base-200"}`}>
            <Languages size={18} /> Translator
          </Link>
          <Link to="/daily-quiz" onClick={onNavigate} className={`flex items-center gap-3 p-2 rounded-lg transition ${location.pathname === "/daily-quiz" ? "bg-primary text-white shadow" : "hover:bg-base-200"}`}>
            <Star size={18} /> Daily Charm Quiz
          </Link>
          <Link to="/literature-news" onClick={onNavigate} className={`flex items-center gap-3 p-2 rounded-lg transition ${location.pathname === "/literature-news" ? "bg-primary text-white shadow" : "hover:bg-base-200"}`}>
            <Newspaper size={18} /> Literature & News
          </Link>

          <Link
            to="/notifications"
            onClick={onNavigate}
            className={`flex items-center gap-3 p-2 rounded-lg transition ${
              location.pathname === "/notifications" ? "bg-primary text-white shadow" : "hover:bg-base-200"
            }`}
          >
            <Bell size={18} />
            Notifications
          </Link>
        </div>

        {/* ONLINE USERS */}
        <div className="mt-6">
          <h3 className="text-sm opacity-60 mb-2">Online Users</h3>

          {onlineFriends.length > 0 ? (
            <div className="space-y-2">
              {onlineFriends.map((user) => (
                <Link
                  key={user._id}
                  to={`/chat/${user._id}`}
                  onClick={onNavigate}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-base-200 transition"
                >
                  <div className="relative">
                    <img
                      src={user.profilePic}
                      className="w-8 h-8 rounded-full"
                    />

                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-base-100 rounded-full"></span>
                  </div>

                  <span className="text-sm">{user.fullName}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm opacity-60">No one online</p>
          )}
        </div>
      </div>

      {/* BOTTOM USER */}
      <div className="relative">
        <div
          className="flex items-center gap-3 p-2 border-t border-base-300 cursor-pointer hover:bg-base-200 rounded-lg"
          onClick={() => setOpen(!open)}
        >
          <img
            src={authUser?.profilePic}
            className="w-8 h-8 rounded-full"
          />
          <span>{authUser?.fullName}</span>
        </div>

        {open && (
          <div className="absolute bottom-12 left-0 w-48 bg-base-200 border border-base-300 rounded-lg shadow-lg p-2">

            {/* MANAGE ACCOUNT */}
            <button
              className="w-full flex items-center gap-2 p-2 hover:bg-base-300 rounded transition"
              onClick={() => {
                navigate("/profile");
                setOpen(false);
                onNavigate?.();
              }}
            >
              <User size={16} />
              Manage Account
            </button>

            {/* LOGOUT */}
            <button
              className="w-full flex items-center gap-2 p-2 hover:bg-base-300 rounded transition"
              onClick={() => {
                logoutMutation();
                onNavigate?.();
              }}
            >
              <LogOut size={16} />
              Logout
            </button>

          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;