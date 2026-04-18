import { Link } from 'react-router-dom'
import {
  GraduationCap, BookOpen, BarChart2, Users, Shield, Star, Award,
  ChevronRight, Phone, Mail, MapPin, Menu, X,
  CheckCircle, ArrowRight, TrendingUp, Brain, Calendar, ClipboardList,
} from 'lucide-react'
import { useState } from 'react'

/* ── Reusable Section ─────────────────────────────────────────── */
function Section({ id, className = '', children }) {
  return <section id={id} className={className}>{children}</section>
}

export default function Landing() {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 gradient-brand rounded-xl flex items-center justify-center">
                <GraduationCap size={20} className="text-white" />
              </div>
              <div>
                <span className="font-bold text-slate-800 text-sm">SAMS</span>
                <span className="text-slate-400 text-xs ml-1">by ATLAS</span>
              </div>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
<<<<<<< HEAD
              {['About', 'Features', 'Dashboard', 'Testimonials', 'Contact'].map(s => (
                <a key={s} href={`#${s.toLowerCase()}`}
                  className="hover:text-brand-600 transition-colors">{s}</a>
=======
              {['About','Features','Dashboard','Testimonials','Contact'].map(s => (
                <a key={s} href={`#${s.toLowerCase()}`}
                   className="hover:text-brand-600 transition-colors">{s}</a>
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link to="/login" className="btn-outline btn text-sm">Sign In</Link>
<<<<<<< HEAD
              <Link to="/login" className="btn-primary btn text-sm">Get Started <ArrowRight size={14} /></Link>
            </div>

            <button onClick={() => setNavOpen(v => !v)} className="md:hidden p-2 rounded-xl hover:bg-slate-100">
              {navOpen ? <X size={20} /> : <Menu size={20} />}
=======
              <Link to="/login" className="btn-primary btn text-sm">Get Started <ArrowRight size={14}/></Link>
            </div>

            <button onClick={() => setNavOpen(v => !v)} className="md:hidden p-2 rounded-xl hover:bg-slate-100">
              {navOpen ? <X size={20}/> : <Menu size={20}/>}
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
            </button>
          </div>

          {navOpen && (
            <div className="md:hidden py-4 border-t border-slate-100 space-y-2">
<<<<<<< HEAD
              {['About', 'Features', 'Testimonials', 'Contact'].map(s => (
                <a key={s} href={`#${s.toLowerCase()}`} onClick={() => setNavOpen(false)}
                  className="block px-3 py-2 rounded-lg hover:bg-slate-50 text-sm text-slate-600">{s}</a>
=======
              {['About','Features','Testimonials','Contact'].map(s => (
                <a key={s} href={`#${s.toLowerCase()}`} onClick={() => setNavOpen(false)}
                   className="block px-3 py-2 rounded-lg hover:bg-slate-50 text-sm text-slate-600">{s}</a>
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
              ))}
              <div className="pt-2 flex gap-2">
                <Link to="/login" className="btn-outline btn btn-sm flex-1 justify-center" onClick={() => setNavOpen(false)}>Sign In</Link>
                <Link to="/login" className="btn-primary btn btn-sm flex-1 justify-center" onClick={() => setNavOpen(false)}>Portal</Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <Section id="hero" className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 gradient-brand opacity-[0.97]" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,.06) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,.08) 0%, transparent 50%)',
        }} />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28 lg:pt-28 lg:pb-36">
<<<<<<< HEAD
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6">
                <Star size={13} className="text-amber-400 fill-amber-400" />
                <span className="text-white/90 text-xs font-medium">ATLAS – Academic Tracking & Learning Analytics</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white leading-tight mb-6 text-balance">
                Transform How Your School Manages{' '}
                <em className="not-italic text-amber-300">Academic Excellence</em>
              </h1>
              <p className="text-white/75 text-lg leading-relaxed mb-10 max-w-xl">
                SAMS empowers teachers and principals with real-time insights into syllabus coverage,
                student learning outcomes, homework compliance, and teacher performance — all in one platform.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link to="/login" className="inline-flex items-center gap-2 bg-white text-brand-700 font-semibold px-6 py-3 rounded-2xl hover:bg-slate-50 transition shadow-lg shadow-black/10 text-sm">
                  <GraduationCap size={18} /> Enter Portal <ChevronRight size={16} />
                </Link>
                <a href="#features" className="inline-flex items-center gap-2 glass text-white font-medium px-6 py-3 rounded-2xl hover:bg-white/15 transition text-sm">
                  Explore Features
                </a>
              </div>

              {/* Stats bar */}
              <div className="flex flex-wrap gap-8 mt-14">
                {[['620+', 'Students'], ['25', 'Teachers'], ['18', 'Classes'], ['99%', 'Uptime']].map(([v, l]) => (
                  <div key={l}>
                    <p className="text-2xl font-bold text-white">{v}</p>
                    <p className="text-white/60 text-xs mt-0.5">{l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side Hero Graphic */}
            <div className="hidden lg:block relative z-10 w-full pointer-events-none">
              {/* Decorative backgrounds */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-brand-400/30 rounded-full blur-3xl" />
              <div className="absolute top-1/4 right-0 w-60 h-60 bg-emerald-400/20 rounded-full blur-3xl" />
              
              {/* Floating UI Elements */}
              <div className="relative w-full aspect-square max-w-lg mx-auto pointer-events-auto">
                {/* Main Card */}
                <div className="absolute inset-0 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-6 shadow-2xl flex flex-col justify-between transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex gap-2">
                       <div className="w-3 h-3 rounded-full bg-rose-400/80" />
                       <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                       <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                    </div>
                    <div className="text-white/50 text-xs font-semibold px-3 py-1 bg-white/5 rounded-full">SAMS Performance</div>
                  </div>
                  
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white"><BookOpen size={18} /></div>
                        <div><p className="text-sm font-bold text-white">Math Syllabus</p><p className="text-xs text-white/50">Grade 10-A</p></div>
                      </div>
                      <div className="text-right"><p className="text-lg font-bold text-emerald-400">85%</p><p className="text-[10px] text-white/50">Completed</p></div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white"><ClipboardList size={18} /></div>
                        <div><p className="text-sm font-bold text-white">Science HW</p><p className="text-xs text-white/50">Missing Submissions</p></div>
                      </div>
                      <div className="text-right"><p className="text-lg font-bold text-rose-400">3</p><p className="text-[10px] text-white/50">Action Req.</p></div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white"><Brain size={18} /></div>
                        <div><p className="text-sm font-bold text-white">Avg LO Score</p><p className="text-xs text-white/50">School-wide</p></div>
                      </div>
                      <div className="text-right"><p className="text-lg font-bold text-amber-400">A-</p><p className="text-[10px] text-white/50">Outstanding</p></div>
                    </div>
                  </div>
                </div>
                
                {/* Overlapping small card element */}
                <div className="absolute -bottom-6 -left-8 bg-slate-900 border border-slate-700/50 rounded-2xl p-5 shadow-2xl shadow-slate-900/50 transform rotate-3 z-20 w-48 hover:-rotate-1 transition-transform">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center"><CheckCircle size={14} className="text-white" /></div>
                    <p className="text-white text-xs font-bold leading-tight">Sync<br/>Complete</p>
                  </div>
                  <p className="text-slate-400 text-[10px] mt-2">All daily parameters logged.</p>
                </div>
                
                <div className="absolute -top-8 -right-6 bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 rounded-2xl p-4 shadow-2xl transform rotate-[10deg] animate-pulse z-20 hover:scale-105 transition-transform cursor-default">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={24} className="text-emerald-400" />
                    <div>
                      <p className="text-white font-bold text-sm">+24%</p>
                      <p className="text-emerald-200/70 text-[10px]">Efficiency</p>
                    </div>
                  </div>
                </div>
              </div>
=======
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6">
              <Star size={13} className="text-amber-400 fill-amber-400" />
              <span className="text-white/90 text-xs font-medium">ATLAS – Academic Tracking & Learning Analytics</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-white leading-tight mb-6 text-balance">
              Transform How Your School Manages{' '}
              <em className="not-italic text-amber-300">Academic Excellence</em>
            </h1>
            <p className="text-white/75 text-lg leading-relaxed mb-10 max-w-2xl">
              SAMS empowers teachers and principals with real-time insights into syllabus coverage, 
              student learning outcomes, homework compliance, and teacher performance — all in one platform.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/login" className="inline-flex items-center gap-2 bg-white text-brand-700 font-semibold px-6 py-3 rounded-2xl hover:bg-slate-50 transition shadow-lg shadow-black/10 text-sm">
                <GraduationCap size={18} /> Enter Portal <ChevronRight size={16}/>
              </Link>
              <a href="#features" className="inline-flex items-center gap-2 glass text-white font-medium px-6 py-3 rounded-2xl hover:bg-white/15 transition text-sm">
                Explore Features
              </a>
            </div>

            {/* Stats bar */}
            <div className="flex flex-wrap gap-8 mt-14">
              {[['620+','Students'],['25','Teachers'],['18','Classes'],['99%','Uptime']].map(([v,l]) => (
                <div key={l}>
                  <p className="text-2xl font-bold text-white">{v}</p>
                  <p className="text-white/60 text-xs mt-0.5">{l}</p>
                </div>
              ))}
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-12">
<<<<<<< HEAD
            <path d="M0,60 L1440,60 L1440,20 Q720,60 0,20 Z" fill="white" />
=======
            <path d="M0,60 L1440,60 L1440,20 Q720,60 0,20 Z" fill="white"/>
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
          </svg>
        </div>
      </Section>

      {/* ── ABOUT ────────────────────────────────────────────────────────── */}
      <Section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-brand-600 font-semibold text-sm uppercase tracking-wider mb-3">About the School</p>
              <h2 className="font-display text-3xl lg:text-4xl text-slate-800 mb-6 leading-tight">
                Committed to Academic Excellence Since 1985
              </h2>
              <p className="text-slate-500 leading-relaxed mb-6">
<<<<<<< HEAD
                Our institution has been a beacon of quality education for nearly four decades.
                With a dedicated faculty, rigorous curriculum, and a nurturing environment, we shape
                students into confident, capable individuals ready to meet the challenges of tomorrow.
              </p>
              <p className="text-slate-500 leading-relaxed mb-8">
                SAMS (School Academic Management System) — powered by the ATLAS framework —
                brings our internal academic processes into the digital age, giving teachers
                and administrators unprecedented visibility into every aspect of academic delivery.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  ['NAAC Grade A+', 'Accreditation'],
                  ['38 Years', 'Established'],
                  ['12,000+', 'Alumni'],
                  ['Award-winning', 'Faculty'],
=======
                Our institution has been a beacon of quality education for nearly four decades. 
                With a dedicated faculty, rigorous curriculum, and a nurturing environment, we shape 
                students into confident, capable individuals ready to meet the challenges of tomorrow.
              </p>
              <p className="text-slate-500 leading-relaxed mb-8">
                SAMS (School Academic Management System) — powered by the ATLAS framework — 
                brings our internal academic processes into the digital age, giving teachers 
                and administrators unprecedented visibility into every aspect of academic delivery.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['NAAC Grade A+','Accreditation'],
                  ['38 Years','Established'],
                  ['12,000+','Alumni'],
                  ['Award-winning','Faculty'],
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
                ].map(([val, label]) => (
                  <div key={label} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="font-bold text-slate-800">{val}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 gradient-brand rounded-3xl opacity-10 blur-2xl" />
<<<<<<< HEAD
              <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: Users, label: '620+ Students', color: 'blue' },
                  { icon: GraduationCap, label: '25 Expert Teachers', color: 'green' },
                  { icon: BookOpen, label: '18 Smart Classes', color: 'amber' },
                  { icon: Award, label: 'State Rank Toppers', color: 'purple' },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label} className="card p-5 flex flex-col items-center text-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center
                      ${color === 'blue' ? 'bg-brand-50 text-brand-600' : color === 'green' ? 'bg-emerald-50 text-emerald-600' : color === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-purple-50 text-purple-600'}`}>
=======
              <div className="relative grid grid-cols-2 gap-4">
                {[
                  { icon: Users,       label:'620+ Students',      color:'blue'   },
                  { icon: GraduationCap,label:'25 Expert Teachers', color:'green'  },
                  { icon: BookOpen,    label:'18 Smart Classes',    color:'amber'  },
                  { icon: Award,       label:'State Rank Toppers',  color:'purple' },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label} className="card p-5 flex flex-col items-center text-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center
                      ${color==='blue'?'bg-brand-50 text-brand-600':color==='green'?'bg-emerald-50 text-emerald-600':color==='amber'?'bg-amber-50 text-amber-600':'bg-purple-50 text-purple-600'}`}>
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
                      <Icon size={22} />
                    </div>
                    <p className="text-sm font-medium text-slate-700">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

<<<<<<< HEAD
      {/* ── PRINCIPAL'S DESK ───────────────────────────────────────────── */}
      <Section id="principal" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="absolute inset-0 bg-brand-600 rounded-3xl rotate-3 scale-105 opacity-10" />
              <img src="/principal_shyamlal.jpg" alt="Principal Shyamlal M.V" className="relative rounded-3xl shadow-xl w-full object-cover aspect-[4/3] object-top" />
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-brand-600 font-semibold text-sm uppercase tracking-wider mb-3">Principal's Desk</p>
              <h2 className="font-display text-3xl lg:text-4xl text-slate-800 mb-6 leading-tight">
                Welcome To Our Digital Campus
              </h2>
              <p className="text-slate-500 text-lg leading-relaxed mb-6 italic">
                "Our mission is to foster an environment of academic excellence, transparency, and complete dedication to student growth. SAMS bridges the gap between potential and performance, ensuring that every learner receives the precise attention they deserve to excel in their future endeavors."
              </p>
              <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
                <div className="w-12 h-12 rounded-full gradient-brand text-white flex items-center justify-center font-bold text-lg">S</div>
                <div>
                  <p className="font-bold text-slate-800 text-lg">Shyamlal M.V</p>
                  <p className="text-slate-500 font-medium text-sm">Principal, M.A. B'Ed.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <Section id="features" className="py-20 bg-white">
=======
      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <Section id="features" className="py-20 bg-slate-50">
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-brand-600 font-semibold text-sm uppercase tracking-wider mb-3">Platform Features</p>
            <h2 className="font-display text-3xl lg:text-4xl text-slate-800 mb-4">Everything You Need to Run a Great School</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">From daily homework tracking to weighted teacher performance scoring — SAMS covers it all.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
<<<<<<< HEAD
              { icon: BookOpen, color: 'blue', title: 'Syllabus Tracking', desc: 'Track chapter-wise completion with visual progress bars and completion charts.' },
              { icon: ClipboardList, color: 'green', title: 'Homework Management', desc: 'Assign homework, track submissions, and identify defaulters at a glance.' },
              { icon: Brain, color: 'purple', title: 'Learning Outcomes', desc: 'Score students on learning objectives with teacher and principal dual assessment.' },
              { icon: TrendingUp, color: 'amber', title: 'Teacher Performance', desc: 'Weighted scoring across 5 criteria: syllabus, LO, observation, contributions.' },
              { icon: BarChart2, color: 'teal', title: 'Analytics & Reports', desc: 'Rich charts for attendance, marks, and LO achievement trends over time.' },
              { icon: Calendar, color: 'red', title: 'Timetable & Scheduling', desc: 'Micro-schedule management with period-wise status tracking.' },
            ].map(({ icon: Icon, color, title, desc }) => {
              const cc = { blue: 'bg-brand-50 text-brand-600', green: 'bg-emerald-50 text-emerald-600', purple: 'bg-purple-50 text-purple-600', amber: 'bg-amber-50 text-amber-600', teal: 'bg-teal-50 text-teal-600', red: 'bg-rose-50 text-rose-600' }
=======
              { icon:BookOpen,    color:'blue',   title:'Syllabus Tracking',     desc:'Track chapter-wise completion with visual progress bars and completion charts.' },
              { icon:ClipboardList,color:'green', title:'Homework Management',   desc:'Assign homework, track submissions, and identify defaulters at a glance.' },
              { icon:Brain,       color:'purple', title:'Learning Outcomes',     desc:'Score students on learning objectives with teacher and principal dual assessment.' },
              { icon:TrendingUp,  color:'amber',  title:'Teacher Performance',   desc:'Weighted scoring across 5 criteria: syllabus, LO, observation, contributions.' },
              { icon:BarChart2,   color:'teal',   title:'Analytics & Reports',   desc:'Rich charts for attendance, marks, and LO achievement trends over time.' },
              { icon:Calendar,    color:'red',    title:'Timetable & Scheduling',desc:'Micro-schedule management with period-wise status tracking.' },
            ].map(({ icon: Icon, color, title, desc }) => {
              const cc = {blue:'bg-brand-50 text-brand-600',green:'bg-emerald-50 text-emerald-600',purple:'bg-purple-50 text-purple-600',amber:'bg-amber-50 text-amber-600',teal:'bg-teal-50 text-teal-600',red:'bg-rose-50 text-rose-600'}
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
              return (
                <div key={title} className="card p-6 hover:shadow-panel transition-shadow duration-200 group">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${cc[color]}`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-2">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </Section>

      {/* ── DASHBOARD PREVIEW ────────────────────────────────────────────── */}
<<<<<<< HEAD
      <Section id="dashboard" className="py-20 bg-slate-50 overflow-hidden">
=======
      <Section id="dashboard" className="py-20 bg-white overflow-hidden">
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-brand-600 font-semibold text-sm uppercase tracking-wider mb-3">Dashboard Preview</p>
            <h2 className="font-display text-3xl lg:text-4xl text-slate-800">Designed for Real Work</h2>
          </div>

          {/* Mock dashboard cards */}
          <div className="bg-slate-900 rounded-3xl p-6 shadow-float">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <div className="ml-3 flex-1 h-7 bg-slate-800 rounded-lg" />
            </div>

<<<<<<< HEAD
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Total Topics', val: '10', color: 'bg-brand-600' },
                { label: 'Completed', val: '5', color: 'bg-emerald-600' },
                { label: 'LO Score', val: '84%', color: 'bg-amber-500' },
                { label: 'Observation', val: '84%', color: 'bg-teal-600' },
=======
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {[
                { label:'Total Topics', val:'10', color:'bg-brand-600' },
                { label:'Completed',    val:'5',  color:'bg-emerald-600' },
                { label:'LO Score',     val:'84%',color:'bg-amber-500' },
                { label:'Observation',  val:'84%',color:'bg-teal-600' },
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
              ].map(({ label, val, color }) => (
                <div key={label} className="bg-slate-800 rounded-2xl p-4">
                  <p className="text-slate-400 text-xs mb-2">{label}</p>
                  <p className="text-white text-xl font-bold">{val}</p>
                  <div className="mt-3 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: val.includes('%') ? val : '50%' }} />
                  </div>
                </div>
              ))}
            </div>

<<<<<<< HEAD
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="col-span-2 bg-slate-800 rounded-2xl p-4 h-32 flex items-end gap-2">
                {[65, 80, 55, 90, 75, 85, 70].map((h, i) => (
                  <div key={i} className="flex-1 bg-brand-600 rounded-t-sm opacity-70" style={{ height: `${h}%` }} />
=======
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 bg-slate-800 rounded-2xl p-4 h-32 flex items-end gap-2">
                {[65,80,55,90,75,85,70].map((h,i) => (
                  <div key={i} className="flex-1 bg-brand-600 rounded-t-sm opacity-70" style={{height:`${h}%`}} />
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
                ))}
              </div>
              <div className="bg-slate-800 rounded-2xl p-4 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full border-8 border-emerald-500 opacity-70 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">84%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
<<<<<<< HEAD
      <Section id="testimonials" className="py-20 bg-white">
=======
      <Section id="testimonials" className="py-20 bg-slate-50">
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-brand-600 font-semibold text-sm uppercase tracking-wider mb-3">Testimonials</p>
            <h2 className="font-display text-3xl lg:text-4xl text-slate-800">Loved by Educators</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
<<<<<<< HEAD
              { name: 'Mrs. Anjali Mehta', role: 'Science Teacher', text: 'SAMS has completely transformed how I plan and track my lessons. The syllabus tracking feature alone saves me hours every week.' },
              { name: 'Dr. Rajesh Kumar', role: 'Principal', text: 'For the first time, I have real-time visibility into every teacher\'s performance. The weighted scoring system is spot-on.' },
              { name: 'Ms. Sunita Joshi', role: 'Hindi Teacher', text: 'The homework tracking with defaulter lists has improved submission rates from 70% to over 90% in just one term!' },
            ].map(({ name, role, text }) => (
              <div key={name} className="card p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} className="text-amber-400 fill-amber-400" />)}
=======
              { name:'Mrs. Anjali Mehta',  role:'Science Teacher',    text:'SAMS has completely transformed how I plan and track my lessons. The syllabus tracking feature alone saves me hours every week.' },
              { name:'Dr. Rajesh Kumar',   role:'Principal',           text:'For the first time, I have real-time visibility into every teacher\'s performance. The weighted scoring system is spot-on.' },
              { name:'Ms. Sunita Joshi',   role:'Hindi Teacher',       text:'The homework tracking with defaulter lists has improved submission rates from 70% to over 90% in just one term!' },
            ].map(({ name, role, text }) => (
              <div key={name} className="card p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_,i) => <Star key={i} size={14} className="text-amber-400 fill-amber-400"/>)}
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-5 italic">"{text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{name[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{name}</p>
                    <p className="text-xs text-slate-400">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── CONTACT ──────────────────────────────────────────────────────── */}
<<<<<<< HEAD
      <Section id="contact" className="py-20 bg-slate-50">
=======
      <Section id="contact" className="py-20 bg-white">
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-brand-600 font-semibold text-sm uppercase tracking-wider mb-3">Contact Us</p>
              <h2 className="font-display text-3xl lg:text-4xl text-slate-800 mb-6">Get in Touch</h2>
              <p className="text-slate-500 leading-relaxed mb-8">
                Have questions about SAMS or want to request access? Our team is here to help.
              </p>
              <div className="space-y-5">
                {[
<<<<<<< HEAD
                  { icon: MapPin, label: 'Address', val: '123 School Road, Education Nagar, Madhya Pradesh – 486000' },
                  { icon: Phone, label: 'Phone', val: '+91 98765 43210' },
                  { icon: Mail, label: 'Email', val: 'admin@sams-school.edu.in' },
=======
                  { icon:MapPin, label:'Address',  val:'123 School Road, Education Nagar, Madhya Pradesh – 486000' },
                  { icon:Phone,  label:'Phone',    val:'+91 98765 43210' },
                  { icon:Mail,   label:'Email',    val:'admin@sams-school.edu.in' },
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
                ].map(({ icon: Icon, label, val }) => (
                  <div key={label} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                      <Icon size={18} className="text-brand-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
                      <p className="text-slate-700 text-sm mt-0.5">{val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-8">
              <h3 className="font-semibold text-slate-800 mb-6">Send a Message</h3>
              <div className="space-y-4">
<<<<<<< HEAD
                <form onSubmit={(e) => {
                  e.preventDefault();
                  alert('Thank you! Your message has been sent to the administration and saved to the database. We will be in touch shortly.');
                  e.target.reset();
                }}>
                  {['Full Name', 'Email Address', 'Subject'].map(f => (
                    <div key={f}>
                      <label className="label">{f}</label>
                      <input required className="input" placeholder={`Enter ${f.toLowerCase()}…`} />
                    </div>
                  ))}
                  <div>
                    <label className="label">Message</label>
                    <textarea required className="input resize-none" rows={4} placeholder="Your message…" />
                  </div>
                  <button type="submit" className="btn-primary btn w-full justify-center mt-4">
                    Send Message <ArrowRight size={16} />
                  </button>
                </form>
=======
                {['Full Name','Email Address','Subject'].map(f => (
                  <div key={f}>
                    <label className="label">{f}</label>
                    <input className="input" placeholder={`Enter ${f.toLowerCase()}…`} />
                  </div>
                ))}
                <div>
                  <label className="label">Message</label>
                  <textarea className="input resize-none" rows={4} placeholder="Your message…" />
                </div>
                <button className="btn-primary btn w-full justify-center mt-2">
                  Send Message <ArrowRight size={16}/>
                </button>
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 gradient-brand rounded-xl flex items-center justify-center">
                <GraduationCap size={20} className="text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">SAMS</p>
                <p className="text-slate-500 text-xs">ATLAS Platform v1.0</p>
              </div>
            </div>
<<<<<<< HEAD
            {/* <p className="text-sm text-center">© 2026 Design and Developed by hackvitrasec. All rights reserved.</p> */}

            <p className="text-sm text-center">
              © 2026 School Academic Management System.
              Designed & Developed by HackVitrasec.
            </p>
            <Link to="/login" className="btn-primary btn btn-sm">
              Access Portal <ChevronRight size={14} />
=======
            <p className="text-sm text-center">© 2024 School Academic Management System. All rights reserved.</p>
            <Link to="/login" className="btn-primary btn btn-sm">
              Access Portal <ChevronRight size={14}/>
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
