import { useState, useMemo, useEffect } from 'react'
import { Download, Edit2, Shield, Settings, AlertCircle, Award } from 'lucide-react'
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
    syllabus: '',
    lo: '',
    observation: '',
    participate: '',
    other: '',
    lang: '',
    overall: '',
    overrideOverall: false,
    remarks: ''
  })

  const WEIGHTS_LIST = [
    { label: 'Syllabus Completion', key: 'syllabus', w: '15%', color: 'bg-blue-500' },
    { label: 'LO Achievement', key: 'lo', w: '15%', color: 'bg-amber-500' },
    { label: 'Classroom Observation', key: 'observation', w: '25%', color: 'bg-emerald-500' },
    { label: 'Participate Score', key: 'participate', w: '10%', color: 'bg-rose-500' },
    { label: 'Other Parameters', key: 'other', w: '20%', color: 'bg-teal-500' },
    { label: 'Language Proficiency', key: 'lang', w: '15%', color: 'bg-indigo-500' }
  ]

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

  // Dynamic live calculation of overall score based on weights
  const computedOverall = useMemo(() => {
    const syl = parseFloat(form.syllabus) || 0
    const lo = parseFloat(form.lo) || 0
    const obs = parseFloat(form.observation) || 0
    const part = parseFloat(form.participate) || 0
    const oth = parseFloat(form.other) || 0
    const lng = parseFloat(form.lang) || 0
    
    const weighted = (syl * 0.15) + (lo * 0.15) + (obs * 0.25) + (part * 0.10) + (oth * 0.20) + (lng * 0.15)
    return parseFloat(weighted.toFixed(1))
  }, [form.syllabus, form.lo, form.observation, form.participate, form.other, form.lang])

  const handleEditClick = (p) => {
    setSelectedTeacher(p)
    setForm({
      syllabus: p.syllabus !== undefined && p.syllabus !== null ? String(p.syllabus) : '',
      lo: p.lo !== undefined && p.lo !== null ? String(p.lo) : '',
      observation: p.observation !== undefined && p.observation !== null ? String(p.observation) : '',
      participate: p.participate !== undefined && p.participate !== null ? String(p.participate) : '',
      other: p.other !== undefined && p.other !== null ? String(p.other) : '',
      lang: p.lang !== undefined && p.lang !== null ? String(p.lang) : '',
      overall: p.overall !== undefined && p.overall !== null ? String(p.overall) : '',
      overrideOverall: p.isOverridden && p.overall !== null,
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
        syllabus_completion_pct: form.syllabus === '' ? null : parseFloat(form.syllabus),
        lo_avg_pct: form.lo === '' ? null : parseFloat(form.lo),
        observation_pct: form.observation === '' ? null : parseFloat(form.observation),
        participate_score: form.participate === '' ? null : parseFloat(form.participate),
        other_score: form.other === '' ? null : parseFloat(form.other),
        lang_score: form.lang === '' ? null : parseFloat(form.lang),
        overall_score: form.overrideOverall ? (form.overall === '' ? null : parseFloat(form.overall)) : null,
        remarks: form.remarks
      }

      await performanceApi.saveOverride(payload)
      toast.success('Performance updated successfully')
      setIsModalOpen(false)
      fetchData()
    } catch (err) {
      console.error(err)
      toast.error('Failed to save performance override')
    } finally {
      setSaving(false)
    }
  }

  // ── Export Logic ──────────────────────────────────────────────────────────
  const handleExport = () => {
    if (sorted.length === 0) return
    const headers = ['Teacher', 'Subject', 'Syllabus %', 'LO %', 'Observation %', 'Participate %', 'Other %', 'Language %', 'Overall %', 'Manual Override', 'Remarks']
    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(',') + "\n"
      + sorted.map(p => [
          p.name, 
          p.subject, 
          p.syllabus, 
          p.lo, 
          p.observation, 
          p.participate || 0,
          p.other, 
          p.lang || 0,
          p.overall.toFixed(1),
          p.isOverridden ? 'Yes' : 'No',
          `"${(p.remarks || '').replace(/"/g, '""')}"`
        ].join(',')).join("\n")

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

      {/* Weights legend */}
      <div className="card p-6 bg-white border border-slate-200 shadow-sm rounded-3xl">
        <SectionHeader title="Scoring Formula Weights" subtitle="Formula used to calculate overall performance score" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mt-4">
          {WEIGHTS_LIST.map(w => (
            <div key={w.key} className="text-center p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className={`w-2.5 h-2.5 rounded-full ${w.color} mx-auto mb-2`} />
              <p className="text-lg font-bold text-slate-800">{w.w}</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-tight">{w.label}</p>
            </div>
          ))}
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

      {/* Individual cards */}
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
                    {p.isOverridden && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand-50 text-brand-600 border border-brand-100">
                        <Settings size={10} /> Override Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{p.subject}</p>
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
                  title="Manage Performance / Override"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
              {WEIGHTS_LIST.map(w => (
                <div key={w.key} className="text-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-xs text-slate-400 font-medium">{w.label}</p>
                  <p className="text-sm font-bold text-slate-700 mt-1">{p[w.key] !== undefined && p[w.key] !== null ? Math.round(p[w.key]) : 0}%</p>
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

      {/* Manual Override Form Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Manage Performance - ${selectedTeacher?.name}`}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div className="p-4 bg-brand-50/50 border border-brand-100 rounded-2xl flex gap-3 text-sm text-brand-800">
            <Shield size={20} className="flex-shrink-0 mt-0.5 text-brand-600" />
            <div>
              <p className="font-semibold">Performance Input & Overrides</p>
              <p className="text-xs text-brand-600 mt-0.5">
                Inputting values here overrides the auto-computed performance metrics. Leave fields blank to keep default calculations.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {WEIGHTS_LIST.map(w => (
              <div key={w.key} className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 block">
                  {w.label} Score % (Weight {w.w})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pr-8 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400 font-medium"
                    placeholder="Auto Calculated"
                    value={form[w.key]}
                    onChange={(e) => setForm(prev => ({ ...prev, [w.key]: e.target.value }))}
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Overall Weighted Score</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Calculated dynamically from inputs or overridden manually.
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-brand-600">{form.overrideOverall ? (form.overall || 0) : computedOverall}%</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  {form.overrideOverall ? 'Manual' : 'Formula Calculated'}
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
                      onChange={(e) => setForm(prev => ({ ...prev, overall: e.target.value }))}
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400">%</span>
                  </div>
                </div>
              )}
            </div>
          </div>

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