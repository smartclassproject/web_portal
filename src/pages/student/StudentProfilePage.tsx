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

const asRecord = (value: unknown): Record<string, any> => (
  value && typeof value === 'object' ? (value as Record<string, any>) : {}
);

const pickStudentId = (profile: any): string | null => {
  const identity = asRecord(profile?.identity);
  const raw = asRecord(profile?.raw);
  const candidate = [
    profile?.studentId,
    identity.studentId,
    raw.studentId,
    profile?.registrationNumber,
    raw.registrationNumber,
    profile?.admissionNumber,
    raw.admissionNumber,
    profile?.cardId,
    raw.cardId
  ].find((v) => typeof v === 'string' && v.trim().length > 0);
  return candidate ? String(candidate) : null;
};

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

  const identity = asRecord(profile.identity);
  const personal = asRecord(profile.personal);
  const academic = asRecord(profile.academic);
  const parentGuardian = asRecord(profile.parentGuardian);
  const studentId = pickStudentId(profile);
  const dobValue = personal.dateOfBirth ?? profile.dateOfBirth;
  const dob = dobValue ? new Date(dobValue).toLocaleDateString() : null;

  return (
    <div className="space-y-4">
      <Section title="Identity">
        <Field label="Name" value={identity.name ?? profile.name} />
        <Field label="Student ID" value={studentId} />
        <Field label="Class" value={identity.className ?? profile.className ?? profile.class} />
        <Field label="Status" value={identity.status ?? profile.status} />
      </Section>
      <Section title="Personal Details">
        <Field label="Date of birth" value={dob} />
        <Field label="Gender" value={personal.gender ?? profile.gender} />
        <Field label="Email" value={personal.email ?? profile.email} />
        <Field label="Phone" value={personal.phone ?? profile.phone} />
      </Section>
      <Section title="Academic Details">
        <Field label="Major" value={academic.major ?? profile.major} />
        <Field label="Major code" value={academic.majorCode ?? profile.majorCode} />
        <Field label="Enrollment year" value={academic.enrollmentYear ?? profile.enrollmentYear} />
        <Field label="Academic year" value={academic.academicYear ?? profile.academicYear} />
        <Field label="Entry term" value={academic.entryTerm ?? profile.term} />
        <Field label="Cohort" value={academic.enrollmentCohortYear ?? profile.cohort} />
      </Section>
      <Section title="Parent / Guardian">
        <Field label="First name" value={parentGuardian.firstName ?? profile.parentFirstName} />
        <Field label="Last name" value={parentGuardian.lastName ?? profile.parentLastName} />
        <Field label="Phone" value={parentGuardian.phoneNumber ?? profile.parentPhoneNumber} />
      </Section>
    </div>
  );
};

export default StudentProfilePage;
