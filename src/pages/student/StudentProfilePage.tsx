import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getStudentProfile } from '../../services/studentPortalService';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
    <h3 className="text-base font-semibold text-gray-900 mb-3">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
  </div>
);

const Field: React.FC<{ label: string; value?: unknown }> = ({ label, value }) => (
  <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-sm font-medium text-gray-900">{value ? String(value) : 'Not provided'}</p>
  </div>
);

const StudentProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await getStudentProfile();
        setProfile(res.data || null);
      } catch (e: any) {
        toast.error(e.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="bg-white rounded-xl p-6">Loading profile...</div>;
  if (!profile) return <div className="bg-white rounded-xl p-6 text-gray-500">Profile unavailable.</div>;

  const dob = profile.personal?.dateOfBirth ? new Date(profile.personal.dateOfBirth).toLocaleDateString() : null;

  return (
    <div className="space-y-4">
      <Section title="Identity">
        <Field label="Name" value={profile.identity?.name} />
        <Field label="Student ID" value={profile.identity?.studentId} />
        <Field label="Class" value={profile.identity?.className} />
        <Field label="Status" value={profile.identity?.status} />
      </Section>
      <Section title="Personal Details">
        <Field label="Date of birth" value={dob} />
        <Field label="Gender" value={profile.personal?.gender} />
        <Field label="Email" value={profile.personal?.email} />
        <Field label="Phone" value={profile.personal?.phone} />
      </Section>
      <Section title="Academic Details">
        <Field label="Major" value={profile.academic?.major} />
        <Field label="Major code" value={profile.academic?.majorCode} />
        <Field label="Enrollment year" value={profile.academic?.enrollmentYear} />
        <Field label="Academic year" value={profile.academic?.academicYear} />
        <Field label="Entry term" value={profile.academic?.entryTerm} />
        <Field label="Cohort" value={profile.academic?.enrollmentCohortYear} />
      </Section>
      <Section title="Parent / Guardian">
        <Field label="First name" value={profile.parentGuardian?.firstName} />
        <Field label="Last name" value={profile.parentGuardian?.lastName} />
        <Field label="Phone" value={profile.parentGuardian?.phoneNumber} />
      </Section>
    </div>
  );
};

export default StudentProfilePage;
