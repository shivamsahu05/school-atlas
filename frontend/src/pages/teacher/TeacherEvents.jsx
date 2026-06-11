import { useState, useEffect, useCallback } from 'react'
import { Calendar, Plus, Loader2, AlertTriangle, MessageSquare, Megaphone, Info, Clock, CheckCircle, Edit2, Trash2 } from 'lucide-react'
import { StatCard, SectionHeader, StatusBadge, Modal, FormInput, SelectDropdown } from '../../components/ui/index.jsx'
import { DataTable } from '../../components/ui/DataTable.jsx'
import { eventApi } from '../../services/schoolApi'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-hot-toast'

export default function TeacherEvents() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState({ id: null, title: '', date: '', location: '', event_type: 'notice', target_class: '', description: '', status: 'upcoming' })

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await eventApi.getAll({ status: filter !== 'all' ? filter : undefined, category: 'event' })
      // Filter out competition types if they are mixed in the DB, though ideally they should be separate
      const allEvents = (res.data?.events || []).filter(e => 
        ['school', 'notice', 'celebration', 'meeting', 'workshop', 'seminar', 'science_fair'].includes(e.event_type)
      ).map(e => {
        // Auto-complete if date has passed
        if (e.event_date) {
           const eventDate = new Date(e.event_date);
           eventDate.setHours(23, 59, 59, 999);
           if (new Date() > eventDate) {
              e.status = 'completed';
           }
        }
        return e;
      })
      setEvents(allEvents)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load events.')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const handleSave = async () => {
    if (!form.title || !form.date) return toast.error("Title and Date are required")
    const payload = { ...form, event_date: form.date, category: 'event' }
    try {
      if (form.id) {
        await eventApi.update(form.id, payload)
        toast.success("Event updated successfully")
      } else {
        await eventApi.create(payload)
        toast.success("Event created successfully")
      }
      setIsModalOpen(false)
      fetchEvents()
    } catch (err) {
      toast.error(form.id ? "Failed to update event" : "Failed to create event")
    }
  }

  const handleEdit = (row) => {
    setForm({
      id: row.id,
      title: row.title,
      date: row.event_date?.substring(0, 10) || '',
      location: row.location || '',
      event_type: row.event_type || 'notice',
      target_class: row.target_class || '',
      description: row.description || '',
      status: row.status || 'upcoming'
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return
    try {
      await eventApi.delete(id)
      toast.success("Event deleted")
      fetchEvents()
    } catch (err) {
      toast.error("Failed to delete event")
    }
  }

  const upcoming = events.filter(e => e.status === 'upcoming').length
  const ongoing = events.filter(e => e.status === 'ongoing').length
  const completed = events.filter(e => e.status === 'completed').length

  const columns = [
    { 
      key: 'title', label: 'Event Name', 
      render: (v, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            {row.event_type === 'notice' ? <Megaphone size={16} /> : 
             row.event_type === 'meeting' ? <MessageSquare size={16} /> : 
             <Info size={16} />}
          </div>
          <span className="font-bold text-slate-700">{v}</span>
        </div>
      )
    },
    { key: 'creator', label: 'Created By', render: (_, row) => (
        <div className="text-xs">
          <span className="font-bold text-slate-700">{row.creator?.name || 'Unknown'}</span>
          <span className="block text-[10px] text-slate-600 capitalize">{row.creator?.role || 'System'}</span>
        </div>
      )
    },
    { key: 'event_date', label: 'Date', render: v => v?.slice(0, 10) || '—' },
    { key: 'location', label: 'Location' },
    {
      key: 'event_type', label: 'Type',
      render: v => <span className="text-[10px] font-black capitalize bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">{v?.replace('_', ' ')}</span>
    },
    { key: 'target_class', label: 'Target' },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    {
      key: 'actions', label: 'Actions', render: (_, row) => (
        <div className="flex items-center gap-2">
          {row.created_by === user?.id && (
            <>
              <button onClick={() => handleEdit(row)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors" title="Edit"><Edit2 size={14} /></button>
              <button onClick={() => handleDelete(row.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors" title="Delete"><Trash2 size={14} /></button>
            </>
          )}
        </div>
      )
    }
  ]

  if (loading && events.length === 0) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-brand-500" /></div>
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Events & Notices</h1>
          <p className="text-slate-500 text-sm font-medium">Informational activities, meetings, and school celebrations</p>
        </div>
        <button onClick={() => {
          setForm({ id: null, title: '', date: '', location: '', event_type: 'notice', target_class: '', description: '', status: 'upcoming' })
          setIsModalOpen(true)
        }} className="btn-primary gap-2">
          <Plus size={18} /> Create Event
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <StatCard title="Upcoming" value={upcoming} icon={Calendar} color="blue" />
        <StatCard title="Ongoing" value={ongoing} icon={Clock} color="amber" />
        <StatCard title="Completed" value={completed} icon={CheckCircle} color="green" />
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <SectionHeader title="Activity Log" subtitle={`${events.length} informational events`} />
          <select value={filter} onChange={e => setFilter(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-brand-300">
            <option value="all">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <DataTable columns={columns} rows={events} emptyMessage="No events found." />
      </div>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={form.id ? "Edit Event / Notice" : "Create Event / Notice"}>
        <div className="space-y-4">
          <FormInput label="Event Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Science Fair, Staff Meeting" />
          <div className="grid grid-cols-2 gap-3">
            <FormInput type="date" label="Date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
            <SelectDropdown 
              label="Type" 
              value={form.event_type} 
              onChange={e => setForm({...form, event_type: e.target.value})}
              options={[
                { value: 'notice', label: '📢 Notice/Announcement' },
                { value: 'school', label: '🏫 School Event' },
                { value: 'celebration', label: '🎉 Celebration' },
                { value: 'meeting', label: '💬 Meeting' },
                { value: 'workshop', label: '📚 Workshop/Seminar' },
                { value: 'science_fair', label: '🧪 Science Fair' }
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormInput label="Location" value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="e.g. Auditorium" />
            <FormInput label="Target Audience" value={form.target_class} onChange={e => setForm({...form, target_class: e.target.value})} placeholder="e.g. All Teachers" />
          </div>
          <FormInput type="textarea" label="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          <div className="flex gap-2 pt-4 border-t">
            <button onClick={handleSave} className="btn-primary flex-1">{form.id ? 'Save Changes' : 'Create Event'}</button>
            <button onClick={() => setIsModalOpen(false)} className="btn-secondary px-6">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
