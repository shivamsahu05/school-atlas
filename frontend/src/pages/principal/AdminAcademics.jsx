import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import axios from 'axios'
import {
    GraduationCap,
    LayoutGrid,
    BookOpen,
    Plus,
    Pencil,
    Trash2,
    X,
    Check,
    Info,
    AlertTriangle,
    Layers,
    ChevronRight,
    Search,
    Book,
    Lightbulb,
    Users,
    Save
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || '';

// ═══════════════════════════════════════════════════════════════════════════════
// REUSABLE UI COMPONENTS (self-contained)
// ═══════════════════════════════════════════════════════════════════════════════

function Card({ children, className = '' }) {
    return <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${className}`}>{children}</div>
}

function Button({ children, onClick, disabled, variant = 'primary', size = 'md', className = '', ...rest }) {
    const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
    const sizes = { sm: 'px-3 py-1.5 text-xs gap-1.5', md: 'px-5 py-2.5 text-sm gap-2' }
    const variants = {
        primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm focus:ring-indigo-500',
        secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 focus:ring-slate-200',
        danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm focus:ring-red-500',
        success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm focus:ring-emerald-500',
        warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm focus:ring-amber-500',
    }
    return <button onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...rest}>{children}</button>
}

function Badge({ children, variant = 'default' }) {
    const variants = {
        default: 'bg-slate-100 text-slate-600',
        success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
        warning: 'bg-amber-50 text-amber-700 border border-amber-100',
        info: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
    }
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${variants[variant]}`}>{children}</span>
}

function Modal({ isOpen, onClose, title, children, footer }) {
    if (!isOpen) return null
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">{children}</div>
                {footer && <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-xl">{footer}</div>}
            </div>
        </div>
    )
}

