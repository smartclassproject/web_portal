import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../../services/announcementService';

const AnnouncementsPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', content: '', targetAudience: 'ALL', isPinned: false });
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await getAnnouncements();
      setItems(res.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch announcements');
    }
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form, targetAudience: [form.targetAudience] };
      if (editingId) await updateAnnouncement(editingId, payload);
      else await createAnnouncement(payload);
      toast.success(editingId ? 'Announcement updated' : 'Announcement created');
      setForm({ title: '', content: '', targetAudience: 'ALL', isPinned: false });
      setEditingId(null);
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
  };

  return (
    <DashboardLayout>
      <ToastContainer position="top-right" autoClose={2500} />
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>

        <form onSubmit={save} className="bg-white rounded-lg shadow p-4 space-y-3">
          <input className="border rounded px-3 py-2 w-full" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <textarea className="border rounded px-3 py-2 w-full" placeholder="Content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            <select className="border rounded px-3 py-2" value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}>
              <option value="ALL">All</option><option value="TEACHERS">Teachers</option><option value="STUDENTS">Students</option><option value="PARENTS">Parents</option>
            </select>
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPinned} onChange={(e) => setForm({ ...form, isPinned: e.target.checked })} /> Pin</label>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">{editingId ? 'Update' : 'Publish'} Announcement</button>
          </div>
        </form>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Published Announcements</h2>
          <div className="space-y-3">
            {items.map((a) => (
              <div key={a._id} className="border rounded p-3">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-semibold">{a.title} {a.isPinned ? <span className="text-xs text-yellow-700">(Pinned)</span> : null}</p>
                    <p className="text-sm text-gray-700">{a.content}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingId(a._id); setForm({ title: a.title, content: a.content, targetAudience: a.targetAudience?.[0] || 'ALL', isPinned: !!a.isPinned }); }} className="px-3 py-1 rounded bg-gray-200">Edit</button>
                    <button onClick={async () => { await deleteAnnouncement(a._id); toast.success('Deleted'); load(); }} className="px-3 py-1 rounded bg-red-600 text-white">Delete</button>
                  </div>
                </div>
              </div>
            ))}
            {items.length === 0 && <p className="text-sm text-gray-500">No announcements yet.</p>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AnnouncementsPage;
