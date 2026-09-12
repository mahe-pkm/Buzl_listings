import Link from 'next/link';

export default function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#1F242E] text-white border-t border-[#313846] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-lg bg-[#004AAD] flex items-center justify-center text-white font-bold text-base">
                B
              </span>
              <span className="text-xl font-bold text-white tracking-tight">
                Buzl<span className="text-[#3B82F6]">.</span> Directory
              </span>
            </Link>
            <p className="text-sm text-[#9FA8B7] max-w-md leading-relaxed">
              Find verified local businesses, specialized services, and trusted service providers across India. Designed for speed, privacy, and accurate local discovery.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-[#7D8795]">
              <span className="inline-block w-2 h-2 rounded-full bg-[#10B981]" />
              <span>Verified directory records • Strict location privacy protected</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9FA8B7] mb-3">
              Directory Navigation
            </h3>
            <ul className="space-y-2 text-sm text-[#CBD5E1]">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/search" className="hover:text-white transition-colors">
                  Search Businesses
                </Link>
              </li>
              <li>
                <Link href="/#categories" className="hover:text-white transition-colors">
                  Browse Categories
                </Link>
              </li>
              <li>
                <Link href="/#locations" className="hover:text-white transition-colors">
                  Browse Cities
                </Link>
              </li>
            </ul>
          </div>

          {/* Business & Operations */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9FA8B7] mb-3">
              For Businesses
            </h3>
            <ul className="space-y-2 text-sm text-[#CBD5E1]">
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Business Owner Login
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Internal Buzl Access
                </Link>
              </li>
              <li>
                <span className="text-xs text-[#7D8795] block mt-4">
                  Privacy Invariant: Service-area coordinates and residential addresses are permanently protected.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#313846] flex flex-col sm:flex-row items-center justify-between text-xs text-[#7D8795] gap-4">
          <p>© {currentYear} Buzl Listing. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Verified Local Business Index</span>
            <span>•</span>
            <span>Safe Public Projections</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
