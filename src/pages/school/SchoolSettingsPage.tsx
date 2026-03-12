import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getMySchool, updateMySchool } from '../../services/schoolService';
import { toast } from 'react-toastify';

const SchoolSettingsPage: React.FC = () => {
  const [school, setSchool] = useState<{ _id: string; name: string; location: string; numberOfTerms?: number } | null>(null);
  const [numberOfTerms, setNumberOfTerms] = useState(3);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getMySchool();
        const data = res.data ?? res;
        setSchool(data);
        setNumberOfTerms(data.numberOfTerms ?? 3);
      } catch (e) {
        toast.error('Failed to load school settings');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleSave = async () => {
    if (numberOfTerms < 1 || numberOfTerms > 6) {
      toast.error('Number of terms must be between 1 and 6');
      return;
    }
    setSaving(true);
    try {
      await updateMySchool({ numberOfTerms });
      setSchool(prev => prev ? { ...prev, numberOfTerms } : null);
      toast.success('Settings saved');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save');
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
        <p className="text-gray-600">Configure term structure for report cards. Teachers will enter end-of-term exam and discipline marks for each term.</p>

        <div className="bg-white rounded-xl shadow-md p-6 max-w-md">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Report card terms</h2>
          <label className="block text-sm font-medium text-gray-700 mb-2">Number of terms per year</label>
          <select
            value={numberOfTerms}
            onChange={(e) => setNumberOfTerms(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            {[1, 2, 3, 4, 5, 6].map(n => (
              <option key={n} value={n}>{n} term{n !== 1 ? 's' : ''}</option>
            ))}
          </select>
          <p className="mt-2 text-sm text-gray-500">Teachers will add final exam and discipline marks for each term.</p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SchoolSettingsPage;
