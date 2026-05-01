import React, { useEffect, useRef, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getProfile, patchProfile, changePassword, uploadProfilePhoto } from '../../services/authProfileService';
import { updateMySchool } from '../../services/schoolService';
import { publicUploadUrl } from '../../utils/publicUploadUrl';
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';

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
  const [initialProfile, setInitialProfile] = useState({
    adminName: '',
    adminPhone: '',
    profileUrl: '',
  });
  const [initialSchool, setInitialSchool] = useState({
    schoolName: '',
    schoolLocation: '',
    shortCode: '',
    numberOfTerms: 3,
  });

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
      setInitialProfile({
        adminName: ((admin.name as string) || '').trim(),
        adminPhone: ((admin.phone as string) || '').trim(),
        profileUrl: ((admin.profileUrl as string) || '').trim(),
      });
      if (school) {
        setSchoolName((school.name as string) || '');
        setSchoolLocation((school.location as string) || '');
        setShortCode((school.shortCode as string) || '');
        setNumberOfTerms(school.numberOfTerms ?? 3);
        setInitialSchool({
          schoolName: ((school.name as string) || '').trim(),
          schoolLocation: ((school.location as string) || '').trim(),
          shortCode: ((school.shortCode as string) || '').trim().toUpperCase(),
          numberOfTerms: school.numberOfTerms ?? 3,
        });
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
      setInitialProfile({
        adminName: adminName.trim(),
        adminPhone: adminPhone.trim(),
        profileUrl: (profileUrl || '').trim(),
      });
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
      setInitialSchool({
        schoolName: schoolName.trim(),
        schoolLocation: schoolLocation.trim(),
        shortCode: code,
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
  const normalizedShortCode = shortCode.trim().toUpperCase();
  const isShortCodeValid = !normalizedShortCode || (normalizedShortCode.length >= 2 && normalizedShortCode.length <= 6);
  const hasProfileChanges =
    adminName.trim() !== initialProfile.adminName ||
    adminPhone.trim() !== initialProfile.adminPhone ||
    (profileUrl || '').trim() !== initialProfile.profileUrl;
  const hasSchoolChanges =
    schoolName.trim() !== initialSchool.schoolName ||
    schoolLocation.trim() !== initialSchool.schoolLocation ||
    normalizedShortCode !== initialSchool.shortCode ||
    numberOfTerms !== initialSchool.numberOfTerms;
  const canSaveProfile = !!adminName.trim() && hasProfileChanges && !savingProfile;
  const canSaveSchool = !!schoolName.trim() && isShortCodeValid && hasSchoolChanges && !savingSchool;
  const isNewPasswordValid = newPw.length >= 6;
  const canSavePassword = !!curPw.trim() && !!newPw.trim() && curPw !== newPw && isNewPasswordValid && !savingPw;

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
            disabled={!canSaveProfile}
            className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
            disabled={!canSaveSchool}
            className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
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

export default SchoolAccountPage;
