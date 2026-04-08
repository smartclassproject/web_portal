import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getSchoolStudents } from '../../services/studentService';
import { getFeeAccounts, getPaymentSubmissions, upsertFeeAccount, upsertPaymentInstructions, getPaymentInstructions, approveSubmission, rejectSubmission } from '../../services/feesService';

const FeesPage: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [instructions, setInstructions] = useState<any>({});
  const [form, setForm] = useState({ studentId: '', totalAmountDue: '', academicYear: new Date().getFullYear(), term: 1 });
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [studentsRes, accountsRes, subsRes, instrRes] = await Promise.all([
        getSchoolStudents(1, 200),
        getFeeAccounts(),
        getPaymentSubmissions({ status: 'PENDING' }),
        getPaymentInstructions()
      ]);
      setStudents(studentsRes.data || []);
      setAccounts(accountsRes.data || []);
      setSubmissions(subsRes.data || []);
      setInstructions(instrRes.data || {});
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load fees data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const saveInstructions = async () => {
    try {
      await upsertPaymentInstructions(instructions);
      toast.success('Payment instructions saved');
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save instructions');
    }
  };

  const saveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await upsertFeeAccount({ ...form, totalAmountDue: Number(form.totalAmountDue) });
      toast.success('Student fee account saved');
      setForm({ studentId: '', totalAmountDue: '', academicYear: new Date().getFullYear(), term: 1 });
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save account');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveSubmission(id);
      toast.success('Submission approved');
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Approval failed');
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt('Rejection reason') || 'Submission rejected';
    try {
      await rejectSubmission(id, reason);
      toast.success('Submission rejected');
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Rejection failed');
    }
  };

  return (
    <DashboardLayout>
      <ToastContainer position="top-right" autoClose={2500} />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School Fees</h1>
          <p className="text-sm text-gray-600">Manage payment instructions, fee accounts, and payment proof review.</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4 space-y-3">
          <h2 className="text-lg font-semibold">Payment Instructions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="border rounded px-3 py-2" placeholder="Bank Name" value={instructions.bankName || ''} onChange={(e) => setInstructions({ ...instructions, bankName: e.target.value })} />
            <input className="border rounded px-3 py-2" placeholder="Bank Account Name" value={instructions.bankAccountName || ''} onChange={(e) => setInstructions({ ...instructions, bankAccountName: e.target.value })} />
            <input className="border rounded px-3 py-2" placeholder="Bank Account Number" value={instructions.bankAccountNumber || ''} onChange={(e) => setInstructions({ ...instructions, bankAccountNumber: e.target.value })} />
            <input className="border rounded px-3 py-2" placeholder="MoMo Number" value={instructions.momoNumber || ''} onChange={(e) => setInstructions({ ...instructions, momoNumber: e.target.value })} />
          </div>
          <textarea className="border rounded px-3 py-2 w-full" placeholder="Instructions" value={instructions.instructionsText || ''} onChange={(e) => setInstructions({ ...instructions, instructionsText: e.target.value })} />
          <button onClick={saveInstructions} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Save Instructions</button>
        </div>

        <form onSubmit={saveAccount} className="bg-white rounded-lg shadow p-4 space-y-3">
          <h2 className="text-lg font-semibold">Create / Update Student Fee Account</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select className="border rounded px-3 py-2" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required>
              <option value="">Select student</option>
              {students.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.studentId})</option>)}
            </select>
            <input type="number" className="border rounded px-3 py-2" placeholder="Total amount due" value={form.totalAmountDue} onChange={(e) => setForm({ ...form, totalAmountDue: e.target.value })} required />
            <input type="number" className="border rounded px-3 py-2" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: Number(e.target.value) })} />
            <input type="number" className="border rounded px-3 py-2" value={form.term} onChange={(e) => setForm({ ...form, term: Number(e.target.value) })} />
          </div>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">Save Fee Account</button>
        </form>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Fee Accounts</h2>
          {loading ? <p className="text-sm text-gray-500">Loading...</p> : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead><tr className="text-left border-b"><th className="py-2">Student</th><th>Status</th><th>Due</th><th>Paid</th><th>Balance</th></tr></thead>
                <tbody>
                  {accounts.map((a) => (
                    <tr key={a._id} className="border-b">
                      <td className="py-2">{a.studentId?.name || 'N/A'}</td><td>{a.status}</td><td>{a.totalAmountDue}</td><td>{a.totalAmountPaid}</td><td>{a.balance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Pending Payment Submissions</h2>
          <div className="space-y-3">
            {submissions.length === 0 ? <p className="text-sm text-gray-500">No pending submissions.</p> : submissions.map((s) => (
              <div key={s._id} className="border rounded p-3 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{s.studentId?.name || 'Student'} - {s.amountSubmitted} ({s.paymentMethod})</p>
                  <p className="text-xs text-gray-600">Reference: {s.paymentReference || 'N/A'} | Proof URL: {s.proofUrl || 'N/A'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(s._id)} className="px-3 py-1 rounded bg-green-600 text-white">Approve</button>
                  <button onClick={() => handleReject(s._id)} className="px-3 py-1 rounded bg-red-600 text-white">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FeesPage;
