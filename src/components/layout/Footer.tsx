import React from "react";
import { FaTwitter, FaFacebookF, FaInstagram } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-[#0d3b7c] text-white">
      <div className="w-full  mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Logo + blurb */}
          <div className="flex flex-col">
            <img
              src="/assets/slnko_white_logo.png"
              alt="SLNKO logo"
              className="h-45 w-45 "
            />
            
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-3 text-lg">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-gray-300">
                  Home
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-gray-300">
                  Complaints
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-gray-300">
                  Track Status
                </a>
              </li>
            </ul>
          </div>

          {/* Contact + Social */}
          <div>
            <h3 className="font-semibold mb-3 text-lg">Contact Us</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-gray-300">
                  1924 Street Name, City State 12345
                </a>
              </li>
              <li>
                <a href="tel:+917766391087" className="hover:text-gray-300">
                  📞 +91 7766 391087 / 3008
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@example.com"
                  className="hover:text-gray-300"
                >
                  ✉️ info@example.com
                </a>
              </li>
            </ul>

            {/* <div className="flex items-center gap-4 pt-5">
              <a href="#" className="hover:text-blue-300" aria-label="Twitter">
                <FaTwitter size={20} />
              </a>
              <a href="#" className="hover:text-blue-300" aria-label="Facebook">
                <FaFacebookF size={20} />
              </a>
              <a
                href="#"
                className="hover:text-blue-300"
                aria-label="Instagram"
              >
                <FaInstagram size={20} />
              </a>
            </div> */}
          </div>
        </div>

        <div className="mt-10 border-t border-white/30 pt-4 text-center text-xs sm:text-sm text-gray-200">
          © {new Date().getFullYear()} Your Company. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
