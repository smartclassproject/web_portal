import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { changeStudentPassword } from '../../services/studentPortalService';

const StudentChangePasswordPage: React.FC = () => {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error('Confirm password does not match');
      return;
    }
    setSaving(true);
    try {
      await changeStudentPassword(form);
      toast.success('Password changed successfully');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
      <form className="space-y-3" onSubmit={onSubmit}>
        <input
          type="password"
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Current password"
          value={form.currentPassword}
          onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))}
          required
        />
        <input
          type="password"
          className="w-full border rounded-lg px-3 py-2"
          placeholder="New password"
          value={form.newPassword}
          onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
          required
        />
        <input
          type="password"
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Confirm new password"
          value={form.confirmPassword}
          onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
          required
        />
        <button
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
};

export default StudentChangePasswordPage;
