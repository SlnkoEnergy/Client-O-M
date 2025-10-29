
export default function Footer() {
  return (
    <footer className="bg-[#0d3b7c] text-white">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="">
          {/* Logo + tagline */}
          <div className="order-1 flex flex-col items-center sm:items-start">
            <img
              src="/assets/slnko_white_logo.png"
              alt="SLNKO logo"
              className="h-20 w-20 sm:h-28 sm:w-28 mb-2"
            />
            <p className="text-xs text-gray-200">The Next Level Engineering</p>
          </div>
          <div className="order-2 lg:order-3 flex  justify-end text-center">
            <ul className="space-y-2 text-sm">
              <li className="font-semibold mb-3 text-lg">Contact Us</li>
              <li>2nd Floor, B58B, Block B, Sector 60,</li>
              <li>Noida, Uttar Pradesh 201309</li>
              <li>
                <a href="mailto:info@slnkoenergy.com" className="hover:text-gray-300">
                  ✉️ info@slnkoenergy.com
                </a>
              </li>
            </ul>
          </div>
          {/* Quick Links */}
          <div className="order-3 lg:order-2">
            <h3 className="font-semibold mb-3 text-lg">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="hover:text-gray-300">Home</a></li>
              <li><a href="/ticket-status" className="hover:text-gray-300">Track Status</a></li>
            </ul>
          </div>

          {/* Contact Us */}

        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-white/30 pt-4 text-center text-xs sm:text-sm text-gray-200">
          © {new Date().getFullYear()} SLnko Energy. All Rights Reserved.
        </div>
      </div>
    </footer>


  );
}
