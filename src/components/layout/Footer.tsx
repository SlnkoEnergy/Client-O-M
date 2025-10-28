import React from "react";
import {
    FaTwitter,
    FaFacebookF,
    FaInstagram,
} from "react-icons/fa";

export default function Footer() {
    return (
        <footer className="bg-[#0d3b7c] text-white py-10 px-6 md:px-16">
            <div className=" mx-auto flex flex-wrap justify-between gap-8">

                {/* Left Section - Logo + Address */}
                <div className="w-full sm:w-auto flex-1 ">
                    <img
                        src="/assets/slnko_white_logo.png"
                        alt="slnko logo"
                        className="h-34 w-34 mt-3"
                    />

                </div>

                <div className="w-full sm:w-auto flex-1 min-w-[150px]">
                    <h3 className="font-semibold mb-2 text-lg">Quick Links</h3>
                    <ul className="space-y-1">
                        <li><a href="#" className="hover:text-gray-300">Home</a></li>
                        <li><a href="#" className="hover:text-gray-300">Complaints</a></li>
                        <li><a href="#" className="hover:text-gray-300">Track Status</a></li>
                    </ul>

                </div>

                <div className="w-full sm:w-auto flex-1 min-w-[150px]">
                    <h3 className="font-semibold mb-2 text-lg">Contact Us</h3>
                    <ul className="space-y-1">
                        <li><a href="#" className="hover:text-gray-300">1924 Street Name, City State 12345</a></li>
                        <li><a href="#" className="hover:text-gray-300">📞 +91 7766 391087 / 3008</a></li>
                        <li><a href="#" className="hover:text-gray-300">✉️ info@example.com</a></li>
                    </ul>
                    <div className="flex space-x-4 pl-56 pt-5">
                        <a href="#" className="hover:text-blue-300">
                            <FaTwitter size={20} />
                        </a>
                        <a href="#" className="hover:text-blue-300">
                            <FaFacebookF size={20} />
                        </a>
                        <a href="#" className="hover:text-blue-300">
                            <FaInstagram size={20} />
                        </a>
                    </div>
                </div>
            </div>

            <div className="mt-8 border-t border-white/30 pt-4 text-center text-sm text-gray-200">
                © {new Date().getFullYear()} Your Company. All Rights Reserved.
            </div>
        </footer>
    );
}
