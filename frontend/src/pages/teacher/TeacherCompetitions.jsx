import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Trophy, Calendar, Users, Plus,
  Edit2, CheckCircle, Clock, Trash2, Medal, UserPlus, AlertTriangle
} from 'lucide-react'
import {
  StatCard, StatusBadge, SectionHeader,
  Modal, DataTable, FormInput, SelectDropdown
} from '../../components/ui/index.jsx'
import { eventApi, classesApi } from '../../services/schoolApi'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-hot-toast'
import clsx from 'clsx'

export default function TeacherCompetitions() {
  const { user } = useAuth()
  const [competitions, setCompetitions] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  // DB Data
  const [dbClasses, setDbClasses] = useState([])
  const [dbSubjects, setDbSubjects] = useState([])

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeComp, setActiveComp] = useState(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('participants')

  // Forms
  const [form, setForm] = useState({
    title: '', date: '', location: '', event_type: 'academic_competition', target_class: '', classPrefix: '', section: '', subject: '', assigned_teacher: '', description: '', status: 'upcoming'
  })

  // Participants & Winners State
  const [participants, setParticipants] = useState([])
  const [winners, setWinners] = useState([])
  const [participantForm, setParticipantForm] = useState({ student_name: '', student_class: '', roll_no: '' })
  const [winnerForm, setWinnerForm] = useState({ participant_id: '', position: 'first', remarks: '' })

  const classOptions = useMemo(() => {
    const grades = new Set()
    dbClasses?.forEach(c => {
      grades.add(c.class_name)
    })
    return Array.from(grades).sort((a, b) => parseInt(a) - parseInt(b)).map(g => ({ value: g, label: `Class ${g}` }))
  }, [dbClasses])

  const sectionOptions = useMemo(() => {
    if (!form.classPrefix) return []
    const sections = dbClasses
      .filter(c => c.class_name === form.classPrefix)
      .map(c => ({ value: c.section, label: `Section ${c.section}` }))
    return sections
  }, [dbClasses, form.classPrefix])

  const subjectOptions = useMemo(() => {
    return dbSubjects?.map(s => ({ value: s.name, label: s.name })) || []
  }, [dbSubjects])

  useEffect(() => {
    if (form.event_type === 'class_competition' && form.classPrefix && form.section && form.subject) {
      // Auto-assign the current teacher for class-level competitions
      setForm(f => ({ ...f, assigned_teacher: user?.name || '' }))
    }
  }, [form.event_type, form.classPrefix, form.section, form.subject, user?.name])

  const fetchInitialData = async () => {
    try {
      const classesRes = await classesApi.getAll()
      const classesData = classesRes.data?.items || classesRes.data?.classes || classesRes.data || []
      setDbClasses(Array.isArray(classesData) ? classesData : [])
      
      const subjectsRes = await classesApi.getSubjects()
      const subjectsData = subjectsRes.data?.items || subjectsRes.data?.subjects || subjectsRes.data || []
      setDbSubjects(Array.isArray(subjectsData) ? subjectsData : [])
    } catch (err) { console.error('Data Fetch Error:', err) }
  }

  const fetchCompetitions = useCallback(async () => {
    try {
      setLoading(true)
      const res = await eventApi.getAll({ category: 'competition' })
      // Filter for competitions only
      const all = res.data?.events || []
      const comps = all.filter(e => 
        ['academic_competition', 'sports_competition', 'inter_house', 'class_competition', 'school_competition', 'annual_sports'].includes(e.event_type)
      ).map(e => {
        if (e.event_date) {
           const eventDate = new Date(e.event_date);
           eventDate.setHours(23, 59, 59, 999);
           if (new Date() > eventDate) {
              e.status = 'completed';
           }
        }
        return e;
      })
      setCompetitions(comps)
    } catch (err) {
      toast.error('Failed to load competitions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCompetitions()
    fetchInitialData()
  }, [fetchCompetitions])

  const loadCompDetails = async (id) => {
    try {
      const [pRes, wRes] = await Promise.all([
        eventApi.getParticipants(id),
        eventApi.getWinners(id)
      ])
      setParticipants(pRes.data.participants || [])
      setWinners(wRes.data.winners || [])
    } catch (err) {
      toast.error('Failed to load details')
    }
  }

  const handleSave = async () => {
    if (!form.title) return toast.error('Title is required!')
    try {
      let target = form.target_class;
      if (form.event_type === 'class_competition' && form.classPrefix) {
        target = `${form.classPrefix}-${form.section} (${form.assigned_teacher || user?.name})`;
      }

      const payload = { ...form, target_class: target, event_date: form.date, category: 'competition' }
      if (form.id) {
        await eventApi.update(form.id, payload)
        toast.success('Updated')
      } else {
        await eventApi.create(payload)
        toast.success('Created')
      }
      setIsModalOpen(false)
      fetchCompetitions()
    } catch (err) { toast.error('Error saving') }
  }

  const handleEdit = (row) => {
    setForm({
      id: row.id,
      title: row.title,
      date: row.event_date?.substring(0, 10) || '',
      location: row.location || '',
      event_type: row.event_type,
      target_class: row.target_class || '',
      description: row.description || '',
      status: row.status
    })
    setIsModalOpen(true)
  }

  const openDetails = (row, mode = 'participants') => {
    setActiveComp(row)
    setModalMode(mode)
    setIsDetailModalOpen(true)
    loadCompDetails(row.id)
  }

  const handleAddParticipant = async () => {
    if (!participantForm.student_name) return toast.error("Name required")
    try {
      await eventApi.addParticipant(activeComp.id, participantForm)
      toast.success("Added")
      setParticipantForm({ student_name: '', student_class: '', roll_no: '' })
      loadCompDetails(activeComp.id)
    } catch (err) { toast.error("Failed") }
  }

  const handleSetWinner = async () => {
    if (!winnerForm.participant_id) return toast.error("Select student")
    try {
      await eventApi.setWinner(activeComp.id, winnerForm)
      toast.success("Winner recorded")
      setWinnerForm({ participant_id: '', position: 'first', remarks: '' })
      loadCompDetails(activeComp.id)
    } catch (err) { toast.error("Failed") }
  }

  const COLUMNS = [
    {
      key: 'title', label: 'Competition Name',
      render: (v, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600 border border-amber-100">
            <Trophy size={16} />
          </div>
          <div>
            <span className="font-bold text-slate-800 block text-sm">{v}</span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {row.event_type.replace('_', ' ')} {row.target_class ? ` · ${row.target_class}` : ''}
            </span>
          </div>
        </div>
      )
    },
    { key: 'creator', label: 'Created By', render: (_, row) => (
        <div className="text-xs">
          <span className="font-bold text-slate-700">{row.creator?.name || 'Unknown'}</span>
          <span className="block text-[10px] text-slate-400 capitalize">{row.creator?.role || 'System'}</span>
        </div>
      )
    },
    { key: 'event_date', label: 'Date', render: v => v?.slice(0, 10) },
    {
      key: 'participants', label: 'Registered', render: (_, row) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600">
          <Users size={12} /> {row._count?.participants || 0}
        </span>
      )
    },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    {
      key: 'actions', label: 'Manage',
      render: (_, row) => (
        <div className="flex gap-2">
          <button onClick={() => openDetails(row, 'participants')} className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5">
            <UserPlus size={14} /> Participants
          </button>
          <button onClick={() => openDetails(row, 'winners')} className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50">
            <Trophy size={14} /> Result
          </button>
          {row.created_by === user?.id && (
            <button onClick={() => handleEdit(row)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400" title="Edit"><Edit2 size={14} /></button>
          )}
        </div>
      )
    }
  ]

  if (!user) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Competitions</h1>
          <p className="text-slate-500 font-medium">Manage sports, academic contests, and house matches</p>
        </div>
        <button onClick={() => {
          setForm({ title: '', date: '', location: '', event_type: 'academic_competition', target_class: '', classPrefix: '', section: '', subject: '', assigned_teacher: user?.name || '', description: '', status: 'upcoming' })
          setIsModalOpen(true)
        }} className="btn-primary gap-2 shadow-lg shadow-brand-100">
          <Plus size={18} /> New Competition
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Contests" value={competitions.length} icon={Trophy} color="brand" />
        <StatCard title="Ongoing" value={competitions.filter(c => c.status === 'ongoing').length} icon={Clock} color="amber" />
        <StatCard title="Winners Decided" value={competitions.filter(c => c.status === 'completed').length} icon={CheckCircle} color="emerald" />
      </div>

      <div className="bg-slate-100 p-1 rounded-xl border border-slate-200/60 inline-flex">
        {[
          { id: 'all', label: 'All Contests' },
          { id: 'academic_competition', label: 'Academic' },
          { id: 'sports_competition', label: 'Sports' },
          { id: 'inter_house', label: 'Inter-house' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <DataTable columns={COLUMNS} rows={competitions.filter(c => activeTab === 'all' || c.event_type === activeTab)} loading={loading} />
      </div>

      {/* CREATE MODAL */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={form.id ? "Edit Competition" : "New Competition"}>
        <div className="space-y-4">
          <SelectDropdown
            label="Competition Category"
            value={form.event_type}
            onChange={e => setForm({...form, event_type: e.target.value})}
            options={[
              { value: 'academic_competition', label: '🎓 Academic Competition' },
              { value: 'sports_competition', label: '⚽ Sports Competition' },
              { value: 'inter_house', label: '🏠 Inter-house Match' },
              { value: 'class_competition', label: '✍️ Class/Subject Contest' },
              { value: 'school_competition', label: '🌍 School-wide Event' },
              { value: 'annual_sports', label: '🏆 Annual Sports Meet' }
            ]}
          />
          <FormInput label="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
          <div className="grid grid-cols-2 gap-3">
            <FormInput type="date" label="Date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
            <SelectDropdown label="Status" value={form.status} onChange={e => setForm({...form, status: e.target.value})} options={[{value:'upcoming',label:'Upcoming'},{value:'ongoing',label:'Ongoing'},{value:'completed',label:'Completed'}]} />
          </div>
          {form.event_type === 'class_competition' && (
             <div className="grid grid-cols-3 gap-2">
                <SelectDropdown label="Class" value={form.classPrefix} onChange={e => setForm({...form, classPrefix: e.target.value})} options={[{value:'',label:'-'}, ...classOptions]} />
                <SelectDropdown label="Section" value={form.section} onChange={e => setForm({...form, section: e.target.value})} options={[{value:'',label:'-'}, ...sectionOptions]} />
                <SelectDropdown label="Subject" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} options={[{value:'',label:'-'}, ...subjectOptions]} />
             </div>
          )}
          <FormInput label="Location" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
          <FormInput type="textarea" label="Competition Rules / Info" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          <div className="flex gap-2 pt-4 border-t">
            <button onClick={handleSave} className="btn-primary flex-1">Save Competition</button>
            <button onClick={() => setIsModalOpen(false)} className="btn-secondary px-6">Cancel</button>
          </div>
        </div>
      </Modal>

      {/* DETAIL MODAL */}
      <Modal open={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Manage Competition" size="xl">
        {activeComp && (
          <div className="space-y-6">
            <div className="bg-slate-900 p-6 rounded-2xl text-white">
               <h2 className="text-xl font-black">{activeComp.title}</h2>
               <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest">{activeComp.event_type.replace('_',' ')} • {activeComp.location}</p>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
               <button onClick={() => setModalMode('participants')} className={clsx("flex-1 py-2 rounded-lg text-xs font-bold transition-all", modalMode === 'participants' ? "bg-white text-brand-600 shadow-sm" : "text-slate-500")}>Participants ({participants.length})</button>
               <button onClick={() => setModalMode('winners')} className={clsx("flex-1 py-2 rounded-lg text-xs font-bold transition-all", modalMode === 'winners' ? "bg-white text-amber-600 shadow-sm" : "text-slate-500")}>Winners / Results</button>
            </div>

            {modalMode === 'participants' ? (
              <div className="space-y-4">
                 <div className="bg-slate-50 p-4 rounded-xl border space-y-3">
                    <input type="text" placeholder="Student Name *" value={participantForm.student_name} onChange={e => setParticipantForm({...participantForm, student_name: e.target.value})} className="w-full bg-white border rounded-lg px-3 py-2 text-sm" />
                    <div className="grid grid-cols-2 gap-2">
                       <input type="text" placeholder="Class" value={participantForm.student_class} onChange={e => setParticipantForm({...participantForm, student_class: e.target.value})} className="w-full bg-white border rounded-lg px-3 py-2 text-sm" />
                       <input type="text" placeholder="Roll No" value={participantForm.roll_no} onChange={e => setParticipantForm({...participantForm, roll_no: e.target.value})} className="w-full bg-white border rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <button onClick={handleAddParticipant} className="w-full btn-secondary py-2 text-xs flex items-center justify-center gap-2"><UserPlus size={14}/> Add Entry</button>
                 </div>
                 <div className="grid sm:grid-cols-2 gap-2">
                    {participants.map(p => (
                       <div key={p.id} className="p-3 bg-white border rounded-xl flex justify-between items-center">
                          <div>
                             <p className="text-xs font-bold text-slate-700">{p.student_name}</p>
                             <p className="text-[10px] text-slate-400">Class: {p.student_class} | Roll: {p.roll_no}</p>
                          </div>
                          <button onClick={() => eventApi.removeParticipant(p.id).then(() => loadCompDetails(activeComp.id))} className="text-slate-300 hover:text-rose-500"><Trash2 size={14}/></button>
                       </div>
                    ))}
                 </div>
              </div>
            ) : (
              <div className="space-y-4">
                 <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 space-y-3">
                    <SelectDropdown label="Select Rank" value={winnerForm.position} onChange={e => setWinnerForm({...winnerForm, position: e.target.value})} options={[{value:'first',label:'🏆 1st'},{value:'second',label:'🥈 2nd'},{value:'third',label:'🥉 3rd'}]} />
                    <select className="w-full border rounded-lg px-3 py-2 text-sm" value={winnerForm.participant_id} onChange={e => setWinnerForm({...winnerForm, participant_id: e.target.value})}>
                       <option value="">-- Choose Participant --</option>
                       {participants.map(p => <option key={p.id} value={p.id}>{p.student_name}</option>)}
                    </select>
                    <button onClick={handleSetWinner} className="w-full btn-primary py-2 text-xs">Confirm Winner</button>
                 </div>
                 <div className="space-y-2">
                    {['first','second','third'].map(pos => {
                       const w = winners.find(x => x.position === pos)
                       return (
                          <div key={pos} className="p-3 border rounded-xl flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black">{pos === 'first' ? '1st' : pos === 'second' ? '2nd' : '3rd'}</div>
                             <span className="text-sm font-bold text-slate-700">{w ? w.participant?.student_name : 'TBD'}</span>
                          </div>
                       )
                    })}
                 </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
