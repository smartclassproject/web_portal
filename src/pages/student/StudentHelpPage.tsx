import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { createStudentInquiry, getStudentInquiries, replyStudentInquiry } from '../../services/studentPortalService';

const StudentHelpPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await getStudentInquiries();
      const list = res.data || [];
      setItems(list);
      if (!selectedId && list.length) setSelectedId(list[0]._id);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const selected = useMemo(() => items.find((x) => x._id === selectedId), [items, selectedId]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createStudentInquiry({ subject, message });
      toast.success('Inquiry sent to school admin');
      setSubject('');
      setMessage('');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create inquiry');
    }
  };

  const sendReply = async () => {
    if (!selected) return;
    try {
      await replyStudentInquiry(selected._id, reply);
      toast.success('Reply sent');
      setReply('');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send reply');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:col-span-1">
        <h2 className="font-semibold text-gray-900 mb-3">Write to school admin</h2>
        <form className="space-y-2" onSubmit={create}>
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
          <textarea
            className="w-full border rounded-lg px-3 py-2"
            rows={4}
            placeholder="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium">Send Inquiry</button>
        </form>
        <div className="mt-4 space-y-2">
          {loading ? (
            <p className="text-sm text-gray-500">Loading inquiries...</p>
          ) : (
            items.map((i) => (
              <button
                key={i._id}
                onClick={() => setSelectedId(i._id)}
                className={`w-full text-left p-3 rounded-lg border ${
                  selectedId === i._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                }`}
              >
                <p className="text-sm font-medium text-gray-900 line-clamp-1">{i.subject}</p>
                <p className="text-xs text-gray-500 mt-1">Status: {i.statusLabel || i.status}</p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:col-span-2">
        {!selected ? (
          <p className="text-sm text-gray-500">Select an inquiry to view conversation.</p>
        ) : (
          <>
            <h3 className="font-semibold text-gray-900">{selected.subject}</h3>
            <p className="text-xs text-gray-500 mb-3">Status: {selected.statusLabel || selected.status}</p>
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {(selected.thread || []).map((m: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg text-sm ${m.authorRole === 'admin' ? 'bg-gray-100 text-gray-800' : 'bg-blue-50 text-blue-900'}`}
                >
                  <p className="font-medium text-xs mb-1">{m.authorRole === 'admin' ? 'School Admin' : 'You'}</p>
                  <p>{m.message}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                className="flex-1 border rounded-lg px-3 py-2"
                placeholder="Write a reply..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <button onClick={sendReply} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium">
                Reply
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StudentHelpPage;
