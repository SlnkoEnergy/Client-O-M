
export default function Footer() {
  return (
    <footer className="bg-[#0d3b7c] text-white">
      <div className="w-full px-2 sm:px-6 lg:px-8 py-4">
        <div className="p-0 m-0 grid grid-cols-1 lg:grid-cols-3 gap-3  sm:text-center  ">
          {/* Logo Section */}
          <div className="flex justify-center lg:justify-start items-center">
            <img
              src="/assets/slnko_white_logo.png"
              alt="SLNKO LOGO"
              className="h-20 w-20 sm:h-28 sm:w-28"
            />
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-3 text-lg">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="hover:text-gray-300">Home</a></li>
              <li><a href="/ticket-status" className="hover:text-gray-300">Track Status</a></li>
            </ul>
          </div>

          {/* Contact Us */}
          <div className="flex flex-col lg:items-end ">
            <h3 className="font-semibold mb-3 text-lg lg:pr-16">Contact Us</h3>
            <ul className="space-y-2 text-sm">
              <li>2nd Floor, B58B, Block B, Sector 60,</li>
              <li>Noida, Uttar Pradesh 201309</li>
              <li>
                <a href="mailto:info@slnkoenergy.com" className="hover:text-gray-300">
                  ✉️ info@slnkoenergy.com
                </a>
              </li>
            </ul>
          </div>
        </div>


        <div className="mt-5 border-t border-white/30 pt-2 text-center text-xs sm:text-sm text-gray-200">
          © {new Date().getFullYear()} SLnko Energy. All Rights Reserved.
        </div>
      </div>
    </footer>

  );
}
