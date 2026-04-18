import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GraduationCap, User, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handle = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    setError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 600)) // simulate latency
    const result = await login(form.username, form.password)
    setLoading(false)
    if (!result.ok) { setError(result.error); return }
    navigate(result.role === 'admin' ? '/admin' : '/teacher', { replace: true })
  }

  const fillDemo = (type) => {
    setForm(type === 'admin'
      ? { username: 'admin', password: 'Admin@123' }
      : { username: '9876543211', password: 'Teacher@123' }
    )
    setError('')
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 gradient-brand flex-col justify-between p-12 relative overflow-hidden">
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
              <GraduationCap size={22} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg">SAMS</span>
          </div>

          <h1 className="font-display text-4xl xl:text-5xl text-white leading-tight mb-6">
            Your Academic<br /><em className="not-italic text-amber-300">Command Centre</em>
          </h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-sm">
            Track every topic, grade every outcome, and elevate every teacher — all in one place.
          </p>
        </div>

        {/* Feature pills */}
        <div className="relative space-y-3">
          {['Real-time Syllabus Tracking','Homework Submission Analytics','Weighted Teacher Scoring','Learning Outcome Assessment'].map(f => (
            <div key={f} className="flex items-center gap-3 glass rounded-xl px-4 py-3">
              <div className="w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center flex-shrink-0">
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-white/90 text-sm">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel – login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 gradient-brand rounded-xl flex items-center justify-center">
              <GraduationCap size={20} className="text-white" />
            </div>
            <span className="font-bold text-slate-800">SAMS – ATLAS Portal</span>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-2xl text-slate-800 mb-1">Welcome back</h2>
            <p className="text-slate-400 text-sm">Sign in to continue to your dashboard</p>
          </div>

          {/* Demo quick-fill */}
<<<<<<< HEAD
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
=======
          <div className="grid grid-cols-2 gap-2 mb-6">
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
            <button onClick={() => fillDemo('admin')}
              className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white hover:border-brand-400 hover:text-brand-600 text-slate-500 transition-all text-center font-medium">
              👔 Fill Admin
            </button>
            <button onClick={() => fillDemo('teacher')}
              className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white hover:border-brand-400 hover:text-brand-600 text-slate-500 transition-all text-center font-medium">
              📚 Fill Teacher
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="input pl-10"
                  placeholder="admin or teacher"
                  value={form.username}
                  onChange={handle('username')}
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="input pl-10 pr-10"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handle('password')}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-rose-600 text-sm bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5">
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !form.username || !form.password}
              className="btn-primary btn w-full justify-center py-3 rounded-xl text-sm mt-2"
            >
              {loading
                ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Signing in…</span>
                : <span className="flex items-center gap-2">Sign In <ArrowRight size={16}/></span>
              }
            </button>
          </form>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-amber-700 text-xs font-semibold mb-2">Valid Login Methods</p>
            <p className="text-amber-600 text-xs">Admin: <code className="font-mono">admin / Admin@123</code></p>
            <p className="text-amber-600 text-xs mt-1">Teacher: <code className="font-mono">Phone No. / Teacher@123</code></p>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            <Link to="/" className="hover:text-brand-600 transition-colors">← Back to Website</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
