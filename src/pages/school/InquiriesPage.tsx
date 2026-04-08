import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getSchoolInquiries, replyToInquiry, updateInquiryStatus } from '../../services/inquiryService';

const InquiriesPage: React.FC = () => {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('');

  const load = async () => {
    try {
      const res = await getSchoolInquiries(statusFilter || undefined);
      setInquiries(res.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch inquiries');
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateInquiryStatus(id, { status });
      toast.success('Inquiry updated');
      await load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Update failed'); }
  };

  const reply = async (id: string) => {
    const message = window.prompt('Reply message');
    if (!message) return;
    try {
      await replyToInquiry(id, message);
      toast.success('Reply sent');
      await load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Reply failed'); }
  };

  return (
    <DashboardLayout>
      <ToastContainer position="top-right" autoClose={2500} />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Inquiries</h1>
          <select className="border rounded px-3 py-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option><option value="OPEN">Open</option><option value="IN_PROGRESS">In Progress</option><option value="RESOLVED">Resolved</option><option value="CLOSED">Closed</option>
          </select>
        </div>

        <div className="bg-white rounded-lg shadow p-4 space-y-3">
          {inquiries.length === 0 && <p className="text-sm text-gray-500">No inquiries available.</p>}
          {inquiries.map((i) => (
            <div key={i._id} className="border rounded p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{i.subject}</p>
                  <p className="text-sm text-gray-700">{i.message}</p>
                  <p className="text-xs text-gray-500 mt-1">Status: {i.status} | Priority: {i.priority} | Type: {i.requesterType}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => reply(i._id)} className="px-3 py-1 rounded bg-blue-600 text-white">Reply</button>
                  <button onClick={() => updateStatus(i._id, 'IN_PROGRESS')} className="px-3 py-1 rounded bg-yellow-600 text-white">In Progress</button>
                  <button onClick={() => updateStatus(i._id, 'RESOLVED')} className="px-3 py-1 rounded bg-green-600 text-white">Resolve</button>
                </div>
              </div>
              {Array.isArray(i.responses) && i.responses.length > 0 && (
                <div className="mt-2 pt-2 border-t text-xs text-gray-600 space-y-1">
                  {i.responses.slice(-3).map((r: any, idx: number) => <p key={idx}>- {r.message}</p>)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InquiriesPage;
