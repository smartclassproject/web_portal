import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import {
  createStaff,
  deleteStaff,
  getStaffList,
  getStaffModules,
  getStaffRoleTemplates,
  resendStaffCredentials,
  resetStaffCredentials,
  updateStaff,
  updateStaffStatus,
  type StaffModule,
  type StaffRoleTemplate,
  type StaffUser,
} from '../../services/staffService';

type StaffFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  staffRole: string;
  customRoleTitle: string;
  modules: string[];
  password: string;
};

const STRONG_DEFAULT_PASSWORD = 'Staff@123';

const DEFAULT_FORM: StaffFormState = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  staffRole: 'MATRON',
  customRoleTitle: '',
  modules: [],
  password: STRONG_DEFAULT_PASSWORD,
};

const SchoolStaffPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [search, setSearch] = useState('');
  const [passwordSetupFilter, setPasswordSetupFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [modulesCatalog, setModulesCatalog] = useState<StaffModule[]>([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [modulesError, setModulesError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Record<string, string[]>>({});

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(null);

  const [form, setForm] = useState<StaffFormState>(DEFAULT_FORM);
  const [resetPassword, setResetPassword] = useState(STRONG_DEFAULT_PASSWORD);
  const [submitting, setSubmitting] = useState(false);
  const [resendingById, setResendingById] = useState<Record<string, boolean>>({});

  const moduleLabelMap = useMemo(
    () => Object.fromEntries(modulesCatalog.map((m) => [m.key, m.label])),
    [modulesCatalog]
  );

  const filteredStaff = useMemo(() => {
    const q = search.trim().toLowerCase();
    return staffList.filter((s) => {
      if (passwordSetupFilter === 'pending' && s.passwordSetup !== false) return false;
      if (passwordSetupFilter === 'completed' && s.passwordSetup !== true) return false;
      if (!q) return true;
      const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
      return (
        fullName.includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phoneNumber.toLowerCase().includes(q) ||
        s.staffRole.toLowerCase().includes(q)
      );
    });
  }, [search, staffList, passwordSetupFilter]);

  const loadModulesCatalog = async () => {
    setModulesLoading(true);
    setModulesError(null);
    try {
      const modulesRes = await getStaffModules();
      setModulesCatalog((modulesRes.data || []).filter((m) => m.isActive));
    } catch (error) {
      console.error(error);
      setModulesError('Module permissions failed to load. Please retry.');
    } finally {
      setModulesLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [staffRes, templatesRes] = await Promise.all([
        getStaffList(),
        getStaffRoleTemplates(),
      ]);
      setStaffList(staffRes.data || []);
      const resolvedTemplates: Record<string, string[]> = {};
      for (const tpl of templatesRes.data?.templates || []) {
        resolvedTemplates[(tpl as StaffRoleTemplate).role] = (tpl as StaffRoleTemplate).defaultModules || [];
      }
      setTemplates(resolvedTemplates);
      await loadModulesCatalog();
    } catch (error) {
      console.error(error);
      toast.error('Failed to load staff data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const applyRoleDefaults = (role: string, current: StaffFormState): StaffFormState => {
    const defaults = templates[role] || [];
    return { ...current, staffRole: role, modules: defaults };
  };

  const openCreate = () => {
    setForm(applyRoleDefaults(DEFAULT_FORM.staffRole, { ...DEFAULT_FORM }));
    setIsCreateOpen(true);
  };

  const openEdit = (staff: StaffUser) => {
    setSelectedStaff(staff);
    setForm({
      firstName: staff.firstName,
      lastName: staff.lastName,
      email: staff.email,
      phoneNumber: staff.phoneNumber,
      staffRole: staff.staffRole,
      customRoleTitle: staff.customRoleTitle || '',
      modules: staff.modules || [],
      password: STRONG_DEFAULT_PASSWORD,
    });
    setIsEditOpen(true);
  };

  const toggleModule = (moduleKey: string) => {
    setForm((prev) => ({
      ...prev,
      modules: prev.modules.includes(moduleKey)
        ? prev.modules.filter((m) => m !== moduleKey)
        : [...prev.modules, moduleKey],
    }));
  };

  const validateForm = () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.phoneNumber.trim()) {
      toast.error('First name, last name, email and phone are required');
      return false;
    }
    if (!form.modules.length) {
      toast.error('Select at least one module');
      return false;
    }
    if (form.staffRole === 'OTHER' && !form.customRoleTitle.trim()) {
      toast.error('Custom role title is required for OTHER role');
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const result = await createStaff({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        staffRole: form.staffRole,
        customRoleTitle: form.customRoleTitle.trim() || undefined,
        modules: form.modules,
        password: form.password || STRONG_DEFAULT_PASSWORD,
      });
      if (result.data?.credentialsEmailSent) {
        toast.success(result.message || 'Staff created. Credentials email sent.');
      } else {
        toast.warning(result.message || 'Staff created, but credentials email failed. Use Resend Credentials.');
      }
      setIsCreateOpen(false);
      await loadData();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to create staff');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedStaff) return;
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      await updateStaff(selectedStaff._id, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        staffRole: form.staffRole,
        customRoleTitle: form.customRoleTitle.trim() || undefined,
        modules: form.modules,
      });
      toast.success('Staff updated successfully');
      setIsEditOpen(false);
      setSelectedStaff(null);
      await loadData();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to update staff');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (staff: StaffUser) => {
    try {
      await updateStaffStatus(staff._id, !staff.isActive);
      toast.success(`Staff ${staff.isActive ? 'deactivated' : 'activated'} successfully`);
      await loadData();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to update status');
    }
  };

  const openReset = (staff: StaffUser) => {
    setSelectedStaff(staff);
    setResetPassword(STRONG_DEFAULT_PASSWORD);
    setIsResetOpen(true);
  };

  const openDelete = (staff: StaffUser) => {
    setSelectedStaff(staff);
    setIsDeleteOpen(true);
  };

  const handleResetCredentials = async () => {
    if (!selectedStaff) return;
    if ((resetPassword || '').length < 4) {
      toast.error('Password must be at least 4 characters');
      return;
    }
    setSubmitting(true);
    try {
      await resetStaffCredentials(selectedStaff._id, resetPassword);
      toast.success('Credentials reset successfully');
      setIsResetOpen(false);
      setSelectedStaff(null);
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to reset credentials');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendCredentials = async (staff: StaffUser) => {
    setResendingById((prev) => ({ ...prev, [staff._id]: true }));
    try {
      const result = await resendStaffCredentials(staff._id);
      toast.success(result.message || 'Login credentials email has been resent successfully!');
      await loadData();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to resend credentials');
    } finally {
      setResendingById((prev) => ({ ...prev, [staff._id]: false }));
    }
  };

  const handleDeleteStaff = async () => {
    if (!selectedStaff) return;
    setSubmitting(true);
    try {
      await deleteStaff(selectedStaff._id);
      toast.success('Staff deleted successfully');
      setIsDeleteOpen(false);
      setSelectedStaff(null);
      await loadData();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to delete staff');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleString();
  };

  const roleOptions = ['MATRON', 'PATRON', 'ACCOUNTANT', 'DIRECTOR_OF_STUDIES', 'DISCIPLINE_MASTER', 'LIBRARIAN', 'OTHER'];

  const renderForm = (isEdit = false) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="staff-first-name" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
          <input
            id="staff-first-name"
            value={form.firstName}
            onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label htmlFor="staff-last-name" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
          <input
            id="staff-last-name"
            value={form.lastName}
            onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="staff-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            id="staff-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label htmlFor="staff-phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input
            id="staff-phone"
            value={form.phoneNumber}
            onChange={(e) => setForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="staff-role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select
            id="staff-role"
            value={form.staffRole}
            onChange={(e) => setForm((prev) => applyRoleDefaults(e.target.value, prev))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
        </div>
        {!isEdit && (
          <div>
            <label htmlFor="staff-initial-password" className="block text-sm font-medium text-gray-700 mb-1">Initial Password</label>
            <input
              id="staff-initial-password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Use a strong password (e.g. Staff@123)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Use a strong temporary password with letters, numbers, and symbols.
            </p>
          </div>
        )}
      </div>
      {form.staffRole === 'OTHER' && (
        <div>
          <label htmlFor="staff-custom-role-title" className="block text-sm font-medium text-gray-700 mb-1">Custom Role Title</label>
          <input
            id="staff-custom-role-title"
            value={form.customRoleTitle}
            onChange={(e) => setForm((prev) => ({ ...prev, customRoleTitle: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Module Permissions</label>
        {modulesLoading && (
          <p className="text-sm text-gray-500 mb-2">Loading module permissions...</p>
        )}
        {modulesError && (
          <div className="mb-2 flex items-center gap-2">
            <p className="text-sm text-red-600">{modulesError}</p>
            <button
              type="button"
              onClick={loadModulesCatalog}
              className="text-sm text-blue-600 hover:underline"
            >
              Retry
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {modulesCatalog.map((moduleItem) => (
            <label key={moduleItem.key} className="inline-flex items-center gap-2 bg-gray-50 rounded-lg p-2">
              <input
                type="checkbox"
                checked={form.modules.includes(moduleItem.key)}
                onChange={() => toggleModule(moduleItem.key)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-800">{moduleItem.label}</span>
            </label>
          ))}
        </div>
        {!modulesLoading && !modulesError && modulesCatalog.length === 0 && (
          <p className="mt-2 text-sm text-gray-500">No active modules available for assignment.</p>
        )}
      </div>
      <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
        <button
          type="button"
          onClick={() => {
            setIsCreateOpen(false);
            setIsEditOpen(false);
            setSelectedStaff(null);
          }}
          className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={isEdit ? handleEdit : handleCreate}
          disabled={submitting}
          className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-60"
        >
          {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Staff'}
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl mx-auto flex items-center justify-center h-64">
          <p className="text-gray-600">Loading staff...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <button
            onClick={openCreate}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold"
          >
            Add Staff
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff by name, role, email, phone..."
              className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
            <select
              aria-label="Password setup filter"
              value={passwordSetupFilter}
              onChange={(e) => setPasswordSetupFilter(e.target.value as 'all' | 'pending' | 'completed')}
              className="w-full md:w-56 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All</option>
              <option value="pending">Pending setup</option>
              <option value="completed">Completed setup</option>
            </select>
          </div>
        </div>

        <div className="relative overflow-x-auto bg-white rounded-xl shadow-md">
          <table className="min-w-full text-left">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Name</th>
                <th className="py-3 px-4 font-semibold">Role</th>
                <th className="py-3 px-4 font-semibold">Email</th>
                <th className="py-3 px-4 font-semibold">Phone</th>
                <th className="py-3 px-4 font-semibold">Modules</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Password Setup</th>
                <th className="py-3 px-4 font-semibold">Last Credentials Sent</th>
                <th className="py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500">
                    No staff records found.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr key={staff._id} className="border-b last:border-b-0 border-gray-100 hover:bg-green-50">
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {staff.firstName} {staff.lastName}
                    </td>
                    <td className="py-3 px-4 text-gray-700">{staff.staffRole.replaceAll('_', ' ')}</td>
                    <td className="py-3 px-4 text-gray-700">{staff.email}</td>
                    <td className="py-3 px-4 text-gray-700">{staff.phoneNumber}</td>
                    <td className="py-3 px-4 text-gray-700">
                      <div className="flex flex-wrap gap-1">
                        {(staff.modules || []).map((m) => (
                          <span key={m} className="px-2 py-1 rounded-full bg-gray-100 text-xs text-gray-700">
                            {moduleLabelMap[m] || m}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${staff.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {staff.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          staff.passwordSetup ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {staff.passwordSetup ? 'Completed' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700 text-sm">
                      {formatDateTime(staff.lastCredentialsSentAt)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => openEdit(staff)} className="text-blue-600 hover:underline text-sm">
                          Edit
                        </button>
                        {staff.passwordSetup ? (
                          <button onClick={() => handleToggleStatus(staff)} className="text-amber-600 hover:underline text-sm">
                            {staff.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        ) : (
                          <button onClick={() => openDelete(staff)} className="text-red-600 hover:underline text-sm">
                            Delete
                          </button>
                        )}
                        <button onClick={() => openReset(staff)} className="text-purple-600 hover:underline text-sm">
                          Reset Credentials
                        </button>
                        {!staff.passwordSetup && (
                          <button
                            onClick={() => handleResendCredentials(staff)}
                            disabled={!!resendingById[staff._id]}
                            className="text-green-700 hover:underline text-sm disabled:opacity-60"
                          >
                            {resendingById[staff._id] ? 'Sending...' : 'Resend Credentials'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add Staff" size="lg">
          {renderForm(false)}
        </Modal>

        <Modal
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setSelectedStaff(null);
          }}
          title={`Edit Staff${selectedStaff ? ` - ${selectedStaff.firstName} ${selectedStaff.lastName}` : ''}`}
          size="lg"
        >
          {renderForm(true)}
        </Modal>

        <Modal
          isOpen={isResetOpen}
          onClose={() => {
            setIsResetOpen(false);
            setSelectedStaff(null);
          }}
          title={`Reset Credentials${selectedStaff ? ` - ${selectedStaff.firstName} ${selectedStaff.lastName}` : ''}`}
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Set a new temporary password for this staff account.</p>
            <div>
              <label htmlFor="staff-reset-password" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                id="staff-reset-password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
              <button
                onClick={() => {
                  setIsResetOpen(false);
                  setSelectedStaff(null);
                }}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleResetCredentials}
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-60"
              >
                {submitting ? 'Resetting...' : 'Reset'}
              </button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={isDeleteOpen}
          onClose={() => {
            setIsDeleteOpen(false);
            setSelectedStaff(null);
          }}
          title={`Delete Staff${selectedStaff ? ` - ${selectedStaff.firstName} ${selectedStaff.lastName}` : ''}`}
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              This action permanently removes the staff account. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
              <button
                onClick={() => {
                  setIsDeleteOpen(false);
                  setSelectedStaff(null);
                }}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStaff}
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-60"
              >
                {submitting ? 'Deleting...' : 'Delete Staff'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default SchoolStaffPage;
