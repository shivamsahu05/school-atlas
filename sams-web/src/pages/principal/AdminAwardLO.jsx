import { useState } from 'react'
import { CheckCircle, ChevronRight, ArrowLeft, Award } from 'lucide-react'
import { SectionHeader, StepIndicator } from '../../components/ui/index.jsx'
import { LODonut } from '../../components/charts/index.jsx'
import { ALL_TEACHERS, LO_ENTRIES } from '../../data/dummyData'
import { clsx } from 'clsx'

const CLASSES   = ['Grade 6-A','Grade 7-B','Grade 8-A','Grade 9-A','Grade 10-A']
const SUBJECTS  = ['Mathematics','Science','English','Hindi','Social Studies']
const TOPICS    = ['Linear Equations','Quadratic Equations','Triangles & Properties','Mensuration','Data Handling']
const STEP_LABELS = ['Select Class','Select Subject','Select Teacher','Select Topic','Enter Scores']

function SelectionStep({ items, selected, onSelect, placeholder }) {
  return (
    <div className="space-y-2 max-w-sm">
      {items.map(item => (
        <button
          key={item}
          onClick={() => onSelect(item)}
          className={clsx(
            'w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-sm font-medium transition-all duration-150',
            selected === item
              ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm'
              : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-slate-50'
          )}
        >
          {item}
          <ChevronRight size={16} className={selected === item ? 'text-brand-500' : 'text-slate-300'} />
        </button>
      ))}
    </div>
  )
}

function ScoreStep({ className, topic, onSubmit }) {
  const students = LO_ENTRIES.slice(0, 8)
  const [scores, setScores] = useState({})

  return (
    <div className="space-y-4 max-w-lg">
      <div className="p-3 rounded-xl bg-brand-50 border border-brand-100">
        <p className="text-xs text-brand-700 font-medium">
          Class: <span className="font-bold">{className}</span> &nbsp;·&nbsp; Topic: <span className="font-bold">{topic}</span>
        </p>
      </div>

      <div className="space-y-2">
        {students.map(s => (
          <div key={s.roll} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-slate-500">{s.roll}</span>
            </div>
            <span className="flex-1 text-sm font-medium text-slate-700">{s.student}</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number" min="0" max="10" step="0.5"
                placeholder="–"
                value={scores[s.roll] ?? ''}
                onChange={e => {
                  const v = parseFloat(e.target.value)
                  if (e.target.value === '' || (v >= 0 && v <= 10)) {
                    setScores(prev => ({ ...prev, [s.roll]: e.target.value }))
                  }
                }}
                className="w-16 text-center input py-1.5 text-sm"
              />
              <span className="text-xs text-slate-400 w-5">/10</span>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onSubmit}
        className="btn-primary btn w-full justify-center mt-4 py-3"
      >
        <Award size={16} /> Submit LO Scores
      </button>
    </div>
  )
}

export default function AdminAwardLO() {
  const [step, setStep]   = useState(1)
  const [sel, setSel]     = useState({ class:'', subject:'', teacher:'', topic:'' })
  const [submitted, setSubmitted] = useState(false)

  const update = (key, val) => {
    setSel(s => ({ ...s, [key]: val }))
    setStep(s => s + 1)
  }

  const reset = () => {
    setStep(1)
    setSel({ class:'', subject:'', teacher:'', topic:'' })
    setSubmitted(false)
  }

  if (submitted) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="card p-8 flex flex-col items-center text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mb-4">
            <CheckCircle size={40} className="text-emerald-500" />
          </div>
          <h2 className="font-display text-2xl text-slate-800 mb-2">LO Scores Awarded!</h2>
          <p className="text-slate-400 text-sm mb-6">
            Scores saved for <span className="font-semibold text-slate-600">{sel.topic}</span> · <span className="font-semibold text-slate-600">{sel.class}</span>
          </p>

          <div className="w-full mb-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Score Distribution</p>
            <LODonut approaching={3} meeting={4} exceeding={5} height={200} />
          </div>

          <div className="grid grid-cols-3 gap-3 w-full mb-6">
            {[['3','Approaching','amber'],['4','Meeting','blue'],['5','Exceeding','green']].map(([v,l,c])=>(
              <div key={l} className={`rounded-xl p-3 text-center ${c==='amber'?'bg-amber-50':c==='blue'?'bg-brand-50':'bg-emerald-50'}`}>
                <p className={`text-xl font-bold ${c==='amber'?'text-amber-600':c==='blue'?'text-brand-600':'text-emerald-600'}`}>{v}</p>
                <p className={`text-xs ${c==='amber'?'text-amber-500':c==='blue'?'text-brand-500':'text-emerald-500'}`}>{l}</p>
              </div>
            ))}
          </div>

          <button onClick={reset} className="btn-primary btn">Award Another</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card p-6 max-w-2xl">
        <SectionHeader
          title={`Step ${step} of 5: ${STEP_LABELS[step-1]}`}
          subtitle="Complete all steps to award LO scores"
        />

        <StepIndicator steps={STEP_LABELS} current={step} />

        {step === 1 && <SelectionStep items={CLASSES}                          selected={sel.class}   onSelect={v=>update('class',v)} />}
        {step === 2 && <SelectionStep items={SUBJECTS}                         selected={sel.subject} onSelect={v=>update('subject',v)} />}
        {step === 3 && <SelectionStep items={ALL_TEACHERS.map(t=>t.name)}      selected={sel.teacher} onSelect={v=>update('teacher',v)} />}
        {step === 4 && <SelectionStep items={TOPICS}                           selected={sel.topic}   onSelect={v=>update('topic',v)} />}
        {step === 5 && <ScoreStep className={sel.class} topic={sel.topic} onSubmit={() => setSubmitted(true)} />}

        {step > 1 && (
          <button onClick={() => setStep(s=>s-1)} className="btn-secondary btn mt-5 gap-2">
            <ArrowLeft size={14}/> Previous Step
          </button>
        )}
      </div>
    </div>
  )
}
