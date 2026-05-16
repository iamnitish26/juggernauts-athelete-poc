import Link from "next/link";
import BrandLogo from "@/components/brand/BrandLogo";

export default function Footer() {
  return (
    <footer className="bg-[#3B0764] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="mb-3">
              <BrandLogo variant="light" size="md" />
            </div>
            <p className="text-purple-100 text-sm font-semibold mb-1">
              Juggernauts Athlete ID
            </p>
            <p className="text-purple-300 text-xs mb-3">
              An initiative by Juggernauts Sporting Foundation (JSF).
            </p>
            <p className="text-purple-200 text-sm leading-relaxed">
              Empowering grassroots sports talent in Odisha. A Section 8 registered
              sports organisation building the future of sports in India.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-purple-100 mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm text-purple-200">
              <li>
                <Link href="/events" className="hover:text-white transition-colors">
                  View Events
                </Link>
              </li>
              <li>
                <Link href="/athlete/register" className="hover:text-white transition-colors">
                  Register as Athlete
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="hover:text-white transition-colors">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-purple-100 mb-3">About</h4>
            <ul className="space-y-2 text-sm text-purple-200">
              <li>
                <a
                  href="https://juggernauts.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Juggernauts Sporting Foundation Website
                </a>
              </li>
              <li>
                <span>Bhubaneswar, Odisha, India</span>
              </li>
              <li>
                <span className="text-purple-300">Section 8 Registered NGO</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-purple-700 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-xs text-purple-300">
            © {new Date().getFullYear()} Juggernauts Sporting Foundation. All rights reserved.
          </p>
          <p className="text-xs text-purple-400">
            Built for grassroots athletes of Odisha
          </p>
        </div>
      </div>
    </footer>
  );
}
