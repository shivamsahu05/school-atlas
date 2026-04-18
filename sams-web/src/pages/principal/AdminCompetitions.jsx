import { useState, useEffect, useMemo } from 'react'
import {
  Trophy, Calendar, Users, Plus,
  Edit2, CheckCircle, Clock, Trash2, Medal, UserPlus
} from 'lucide-react'
import {
  StatCard, StatusBadge,
  Modal, DataTable, FormInput, SelectDropdown
} from '../../components/ui/index.jsx'
import { eventApi } from '../../services/schoolApi'
import { toast } from 'react-hot-toast'
import clsx from 'clsx'
import { ALL_CLASSES, SUBJECTS } from '../../data/constants.js'
import { ALL_TEACHERS } from '../../data/dummyData.js'

export default function AdminCompetitions() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeEvent, setActiveEvent] = useState(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('participants')

  // Forms
  const [form, setForm] = useState({
    title: '', date: '', location: '', event_type: 'school', target_class: '', classPrefix: '', section: '', subject: '', assigned_teacher: '', description: '', status: 'upcoming'
  })
  
  // Participants & Winners State
  const [participants, setParticipants] = useState([])
  const [winners, setWinners] = useState([])
  const [participantForm, setParticipantForm] = useState({ student_name: '', student_class: '', roll_no: '' })
  const [winnerForm, setWinnerForm] = useState({ participant_id: '', position: 'first', remarks: '' })

  const classOptions = useMemo(() => {
    const grades = new Set()
    ALL_CLASSES?.forEach(c => {
      if (c === 'All') return
      grades.add(c.split('-')[0].trim())
    })
    return Array.from(grades).sort().map(g => ({value: g, label: g}))
  }, [])

  const sectionOptions = useMemo(() => {
    const sections = new Set()
    ALL_CLASSES?.forEach(c => {
      if (c === 'All') return
      if (c.includes('-')) sections.add(c.split('-')[1].trim())
    })
    return Array.from(sections).sort().map(s => ({value: s, label: s}))
  }, [])

  const subjectOptions = useMemo(() => {
    return SUBJECTS?.map(s => ({value: s, label: s})) || []
  }, [])

  const [matchedTeachers, setMatchedTeachers] = useState([])

  useEffect(() => {
    if (form.event_type === 'class' && form.classPrefix && form.section && form.subject) {
      const targetStr = `${form.classPrefix}-${form.section}`
      const matches = ALL_TEACHERS.filter(t => t.classAssigned === targetStr && t.subject === form.subject)
      setMatchedTeachers(matches)
      if (matches.length === 1) {
        setForm(f => ({ ...f, assigned_teacher: matches[0].name }))
      } else if (matches.length === 0) {
        setForm(f => ({ ...f, assigned_teacher: '' }))
      }
    } else {
      setMatchedTeachers([])
    }
  }, [form.event_type, form.classPrefix, form.section, form.subject])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const res = await eventApi.getAll()
      setEvents(res.data.events || [])
    } catch (err) {
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const loadEventDetails = async (eventId) => {
    try {
      const [pRes, wRes] = await Promise.all([
        eventApi.getParticipants(eventId),
        eventApi.getWinners(eventId)
      ])
      setParticipants(pRes.data.participants || [])
      setWinners(wRes.data.winners || [])
    } catch (err) {
      toast.error('Failed to load event details')
    }
  }

  const handleSaveEvent = async () => {
    if (!form.title) {
      toast.error('Event Title is required!')
      return
    }
    try {
      let finalTargetClass = form.target_class;
      if (form.event_type === 'class') {
         finalTargetClass = [form.classPrefix, form.section, form.subject].filter(Boolean).join(' - ');
         if (form.assigned_teacher) {
           finalTargetClass += ` (${form.assigned_teacher})`
         }
      }

      const payload = {
        title: form.title,
        description: form.description,
        event_date: form.date,
        location: form.location,
        event_type: form.event_type,
        target_class: finalTargetClass,
        status: form.status
      }

      if (form.id) {
        await eventApi.update(form.id, payload)
        toast.success('Event updated')
      } else {
        await eventApi.create(payload)
        toast.success('Event created')
      }
      setIsModalOpen(false)
      fetchEvents()
    } catch (err) {
      toast.error('Error saving event')
    }
  }

  const handleEdit = (row) => {
    let cp = '', sec = '', sub = '', teacher = '';
    if (row.event_type === 'class' && row.target_class) {
       const hasTeacher = row.target_class.includes('(');
       const baseTarget = hasTeacher ? row.target_class.substring(0, row.target_class.indexOf('(')).trim() : row.target_class;
       if (hasTeacher) {
          teacher = row.target_class.substring(row.target_class.indexOf('(') + 1, row.target_class.indexOf(')'));
       }
       const parts = baseTarget.split(' - ');
       cp = parts[0] || '';
       sec = parts[1] || '';
       sub = parts[2] || '';
    }
    setForm({
      id: row.id,
      title: row.title,
      date: row.event_date ? row.event_date.substring(0, 10) : '',
      location: row.location || '',
      event_type: row.event_type,
      target_class: row.event_type === 'class' ? '' : (row.target_class || ''),
      classPrefix: cp,
      section: sec,
      subject: sub,
      assigned_teacher: teacher,
      description: row.description || '',
      status: row.status
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event?")) return
    try {
      await eventApi.delete(id)
      toast.success("Event deleted")
      fetchEvents()
    } catch (err) {
      toast.error('Failed to delete event')
    }
  }

  const openDetails = (row, mode = 'participants') => {
    setActiveEvent(row)
    setModalMode(mode)
    setIsDetailModalOpen(true)
    loadEventDetails(row.id)
  }

  const handleAddParticipant = async () => {
    if (!participantForm.student_name) return toast.error("Student name required")
    try {
      await eventApi.addParticipant(activeEvent.id, participantForm)
      toast.success("Participant added")
      setParticipantForm({ student_name: '', student_class: '', roll_no: '' })
      loadEventDetails(activeEvent.id)
    } catch (err) {
      toast.error("Failed to add participant")
    }
  }

  const handleRemoveParticipant = async (pid) => {
    try {
      await eventApi.removeParticipant(pid)
      toast.success("Participant removed")
      loadEventDetails(activeEvent.id)
    } catch (err) {
      toast.error("Error removing participant")
    }
  }

  const handleSetWinner = async () => {
    if (!winnerForm.participant_id) return toast.error("Please select a participant")
    try {
      await eventApi.setWinner(activeEvent.id, winnerForm)
      toast.success("Winner recorded")
      setWinnerForm({ participant_id: '', position: 'first', remarks: '' })
      loadEventDetails(activeEvent.id)
    } catch (err) {
      toast.error("Failed to set winner")
    }
  }

  const COLUMNS = [
    {
      key: 'title', label: 'Event Name',
      render: (v, row) => (
        <div className="flex items-center gap-3">
          <div className={clsx(
            "w-10 h-10 rounded-xl flex items-center justify-center border font-bold text-sm",
            row.event_type === 'annual_sports' ? 'bg-rose-50 text-rose-600 border-rose-100' :
            row.event_type === 'school' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
            'bg-emerald-50 text-emerald-600 border-emerald-100'
          )}>
            <Trophy size={16} />
          </div>
          <div>
             <span className="font-bold text-slate-800 block text-sm">{v}</span>
             <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
               {row.event_type.replace('_', ' ')}
               {row.target_class ? ` · ${row.target_class}` : ''}
             </span>
          </div>
        </div>
      )
    },
    { key: 'event_date', label: 'Date', render: v => v ? new Date(v).toLocaleDateString() : 'TBA' },
    { key: 'participants', label: 'Participants', render: (_, row) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600">
          <Users size={12}/> {row._count?.participants || 0}
        </span>
    )},
    {
      key: 'status', label: 'Status',
      render: v => <StatusBadge status={v} />
    },
    {
      key: 'actions', label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <button onClick={() => openDetails(row, 'participants')} className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5">
            <UserPlus size={14} /> Add Participant
          </button>
          <button onClick={() => openDetails(row, 'winners')} className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50">
            <Trophy size={14} /> Winners
          </button>
          <button onClick={() => handleEdit(row)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors" title="Edit Event"><Edit2 size={14} /></button>
          <button onClick={() => handleDelete(row.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors" title="Delete Event"><Trash2 size={14} /></button>
        </div>
      )
    }
  ]

  const filteredEvents = events.filter(e => activeTab === 'all' || e.event_type === activeTab)

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Manage Events</h1>
          <p className="text-slate-500 font-medium">Coordinate class activities, school festivals, and sports</p>
        </div>
        <button onClick={() => { 
          setForm({ title: '', date: '', location: '', event_type: 'school', target_class: '', classPrefix: '', section: '', subject: '', assigned_teacher: '', description: '', status: 'upcoming' })
          setIsModalOpen(true) 
        }} className="btn-primary shadow-lg shadow-brand-200 gap-2">
          <Plus size={18} /> Create Event
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Events" value={events.length} icon={Trophy} color="brand" />
        <StatCard title="Upcoming" value={events.filter(e => e.status === 'upcoming').length} icon={Calendar} color="amber" />
        <StatCard title="Completed" value={events.filter(e => e.status === 'completed').length} icon={CheckCircle} color="emerald" />
      </div>

      <div className="bg-slate-100 p-1.5 rounded-xl border border-slate-200/60 inline-flex">
         {[
           {id: 'all', label: 'All Events'},
           {id: 'class', label: 'Class Events'},
           {id: 'school', label: 'School Events'},
           {id: 'annual_sports', label: 'Annual Sports'}
         ].map(tab => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id)}
             className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
               activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
             }`}
           >
             {tab.label}
           </button>
         ))}
      </div>

      <div className="card overflow-hidden border-slate-100">
        <DataTable columns={COLUMNS} rows={filteredEvents} loading={loading} emptyMessage="No events found in this category." />
      </div>

      {/* CREATE EVENT MODAL */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={form.id ? "Edit Event" : "Create New Event"} size="lg">
        <div className="space-y-6">
          {/* Type Selection */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">1. Select Event Type</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { id: 'class', icon: Users, label: 'Class Event', desc: 'Internal class activity' },
                { id: 'school', icon: Trophy, label: 'School Event', desc: 'Festivals, debates' },
                { id: 'annual_sports', icon: Medal, label: 'Annual Sports', desc: 'Athletics, games' }
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => setForm({...form, event_type: type.id})}
                  className={clsx(
                    "p-4 rounded-2xl border-2 text-left transition-all",
                    form.event_type === type.id 
                      ? "border-indigo-500 bg-indigo-50/50" 
                      : "border-slate-100 bg-white hover:border-slate-200"
                  )}
                >
                   <type.icon size={20} className={form.event_type === type.id ? "text-indigo-600 mb-2" : "text-slate-400 mb-2"} />
                   <p className={clsx("font-bold text-sm", form.event_type === type.id ? "text-indigo-900" : "text-slate-700")}>{type.label}</p>
                   <p className="text-[10px] text-slate-500 mt-1">{type.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 block">2. Event Details</label>
            <div className="space-y-4">
              <FormInput label="Event Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Science Fair 2024" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput type="date" label="Date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                <SelectDropdown 
                   label="Status" 
                   value={form.status} 
                   onChange={e => setForm({...form, status: e.target.value})}
                   options={[
                     {value: 'upcoming', label: 'Upcoming'},
                     {value: 'ongoing', label: 'Ongoing'},
                     {value: 'completed', label: 'Completed'}
                   ]}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="Location" value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="e.g. Main Hall" />
                {form.event_type !== 'class' && (
                  <FormInput label="Target Audience" value={form.target_class} onChange={e => setForm({...form, target_class: e.target.value})} placeholder="e.g. All Students" />
                )}
              </div>

              {form.event_type === 'class' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SelectDropdown label="Class" value={form.classPrefix} onChange={e => setForm({...form, classPrefix: e.target.value})} options={[{value:'', label:'Select Class'}, ...classOptions]} />
                    <SelectDropdown label="Section" value={form.section} onChange={e => setForm({...form, section: e.target.value})} options={[{value:'', label:'Select Section'}, ...sectionOptions]} />
                    <SelectDropdown label="Subject" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} options={[{value:'', label:'Select Subject'}, ...subjectOptions]} />
                  </div>
                  <div>
                    <label className="label text-xs font-bold text-slate-500 tracking-wider mb-2 block">Assigned Teacher</label>
                    {matchedTeachers.length > 1 ? (
                      <select className="input bg-white border-slate-200" value={form.assigned_teacher} onChange={e => setForm({...form, assigned_teacher: e.target.value})}>
                        <option value="">Select a Teacher</option>
                        {matchedTeachers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                      </select>
                    ) : (
                      <input 
                        className={clsx("input cursor-not-allowed font-semibold w-full", form.assigned_teacher ? "bg-brand-50 text-brand-700 border-brand-200" : "bg-slate-50 text-slate-400")} 
                        readOnly 
                        placeholder="No mapping found" 
                        value={form.assigned_teacher || ''} 
                      />
                    )}
                  </div>
                </div>
              )}

              <FormInput type="textarea" rows={3} label="Description (Optional)" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button onClick={handleSaveEvent} className="btn-primary flex-1 py-3 text-sm">{form.id ? 'Save Changes' : 'Create Event'}</button>
            <button onClick={() => setIsModalOpen(false)} className="btn-secondary px-8">Cancel</button>
          </div>
        </div>
      </Modal>

      {/* EVENT MANAGEMENT DETAIL MODAL */}
      <Modal open={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Event Management" size="xl">
        {activeEvent && (
          <div className="space-y-8">
            {/* Header info */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-3xl text-white shadow-xl">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-white/20 rounded text-[10px] font-bold uppercase tracking-wider">{activeEvent.event_type.replace('_', ' ')}</span>
                    {activeEvent.target_class && <span className="px-2 py-1 bg-white/10 rounded text-[10px] font-bold">{activeEvent.target_class}</span>}
                  </div>
                  <h2 className="text-2xl font-black tracking-tight">{activeEvent.title}</h2>
                  <p className="text-slate-300 text-sm mt-1 flex items-center gap-2">
                    {activeEvent.event_date ? new Date(activeEvent.event_date).toLocaleDateString() : 'No date'}
                    {activeEvent.location && ` • ${activeEvent.location}`}
                  </p>
                </div>
                <StatusBadge status={activeEvent.status} />
              </div>
            </div>

            <div className="bg-slate-100 p-1.5 rounded-xl border border-slate-200/60 inline-flex w-full mb-2">
              <button
                onClick={() => setModalMode('participants')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                  modalMode === 'participants' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Participants ({participants.length})
              </button>
              <button
                onClick={() => setModalMode('winners')}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                  modalMode === 'winners' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Declare Winners
              </button>
            </div>

            <div className="max-w-2xl mx-auto w-full">
              {modalMode === 'participants' ? (
                /* Participants View */
                <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Users size={16} className="text-indigo-500" />
                    Participants
                    <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-xs">{participants.length}</span>
                  </h3>
                </div>

                {/* Add participant form */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                   <input type="text" placeholder="Student Name *" value={participantForm.student_name} onChange={e => setParticipantForm({...participantForm, student_name: e.target.value})} className="input py-2 text-sm" />
                   <div className="flex gap-2">
                     <input type="text" placeholder="Class" value={participantForm.student_class} onChange={e => setParticipantForm({...participantForm, student_class: e.target.value})} className="input py-2 w-1/2 text-sm" />
                     <input type="text" placeholder="Roll No" value={participantForm.roll_no} onChange={e => setParticipantForm({...participantForm, roll_no: e.target.value})} className="input py-2 w-1/2 text-sm" />
                   </div>
                   <button onClick={handleAddParticipant} disabled={!participantForm.student_name} className="w-full btn-secondary py-2 text-xs flex items-center justify-center gap-2">
                     <UserPlus size={14} /> Add Participant
                   </button>
                </div>

                {/* Participant list */}
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                   {participants.map(p => (
                     <div key={p.id} className="flex items-center justify-between bg-white border border-slate-100 p-3 rounded-lg group hover:border-slate-300">
                       <div>
                         <p className="text-xs font-bold text-slate-700">{p.student_name}</p>
                         <p className="text-[10px] text-slate-400">Class: {p.student_class || '-'} | Roll: {p.roll_no || '-'}</p>
                       </div>
                       <button onClick={() => handleRemoveParticipant(p.id)} className="text-slate-300 hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Trash2 size={14} />
                       </button>
                     </div>
                   ))}
                   {participants.length === 0 && <p className="text-xs text-center text-slate-400 py-4">No participants added yet.</p>}
                </div>
              </div>
              ) : (
              /* Winners View */
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Trophy size={16} className="text-amber-500" />
                    Declare Winners
                  </h3>
                </div>

                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 space-y-3">
                  <SelectDropdown
                    label="Select Winner Position"
                    value={winnerForm.position}
                    onChange={e => setWinnerForm({...winnerForm, position: e.target.value})}
                    options={[
                      {value: 'first', label: '🏆 1st Place'},
                      {value: 'second', label: '🥈 2nd Place'},
                      {value: 'third', label: '🥉 3rd Place'}
                    ]}
                  />
                  
                  <div>
                    <label className="label text-[10px]">Select Participant</label>
                    <select className="select py-2 text-sm" value={winnerForm.participant_id} onChange={e => setWinnerForm({...winnerForm, participant_id: e.target.value})}>
                      <option value="">-- Choose from participants list --</option>
                      {participants.map(p => <option key={p.id} value={p.id}>{p.student_name} ({p.student_class})</option>)}
                    </select>
                  </div>
                  
                  <input type="text" placeholder="Remarks (Optional)" value={winnerForm.remarks} onChange={e => setWinnerForm({...winnerForm, remarks: e.target.value})} className="input py-2 text-sm" />
                  
                  <button onClick={handleSetWinner} disabled={!winnerForm.participant_id} className="w-full btn-primary py-2 text-xs">
                     Record Winner
                  </button>
                </div>

                {/* Winners Display */}
                <div className="space-y-2">
                  {['first', 'second', 'third'].map(pos => {
                    const winner = winners.find(w => w.position === pos)
                    return (
                      <div key={pos} className={clsx(
                        "flex items-center p-3 rounded-xl border",
                        pos === 'first' && "bg-amber-50 border-amber-200",
                        pos === 'second' && "bg-slate-100 border-slate-300",
                        pos === 'third' && "bg-orange-50 border-orange-200"
                      )}>
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-black text-xs shadow-sm mr-3">
                          {pos === 'first' ? '1st' : pos === 'second' ? '2nd' : '3rd'}
                        </div>
                        <div className="flex-1">
                          {winner ? (
                             <>
                                <p className="text-xs font-bold text-slate-800">{winner.participant?.student_name}</p>
                                {winner.remarks && <p className="text-[10px] text-slate-500 italic mt-0.5">"{winner.remarks}"</p>}
                             </>
                          ) : (
                             <p className="text-xs text-slate-400 italic">Not decided yet</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
