export default function Footer() {
  return (
    <footer className="border-t border-[#1E2328] bg-[#091220]/50 mt-auto">
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold font-serif text-[#C8AA6E] tracking-wide">LPP</span>
            <span className="text-[#786E4D] text-xs">League Press Poll</span>
          </div>
          <div className="flex items-center gap-6">
            <a 
              href="/pollsters" 
              className="text-[#A8B4BE] hover:text-[#C8AA6E] text-sm transition-colors"
            >
              Pollsters
            </a>
            <span className="text-[#786E4D] text-xs">
              © {new Date().getFullYear()} LPP
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}