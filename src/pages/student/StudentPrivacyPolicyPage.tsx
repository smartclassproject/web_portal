import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getStudentPrivacyPolicy } from '../../services/studentPortalService';

const StudentPrivacyPolicyPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [policy, setPolicy] = useState<any>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await getStudentPrivacyPolicy();
        setPolicy(res.data || null);
      } catch (e: any) {
        toast.error(e.response?.data?.message || 'Failed to load privacy policy');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="bg-white rounded-xl p-6">Loading privacy policy...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {policy ? (
        <>
          <h2 className="text-xl font-semibold text-gray-900">{policy.title}</h2>
          <p className="text-xs text-gray-500 mt-1">
            Version: {policy.version || 'N/A'} • Updated: {new Date(policy.updatedAt).toLocaleString()}
          </p>
          <div className="mt-4 whitespace-pre-wrap text-sm text-gray-700 leading-6">{policy.content}</div>
        </>
      ) : (
        <>
          <h2 className="text-xl font-semibold text-gray-900">Privacy Policy</h2>
          <p className="text-sm text-gray-600 mt-3">
            We value your privacy. Student data is used only for academic operations, communication, and school administration.
            Full privacy policy has not been published yet by system administration.
          </p>
          <p className="text-sm text-gray-600 mt-2">For details, please contact your school admin.</p>
        </>
      )}
    </div>
  );
};

export default StudentPrivacyPolicyPage;
