import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { getStudentLessons, getStudentMaterials } from '../../services/studentPortalService';

const StudentMaterialsPage: React.FC = () => {
  const [tab, setTab] = useState<'materials' | 'lessons'>('materials');
  const [query, setQuery] = useState('');
  const [materials, setMaterials] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [mRes, lRes] = await Promise.all([getStudentMaterials(), getStudentLessons()]);
        setMaterials(mRes.data || []);
        setLessons(lRes.data || []);
      } catch (e: any) {
        toast.error(e.response?.data?.message || 'Failed to load study content');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const list = useMemo(() => {
    const base = tab === 'materials' ? materials : lessons;
    if (!query.trim()) return base;
    const q = query.toLowerCase();
    return base.filter((x) =>
      String(x.title || '').toLowerCase().includes(q) ||
      String(x.description || x.summary || '').toLowerCase().includes(q) ||
      String(x.subject || '').toLowerCase().includes(q)
    );
  }, [tab, materials, lessons, query]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <h2 className="text-lg font-semibold">Study Materials</h2>
        <input
          className="border rounded-lg px-3 py-2 w-full md:w-80"
          placeholder="Search materials or lessons..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <button
          className={`px-3 py-2 rounded-lg text-sm font-medium ${tab === 'materials' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setTab('materials')}
        >
          Materials
        </button>
        <button
          className={`px-3 py-2 rounded-lg text-sm font-medium ${tab === 'lessons' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setTab('lessons')}
        >
          Lessons
        </button>
      </div>
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : list.length === 0 ? (
        <p className="text-sm text-gray-500">No {tab} found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {list.map((item) => (
            <div key={item._id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-900">{item.title}</h3>
              <p className="text-xs text-gray-500 mt-1">
                {item.subject || 'General'} {item.courseCode ? `• ${item.courseCode}` : ''}
              </p>
              <p className="text-sm text-gray-700 mt-2 line-clamp-3">{item.description || item.summary || 'No description.'}</p>
              <div className="mt-3 text-xs text-gray-500 flex gap-3">
                {item.fileType && <span>Type: {item.fileType}</span>}
                {item.fileSize && <span>Size: {item.fileSize}</span>}
              </div>
              {item.downloadUrl && (
                <a
                  href={item.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Open
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentMaterialsPage;
