import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../../services/announcementService';

type Audience = 'ALL' | 'TEACHERS' | 'STUDENTS' | 'PARENTS';

interface AnnouncementForm {
  title: string;
  content: string;
  targetAudience: Audience;
  isPinned: boolean;
}

const AnnouncementsPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<AnnouncementForm>({ title: '', content: '', targetAudience: 'ALL', isPinned: false });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

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
    if (isSaving) return;

    try {
      setIsSaving(true);
      const payload = { ...form, targetAudience: [form.targetAudience] };
      if (editingId) await updateAnnouncement(editingId, payload);
      else await createAnnouncement(payload);
      toast.success(editingId ? 'Announcement updated' : 'Announcement created');
      setForm({ title: '', content: '', targetAudience: 'ALL', isPinned: false });
      setEditingId(null);
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeletingId(id);
      await deleteAnnouncement(id);
      toast.success('Deleted');
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setIsDeletingId(null);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return 'Unknown date';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown date';
    return date.toLocaleString();
  };

  return (
    <DashboardLayout>
      <ToastContainer position="top-right" autoClose={2500} />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="mt-1 text-sm text-gray-600">Share school updates with the right audience and track published messages.</p>
        </div>

        <form onSubmit={save} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Announcement title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              disabled={isSaving}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <textarea
              className="border rounded-lg px-3 py-2 w-full min-h-28 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Write your announcement content"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
              disabled={isSaving}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            <select
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.targetAudience}
              onChange={(e) => setForm({ ...form, targetAudience: e.target.value as Audience })}
              disabled={isSaving}
            >
              <option value="ALL">All</option><option value="TEACHERS">Teachers</option><option value="STUDENTS">Students</option><option value="PARENTS">Parents</option>
            </select>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isPinned}
                onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
                disabled={isSaving}
              />
              Pin this announcement
            </label>
            <div className="flex justify-end md:justify-start gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                onClick={() => {
                  setEditingId(null);
                  setForm({ title: '', content: '', targetAudience: 'ALL', isPinned: false });
                }}
                disabled={isSaving}
              >
                Reset
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 disabled:opacity-60"
                disabled={isSaving}
                aria-busy={isSaving}
                aria-label={isSaving ? 'Saving announcement' : 'Save announcement'}
              >
                {isSaving && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                {isSaving ? 'Saving...' : `${editingId ? 'Update' : 'Publish'} Announcement`}
              </button>
            </div>
          </div>
        </form>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-lg font-semibold mb-3">Published Announcements</h2>
          <div className="space-y-3">
            {items.map((a) => (
              <div key={a._id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex flex-col md:flex-row md:justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-900">{a.title}</p>
                      {a.isPinned ? <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">Pinned</span> : null}
                      {a.targetAudience?.[0] ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">{a.targetAudience[0]}</span>
                      ) : null}
                    </div>
                    <p className="text-sm text-gray-700 mt-1 line-clamp-3">{a.content}</p>
                    <p className="text-xs text-gray-500 mt-2">Published: {formatDate(a.createdAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingId(a._id);
                        setForm({
                          title: a.title,
                          content: a.content,
                          targetAudience: a.targetAudience?.[0] || 'ALL',
                          isPinned: !!a.isPinned
                        });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                      disabled={isSaving}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(a._id)}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white inline-flex items-center gap-2 disabled:opacity-60"
                      disabled={isSaving || isDeletingId === a._id}
                    >
                      {isDeletingId === a._id ? (
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : null}
                      {isDeletingId === a._id ? 'Deleting...' : 'Delete'}
                    </button>
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
