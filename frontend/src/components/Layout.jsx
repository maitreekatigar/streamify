import { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const Layout = ({ children, showSidebar = false, padded = true }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="h-full flex overflow-hidden">
      {showSidebar && (
        <>
          <div className="hidden md:block h-full shrink-0">
            <Sidebar />
          </div>

          {menuOpen && (
            <div className="md:hidden fixed inset-0 z-40 flex">
              <button
                type="button"
                className="absolute inset-0 bg-black/40"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              />
              <div className="relative h-full z-50">
                <Sidebar onNavigate={() => setMenuOpen(false)} />
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex-1 flex flex-col h-full min-w-0">
        <Navbar onMenuClick={showSidebar ? () => setMenuOpen(true) : undefined} />

        <main className={`flex-1 min-h-0 ${padded ? "overflow-y-auto p-4" : "overflow-hidden"}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
