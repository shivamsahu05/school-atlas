import { useState, useMemo } from 'react'
import { Plus, Edit2, Trash2, Save, Trophy, Calendar, CheckCircle, Clock, Star } from 'lucide-react'
import {
  StatCard, SectionHeader, FilterChips, StatusBadge, Modal, DataTable
} from '../../components/ui/index.jsx'

// ── Seed data ─────────────────────────────────────────────────────────────────
const SEED = [
  { id: 1, name: 'Annual Science Olympiad', type: 'Competition', date: '2024-02-10', status: 'Completed', participants: 120, venue: 'School Auditorium', description: 'Inter-class science competition' },
  { id: 2, name: 'Republic Day Celebration', type: 'Festival', date: '2024-01-26', status: 'Completed', participants: 620, venue: 'School Ground', description: 'National flag hoisting and cultural show' },
  { id: 3, name: 'Mathematics Quiz Bowl', type: 'Competition', date: '2024-03-05', status: 'Upcoming', participants: 80, venue: 'Computer Lab', description: 'Inter-school math quiz' },
  { id: 4, name: 'Holi Festival Event', type: 'Festival', date: '2024-03-25', status: 'Upcoming', participants: 350, venue: 'School Courtyard', description: 'Cultural celebration with colours' },
  { id: 5, name: 'English Debate Championship', type: 'Competition', date: '2024-02-20', status: 'Ongoing', participants: 60, venue: 'Library Hall', description: 'Public speaking and debate skills' },
  { id: 6, name: 'Annual Sports Day', type: 'Festival', date: '2024-03-15', status: 'Ongoing', participants: 620, venue: 'Sports Ground', description: 'Inter-house athletics and team sports' },
  { id: 7, name: 'Art & Craft Exhibition', type: 'Festival', date: '2024-04-05', status: 'Upcoming', participants: 200, venue: 'Art Room', description: 'Student artwork display and awards' },
  { id: 8, name: 'Hindi Recitation Contest', type: 'Competition', date: '2024-01-18', status: 'Completed', participants: 45, venue: 'Main Hall', description: 'Hindi poem and prose recitation' },
]

const TYPES = ['All', 'Competition', 'Festival']
const STATUSES = ['All', 'Upcoming', 'Ongoing', 'Completed']

const EMPTY_FORM = { name: '', type: 'Competition', date: '', status: 'Upcoming', participants: '', venue: '', description: '' }

const STATUS_COLORS = {
  Upcoming: 'bg-amber-50 border-amber-200',
  Ongoing: 'bg-brand-50 border-brand-200',
  Completed: 'bg-emerald-50 border-emerald-200',
}

