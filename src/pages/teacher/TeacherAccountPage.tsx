import React, { useEffect, useRef, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getProfile, patchProfile, changePassword, uploadProfilePhoto } from '../../services/authProfileService';
import { publicUploadUrl } from '../../utils/publicUploadUrl';
import { toast } from 'react-toastify';

const TeacherAccountPage: React.FC = () => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [profileUrl, setProfileUrl] = useState<string | undefined>();
  const [schoolName, setSchoolName] = useState('');
  const [schoolLocation, setSchoolLocation] = useState('');
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getProfile();
      const d = res.data as {
        teacher?: { name?: string; email?: string; phone?: string; department?: string; specialization?: string; profileUrl?: string };
        school?: { name?: string; location?: string } | null;
      };
      const t = d.teacher;
      const s = d.school;
      if (!t) {
        toast.error('Profile not available');
        return;
      }
      setName((t.name as string) || '');
      setEmail((t.email as string) || '');
      setPhone((t.phone as string) || '');
      setDepartment((t.department as string) || '');
      setSpecialization((t.specialization as string) || '');
      setProfileUrl(t.profileUrl as string | undefined);
      if (s) {
        setSchoolName((s.name as string) || '');
        setSchoolLocation((s.location as string) || '');
      }
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
      await patchProfile({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        department: department.trim(),
        specialization: specialization.trim(),
        profileUrl,
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

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">My account</h1>

        <section className="bg-white rounded-xl shadow p-6 space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">School</h2>
          <p className="text-gray-700 font-medium">{schoolName || '—'}</p>
          <p className="text-sm text-gray-500">{schoolLocation || ''}</p>
        </section>

        <section className="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Your profile</h2>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gray-100 border overflow-hidden flex items-center justify-center">
              {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : null}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-sm px-3 py-2 bg-gray-100 rounded-lg border"
            >
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
            <input
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <button
            type="button"
            onClick={saveProfile}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </section>

        <section className="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Credentials</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
            <input
              type="password"
              value={curPw}
              onChange={(e) => setCurPw(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <button
            type="button"
            onClick={savePassword}
            disabled={savingPw}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg disabled:opacity-50"
          >
            {savingPw ? 'Updating…' : 'Update password'}
          </button>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default TeacherAccountPage;
