import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getSchoolInquiries, replyToInquiry, updateInquiryStatus } from '../../services/inquiryService';

type InquiryStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

interface InquiryResponseItem {
  _id?: string;
  message: string;
  senderName?: string;
  senderType?: string;
  createdAt?: string;
}

interface InquiryItem {
  _id: string;
  subject: string;
  message: string;
  status: InquiryStatus;
  priority?: string;
  requesterType?: string;
  requesterName?: string;
  studentId?: { name?: string };
  createdAt?: string;
  updatedAt?: string;
  responses?: InquiryResponseItem[];
}

const InquiriesPage: React.FC = () => {
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const load = async () => {
    try {
      const res = await getSchoolInquiries(statusFilter || undefined);
      const nextInquiries = res.data || [];
      setInquiries(nextInquiries);
      if (nextInquiries.length === 0) {
        setSelectedInquiryId(null);
      } else if (!selectedInquiryId || !nextInquiries.some((item: InquiryItem) => item._id === selectedInquiryId)) {
        setSelectedInquiryId(nextInquiries[0]._id);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch inquiries');
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const updateStatus = async (id: string, status: InquiryStatus) => {
    try {
      setIsUpdatingStatus(true);
      await updateInquiryStatus(id, { status });
      toast.success('Inquiry updated');
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const reply = async (id: string) => {
    if (!replyMessage.trim()) return;

    try {
      setIsReplying(true);
      await replyToInquiry(id, replyMessage.trim());
      toast.success('Reply sent');
      setReplyMessage('');
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Reply failed');
    } finally {
      setIsReplying(false);
    }
  };

  const statusClasses: Record<string, string> = {
    OPEN: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-amber-100 text-amber-700',
    RESOLVED: 'bg-green-100 text-green-700',
    CLOSED: 'bg-gray-100 text-gray-700'
  };

  const selectedInquiry = inquiries.find((item) => item._id === selectedInquiryId) || null;
  const filteredInquiries = inquiries.filter((item) => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return true;
    const studentName = item.studentId?.name || item.requesterName || '';
    return (
      item.subject?.toLowerCase().includes(keyword) ||
      item.message?.toLowerCase().includes(keyword) ||
      studentName.toLowerCase().includes(keyword)
    );
  });

  const timeline = selectedInquiry
    ? [
      {
        id: `${selectedInquiry._id}-initial`,
        message: selectedInquiry.message,
        sender: selectedInquiry.studentId?.name || selectedInquiry.requesterName || 'Student',
        senderType: 'STUDENT',
        createdAt: selectedInquiry.createdAt
      },
      ...((selectedInquiry.responses || []).map((r, idx) => ({
        id: r._id || `${selectedInquiry._id}-response-${idx}`,
        message: r.message,
        sender: r.senderName || (r.senderType === 'ADMIN' ? 'School Admin' : 'Student'),
        senderType: r.senderType || 'ADMIN',
        createdAt: r.createdAt
      })))
    ]
    : [];

  const formatDate = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString();
  };

  return (
    <DashboardLayout>
      <ToastContainer position="top-right" autoClose={2500} />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inquiries</h1>
          <p className="mt-1 text-sm text-gray-600">Review student inquiries, track status, and reply with full conversation history.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by subject, student, or message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option><option value="OPEN">Open</option><option value="IN_PROGRESS">In Progress</option><option value="RESOLVED">Resolved</option><option value="CLOSED">Closed</option>
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-3 space-y-3 max-h-[70vh] overflow-auto">
            <h2 className="text-sm font-semibold text-gray-700 px-1">Inquiry List</h2>
            {filteredInquiries.length === 0 && <p className="text-sm text-gray-500 px-1">No inquiries available.</p>}
            {filteredInquiries.map((i) => {
              const isSelected = selectedInquiryId === i._id;
              return (
                <button
                  key={i._id}
                  type="button"
                  onClick={() => setSelectedInquiryId(i._id)}
                  className={`w-full text-left border rounded-xl p-3 transition ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-gray-900 truncate">{i.subject}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusClasses[i.status] || statusClasses.CLOSED}`}>
                      {i.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{i.studentId?.name || i.requesterName || 'Student'}</p>
                  <p className="text-sm text-gray-700 mt-1 line-clamp-2">{i.message}</p>
                  <p className="text-xs text-gray-500 mt-2">Updated {formatDate(i.updatedAt)}</p>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col min-h-[70vh]">
            {!selectedInquiry ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">
                Select an inquiry from the list to view conversation history.
              </div>
            ) : (
              <>
                <div className="border-b pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">{selectedInquiry.subject}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusClasses[selectedInquiry.status] || statusClasses.CLOSED}`}>
                      {selectedInquiry.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Student: {selectedInquiry.studentId?.name || selectedInquiry.requesterName || 'Student'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => updateStatus(selectedInquiry._id, 'IN_PROGRESS')}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60"
                      disabled={isUpdatingStatus}
                    >
                      Mark In Progress
                    </button>
                    <button
                      onClick={() => updateStatus(selectedInquiry._id, 'RESOLVED')}
                      className="px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                      disabled={isUpdatingStatus}
                    >
                      Mark Resolved
                    </button>
                    <button
                      onClick={() => updateStatus(selectedInquiry._id, 'CLOSED')}
                      className="px-3 py-1.5 rounded-lg bg-gray-700 text-white hover:bg-gray-800 disabled:opacity-60"
                      disabled={isUpdatingStatus}
                    >
                      Close
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-auto py-4 space-y-3">
                  {timeline.map((entry) => {
                    const fromAdmin = entry.senderType === 'ADMIN' || entry.senderType === 'school_admin';
                    return (
                      <div key={entry.id} className={`flex ${fromAdmin ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-xl p-3 ${fromAdmin ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                          <p className="text-xs font-medium opacity-90">{entry.sender}</p>
                          <p className="text-sm mt-1 whitespace-pre-wrap">{entry.message}</p>
                          <p className={`text-[11px] mt-2 ${fromAdmin ? 'text-blue-100' : 'text-gray-500'}`}>{formatDate(entry.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t pt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reply to student</label>
                  <textarea
                    className="w-full border rounded-lg px-3 py-2 min-h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Write your reply..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    disabled={isReplying || selectedInquiry.status === 'CLOSED'}
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => reply(selectedInquiry._id)}
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-2 disabled:opacity-60"
                      disabled={isReplying || !replyMessage.trim() || selectedInquiry.status === 'CLOSED'}
                    >
                      {isReplying && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                      {isReplying ? 'Sending...' : selectedInquiry.status === 'CLOSED' ? 'Inquiry Closed' : 'Send Reply'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InquiriesPage;
