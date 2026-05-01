import React, { useEffect, useRef, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getProfile, patchProfile, changePassword, uploadProfilePhoto } from '../../services/authProfileService';
import { publicUploadUrl } from '../../utils/publicUploadUrl';
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';

const SchoolStaffAccountPage: React.FC = () => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [staffRole, setStaffRole] = useState('');
  const [profileUrl, setProfileUrl] = useState<string | undefined>();
  const [schoolName, setSchoolName] = useState('');
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [initialProfile, setInitialProfile] = useState({
    name: '',
    email: '',
    phone: '',
    profileUrl: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await getProfile();
      const d = res.data as {
        staff?: {
          firstName?: string;
          lastName?: string;
          email?: string;
          phoneNumber?: string;
          staffRole?: string;
          profileUrl?: string;
        };
        school?: { name?: string } | null;
      };
      const staff = d.staff;
      if (!staff) {
        toast.error('Profile not available');
        return;
      }
      setName(`${staff.firstName || ''} ${staff.lastName || ''}`.trim());
      setEmail(staff.email || '');
      setPhone(staff.phoneNumber || '');
      setStaffRole((staff.staffRole || '').replaceAll('_', ' '));
      setProfileUrl(staff.profileUrl || undefined);
      setSchoolName(d.school?.name || '');
      setInitialProfile({
        name: `${staff.firstName || ''} ${staff.lastName || ''}`.trim(),
        email: (staff.email || '').trim(),
        phone: (staff.phoneNumber || '').trim(),
        profileUrl: (staff.profileUrl || '').trim(),
      });
    } catch {
      toast.error('Failed to load account');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await patchProfile({ name: name.trim(), email: email.trim(), phone: phone.trim(), profileUrl });
      setInitialProfile({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        profileUrl: (profileUrl || '').trim(),
      });
      toast.success('Profile saved');
    } catch (e: unknown) {
      const m = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(m || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const res = await uploadProfilePhoto(f);
      if (res.data?.profileUrl) {
        setProfileUrl(res.data.profileUrl);
        await patchProfile({ profileUrl: res.data.profileUrl });
        setInitialProfile((prev) => ({ ...prev, profileUrl: (res.data?.profileUrl || '').trim() }));
        toast.success('Photo updated');
      }
    } catch {
      toast.error('Upload failed');
    }
  };

  const savePassword = async () => {
    if (!curPw || !newPw) {
      toast.error('Fill current and new password');
      return;
    }
    if (newPw.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    setSavingPw(true);
    try {
      await changePassword(curPw, newPw);
      setCurPw('');
      setNewPw('');
      toast.success('Password updated');
    } catch (e: unknown) {
      const m = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(m || 'Password change failed');
    } finally {
      setSavingPw(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-16">Loading…</div>
      </DashboardLayout>
    );
  }

  const img = profileUrl ? publicUploadUrl(profileUrl) : null;
  const hasProfileChanges =
    name.trim() !== initialProfile.name ||
    email.trim() !== initialProfile.email ||
    phone.trim() !== initialProfile.phone ||
    (profileUrl || '').trim() !== initialProfile.profileUrl;
  const canSaveProfile = !!name.trim() && !!email.trim() && hasProfileChanges && !saving;
  const isNewPasswordValid = newPw.length >= 6;
  const canSavePassword = !!curPw.trim() && !!newPw.trim() && curPw !== newPw && isNewPasswordValid && !savingPw;

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">My account</h1>

        <section className="bg-white rounded-xl shadow p-6 space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">School</h2>
          <p className="text-gray-700 font-medium">{schoolName || '—'}</p>
          <p className="text-sm text-gray-500">{staffRole || ''}</p>
        </section>

        <section className="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Your profile</h2>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gray-100 border overflow-hidden flex items-center justify-center">
              {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : null}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
            <button type="button" onClick={() => fileRef.current?.click()} className="text-sm px-3 py-2 bg-gray-100 rounded-lg border">
              Change photo
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <button
            type="button"
            onClick={saveProfile}
            disabled={!canSaveProfile}
            className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </section>

        <section className="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Credentials</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
            <input type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
            <div className="mt-2 flex items-center text-xs text-gray-500">
              <div className={`w-2 h-2 rounded-full mr-2 ${isNewPasswordValid ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span>At least 6 characters</span>
            </div>
          </div>
          <button
            type="button"
            onClick={savePassword}
            disabled={!canSavePassword}
            className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingPw ? 'Updating…' : 'Update password'}
          </button>
        </section>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </DashboardLayout>
  );
};

export default SchoolStaffAccountPage;