export default function CompetitionFestival() {
  const [events, setEvents] = useState(SEED)
  const [filterType, setFilterType] = useState('All')
  const [filterStat, setFilterStat] = useState('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [editEvent, setEditEvent] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [nextId, setNextId] = useState(SEED.length + 1)

  // ── Filtered + sorted (date desc) ─────────────────────────────────────────
  const filtered = useMemo(() =>
    [...events]
      .filter(e =>
        (filterType === 'All' || e.type === filterType) &&
        (filterStat === 'All' || e.status === filterStat)
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [events, filterType, filterStat]
  )

  // ── Stats ──────────────────────────────────────────────────────────────────
  const upcoming = events.filter(e => e.status === 'Upcoming').length
  const ongoing = events.filter(e => e.status === 'Ongoing').length
  const completed = events.filter(e => e.status === 'Completed').length

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const openAdd = () => { setEditEvent(null); setForm(EMPTY_FORM); setModalOpen(true) }
  const openEdit = (ev) => { setEditEvent(ev); setForm({ ...ev, participants: String(ev.participants) }); setModalOpen(true) }

  const handleSave = () => {
    const entry = { ...form, participants: Number(form.participants) || 0 }
    if (editEvent) {
      setEvents(prev => prev.map(e => e.id === editEvent.id ? { ...entry, id: editEvent.id } : e))
    } else {
      setEvents(prev => [...prev, { ...entry, id: nextId }])
      setNextId(n => n + 1)
    }
    setModalOpen(false)
  }

  const handleDelete = (id) => {
    if (window.confirm('Delete this event?')) {
      setEvents(prev => prev.filter(e => e.id !== id))
    }
  }

  // ── Table ─────────────────────────────────────────────────────────────────
  const COLUMNS = [
    {
      key: 'name', label: 'Event Name', sortable: true,
      render: (v, row) => (
        <div>
          <p className="font-semibold text-slate-800 text-sm">{v}</p>
          <p className="text-xs text-slate-400 mt-0.5 max-w-[200px] truncate">{row.description}</p>
        </div>
      )
    },
    {
      key: 'type', label: 'Type', sortable: true,
      render: v => (
        <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${v === 'Competition' ? 'bg-purple-50 text-purple-700' : 'bg-teal-50 text-teal-700'}`}>
          {v === 'Competition' ? '🏆 Competition' : '🎉 Festival'}
        </span>
      )
    },
    {
      key: 'date', label: 'Date', sortable: true,
      render: v => <span className="text-xs text-slate-600 whitespace-nowrap">{v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
    },
    {
      key: 'venue', label: 'Venue', sortable: false,
      render: v => <span className="text-xs text-slate-500">{v}</span>
    },
    // {
    //   key: 'participants', label: 'Participants', sortable: true,
    //   render: v => <span className="text-sm font-semibold text-slate-700">{v}</span>
    // },
    {
      key: 'status', label: 'Status', sortable: true,
      render: v => <StatusBadge status={v} />
    },
    {
      key: 'id', label: 'Actions',
      render: (v, row) => (
        <div className="flex gap-1">
          <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500 hover:text-amber-600 transition-colors">
            <Edit2 size={13} />
          </button>
          <button onClick={() => handleDelete(row.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-400 hover:text-rose-600 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      )
    },
  ]

  const INPUT = 'text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-300 w-full'
  const LABEL = 'text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block'

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Upcoming" value={upcoming} icon={Clock} color="amber" />
        <StatCard title="Ongoing" value={ongoing} icon={Star} color="blue" />
        <StatCard title="Completed" value={completed} icon={CheckCircle} color="green" />
      </div>

      {/* Filters + Table */}
      <div className="card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHeader title="Competition & Festival Events" subtitle={`${filtered.length} events`} />
          <button onClick={openAdd} className="btn btn-primary btn-sm">
            <Plus size={14} /> Add Event
          </button>
        </div>

        <div className="flex flex-wrap gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Type</p>
            <FilterChips options={TYPES} value={filterType} onChange={setFilterType} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</p>
            <FilterChips options={STATUSES} value={filterStat} onChange={setFilterStat} />
          </div>
        </div>

        <DataTable columns={COLUMNS} rows={filtered} emptyMessage="No events found for the selected filters." />
      </div>

      {/* Add / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editEvent ? 'Edit Event' : 'Add New Event'} size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={LABEL}>Event Name</label>
            <input className={INPUT} placeholder="e.g. Annual Science Olympiad" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className={LABEL}>Type</label>
            <select className={INPUT} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option>Competition</option>
              <option>Festival</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Status</label>
            <select className={INPUT} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option>Upcoming</option>
              <option>Ongoing</option>
              <option>Completed</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Date</label>
            <input className={INPUT} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          {/* <div>
            <label className={LABEL}>Participants</label>
            <input className={INPUT} type="number" min="0" placeholder="Number of participants" value={form.participants} onChange={e => setForm(f => ({...f, participants: e.target.value}))} />
          </div> */}
          <div className="col-span-2">
            <label className={LABEL}>Venue</label>
            <input className={INPUT} placeholder="e.g. School Auditorium" value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className={LABEL}>Description</label>
            <textarea className={INPUT} rows={2} placeholder="Brief description of the event…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={handleSave} className="btn btn-primary flex-1 justify-center">
            <Save size={14} /> {editEvent ? 'Save Changes' : 'Add Event'}
          </button>
          <button onClick={() => setModalOpen(false)} className="btn btn-secondary px-5">Cancel</button>
        </div>
      </Modal>
    </div>
  )
}
