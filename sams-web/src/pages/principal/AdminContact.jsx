import { useState } from 'react';
import clsx from 'clsx';
import { Mail, CheckCircle, Trash2, Search, Filter, Eye, Clock } from 'lucide-react';
import { StatCard, SectionHeader, DataTable, Modal, StatusBadge } from '../../components/ui/index.jsx';

const MOCK_MESSAGES = [
  { id: 1, full_name: 'Rahul Sharma', email: 'rahul.sr@gmail.com', subject: 'Admissions Inquiry for 2024', message: 'Hello, I want to know the admission process for Grade 8. Thanks.', status: 'new', created_at: '2024-03-24 10:30 AM' },
  { id: 2, full_name: 'Anjali Verma', email: 'anjali89@yahoo.com', subject: 'Transport Facility Issue', message: 'The bus route No 4 was late today by 30 mins.', status: 'read', created_at: '2024-03-23 08:15 AM' },
  { id: 3, full_name: 'Priya Singh', email: 'priya.singh@outlook.com', subject: 'Syllabus Meeting Request', message: 'Can we schedule a meeting regarding the term 2 syllabus?', status: 'replied', created_at: '2024-03-21 14:00 PM' }
];

export default function AdminContact() {
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState(null);

  const filteredMessages = messages.filter(m => {
    const matchSearch = m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || m.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'All' || m.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      setMessages(prev => prev.filter(m => m.id !== id));
      if (selectedMsg && selectedMsg.id === id) setIsViewModalOpen(false);
    }
  };

  const handleUpdateStatus = (id, newStatus) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
    if (selectedMsg && selectedMsg.id === id) {
      setSelectedMsg({ ...selectedMsg, status: newStatus });
    }
  };

  const openMessage = (msg) => {
    setSelectedMsg(msg);
    setIsViewModalOpen(true);
    if (msg.status === 'new') {
      handleUpdateStatus(msg.id, 'read');
    }
  }

  const COLUMNS = [
    { key: 'full_name', label: 'Sender', sortable: true, render: (v, row) => (
      <div>
        <p className="font-semibold text-slate-800">{v}</p>
        <p className="text-xs text-slate-400">{row.email}</p>
      </div>
    )},
    { key: 'subject', label: 'Subject', render: v => <span className="text-sm text-slate-600 font-medium truncate max-w-[200px] block">{v}</span> },
    { key: 'created_at', label: 'Date', sortable: true, render: v => <span className="text-xs text-slate-500">{v}</span> },
    { key: 'status', label: 'Status', render: v => {
        let badgeColor = 'badge-blue';
        if (v === 'read') badgeColor = 'badge-amber';
        if (v === 'replied') badgeColor = 'badge-green';
        return <span className={clsx("badge", badgeColor)}>{v.toUpperCase()}</span>;
    }},
    { key: 'actions', label: 'Actions', render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openMessage(row)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" title="View Message">
             <Eye size={15} />
          </button>
          <button onClick={() => handleDelete(row.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500" title="Delete">
             <Trash2 size={15} />
          </button>
        </div>
    )}
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader title="Contact Messages" subtitle="Manage inquiries, feedback, and website contact submissions" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <StatCard title="Total Messages" value={messages.length} icon={Mail} color="blue" />
         <StatCard title="Unread (New)" value={messages.filter(m => m.status === 'new').length} icon={Clock} color="amber" />
         <StatCard title="Replied" value={messages.filter(m => m.status === 'replied').length} icon={CheckCircle} color="green" />
      </div>

      <div className="card p-6">
         <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
            <div className="flex gap-2">
               {['All', 'new', 'read', 'replied'].map(status => (
                  <button 
                     key={status} 
                     onClick={() => setFilterStatus(status)}
                     className={clsx("px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors", filterStatus === status ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600")}
                  >
                     {status}
                  </button>
               ))}
            </div>
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
               <input 
                  type="text" 
                  placeholder="Search sender or subject..." 
                  className="input pl-10 py-2 text-sm w-full md:w-64"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
               />
            </div>
         </div>

         <DataTable columns={COLUMNS} rows={filteredMessages} emptyMessage="No messages found." />
      </div>

      <Modal open={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Message Details" size="md">
        {selectedMsg && (
          <div className="space-y-5">
             <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                   <h3 className="font-bold text-slate-800 text-lg">{selectedMsg.subject}</h3>
                   <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm font-semibold text-slate-600">{selectedMsg.full_name}</p>
                      <span className="text-xs text-slate-400">&lt;{selectedMsg.email}&gt;</span>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-xs text-slate-400 font-medium mb-1">{selectedMsg.created_at}</p>
                   {selectedMsg.status === 'new' && <span className="badge badge-blue">NEW</span>}
                   {selectedMsg.status === 'read' && <span className="badge badge-amber">READ</span>}
                   {selectedMsg.status === 'replied' && <span className="badge badge-green">REPLIED</span>}
                </div>
             </div>

             <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedMsg.message}</p>
             </div>

             <div className="pt-4 flex gap-3 border-t border-slate-100">
                 {selectedMsg.status !== 'replied' && (
                    <button onClick={() => handleUpdateStatus(selectedMsg.id, 'replied')} className="btn-primary flex-1">Mark as Replied</button>
                 )}
                 <button onClick={() => handleDelete(selectedMsg.id)} className="btn-outline flex-1 text-rose-500 border-rose-200 hover:bg-rose-50">Delete Message</button>
             </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
