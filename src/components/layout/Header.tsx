import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActiveDashboard = location.pathname === "/";
  const isActiveTrackStatus = location.pathname === "/ticket-status";

  // Prevent background scroll when menu is open (mobile)
  useEffect(() => {
    if (menuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50">
      {/* Header bar */}
      <div className="relative w-full h-16 bg-[#1F487C] flex items-center justify-between px-4 sm:px-6 shadow-md">
        <div className="flex items-center gap-2 sm:gap-4">
          <img
            src="/assets/slnko_white_logo.png"
            alt="slnko logo"
            className="h-24 w-24 "
          />
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="sm:hidden text-white focus:outline-none"
          aria-label="Toggle Menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Desktop nav */}
        <nav className="hidden sm:flex gap-8 items-center text-white">
          <button
            className={`flex items-center gap-1 cursor-pointer px-2 py-1 rounded-md transition ${isActiveDashboard ? "bg-white text-[#214b7b] font-medium" : ""
              }`}
            onClick={() => navigate("/")}
          >
            <span>Home</span>
          </button>

          <button
            className={`flex items-center gap-1 cursor-pointer px-2 py-1 rounded-md transition ${isActiveTrackStatus ? "bg-white text-[#214b7b] font-medium" : ""
              }`}
            onClick={() => navigate("/ticket-status")}
          >
            <span>Track Status</span>
          </button>
        </nav>

        {/* Mobile menu (anchored directly under header) */}
        {menuOpen && (
          <>
            {/* Click-away overlay */}
            <div
              className="fixed inset-0 z-40 bg-black/30 sm:hidden"
              onClick={() => setMenuOpen(false)}
            />

            <nav
              id="mobile-menu"
              className="absolute left-0 top-full w-full z-50 sm:hidden bg-[#1F487C] border-t border-white/20 text-white font-medium shadow-lg"
            >
              <div className="flex flex-col py-3 px-4 space-y-2">
                <button
                  onClick={() => {
                    navigate("/");
                    setMenuOpen(false);
                  }}
                  className={`text-left px-3 py-2 rounded-md transition-all ${isActiveDashboard
                    ? "bg-white text-[#214b7b]"
                    : "hover:bg-white/10"
                    }`}
                >
                  Home
                </button>
                <button
                  onClick={() => {
                    navigate("/ticket-status");
                    setMenuOpen(false);
                  }}
                  className={`text-left px-3 py-2 rounded-md transition-all ${isActiveTrackStatus
                    ? "bg-white text-[#214b7b]"
                    : "hover:bg-white/10"
                    }`}
                >
                  Track Status
                </button>
              </div>
            </nav>
          </>
        )}
      </div>
    </header>
  );
}
