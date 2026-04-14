import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getMySchool, updateMySchool } from '../../services/schoolService';
import { toast } from 'react-toastify';
import type { EnrollmentSeason } from '../../types';

const ALL_SEASONS: { id: EnrollmentSeason; label: string }[] = [
  { id: 'fall', label: 'Fall' },
  { id: 'spring', label: 'Spring' },
  { id: 'summer', label: 'Summer' },
  { id: 'winter', label: 'Winter' },
];

const SchoolSettingsPage: React.FC = () => {
  const [numberOfTerms, setNumberOfTerms] = useState(3);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [enabledSeasons, setEnabledSeasons] = useState<EnrollmentSeason[]>([
    'fall',
    'spring',
    'summer',
    'winter',
  ]);
  const [defaultEnrollmentSemester, setDefaultEnrollmentSemester] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getMySchool();
        const data = res.data ?? res;
        setNumberOfTerms(data.numberOfTerms ?? 3);
        setName(data.name ?? '');
        setLocation(data.location ?? '');
        setShortCode(data.shortCode ?? '');
        const raw = data.enrollmentSemestersEnabled;
        const normalized =
          Array.isArray(raw) && raw.length > 0
            ? (raw.map((s: string) => String(s).toLowerCase()) as EnrollmentSeason[]).filter((s) =>
                ALL_SEASONS.some((o) => o.id === s)
              )
            : ALL_SEASONS.map((o) => o.id);
        setEnabledSeasons(normalized.length ? normalized : ALL_SEASONS.map((o) => o.id));
        const def = data.defaultEnrollmentSemester ? String(data.defaultEnrollmentSemester).toLowerCase() : '';
        setDefaultEnrollmentSemester(def && ALL_SEASONS.some((o) => o.id === def) ? def : '');
      } catch {
        toast.error('Failed to load school settings');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const toggleSeason = (id: EnrollmentSeason) => {
    setEnabledSeasons((prev) => {
      const has = prev.includes(id);
      if (has && prev.length <= 1) {
        toast.warn('At least one enrollment semester must stay enabled');
        return prev;
      }
      return has ? prev.filter((s) => s !== id) : [...prev, id];
    });
  };

  const handleSave = async () => {
    if (numberOfTerms < 1 || numberOfTerms > 6) {
      toast.error('Number of terms must be between 1 and 6');
      return;
    }
    if (enabledSeasons.length < 1) {
      toast.error('Enable at least one enrollment semester');
      return;
    }
    if (defaultEnrollmentSemester && !enabledSeasons.includes(defaultEnrollmentSemester as EnrollmentSeason)) {
      toast.error('Default enrollment semester must be one of the enabled semesters');
      return;
    }
    const code = shortCode.trim().toUpperCase();
    if (code && (code.length < 2 || code.length > 6)) {
      toast.error('Short code must be 2–6 letters or digits (used in student IDs)');
      return;
    }
    setSaving(true);
    try {
      await updateMySchool({
        name: name.trim() || undefined,
        location: location.trim() || undefined,
        numberOfTerms,
        shortCode: code || undefined,
        enrollmentSemestersEnabled: enabledSeasons,
        defaultEnrollmentSemester: defaultEnrollmentSemester || null,
      });
      toast.success('Settings saved');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">School Settings</h1>
        <p className="text-gray-600">
          Update your school profile, short code for student IDs, which enrollment semesters students can choose,
          and how many grading terms appear on report cards.
        </p>

        <div className="bg-white rounded-xl shadow-md p-6 max-w-lg space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">School details</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">School name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Short code (student IDs)</label>
            <input
              value={shortCode}
              onChange={(e) => setShortCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              maxLength={6}
              placeholder="e.g. KGS"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 uppercase"
            />
            <p className="mt-1 text-xs text-gray-500">
              2–6 letters or digits, unique across schools. Auto-generated student IDs start with this code.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 max-w-lg space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Student registration semesters</h2>
          <p className="text-sm text-gray-500">
            These options appear when adding a student (e.g. Fall or Spring intake). They are separate from grading
            terms below.
          </p>
          <div className="flex flex-wrap gap-4">
            {ALL_SEASONS.map(({ id, label }) => (
              <label key={id} className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabledSeasons.includes(id)}
                  onChange={() => toggleSeason(id)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-800">{label}</span>
              </label>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Default when opening “Add student”</label>
            <select
              value={defaultEnrollmentSemester}
              onChange={(e) => setDefaultEnrollmentSemester(e.target.value)}
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">None (first enabled semester)</option>
              {enabledSeasons.map((id) => {
                const label = ALL_SEASONS.find((o) => o.id === id)?.label ?? id;
                return (
                  <option key={id} value={id}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 max-w-md">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Report card terms</h2>
          <label className="block text-sm font-medium text-gray-700 mb-2">Number of terms per year</label>
          <select
            value={numberOfTerms}
            onChange={(e) => setNumberOfTerms(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} term{n !== 1 ? 's' : ''}
              </option>
            ))}
          </select>
          <p className="mt-2 text-sm text-gray-500">
            Teachers will add final exam and discipline marks for each term.
          </p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save all'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SchoolSettingsPage;
