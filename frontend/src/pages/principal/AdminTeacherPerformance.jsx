import { useState, useMemo, useEffect } from 'react'
import { Download, Edit2, Shield, Settings, AlertCircle, BookOpen, Eye, TrendingUp, Users, LayoutGrid, Globe } from 'lucide-react'
import {
  StatCard, SectionHeader, ProgressBar, Modal
} from '../../components/ui/index.jsx'
import { BarChartWidget } from '../../components/charts/index.jsx'
import { academicApi } from '../../services/schoolApi'
import { performanceApi } from '../../api'
import { toast } from 'react-hot-toast'
import clsx from 'clsx'

export default function AdminTeacherPerformance() {
  const [performanceData, setPerformanceData] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState(null)
  const [form, setForm] = useState({
    participate: '',
    other: '',
    lang: '',
    overall: '',
    overrideOverall: false,
    remarks: ''
  })

  // All 6 parameters with source description
  const WEIGHTS_LIST = [
    {
      label: 'Syllabus Completion',
      key: 'syllabus',
      w: '15%',
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      icon: BookOpen,
      adminOnly: false,
      source: 'Teacher Micro Schedule completion from Teacher Portal.'
    },
    {
      label: 'LO Achievement',
      key: 'lo',
      w: '15%',
      color: 'bg-amber-500',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      icon: TrendingUp,
      adminOnly: false,
      source: 'LO Achievement assigned from Award LO module.'
    },
    {
      label: 'Classroom Observation',
      key: 'observation',
      w: '25%',
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      icon: Eye,
      adminOnly: false,
      source: 'Observation score from Observation Records.'
    },
    {
      label: 'Participate Score',
      key: 'participate',
      w: '10%',
      color: 'bg-rose-500',
      textColor: 'text-rose-600',
      bgColor: 'bg-rose-50',
      icon: Users,
      adminOnly: true,
      source: 'Manually assigned by Admin.'
    },
    {
      label: 'Other Parameters',
      key: 'other',
      w: '20%',
      color: 'bg-teal-500',
      textColor: 'text-teal-600',
      bgColor: 'bg-teal-50',
      icon: LayoutGrid,
      adminOnly: true,
      source: 'Manually assigned by Admin.'
    },
    {
      label: 'Language Proficiency',
      key: 'lang',
      w: '15%',
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      icon: Globe,
      adminOnly: true,
      source: 'Manually assigned by Admin.'
    }
  ]

  // Only the 3 admin-editable fields
  const ADMIN_FIELDS = WEIGHTS_LIST.filter(w => w.adminOnly)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await academicApi.getPerformance()
      setPerformanceData(res.data?.data || res.data || [])
    } catch (err) {
      console.error('Failed to fetch performance data:', err)
      toast.error('Failed to load performance scores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const sorted = useMemo(() => {
    return [...performanceData].sort((a, b) => b.overall - a.overall)
  }, [performanceData])

  // Live preview of overall weighted score using current form values + teacher's auto-calculated values
  const computedOverall = useMemo(() => {
    if (!selectedTeacher) return 0
    const syl  = parseFloat(selectedTeacher.syllabus)    || 0
    const lo   = parseFloat(selectedTeacher.lo)          || 0
    const obs  = parseFloat(selectedTeacher.observation) || 0
    const part = parseFloat(form.participate) || 0
    const oth  = parseFloat(form.other)       || 0
    const lng  = parseFloat(form.lang)        || 0
    const weighted = (syl * 0.15) + (lo * 0.15) + (obs * 0.25) + (part * 0.10) + (oth * 0.20) + (lng * 0.15)
    return parseFloat(weighted.toFixed(1))
  }, [selectedTeacher, form.participate, form.other, form.lang])

  const handleEditClick = (p) => {
    setSelectedTeacher(p)
    setForm({
      participate: p.participate !== undefined && p.participate !== null && p.participate !== 0
        ? String(p.participate) : '',
      other: p.other !== undefined && p.other !== null && p.other !== 0
        ? String(p.other) : '',
      lang: p.lang !== undefined && p.lang !== null && p.lang !== 0
        ? String(p.lang) : '',
      overall: '',
      overrideOverall: false,
      remarks: p.remarks || ''
    })
    setIsModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        teacher_id: selectedTeacher.teacherId,
        participate_score: form.participate === '' ? null : parseFloat(form.participate),
        other_score:       form.other       === '' ? null : parseFloat(form.other),
        lang_score:        form.lang        === '' ? null : parseFloat(form.lang),
        overall_score: form.overrideOverall ? (form.overall === '' ? null : parseFloat(form.overall)) : null,
        remarks: form.remarks
      }

      await performanceApi.saveOverride(payload)
      toast.success('Performance saved successfully')
      setIsModalOpen(false)
      fetchData()
    } catch (err) {
      console.error(err)
      toast.error('Failed to save performance')
    } finally {
      setSaving(false)
    }
  }

  // ── Export Logic ──────────────────────────────────────────────────────────
  const handleExport = () => {
    if (sorted.length === 0) return
    const headers = ['Teacher ID', 'Teacher Name', 'Syllabus %', 'LO %', 'Observation %', 'Participate %', 'Other %', 'Language %', 'Overall %', 'Admin Scores Set', 'Remarks']
    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(',') + "\n"
      + sorted.map(p => {
          const teacherIdFormatted = `TCH${String(p.teacherId).padStart(3, '0')}`;
          return [
            teacherIdFormatted,
            p.name, 
            p.syllabus,
            p.lo,
            p.observation,
            p.participate || 0,
            p.other || 0,
            p.lang || 0,
            p.overall.toFixed(1),
            p.adminScoresSet ? 'Yes' : 'No',
            `"${(p.remarks || '').replace(/"/g, '""')}"`
          ].join(',')
        }).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `SAMS_Teacher_Performance_${new Date().toLocaleDateString()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading && performanceData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div />
        <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
          <Download size={14} /> Export performance report
        </button>
      </div>

      {/* Scoring Formula — with source descriptions */}
      <div className="card p-6 bg-white border border-slate-200 shadow-sm rounded-3xl">
        <SectionHeader title="Scoring Formula Weights" subtitle="Formula used to calculate overall performance score — showing source of each parameter" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mt-4">
          {WEIGHTS_LIST.map(w => {
            const Icon = w.icon
            return (
              <div key={w.key} className={`text-center p-3 rounded-2xl border ${w.adminOnly ? 'bg-rose-50/40 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center mx-auto mb-2 ${w.bgColor}`}>
                  <Icon size={14} className={w.textColor} />
                </div>
                <p className="text-lg font-bold text-slate-800">{w.w}</p>
                <p className="text-xs font-semibold text-slate-600 mt-0.5 leading-tight">{w.label}</p>
                <p className="text-[10px] text-slate-400 mt-1 leading-tight">{w.source}</p>
                {w.adminOnly && (
                  <span className="inline-block mt-1.5 px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-100 text-rose-600 uppercase tracking-wide">
                    Admin Entry
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Bar chart */}
      {sorted.length > 0 && (
        <div className="card p-6 bg-white border border-slate-200 shadow-sm rounded-3xl">
          <SectionHeader title="Overall Performance Scores" />
          <div className="mt-4">
            <BarChartWidget data={sorted.map(p => ({ name: p.name.split(' ')[0], pct: Math.round(p.overall) }))}
              dataKey="pct" xKey="name" color="#1a56db" height={200} name="Overall %" />
          </div>
        </div>
      )}

      {/* Individual teacher cards */}
      <div className="space-y-4">
        {sorted.length > 0 ? sorted.map((p, i) => (
          <div key={p.teacherId} className="card p-6 bg-white border border-slate-200 shadow-sm rounded-3xl hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold
                  ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-600' : 'bg-slate-100 text-slate-500'}`}>
                  #{i + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-800">{p.name}</p>
                    {p.adminScoresSet && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand-50 text-brand-600 border border-brand-100">
                        <Settings size={10} /> Admin Scored
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                    TCH{String(p.teacherId).padStart(3, '0')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className={`text-2xl font-black ${p.overall >= 85 ? 'text-emerald-600' : p.overall >= 70 ? 'text-amber-600' : 'text-rose-600'}`}>
                    {p.overall.toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-400">Overall Score</p>
                </div>
                <button
                  onClick={() => handleEditClick(p)}
                  className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-brand-600 transition-colors"
                  title="Manage Performance"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            </div>

            {/* Parameter breakdown bars */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
              {WEIGHTS_LIST.map(w => (
                <div key={w.key} className={`text-center p-2 rounded-xl border ${w.adminOnly ? 'bg-rose-50/30 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                  <p className="text-xs text-slate-400 font-medium">{w.label}</p>
                  <p className="text-sm font-bold text-slate-700 mt-1">
                    {w.adminOnly && !p.adminScoresSet
                      ? <span className="text-slate-300 text-xs italic">—</span>
                      : `${p[w.key] !== undefined && p[w.key] !== null ? Math.round(p[w.key]) : 0}%`
                    }
                  </p>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full mt-1.5 overflow-hidden">
                    <div className={clsx("h-full rounded-full", w.color)} style={{ width: `${Math.min(p[w.key] || 0, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {p.remarks && (
              <div className="mt-4 p-3 bg-slate-50/50 rounded-2xl border border-slate-100 text-xs text-slate-500 italic">
                Feedback: "{p.remarks}"
              </div>
            )}
          </div>
        )) : (
          <div className="card p-8 text-center text-slate-400 rounded-3xl border border-slate-200">
            No performance records found. Observations and Syllabus completion contribute to these scores.
          </div>
        )}
      </div>

      {/* Manage Performance Modal — Admin enters ONLY the 3 manual fields */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Manage Performance — ${selectedTeacher?.name}`}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-6">

          {/* Info banner */}
          <div className="p-4 bg-brand-50/50 border border-brand-100 rounded-2xl flex gap-3 text-sm text-brand-800">
            <Shield size={20} className="flex-shrink-0 mt-0.5 text-brand-600" />
            <div>
              <p className="font-semibold">Admin Manual Scoring</p>
              <p className="text-xs text-brand-600 mt-0.5">
                Enter values for the 3 admin-controlled parameters below. Syllabus, LO, and Observation are auto-calculated from their respective modules.
              </p>
            </div>
          </div>

          {/* Auto-calculated read-only display */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              Auto-Calculated Parameters
            </p>
            <div className="grid grid-cols-3 gap-3">
              {WEIGHTS_LIST.filter(w => !w.adminOnly).map(w => {
                const Icon = w.icon
                return (
                  <div key={w.key} className={`p-3 rounded-xl border border-slate-100 ${w.bgColor}/40`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon size={12} className={w.textColor} />
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{w.label}</p>
                    </div>
                    <p className="text-xl font-black text-slate-700">
                      {selectedTeacher ? Math.round(selectedTeacher[w.key] || 0) : 0}%
                    </p>
                    <p className="text-[9px] text-slate-400 mt-0.5">Weight {w.w}</p>
                    <p className="text-[9px] text-slate-400 leading-tight mt-0.5">{w.source}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100" />

          {/* Admin-entry fields */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              Admin Manual Entry
            </p>
            <div className="p-3 bg-rose-50/40 border border-rose-100 rounded-xl flex gap-2 items-start text-xs text-rose-700 mb-4">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              <span>
                Enter a value between <strong>0 and 100</strong> for each parameter below. These are displayed on the Teacher Analytics page.
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {ADMIN_FIELDS.map(w => {
                const Icon = w.icon
                return (
                  <div key={w.key} className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                      <Icon size={12} className={w.textColor} />
                      {w.label}
                      <span className="text-slate-400 font-normal">({w.w})</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        className="w-full bg-rose-50/30 border border-rose-200 rounded-xl px-4 py-2.5 pr-8 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all placeholder:text-slate-400 font-medium"
                        placeholder="0 – 100"
                        value={form[w.key]}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (val !== '' && Number(val) > 100) val = '100';
                          setForm(prev => ({ ...prev, [w.key]: val }));
                        }}
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400">%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Overall score preview */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Overall Weighted Score Preview</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Calculated from auto values + your admin entries above.
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-brand-600">
                  {form.overrideOverall ? (form.overall || 0) : computedOverall}%
                </p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  {form.overrideOverall ? 'Manual Override' : 'Formula Calculated'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="inline-flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4.5 h-4.5"
                  checked={form.overrideOverall}
                  onChange={(e) => setForm(prev => ({ ...prev, overrideOverall: e.target.checked }))}
                />
                <span className="text-xs font-semibold text-slate-700">Override overall score manually</span>
              </label>

              {form.overrideOverall && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-xs font-semibold text-slate-600 block">Custom Overall Score %</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-8 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400 font-medium"
                      required
                      value={form.overall}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (val !== '' && Number(val) > 100) val = '100';
                        setForm(prev => ({ ...prev, overall: val }));
                      }}
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400">%</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 block">Remarks & Principal's Feedback</label>
            <textarea
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400 font-medium min-h-[80px]"
              placeholder="Provide constructive feedback for the teacher..."
              value={form.remarks}
              onChange={(e) => setForm(prev => ({ ...prev, remarks: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center gap-2"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Performance'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}