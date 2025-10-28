import { useLocation, useNavigate } from "react-router-dom";

export default function Header() {

    const location = useLocation();
    const navigate = useNavigate();


    const isActiveDashboard = location.pathname === '/'
    const isActiveTrackStatus = location.pathname === '/ticket-status';
    const isActiveHelp = location.pathname === '/help';
    return (

        <div className="w-full h-16 bg-[#1F487C] flex items-center justify-between px-4 sm:px-6 shadow-md top-0 relative">
            <div className="flex items-center gap-2 sm:gap-4">
                <img
                    src="/assets/slnko_white_logo.png"
                    alt="slnko logo"
                    className="h-24 w-24 mt-3"
                />
            </div>

            <div className="hidden sm:flex gap-8 items-center text-white">
                <div className={`flex items-center gap-1 cursor-pointer px-2 py-1 rounded-md transition ${isActiveDashboard ? "bg-white text-[#214b7b] font-medium" : ""}`}
                    onClick={() => navigate("/")}
                >
                    <span>Home</span>
                </div>

                <div className={`flex items-center gap-1 cursor-pointer px-2 py-1 rounded-md transition ${isActiveTrackStatus ? "bg-white text-[#214b7b] font-medium" : ""}`}
                    onClick={() => navigate('/ticket-status')}
                >
                    <span> Track Status </span>
                </div>

                <div className={`flex items-center gap-1 cursor-pointer px-2 py-1 rounded-md transition ${isActiveHelp ? "bg-white text-[#214b7b] font-medium" : ""}`}
                    onClick={() => navigate('/help')}
                >
                    <span> Help </span>
                </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">

            </div>

        </div>
    );
}