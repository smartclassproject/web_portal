import React, { useEffect, useRef, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getProfile, patchProfile, changePassword, uploadProfilePhoto } from '../../services/authProfileService';
import { updateMySchool } from '../../services/schoolService';
import { publicUploadUrl } from '../../utils/publicUploadUrl';
import { toast } from 'react-toastify';

const SchoolAccountPage: React.FC = () => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [profileUrl, setProfileUrl] = useState<string | undefined>();
  const [schoolName, setSchoolName] = useState('');
  const [schoolLocation, setSchoolLocation] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [numberOfTerms, setNumberOfTerms] = useState(3);
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSchool, setSavingSchool] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getProfile();
      const d = res.data as {
        role?: string;
        admin?: { name?: string; phone?: string; profileUrl?: string };
        school?: { name?: string; location?: string; shortCode?: string; numberOfTerms?: number } | null;
      };
      const admin = d.admin;
      const school = d.school;
      if (!admin) {
        toast.error('Profile not available');
        return;
      }
      setAdminName((admin.name as string) || '');
      setAdminPhone((admin.phone as string) || '');
      setProfileUrl(admin.profileUrl as string | undefined);
      if (school) {
        setSchoolName((school.name as string) || '');
        setSchoolLocation((school.location as string) || '');
        setShortCode((school.shortCode as string) || '');
        setNumberOfTerms(school.numberOfTerms ?? 3);
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
    setSavingProfile(true);
    try {
      await patchProfile({ name: adminName.trim(), phone: adminPhone.trim(), profileUrl });
      toast.success('Profile saved');
    } catch (e: unknown) {
      const m = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(m || 'Save failed');
    } finally {
      setSavingProfile(false);
    }
  };

  const saveSchool = async () => {
    const code = shortCode.trim().toUpperCase();
    if (code && (code.length < 2 || code.length > 6)) {
      toast.error('Short code must be 2–6 characters');
      return;
    }
    setSavingSchool(true);
    try {
      await updateMySchool({
        name: schoolName.trim(),
        location: schoolLocation.trim(),
        shortCode: code || undefined,
        numberOfTerms,
      });
      toast.success('School details saved');
    } catch (e: unknown) {
      const m = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(m || 'Save failed');
    } finally {
      setSavingSchool(false);
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

        <section className="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Your profile</h2>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gray-100 border overflow-hidden flex items-center justify-center">
              {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : null}
            </div>
            <div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-sm px-3 py-2 bg-gray-100 rounded-lg border"
              >
                Change photo
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              value={adminPhone}
              onChange={(e) => setAdminPhone(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <button
            type="button"
            onClick={saveProfile}
            disabled={savingProfile}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            {savingProfile ? 'Saving…' : 'Save profile'}
          </button>
        </section>

        <section className="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Your school</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">School name</label>
            <input
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              value={schoolLocation}
              onChange={(e) => setSchoolLocation(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Short code</label>
            <input
              value={shortCode}
              onChange={(e) => setShortCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              maxLength={6}
              className="w-full border rounded-lg px-3 py-2 uppercase"
            />
            <p className="text-xs text-gray-500 mt-1">Used in auto-generated student IDs.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Terms per year</label>
            <select
              value={numberOfTerms}
              onChange={(e) => setNumberOfTerms(parseInt(e.target.value, 10))}
              className="w-full border rounded-lg px-3 py-2"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={saveSchool}
            disabled={savingSchool}
            className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
          >
            {savingSchool ? 'Saving…' : 'Save school'}
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

export default SchoolAccountPage;
