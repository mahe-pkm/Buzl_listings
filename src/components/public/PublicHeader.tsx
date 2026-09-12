import Link from 'next/link';

export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#E1E4EA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="w-9 h-9 rounded-xl bg-[#004AAD] flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:bg-[#003C8A] transition-colors">
                B
              </span>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-[#1F242E] tracking-tight leading-none group-hover:text-[#004AAD] transition-colors">
                  Buzl<span className="text-[#004AAD]">.</span>
                </span>
                <span className="text-[10px] font-medium text-[#7D8795] tracking-wider uppercase">
                  Directory
                </span>
              </div>
            </Link>

            {/* Main Nav */}
            <nav className="hidden md:flex items-center space-x-1">
              <Link
                href="/#categories"
                className="px-3 py-2 text-sm font-medium text-[#5D6776] hover:text-[#1F242E] hover:bg-[#F2F5FA] rounded-lg transition-colors"
              >
                Categories
              </Link>
              <Link
                href="/#locations"
                className="px-3 py-2 text-sm font-medium text-[#5D6776] hover:text-[#1F242E] hover:bg-[#F2F5FA] rounded-lg transition-colors"
              >
                Cities
              </Link>
            </nav>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-3">
            <Link
              href="/search"
              className="p-2 text-[#5D6776] hover:text-[#1F242E] hover:bg-[#F2F5FA] rounded-lg transition-colors sm:hidden"
              aria-label="Search directory"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>

            <Link
              href="/search"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#5D6776] bg-[#F2F5FA] hover:bg-[#EAEFF7] border border-[#E1E4EA] rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 text-[#7D8795]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search directory...</span>
            </Link>

            <div className="h-5 w-px bg-[#E1E4EA] hidden sm:block" />

            <Link
              href="/login"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-[#004AAD] hover:bg-[#003C8A] rounded-lg transition-colors shadow-sm"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
