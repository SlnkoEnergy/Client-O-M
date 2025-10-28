import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActiveDashboard = location.pathname === "/";
  const isActiveTrackStatus = location.pathname === "/ticket-status";
  return (
    <div className="w-full h-16 bg-[#1F487C] flex items-center justify-between px-4 sm:px-6 shadow-md top-0 relative">
      <div className="flex items-center gap-2 sm:gap-4">
        <img
          src="/assets/slnko_white_logo.png"
          alt="slnko logo"
          className="h-24 w-24 mt-3"
        />
      </div>    
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="sm:hidden text-white focus:outline-none"
        aria-label="Toggle Menu"
      >
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className="hidden sm:flex gap-8 items-center text-white">
        <div
          className={`flex items-center gap-1 cursor-pointer px-2 py-1 rounded-md transition ${
            isActiveDashboard ? "bg-white text-[#214b7b] font-medium" : ""
          }`}
          onClick={() => navigate("/")}
        >
          <span>Home</span>
        </div>

        <div
          className={`flex items-center gap-1 cursor-pointer px-2 py-1 rounded-md transition ${
            isActiveTrackStatus ? "bg-white text-[#214b7b] font-medium" : ""
          }`}
          onClick={() => navigate("/ticket-status")}
        >
          <span> Track Status </span>
        </div>
      </div>
      <div className="sm:hidden flex items-center gap-2 sm:gap-4"></div>

      {menuOpen && (
        <div className="sm:hidden bg-[#1F487C] border-t border-white/20 text-white font-medium">
          <div className="flex flex-col py-3 px-4 space-y-2">
            <button
              onClick={() => {
                navigate("/");
                setMenuOpen(false);
              }}
              className={`text-left px-3 py-2 rounded-md transition-all ${
                isActiveDashboard
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
              className={`text-left px-3 py-2 rounded-md transition-all ${
                isActiveTrackStatus
                  ? "bg-white text-[#214b7b]"
                  : "hover:bg-white/10"
              }`}
            >
              Track Status
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
