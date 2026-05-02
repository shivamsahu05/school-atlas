export default function Footer() {
  return (
    <footer className="py-6 mt-auto border-t border-slate-100/80 bg-white/50 backdrop-blur-md">
      <div className="flex justify-center items-center px-6">
        <p className="text-[10px] font-bold text-brand-600/80 uppercase tracking-[0.2em] flex items-center gap-3 select-none">
          <span>© 2026 SAMS</span>
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500/30" />
          <span className="text-brand-700 hover:text-brand-900 transition-all duration-300 cursor-default">HackVitrasec</span>
        </p>
      </div>
    </footer>
  )
}
