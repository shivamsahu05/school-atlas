import clsx from 'clsx'
import { X, ChevronDown, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'

/* ─── StatCard ─────────────────────────────────────────────────────────── */
export function StatCard({ title, value, subtitle, icon: Icon, color = 'blue', trend, loading = false, className }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-emerald-50 text-emerald-600',
    amber:  'bg-amber-50 text-amber-600',
    red:    'bg-rose-50 text-rose-600',
    teal:   'bg-teal-50 text-teal-600',
    purple: 'bg-purple-50 text-purple-600',
    brand:  'bg-brand-50 text-brand-600',
  }
  const barColors = {
    blue:'bg-blue-500', green:'bg-emerald-500', amber:'bg-amber-500',
    red:'bg-rose-500', teal:'bg-teal-500', purple:'bg-purple-500',
    brand:'bg-brand-500',
  }

  if (loading) {
    return (
      <div className={clsx("bg-white rounded-[1.2rem] sm:rounded-[1.5rem] p-3 sm:p-5 shadow-sm border border-slate-100 animate-pulse", className)}>
        <div className="flex items-start justify-between mb-2 sm:mb-4">
          <div className="h-3 w-12 sm:w-20 bg-slate-100 rounded" />
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-100" />
        </div>
        <div className="h-6 sm:h-8 w-16 sm:w-24 bg-slate-100 rounded mb-2" />
        <div className="h-3 w-24 sm:h-3 sm:w-32 bg-slate-100 rounded" />
      </div>
    )
  }

  return (
    <div className={clsx("bg-white rounded-[1.2rem] sm:rounded-[1.5rem] p-3 sm:p-5 shadow-sm border border-slate-100/50 hover:shadow-md transition-all duration-300 group", className)}>
      <div className="flex items-start justify-between mb-1 sm:mb-2 gap-1">
        <p className="text-[9px] sm:text-[11px] font-extrabold text-slate-500 tracking-wide leading-tight">{title}</p>
        {Icon && (
          <div className={clsx('w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shrink-0', colors[color])}>
            <Icon size={14} className="sm:w-5 sm:h-5" />
          </div>
        )}
      </div>
      
      <div className="space-y-0.5 sm:space-y-1">
        <h4 className="text-lg sm:text-3xl font-black text-slate-800 tracking-tighter">{value}</h4>
        {subtitle && (
          <p className="text-[8px] sm:text-[11px] font-bold text-slate-400 leading-none">
            {subtitle}
          </p>
        )}
      </div>

      {trend !== undefined && (
        <div className="mt-5">
          <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
            <div 
              className={clsx('h-full rounded-full transition-all duration-1000', barColors[color])} 
              style={{ width: `${Math.min(trend, 100)}%` }} 
            />
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── StatusBadge ──────────────────────────────────────────────────────── */
export function StatusBadge({ status }) {
  const map = {
    Approved:   'badge-green',
    Completed:  'badge-green',
    Exceeding:  'badge-green',
    Meeting:    'badge-blue',
    Pending:    'badge-amber',
    Approaching:'badge-amber',
    Rejected:   'badge-red',
    Ongoing:    'badge-blue',
  }
  return <span className={clsx('badge', map[status] || 'badge-gray')}>{status}</span>
}

/* ─── ProgressBar ──────────────────────────────────────────────────────── */
export function ProgressBar({ value, max = 100, color = 'blue', showLabel = true, height = 'h-2' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const colors = {
    blue:'bg-brand-500', green:'bg-emerald-500', amber:'bg-amber-500',
    red:'bg-rose-500', teal:'bg-teal-500',
  }
  const autoColor = pct >= 75 ? 'green' : pct >= 50 ? 'blue' : pct >= 30 ? 'amber' : 'red'
  const c = colors[color === 'auto' ? autoColor : color]
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-slate-400">{value}/{max}</span>
          <span className="text-xs font-semibold text-slate-600">{pct}%</span>
        </div>
      )}
      <div className={clsx('w-full bg-slate-100 rounded-full overflow-hidden', height)}>
        <div className={clsx('h-full rounded-full transition-all duration-500', c)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

/* ─── Modal ────────────────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null
  const sizes = { sm:'max-w-sm', md:'max-w-lg', lg:'max-w-2xl', xl:'max-w-4xl' }
  
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx('relative bg-white rounded-2xl shadow-float w-full animate-slide-up', sizes[size])}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-4 max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-thin overflow-x-hidden">{children}</div>
      </div>
    </div>,
    document.body
  )
}

/* ─── Tabs ─────────────────────────────────────────────────────────────── */
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit max-w-full overflow-x-auto scrollbar-thin">
      {tabs.map(t => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={clsx(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 flex-shrink-0 whitespace-nowrap',
            active === t.value
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

/* ─── SectionHeader ────────────────────────────────────────────────────── */
export function SectionHeader({ title, subtitle, action, onAction }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-sub">{subtitle}</p>}
      </div>
      {action && (
        <button onClick={onAction} className="btn-primary btn-sm">
          {action}
        </button>
      )}
    </div>
  )
}

/* ─── FilterChip ───────────────────────────────────────────────────────── */
export function FilterChips({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={clsx(
            'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
            value === opt
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

/* ─── EmptyState ───────────────────────────────────────────────────────── */
export function EmptyState({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon size={48} className="text-slate-200 mb-4" />}
      <p className="text-slate-400 text-sm">{message}</p>
    </div>
  )
}

/* ─── StepIndicator ────────────────────────────────────────────────────── */
export function StepIndicator({ steps, current }) {
  return (
    <div className="flex items-center gap-1 mb-6">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center flex-1">
          <div className={clsx(
            'h-1.5 rounded-full w-full transition-all duration-300',
            i + 1 < current ? 'bg-emerald-500' :
            i + 1 === current ? 'bg-brand-600' : 'bg-slate-200',
          )} />
        </div>
      ))}
    </div>
  )
}

/* ─── FormInput ───────────────────────────────────────────────────────── */
export function FormInput({ label, error, helperText, type, ...props }) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

  return (
    <div className="space-y-1.5 flex-1">
      {label && <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</label>}
      <div className="relative">
        <input 
          type={inputType}
          className={clsx(
            "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400 font-medium",
            isPassword && "pr-10",
            error && "border-rose-400 focus:border-rose-400 focus:ring-rose-500/20 shadow-sm shadow-rose-100"
          )}
          {...props} 
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {helperText && !error && <p className="text-[10px] font-semibold text-slate-500 ml-1 mt-1">{helperText}</p>}
      {error && <p className="text-[10px] font-bold text-rose-500 ml-1 mt-1 animate-slide-up">{error}</p>}
    </div>
  )
}

/* ─── SelectDropdown ──────────────────────────────────────────────────── */
export function SelectDropdown({ label, options, value, onChange, error, ...props }) {
  return (
    <div className="space-y-1.5 flex-1">
      {label && <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</label>}
      <div className="relative">
        <select 
          value={value}
          onChange={onChange}
          className={clsx(
            "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium appearance-none leading-none",
            error && "border-rose-400 focus:border-rose-400"
          )}
          {...props}
        >
          {options.filter(Boolean).map(opt => (
            <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
              {typeof opt === 'string' ? opt : opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDown size={16} className="text-slate-400" />
        </div>
      </div>
    </div>
  )
}

/* ─── InfoRow ───────────────────────────────────────────────────────────── */
export function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0 border-dashed">
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <span className="text-sm font-bold text-slate-800 text-right">{value}</span>
    </div>
  )
}

export { default as DataTable } from "./DataTable";
export { default as Footer } from "./Footer";
