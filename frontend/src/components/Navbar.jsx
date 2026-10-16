import { Link } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { BellIcon, LogOutIcon, MenuIcon, ShipWheelIcon } from "lucide-react";
import ThemeSelector from "./ThemeSelector";
import useLogout from "../hooks/useLogout";

const Navbar = ({ onMenuClick }) => {
  const { authUser } = useAuthUser();
  const { logoutMutation } = useLogout();

  // ✅ DEFAULT AVATAR (MODERN)
  const fallbackAvatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(
    authUser?.fullName || "User"
  )}`;

  return (
    <nav className="bg-base-200 border-b border-base-300 sticky top-0 z-30 h-16 flex items-center backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between w-full">
          
          {/* 🔥 LOGO */}
          <div className="flex items-center gap-2.5">
            {onMenuClick && (
              <button
                type="button"
                className="btn btn-ghost btn-circle md:hidden"
                aria-label="Open menu"
                onClick={onMenuClick}
              >
                <MenuIcon className="h-6 w-6" />
              </button>
            )}
            <Link to="/" className="flex items-center gap-2.5">
              <ShipWheelIcon className="size-8 text-primary" />
              <span className="text-2xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
                Streamify
              </span>
            </Link>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-3 sm:gap-4">

            {/* 🔔 Notifications */}
            <Link to="/notifications">
              <button className="btn btn-ghost btn-circle hover:scale-110 transition tooltip" data-tip="Notifications">
                <BellIcon className="h-6 w-6 opacity-70" />
              </button>
            </Link>

            {/* 🎨 Theme */}
            <ThemeSelector />

            {/* 👤 Avatar */}
            <Link to="/profile" className="relative group tooltip" data-tip="My profile" aria-label="Open my profile">
              <div className="avatar">
                <div className="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 transition-all duration-300 group-hover:ring-2 group-hover:scale-105 shadow-md">
                  <img
                    src={authUser?.profilePic || fallbackAvatar}
                    alt="User Avatar"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.target.src = fallbackAvatar;
                    }}
                  />
                </div>
              </div>

              {/* 🟢 Online indicator */}
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-base-100 rounded-full shadow-sm"></span>
            </Link>

            {/* 🚪 Logout */}
            <button
              className="btn btn-ghost btn-circle hover:scale-110 transition tooltip"
              data-tip="Logout"
              onClick={logoutMutation}
            >
              <LogOutIcon className="h-6 w-6 opacity-70" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;