function Input({ label, ...props }) {
    return (
        <div className="space-y-1.5">
            {label && <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>}
            <input className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none text-sm transition-all placeholder:text-slate-400" {...props} />
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const AdminAcademics = () => {
    // Data States
    const [classes, setClasses] = useState([])
    const [sections, setSections] = useState([])          // master sections (pool)
    const [subjects, setSubjects] = useState([])          // master subjects (pool)
    const [streams, setStreams] = useState([])            // master streams (for HS)

    const CLASS_OPTIONS = {
        primary: [
            { id: 'Pre-Nursery', name: 'Pre-Nursery', sort: 1 },
            { id: 'Nursery', name: 'Nursery', sort: 2 },
            { id: 'LKG', name: 'LKG', sort: 3 },
            { id: 'UKG', name: 'UKG', sort: 4 },
            { id: '1', name: 'Class 1', sort: 5 },
            { id: '2', name: 'Class 2', sort: 6 },
            { id: '3', name: 'Class 3', sort: 7 },
            { id: '4', name: 'Class 4', sort: 8 },
            { id: '5', name: 'Class 5', sort: 9 },
            { id: '6', name: 'Class 6', sort: 10 },
            { id: '7', name: 'Class 7', sort: 11 },
            { id: '8', name: 'Class 8', sort: 12 }
        ],
        high_school: [
            { id: '9', name: 'Class 9', sort: 13 },
            { id: '10', name: 'Class 10', sort: 14 }
        ],
        higher_secondary: [
            { id: '11', name: 'Class 11', sort: 15 },
            { id: '12', name: 'Class 12', sort: 16 }
        ]
    };

    const handleClassIdentifierChange = (identifier) => {
        const options = CLASS_OPTIONS[classForm.classCategory] || [];
        const opt = options.find(o => o.id === identifier);
        if (opt) {
            setClassForm(f => ({ ...f, classNumber: opt.id, name: opt.name, sortOrder: opt.sort }));
        } else {
            setClassForm(f => ({ ...f, classNumber: identifier }));
        }
    };

    const handleCategoryChange = (category) => {
        setClassForm(f => ({ ...f, classCategory: category, classNumber: '', name: '', sortOrder: '' }));
    };

    // Selection State
    const [selectedClass, setSelectedClass] = useState(null)
    const [activeTab, setActiveTab] = useState('sections') // for regular classes: 'sections' or 'subjects'

    // Class-specific data
    const [classSections, setClassSections] = useState([])
    const [classSubjects, setClassSubjects] = useState([])
    const [classStreams, setClassStreams] = useState([])
    const [selectedStream, setSelectedStream] = useState(null)
    const [streamSections, setStreamSections] = useState([])
    const [streamSubjects, setStreamSubjects] = useState([])

    // Loading States
    const [loading, setLoading] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)

    // Confirm Dialog
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null })

    const showConfirmDialog = (title, message) => {
        return new Promise((resolve) => {
            setConfirmDialog({
                open: true,
                title,
                message,
                onConfirm: () => { setConfirmDialog({ open: false, title: '', message: '', onConfirm: null }); resolve(true) },
                onCancel: () => { setConfirmDialog({ open: false, title: '', message: '', onConfirm: null }); resolve(false) }
            })
        })
    }

    // Modal States
    const [modals, setModals] = useState({
        class: false,
        section: false,    // for adding a new section directly to the selected class
        subject: false,    // for adding a new subject directly to the selected class
        stream: false
    })

    // Form States
    const [classForm, setClassForm] = useState({ name: '', classNumber: '', sortOrder: '', classCategory: 'primary', description: '' })
    const [sectionForm, setSectionForm] = useState({ name: '', code: '', description: '' })
    const [subjectForm, setSubjectForm] = useState({ name: '', code: '', description: '' })
    const [streamForm, setStreamForm] = useState({ name: '', code: '', description: '' })
    
    const [editingId, setEditingId] = useState(null)
    const [editingStreamId, setEditingStreamId] = useState(null)

    const token = JSON.parse(localStorage.getItem('sams_session') || '{}')?.token
    const headers = { 'Authorization': `Bearer ${token}` }

    const isHigherSecondary = (cls) => {
        if (!cls) return false
        const cn = String(cls.class_number)
        return cn === '11' || cn === '12' || cls.class_category === 'higher_secondary'
    }

    // Initial fetch
    useEffect(() => { fetchInitialData() }, [])

    // When selected class changes, fetch its details
    useEffect(() => {
        if (selectedClass) {
            fetchClassDetails(selectedClass.id)
            if (isHigherSecondary(selectedClass)) {
                fetchClassStreams(selectedClass.id)
            } else {
                setActiveTab('sections')
            }
            setSelectedStream(null)
        } else {
            setClassSections([])
            setClassSubjects([])
            setClassStreams([])
            setSelectedStream(null)
        }
    }, [selectedClass])

    // When stream selected, fetch its details
    useEffect(() => {
        if (selectedStream) {
            fetchStreamDetails(selectedStream.id)
        } else {
            setStreamSections([])
            setStreamSubjects([])
        }
    }, [selectedStream])

    const fetchInitialData = async () => {
        setLoading(true)
        try {
            const [classesRes, sectionsRes, subjectsRes] = await Promise.all([
                fetch(`${API_URL}/api/admin/classes`, { headers }),
                fetch(`${API_URL}/api/admin/sections`, { headers }),
                fetch(`${API_URL}/api/admin/subjects`, { headers })
            ])

            const [classesData, sectionsData, subjectsData] = await Promise.all([
                classesRes.json(), sectionsRes.json(), subjectsRes.json()
            ])

            if (classesData.success) {
                const classesArray = classesData.data || classesData.classes || []
                const sorted = [...classesArray].sort((a, b) =>
                    (a.name || '').localeCompare(b.name || '', undefined, { numeric: true })
                )
                setClasses(sorted)
            }
            if (sectionsData.success) setSections(sectionsData.data || sectionsData.sections || [])
            if (subjectsData.success) setSubjects(subjectsData.data || subjectsData.subjects || [])

            try {
                const streamsRes = await fetch(`${API_URL}/api/admin/streams`, { headers })
                const streamsData = await streamsRes.json()
                if (streamsData.success) setStreams(streamsData.data || streamsData.streams || [])
            } catch (e) { /* streams may not exist */ }
        } catch (error) {
            console.error('Error fetching data:', error)
            toast.error('Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    const fetchClassDetails = async (classId) => {
        setActionLoading(true)
        try {
            const [sectionsRes, subjectsRes] = await Promise.all([
                fetch(`${API_URL}/api/admin/class-sections/${classId}`, { headers }),
                fetch(`${API_URL}/api/admin/class-subjects/${classId}`, { headers })
            ])
            const [sectionsData, subjectsData] = await Promise.all([sectionsRes.json(), subjectsRes.json()])
            if (sectionsData.success) setClassSections(sectionsData.data || sectionsData.sections || [])
            if (subjectsData.success) setClassSubjects(subjectsData.data || subjectsData.subjects || [])
        } catch (error) {
            console.error('Error fetching class details:', error)
            toast.error('Failed to load class details')
        } finally {
            setActionLoading(false)
        }
    }

    const fetchClassStreams = async (classId) => {
        try {
            const res = await fetch(`${API_URL}/api/admin/class-streams/${classId}`, { headers })
            const data = await res.json()
            if (data.success) setClassStreams(data.data || data.streams || [])
        } catch (e) { console.error('Error fetching class streams:', e) }
    }

    const fetchStreamDetails = async (streamId) => {
        if (!selectedClass) return
        try {
            const secRes = await fetch(`${API_URL}/api/admin/class-sections/${selectedClass.id}?stream_id=${streamId}`, { headers })
            const secData = await secRes.json()
            if (secData.success) setStreamSections(secData.data || secData.sections || [])
            if (subData.success) setStreamSubjects(subData.data || subData.subjects || [])
        } catch (e) { console.error('Error fetching stream details:', e) }
    }

    // ── CLASS CRUD ────────────────────────────────────────────────────────────
    const handleSaveClass = async () => {
        if (!classForm.name || !classForm.classNumber) {
            toast.error('Name and Class Identifier are required')
            return
        }
        setActionLoading(true)
        try {
            const method = editingId ? 'PUT' : 'POST'
            const url = editingId
                ? `${API_URL}/api/admin/classes-extended/${editingId}`
                : `${API_URL}/api/admin/classes-extended`

            const body = {
                name: classForm.name,
                class_number: classForm.classNumber,
                sort_order: classForm.sortOrder || 0,
                class_category: classForm.classCategory || 'primary',
                description: classForm.description
            }

            const res = await fetch(url, {
                method,
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })
            const data = await res.json()

            if (data.success) {
                toast.success(editingId ? 'Class updated' : 'Class created')
                setModals({ ...modals, class: false })
                setClassForm({ name: '', classNumber: '', sortOrder: '', classCategory: 'primary', description: '' })
                setEditingId(null)
                fetchInitialData()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.error('Error saving class:', error)
            toast.error('Failed to save class')
        } finally {
            setActionLoading(false)
        }
    }

    const handleDeleteClass = async (id) => {
        const ok = await showConfirmDialog('Delete Class', 'Are you sure? This will remove the class and all its assigned sections, subjects, and groups.')
        if (!ok) return
        try {
            const res = await fetch(`${API_URL}/api/admin/classes/${id}`, { method: 'DELETE', headers })
            const data = await res.json()
            if (data.success) {
                toast.success('Class deleted')
                if (selectedClass?.id === id) setSelectedClass(null)
                fetchInitialData()
            } else {
                await showConfirmDialog('Cannot Delete', data.message || 'This class cannot be deleted.')
                toast.error(data.message)
            }
        } catch (error) {
            console.error('Error deleting class:', error)
            toast.error('Failed to delete class')
        }
    }

    // ── SECTION CRUD & ASSIGNMENT ─────────────────────────────────────────────
    const handleCreateAndAssignSection = async () => {
        if (!sectionForm.name || !sectionForm.code) {
            toast.error('Name and Code are required')
            return
        }
        if (!selectedClass) {
            toast.error('Please select a class first')
            return
        }
        setActionLoading(true)
        try {
            let sectionId = null

            // 1. Try to create section in master
            const secRes = await fetch(`${API_URL}/api/admin/sections`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify(sectionForm)
            })
            const secData = await secRes.json()

            if (secData.success) {
                sectionId = secData.section?.id || secData.id
            } else {
                // Section already exists — find its ID from the master list
                const existingSection = sections.find(
                    s => s.name?.toLowerCase() === sectionForm.name.toLowerCase() ||
                         s.code?.toLowerCase() === sectionForm.code.toLowerCase()
                )
                if (existingSection) {
                    sectionId = existingSection.id
                } else {
                    // Refresh sections and try again
                    const refreshRes = await fetch(`${API_URL}/api/admin/sections`, { headers })
                    const refreshData = await refreshRes.json()
                    if (refreshData.success) {
                        setSections(refreshData.sections)
                        const found = refreshData.sections.find(
                            s => s.name?.toLowerCase() === sectionForm.name.toLowerCase() ||
                                 s.code?.toLowerCase() === sectionForm.code.toLowerCase()
                        )
                        if (found) sectionId = found.id
                    }
                }
                if (!sectionId) {
                    toast.error(secData.message || 'Failed to create section')
                    return
                }
            }

            // 2. Assign to current class
            const assignRes = await fetch(`${API_URL}/api/admin/class-sections`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ class_id: selectedClass.id, section_id: sectionId })
            })
            const assignData = await assignRes.json()
            if (assignData.success) {
                toast.success('Section assigned to class')
                setModals({ ...modals, section: false })
                setSectionForm({ name: '', code: '', description: '' })
                fetchInitialData()           // refresh master sections
                fetchClassDetails(selectedClass.id)  // refresh class sections
            } else {
                toast.error('Assignment failed: ' + assignData.message)
            }
        } catch (error) {
            console.error('Error creating section:', error)
            toast.error('Failed to create section')
        } finally {
            setActionLoading(false)
        }
    }

    const handleAssignExistingSection = async (sectionId) => {
        if (!selectedClass) return
        setActionLoading(true)
        try {
            const res = await fetch(`${API_URL}/api/admin/class-sections`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ class_id: selectedClass.id, section_id: sectionId })
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Section assigned')
                fetchClassDetails(selectedClass.id)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.error('Error assigning section:', error)
        } finally {
            setActionLoading(false)
        }
    }

    const handleUnassignSection = async (mappingId, sectionId) => {
        const ok = await showConfirmDialog('Remove Section', 'Remove this section from the class?')
        if (!ok) return

        let success = false
        let errorMessage = ''

        if (mappingId) {
            try {
                const res = await fetch(`${API_URL}/api/admin/class-sections/${mappingId}`, { method: 'DELETE', headers })
                const data = await res.json()
                if (data.success) success = true
                else errorMessage = data.message
            } catch (error) { errorMessage = 'Network error' }
        }

        if (!success && selectedClass && sectionId) {
            try {
                const res = await fetch(`${API_URL}/api/admin/class-sections-by-params?class_id=${selectedClass.id}&section_id=${sectionId}`, { method: 'DELETE', headers })
                const data = await res.json()
                if (data.success) success = true
                else errorMessage = data.message || errorMessage
            } catch (error) { errorMessage = 'Failed to remove section' }
        }

        if (success) {
            toast.success('Section removed')
            fetchClassDetails(selectedClass.id)
            if (selectedStream) fetchStreamDetails(selectedStream.id)
        } else {
            toast.error(errorMessage || 'Failed to remove section')
        }
    }

    // ── SUBJECT CRUD & ASSIGNMENT ─────────────────────────────────────────────
    const handleCreateAndAssignSubject = async () => {
        if (!subjectForm.name || !subjectForm.code) {
            toast.error('Name and Code are required')
            return
        }
        if (!selectedClass) {
            toast.error('Please select a class first')
            return
        }
        setActionLoading(true)
        try {
            let subjectId = null

            // 1. Try to create subject in master
            const subRes = await fetch(`${API_URL}/api/admin/subjects`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify(subjectForm)
            })
            const subData = await subRes.json()

            if (subData.success) {
                subjectId = subData.subject?.id || subData.id
            } else {
                // Subject already exists — find its ID from the master list
                const existingSubject = subjects.find(
                    s => s.name?.toLowerCase() === subjectForm.name.toLowerCase() ||
                         s.code?.toLowerCase() === subjectForm.code.toLowerCase()
                )
                if (existingSubject) {
                    subjectId = existingSubject.id
                } else {
                    // Refresh subjects and try again
                    const refreshRes = await fetch(`${API_URL}/api/admin/subjects`, { headers })
                    const refreshData = await refreshRes.json()
                    if (refreshData.success) {
                        setSubjects(refreshData.subjects)
                        const found = refreshData.subjects?.find(
                            s => s.name?.toLowerCase() === subjectForm.name.toLowerCase() ||
                                 s.code?.toLowerCase() === subjectForm.code.toLowerCase()
                        )
                        if (found) subjectId = found.id
                    }
                }
                if (!subjectId) {
                    toast.error(subData.message || 'Failed to create subject')
                    return
                }
            }

            // 2. Assign to current class
            const assignRes = await fetch(`${API_URL}/api/admin/class-subjects`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ class_id: selectedClass.id, subject_id: subjectId, stream_id: selectedStream?.id || null })
            })
            const assignData = await assignRes.json()
            if (assignData.success) {
                toast.success('Subject assigned to class')
                setModals({ ...modals, subject: false })
                setSubjectForm({ name: '', code: '', description: '' })
                fetchInitialData()
                fetchClassDetails(selectedClass.id)
                if (selectedStream) fetchStreamDetails(selectedStream.id)
            } else {
                toast.error('Assignment failed: ' + assignData.message)
            }
        } catch (error) {
            console.error('Error creating subject:', error)
            toast.error('Failed to create subject')
        } finally {
            setActionLoading(false)
        }
    }

    const handleAssignExistingSubject = async (subjectId) => {
        if (!selectedClass) return
        setActionLoading(true)
        try {
            const res = await fetch(`${API_URL}/api/admin/class-subjects`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ class_id: selectedClass.id, subject_id: subjectId, stream_id: selectedStream?.id || null })
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Subject assigned')
                fetchClassDetails(selectedClass.id)
                if (selectedStream) fetchStreamDetails(selectedStream.id)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.error('Error assigning subject:', error)
        } finally {
            setActionLoading(false)
        }
    }

    const handleUnassignSubject = async (mappingId, subjectId) => {
        const ok = await showConfirmDialog('Remove Subject', 'Remove this subject from the class?')
        if (!ok) return

        let success = false
        let errorMessage = ''

        if (mappingId) {
            try {
                const res = await fetch(`${API_URL}/api/admin/class-subjects/${mappingId}`, { method: 'DELETE', headers })
                const data = await res.json()
                if (data.success) success = true
                else errorMessage = data.message
            } catch (error) { errorMessage = 'Network error' }
        }

        if (!success && selectedClass && subjectId) {
            try {
                const res = await fetch(`${API_URL}/api/admin/class-subjects-by-params?class_id=${selectedClass.id}&subject_id=${subjectId}`, { method: 'DELETE', headers })
                const data = await res.json()
                if (data.success) success = true
                else errorMessage = data.message || errorMessage
            } catch (error) { errorMessage = 'Failed to remove subject' }
        }

        if (success) {
            toast.success('Subject removed')
            fetchClassDetails(selectedClass.id)
            if (selectedStream) fetchStreamDetails(selectedStream.id)
        } else {
            toast.error(errorMessage || 'Failed to remove subject')
        }
    }

    // ── STREAM HANDLERS (unchanged but integrated) ────────────────────────────
    const handleCreateStream = async () => {
        if (!streamForm.name || !streamForm.code) {
            toast.error('Name and Code are required')
            return
        }
        try {
            if (editingStreamId) {
                await axios.put(`${API_URL}/api/admin/streams/${editingStreamId}`, streamForm, { headers: { ...headers, 'Content-Type': 'application/json' } })
                toast.success('Group updated')
            } else {
                const res = await axios.post(`${API_URL}/api/admin/streams`, streamForm, { headers: { ...headers, 'Content-Type': 'application/json' } })
                const newStreamId = res.data.id

                if (selectedClass) {
                    await axios.post(`${API_URL}/api/admin/class-streams`, {
                        class_id: selectedClass.id,
                        stream_id: newStreamId
                    }, { headers: { ...headers, 'Content-Type': 'application/json' } })
                }
                toast.success('Group created and linked')
            }
            setModals({ ...modals, stream: false })
            setEditingStreamId(null)
            setStreamForm({ name: '', code: '', description: '' })
            const streamsRes = await fetch(`${API_URL}/api/admin/streams`, { headers })
            const streamsData = await streamsRes.json()
            if (streamsData.success) setStreams(streamsData.streams)
            if (selectedClass) fetchClassStreams(selectedClass.id)
        } catch (e) { toast.error(e.response?.data?.message || 'Failed to save group') }
    }

    const handleLinkStreamToClass = async (streamId) => {
        if (!selectedClass) return
        try {
            await axios.post(`${API_URL}/api/admin/class-streams`, { class_id: selectedClass.id, stream_id: streamId }, { headers: { ...headers, 'Content-Type': 'application/json' } })
            toast.success('Group linked to class')
            fetchClassStreams(selectedClass.id)
        } catch (e) { toast.error('Failed to link group') }
    }

    const handleUnlinkStream = async (linkId) => {
        const ok = await showConfirmDialog('Remove Group', 'Remove this group from the class?')
        if (!ok) return
        try {
            await axios.delete(`${API_URL}/api/admin/class-streams/${linkId}`, { headers })
            toast.success('Group removed from class')
            if (selectedStream && classStreams.find(cs => cs.link_id === linkId)?.id === selectedStream.id) {
                setSelectedStream(null)
            }
            fetchClassStreams(selectedClass.id)
        } catch (e) { toast.error('Failed to remove group') }
    }

    const handleAssignSectionToStream = async (sectionId) => {
        if (!selectedClass || !selectedStream) return
        setActionLoading(true)
        try {
            await axios.post(`${API_URL}/api/admin/class-sections`, {
                class_id: selectedClass.id,
                section_id: sectionId,
                stream_id: selectedStream.id
            }, { headers: { ...headers, 'Content-Type': 'application/json' } })
            toast.success('Section assigned to group')
            fetchStreamDetails(selectedStream.id)
            fetchClassDetails(selectedClass.id)
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to assign section')
        } finally {
            setActionLoading(false)
        }
    }

    // ── FILTERING ────────────────────────────────────────────────────────────
    const sortedSections = [...sections].sort((a, b) => a.name.localeCompare(b.name))
    const sortedSubjects = [...subjects].sort((a, b) => a.name.localeCompare(b.name))

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════════

    return (
        <div className="space-y-6 pb-20 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 rounded-xl p-8 text-white shadow-lg shadow-indigo-200/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-500/30 rounded-lg backdrop-blur-md">
                            <GraduationCap size={24} className="text-white" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Academic Structure</h1>
                    </div>
                    <p className="text-indigo-100/90 text-sm max-w-md">
                        Create classes and then assign sections and subjects to them. For classes 11-12, you can also define academic groups (streams).
                    </p>
                </div>
            </div>

            {/* Classes Overview */}
            <Card>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <GraduationCap size={20} className="text-indigo-600" />
                        <h2 className="font-bold text-slate-800">Classes</h2>
                        <Badge variant="info">{classes.length}</Badge>
                    </div>
                    <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                            setEditingId(null)
                            setClassForm({ name: '', classNumber: '', sortOrder: '', classCategory: 'primary', description: '' })
                            setModals({ ...modals, class: true })
                        }}
                    >
                        <Plus size={16} /> Add Class
                    </Button>
                </div>
                <div className="flex flex-wrap gap-2.5">
                    {loading ? (
                        <div className="w-full text-center py-8 text-slate-400">
                            <div className="animate-spin w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2" />
                            Loading classes...
                        </div>
                    ) : classes.length === 0 ? (
                        <div className="w-full text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                            No classes found. Add your first class to begin.
                        </div>
                    ) : (
                        [...classes].sort((a, b) => {
                            const numA = parseInt(a.class_number) || 0
                            const numB = parseInt(b.class_number) || 0
                            return numA - numB || String(a.class_number).localeCompare(String(b.class_number))
                        }).map(cls => (
                            <div
                                key={cls.id}
                                className={`group relative inline-flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 border text-sm font-semibold select-none ${selectedClass?.id === cls.id
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100'
                                    : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/30'
                                    }`}
                                onClick={() => setSelectedClass(cls)}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${selectedClass?.id === cls.id ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-indigo-100'}`}>
                                    <span className={selectedClass?.id === cls.id ? 'text-white' : 'text-indigo-600'}>
                                        {cls.class_number || '?'}
                                    </span>
                                </div>
                                <span>{cls.name}</span>
                                <div className={`flex items-center gap-1.5 ml-1 transition-all duration-200 ${selectedClass?.id === cls.id ? 'opacity-100' : 'opacity-0 scale-90 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto'}`}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setEditingId(cls.id)
                                            setClassForm({ name: cls.name, classNumber: cls.class_number, sortOrder: cls.sort_order || '', classCategory: cls.class_category || 'primary', description: cls.description || '' })
                                            setModals({ ...modals, class: true })
                                        }}
                                        className={`p-1.5 rounded-lg transition-colors ${selectedClass?.id === cls.id ? 'hover:bg-white/20 text-white' : 'hover:bg-indigo-100 text-slate-400 hover:text-indigo-600'}`}
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteClass(cls.id) }}
                                        className={`p-1.5 rounded-lg transition-colors ${selectedClass?.id === cls.id ? 'hover:bg-white/20 text-white' : 'hover:bg-red-50 text-slate-400 hover:text-red-600'}`}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>

            {/* Class Details Panel */}
            {selectedClass ? (
                <Card className="border-t-4 border-indigo-500 shadow-lg shadow-indigo-50 !p-8">
                    {/* Class Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 pb-8 border-b border-slate-100">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-100">
                                {selectedClass.class_number}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h2 className="text-2xl font-extrabold text-slate-800">{selectedClass.name}</h2>
                                    {isHigherSecondary(selectedClass) && (
                                        <Badge variant="info">Higher Secondary</Badge>
                                    )}
                                </div>
                                <p className="text-slate-500 text-sm font-medium flex items-center gap-4">
                                    <span className="flex items-center gap-1.5"><LayoutGrid size={14} /> {classSections.length} Sections</span>
                                    <span className="flex items-center gap-1.5"><BookOpen size={14} /> {classSubjects.length} Subjects</span>
                                </p>
                            </div>
                        </div>
                        
                    </div>

                    {/* ===== HIGHER SECONDARY: Groups + Sections + Subjects ===== */}
                    {isHigherSecondary(selectedClass) ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Groups Management */}
                            <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-100">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                    <div className="flex items-center gap-2">
                                        <Layers size={20} className="text-emerald-600" />
                                        <h3 className="font-bold text-slate-800 tracking-tight">Academic Groups (Streams)</h3>
                                        <Badge variant="success">{classStreams.length}</Badge>
                                    </div>
                                    <Button size="sm" variant="success"
                                        onClick={() => { setStreamForm({ name: '', code: '', description: '' }); setEditingStreamId(null); setModals({ ...modals, stream: true }) }}>
                                        <Plus size={16} /> New Group
                                    </Button>
                                </div>

                                {/* Group pills */}
                                <div className="flex flex-wrap gap-3 mb-6">
                                    {classStreams.map(stream => (
                                        <div key={stream.link_id}
                                            className={`inline-flex items-center gap-3 px-5 py-3 rounded-xl cursor-pointer transition-all duration-200 border font-bold text-sm select-none ${selectedStream?.id === stream.id
                                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100'
                                                : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-600 hover:shadow-sm'
                                                }`}
                                            onClick={() => setSelectedStream(stream)}>
                                            <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] ${selectedStream?.id === stream.id ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                                                {stream.code}
                                            </div>
                                            <span>{stream.name}</span>
                                            {selectedStream?.id === stream.id && (
                                                <button onClick={(e) => { e.stopPropagation(); handleUnlinkStream(stream.link_id) }}
                                                    className="ml-1 hover:bg-emerald-500 rounded-full p-0.5 transition-colors" title="Remove from class">
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Link existing groups */}
                                {streams.filter(s => !classStreams.some(cs => cs.id === s.id)).length > 0 && (
                                    <div className="bg-white p-4 rounded-xl border border-slate-200/60">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Available Master Groups</p>
                                        <div className="flex flex-wrap gap-2">
                                            {streams.filter(s => !classStreams.some(cs => cs.id === s.id)).map(s => (
                                                <div key={s.id} className="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden hover:border-emerald-300 transition-all group/btn">
                                                    <button onClick={() => handleLinkStreamToClass(s.id)}
                                                        className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-emerald-600 transition-colors flex items-center gap-2" title="Add to class">
                                                        <Plus size={12} /> {s.name}
                                                    </button>
                                                    <div className="flex border-l border-slate-200 bg-white">
                                                        <button onClick={() => { setStreamForm({ name: s.name, code: s.code, description: s.description || '' }); setEditingStreamId(s.id); setModals({ ...modals, stream: true }) }}
                                                            className="px-2 py-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Edit Group">
                                                            <Pencil size={12} />
                                                        </button>
                                                        <button onClick={() => handleDeleteStream(s.id)}
                                                            className="px-2 py-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete Group">
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Selected Group → Sections + Subjects */}
                            {selectedStream ? (
                                <Card className="border-l-4 border-emerald-500 bg-white shadow-md animate-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center gap-2 mb-8">
                                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                            <Layers size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800">{selectedStream.name}</h3>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Configuration for {selectedClass.name}</p>
                                        </div>
                                    </div>

                                    <div className="grid lg:grid-cols-2 gap-10">
                                        {/* SECTIONS for this group */}
                                        <div className="space-y-6">
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                                    <LayoutGrid size={16} className="text-indigo-500" />
                                                    Assigned Sections
                                                    <Badge variant="info">{streamSections.length}</Badge>
                                                </h4>
                                                {streamSections.length > 0 ? (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {streamSections.map(sec => (
                                                            <div key={sec.mapping_id} className="group/item flex items-center justify-between p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl hover:bg-indigo-50 transition-colors">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[10px] font-bold text-indigo-600 border border-indigo-100">
                                                                        {sec.code}
                                                                    </div>
                                                                    <span className="text-sm font-bold text-slate-700">{sec.section_name}</span>
                                                                </div>
                                                                <button onClick={() => handleUnassignSection(sec.mapping_id, sec.section_id)}
                                                                    className="p-1 text-slate-300 hover:text-red-500 transition-colors" title="Remove section">
                                                                    <X size={16} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                                                        <p className="text-xs text-slate-400 font-medium">No sections assigned yet.</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-6 border-t border-slate-100">
                                                <div className="flex items-center justify-between mb-3">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Add more sections</p>
                                                    <Button size="sm" variant="secondary" onClick={() => setModals({ ...modals, section: true })}>
                                                        <Plus size={12} /> Create New Section
                                                    </Button>
                                                </div>
                                                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto px-1">
                                                    {sortedSections.map(sec => {
                                                        const isAssigned = streamSections.some(ss => ss.section_id === sec.id)
                                                        return (
                                                            <button
                                                                key={sec.id}
                                                                onClick={() => !isAssigned && handleAssignSectionToStream(sec.id)}
                                                                disabled={actionLoading || isAssigned}
                                                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${isAssigned
                                                                        ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                                                                        : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 active:scale-95'
                                                                    }`}>
                                                                {isAssigned ? <Check size={12} /> : <Plus size={12} />}
                                                                {sec.name}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* SUBJECTS for this group */}
                                        <div className="space-y-6">
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                                    <BookOpen size={16} className="text-amber-500" />
                                                    Assigned Subjects
                                                    <Badge variant="warning">{streamSubjects.length}</Badge>
                                                </h4>
                                                {streamSubjects.length > 0 ? (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {streamSubjects.map((sub, index) => (
                                                            <div key={sub.mapping_id || `subject-${index}`} className="group/item flex items-center justify-between p-3 bg-amber-50/50 border border-amber-100 rounded-xl hover:bg-amber-50 transition-colors">
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[10px] font-bold text-amber-600 border border-amber-100">
                                                                        {(sub.code || sub.subject_code || '??').charAt(0)}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <span className="text-sm font-bold text-slate-700 block truncate" title={sub.name || sub.subject_name}>{sub.name || sub.subject_name}</span>
                                                                        <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">{sub.code || sub.subject_code}</span>
                                                                    </div>
                                                                </div>
                                                                <button onClick={() => handleUnassignSubject(sub.mapping_id, sub.subject_id)}
                                                                    className="p-1 text-slate-300 hover:text-red-500 transition-colors" title="Remove subject">
                                                                    <X size={16} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                                                        <p className="text-xs text-slate-400 font-medium">No subjects assigned yet.</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-6 border-t border-slate-100">
                                                <div className="flex items-center justify-between mb-3">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Add more subjects</p>
                                                    <Button size="sm" variant="secondary" onClick={() => setModals({ ...modals, subject: true })}>
                                                        <Plus size={12} /> Create New Subject
                                                    </Button>
                                                </div>
                                                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto px-1">
                                                    {sortedSubjects.map(sub => {
                                                        const isAssigned = streamSubjects.some(cs => cs.subject_id === sub.id)
                                                        return (
                                                            <button
                                                                key={sub.id}
                                                                onClick={() => !isAssigned && handleAssignExistingSubject(sub.id)}
                                                                disabled={isAssigned}
                                                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${isAssigned
                                                                        ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                                                                        : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300 hover:text-amber-600 active:scale-95'
                                                                    }`}>
                                                                {isAssigned ? <Check size={12} /> : <Plus size={12} />}
                                                                {sub.name}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ) : classStreams.length > 0 ? (
                                <div className="text-center p-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
                                    <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-emerald-500">
                                        <ChevronRight size={32} />
                                    </div>
                                    <h4 className="font-bold text-slate-700">Select a Group</h4>
                                    <p className="text-sm text-slate-500 mt-1 max-w-[280px]">Choose a group above to manage its sections and subjects.</p>
                                </div>
                            ) : (
                                <div className="text-center p-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center">
                                    <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-slate-300">
                                        <Layers size={32} />
                                    </div>
                                    <h4 className="font-bold text-slate-700">No groups yet</h4>
                                    <p className="text-sm text-slate-500 mt-1 max-w-[280px]">Create a group (e.g., Science, Commerce) to start configuring {selectedClass.name}.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* ===== REGULAR CLASSES: Sections & Subjects ===== */
                        <div className="space-y-8">
                            {/* ── Sections ── */}
                                <div className="space-y-6 animate-in fade-in">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                            <LayoutGrid size={18} className="text-indigo-600" />
                                            Sections in this Class
                                            <Badge variant="info">{classSections.length}</Badge>
                                        </h3>
                                        <Button size="sm" variant="primary" onClick={() => setModals({ ...modals, section: true })}>
                                            <Plus size={16} /> Add Section
                                        </Button>
                                    </div>

                                    {classSections.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {classSections.map((sec, index) => (
                                                <div key={sec.mapping_id || `section-${index}`} className="group relative bg-white border border-slate-200 p-4 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all">
                                                    <button onClick={() => handleUnassignSection(sec.mapping_id, sec.section_id)}
                                                        className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                                        <X size={14} />
                                                    </button>
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-sm">
                                                            {sec.code}
                                                        </div>
                                                        <div className="pr-6">
                                                            <span className="font-bold text-slate-800 text-sm block">{sec.section_name}</span>
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase">{sec.code}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                                            <LayoutGrid size={40} className="mx-auto text-slate-200 mb-3" />
                                            <p className="text-slate-400 text-sm font-medium">No sections assigned yet.</p>
                                            <p className="text-xs text-slate-400 mt-1">Click "Add Section" to create a new section for this class.</p>
                                        </div>
                                    )}

                                    {/* Existing master sections pool */}
                                    {sections.length > 0 && (
                                        <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-100">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Or assign from existing master sections</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {sortedSections.map(sec => {
                                                    const isAssigned = classSections.some(cs => cs.section_id === sec.id)
                                                    return (
                                                        <button
                                                            key={sec.id}
                                                            onClick={() => !isAssigned && handleAssignExistingSection(sec.id)}
                                                            disabled={actionLoading || isAssigned}
                                                            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all rounded-xl border ${isAssigned
                                                                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                                                    : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600 hover:shadow-sm active:scale-95'
                                                                }`}>
                                                            {isAssigned ? <Check size={12} /> : <Plus size={12} />}
                                                            {sec.name}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                            {/* ── Divider ── */}
                            <div className="border-t border-slate-200" />

                            {/* ── Subjects ── */}
                                <div className="space-y-6 animate-in fade-in">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                            <BookOpen size={18} className="text-amber-600" />
                                            Subjects in this Class
                                            <Badge variant="warning">{classSubjects.length}</Badge>
                                        </h3>
                                        <Button size="sm" variant="primary" onClick={() => setModals({ ...modals, subject: true })}>
                                            <Plus size={16} /> Add Subject
                                        </Button>
                                    </div>

                                    {classSubjects.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {classSubjects.map((sub, index) => (
                                                <div key={sub.mapping_id || `subject-${index}`} className="group relative bg-white border border-slate-200 p-4 rounded-xl hover:border-amber-300 hover:shadow-md transition-all">
                                                    <button onClick={() => handleUnassignSubject(sub.mapping_id, sub.subject_id)}
                                                        className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                                        <X size={14} />
                                                    </button>
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-center text-amber-600 font-bold text-sm">
                                                            {(sub.code || sub.subject_code || '?').charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="pr-6">
                                                            <span className="font-bold text-slate-800 text-sm block" title={sub.name || sub.subject_name}>{sub.name || sub.subject_name}</span>
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase">{sub.code || sub.subject_code}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                                            <BookOpen size={40} className="mx-auto text-slate-200 mb-3" />
                                            <p className="text-slate-400 text-sm font-medium">No subjects assigned yet.</p>
                                            <p className="text-xs text-slate-400 mt-1">Click "Add Subject" to create a new subject for this class.</p>
                                        </div>
                                    )}

                                    {/* Existing master subjects pool */}
                                    {subjects.length > 0 && (
                                        <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-100">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Or assign from existing master subjects</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {sortedSubjects.map(sub => {
                                                    const isAssigned = classSubjects.some(cs => cs.subject_id === sub.id)
                                                    return (
                                                        <button
                                                            key={sub.id}
                                                            onClick={() => !isAssigned && handleAssignExistingSubject(sub.id)}
                                                            disabled={isAssigned}
                                                            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all rounded-xl border ${isAssigned
                                                                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                                                    : 'bg-white border-slate-200 text-slate-600 hover:border-amber-400 hover:text-amber-600 hover:shadow-sm active:scale-95'
                                                                }`}>
                                                            {isAssigned ? <Check size={12} /> : <Plus size={12} />}
                                                            {sub.name}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                        </div>
                    )}
                </Card>
            ) : (
                <div className="flex flex-col items-center justify-center p-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                    <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-6 text-indigo-500">
                        <Lightbulb size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Select a Class</h3>
                    <p className="text-slate-500 max-w-sm">Pick a class from the list above to manage its sections, subjects, and groups.</p>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                MODALS
            ═══════════════════════════════════════════════════════════════════ */}

            {/* Class Modal */}
            <Modal
                isOpen={modals.class}
                onClose={() => setModals({ ...modals, class: false })}
                title={editingId ? 'Edit Class' : 'New Academic Class'}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModals({ ...modals, class: false })}>Cancel</Button>
                        <Button variant="primary" onClick={handleSaveClass} disabled={actionLoading}>
                            {actionLoading ? 'Saving...' : (editingId ? 'Update Class' : 'Create Class')}
                        </Button>
                    </>
                }
            >
                <div className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Class Category</label>
                        <select
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-medium transition-all"
                            value={classForm.classCategory}
                            onChange={e => handleCategoryChange(e.target.value)}
                        >
                            <option value="primary">Primary (Pre-Nursery to 8)</option>
                            <option value="high_school">High School (9-10)</option>
                            <option value="higher_secondary">Higher Secondary (11-12)</option>
                        </select>
                        <p className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                            <Info size={12} /> Higher Secondary enables group/stream selection.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Class Identifier *</label>
                            <select
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-medium transition-all"
                                value={classForm.classNumber}
                                onChange={e => handleClassIdentifierChange(e.target.value)}
                            >
                                <option value="">Select Class...</option>
                                {(CLASS_OPTIONS[classForm.classCategory] || []).map(opt => (
                                    <option key={opt.id} value={opt.id}>{opt.id}</option>
                                ))}
                            </select>
                        </div>
                        <Input label="Sort Order *" placeholder="e.g. 1" type="number" value={classForm.sortOrder} onChange={e => setClassForm({ ...classForm, sortOrder: e.target.value })} />
                    </div>
                    <Input label="Class Name *" placeholder="e.g. Class 10 or Grade A" value={classForm.name} onChange={e => setClassForm({ ...classForm, name: e.target.value })} />
                </div>
            </Modal>

            {/* Section Modal (Create & Assign) */}
            <Modal
                isOpen={modals.section}
                onClose={() => setModals({ ...modals, section: false })}
                title="Add New Section to Class"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModals({ ...modals, section: false })}>Cancel</Button>
                        <Button variant="success" onClick={handleCreateAndAssignSection} disabled={actionLoading}>
                            {actionLoading ? 'Creating...' : 'Create & Assign'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-5">
                    <p className="text-sm text-slate-600">Create a new section and assign it to <strong>{selectedClass?.name}</strong>.</p>
                    <Input label="Section Name" placeholder="e.g. Section A or Lotus" value={sectionForm.name} onChange={e => setSectionForm({ ...sectionForm, name: e.target.value })} />
                    <Input label="Section Code" placeholder="e.g. A" value={sectionForm.code} onChange={e => setSectionForm({ ...sectionForm, code: e.target.value })} />
                </div>
            </Modal>

            {/* Subject Modal (Create & Assign) */}
            <Modal
                isOpen={modals.subject}
                onClose={() => setModals({ ...modals, subject: false })}
                title="Add New Subject to Class"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModals({ ...modals, subject: false })}>Cancel</Button>
                        <Button variant="warning" onClick={handleCreateAndAssignSubject} disabled={actionLoading}>
                            {actionLoading ? 'Creating...' : 'Create & Assign'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-5">
                    <p className="text-sm text-slate-600">Create a new subject and assign it to <strong>{selectedClass?.name}</strong>.</p>
                    <Input label="Subject Name" placeholder="e.g. Mathematics" value={subjectForm.name} onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })} />
                    <Input label="Subject Code" placeholder="e.g. MATH101" value={subjectForm.code} onChange={e => setSubjectForm({ ...subjectForm, code: e.target.value })} />
                    <Input label="Description (Optional)" placeholder="Brief overview" value={subjectForm.description} onChange={e => setSubjectForm({ ...subjectForm, description: e.target.value })} />
                </div>
            </Modal>

            {/* Stream Modal */}
            <Modal
                isOpen={modals.stream}
                onClose={() => { setModals({ ...modals, stream: false }); setEditingStreamId(null) }}
                title={editingStreamId ? 'Edit Group' : 'New Academic Group'}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModals({ ...modals, stream: false })}>Cancel</Button>
                        <Button variant="primary" onClick={handleCreateStream} disabled={actionLoading}>
                            {actionLoading ? (editingStreamId ? 'Updating...' : 'Creating...') : (editingStreamId ? 'Update Group' : 'Create Group')}
                        </Button>
                    </>
                }
            >
                <div className="space-y-5">
                    <Input label="Group Name" placeholder="e.g. Science, Arts, Commerce" value={streamForm.name} onChange={e => setStreamForm({ ...streamForm, name: e.target.value })} />
                    <Input label="Group Code" placeholder="e.g. SCI" value={streamForm.code} onChange={e => setStreamForm({ ...streamForm, code: e.target.value })} />
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex gap-3">
                        <AlertTriangle className="text-amber-600 flex-shrink-0" size={18} />
                        <p className="text-xs text-amber-800 leading-relaxed">
                            Groups are reusable across classes (e.g., Science for both Class 11 and 12).
                        </p>
                    </div>
                </div>
            </Modal>

            {/* Custom Confirmation Dialog */}
            {confirmDialog.open && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={confirmDialog.onCancel}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">{confirmDialog.title}</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Security Confirmation</p>
                                </div>
                            </div>
                            <p className="text-slate-600 mb-8 leading-relaxed whitespace-pre-line text-sm pl-16">
                                {confirmDialog.message}
                            </p>
                            <div className="flex justify-end gap-3">
                                <button onClick={confirmDialog.onCancel} className="px-5 py-2.5 rounded-xl text-slate-600 font-bold text-sm bg-slate-100 hover:bg-slate-200 transition-all border border-slate-200">
                                    Cancel
                                </button>
                                <button onClick={confirmDialog.onConfirm} className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-100 active:scale-95">
                                    Proceed Action
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminAcademics