import React, { useEffect, useMemo, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import { getSchoolStudents } from '../../services/studentService';
import {
  getFeeAccounts,
  getPaymentSubmissions,
  upsertFeeAccount,
  bulkUpsertFeeAccounts,
  upsertPaymentInstructions,
  getPaymentInstructions,
  approveSubmission,
  rejectSubmission,
} from '../../services/feesService';
import { publicUploadUrl } from '../../utils/publicUploadUrl';
import { formatRwf } from '../../utils/formatRwf';

function formatFeeAccountCohort(a: { feeBucketKey?: string; academicYear?: number; term?: number }) {
  const key = a.feeBucketKey;
  if (!key) return '—';
  if (key === 'school-wide') return 'School-wide';
  if (String(key).startsWith('legacy-')) {
    if (a.academicYear != null || a.term != null) {
      return `Year ${a.academicYear ?? '—'} · Term ${a.term ?? '—'}`;
    }
    return key;
  }
  const m = /^(\w+)-(\d{4})$/.exec(String(key));
  if (m) return `${m[1].charAt(0).toUpperCase() + m[1].slice(1)} ${m[2]}`;
  return key;
}

const FeesPage: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [instructions, setInstructions] = useState<Record<string, unknown>>({});
  const [instructionsDraft, setInstructionsDraft] = useState<Record<string, unknown>>({});

  const [accountForm, setAccountForm] = useState({
    studentId: '',
    totalAmountDue: '',
    academicYear: new Date().getFullYear(),
    term: 1,
  });

  const [loading, setLoading] = useState(false);
  const [savingInstructions, setSavingInstructions] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);

  const [pendingModalOpen, setPendingModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState<'ALL_ACTIVE' | 'COHORT'>('ALL_ACTIVE');
  const [bulkSeason, setBulkSeason] = useState<'fall' | 'spring' | 'summer' | 'winter'>('fall');
  const [bulkCohortYear, setBulkCohortYear] = useState<number>(new Date().getFullYear());
  const [bulkOnlyActive, setBulkOnlyActive] = useState(true);
  const [bulkAmount, setBulkAmount] = useState('');
  const [bulkPreview, setBulkPreview] = useState<{
    total: number;
    feeBucketKey: string;
    sample: { _id?: string; name?: string; studentId?: string; cohortLabel?: string }[];
    skippedMissingCohort: number;
  } | null>(null);
  const [bulkPreviewLoading, setBulkPreviewLoading] = useState(false);
  const [bulkApplying, setBulkApplying] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [instructionsModalOpen, setInstructionsModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingSubmissionId, setRejectingSubmissionId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const loadData = async (): Promise<{ pendingCount: number }> => {
    setLoading(true);
    try {
      const [studentsRes, accountsRes, subsRes, instrRes] = await Promise.all([
        getSchoolStudents(1, 200),
        getFeeAccounts(),
        getPaymentSubmissions({ status: 'PENDING' }),
        getPaymentInstructions(),
      ]);
      const subs = subsRes.data || [];
      setStudents(studentsRes.data || []);
      setAccounts(accountsRes.data || []);
      setSubmissions(subs);
      const instr = instrRes.data || {};
      setInstructions(instr);
      return { pendingCount: subs.length };
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load fees data');
      return { pendingCount: 0 };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openInstructionsModal = () => {
    setInstructionsDraft({ ...instructions });
    setInstructionsModalOpen(true);
  };

  const openAccountModal = () => {
    setAccountForm({
      studentId: '',
      totalAmountDue: '',
      academicYear: new Date().getFullYear(),
      term: 1,
    });
    setAccountModalOpen(true);
  };

  const saveInstructions = async () => {
    try {
      setSavingInstructions(true);
      await upsertPaymentInstructions(instructionsDraft);
      toast.success('Payment instructions saved');
      setInstructions({ ...instructionsDraft });
      setInstructionsModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save instructions');
    } finally {
      setSavingInstructions(false);
    }
  };

  const saveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingAccount(true);
      await upsertFeeAccount({
        ...accountForm,
        totalAmountDue: Number(accountForm.totalAmountDue),
      });
      toast.success('Student fee account saved');
      setAccountModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save account');
    } finally {
      setSavingAccount(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setApprovingId(id);
      await approveSubmission(id);
      toast.success('Submission approved');
      const { pendingCount } = await loadData();
      if (pendingCount === 0) setPendingModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Approval failed');
    } finally {
      setApprovingId(null);
    }
  };

  const openRejectModal = (id: string) => {
    setRejectingSubmissionId(id);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const confirmReject = async () => {
    if (!rejectingSubmissionId || isRejecting) return;
    const reason = rejectReason.trim() || 'Submission rejected';
    try {
      setIsRejecting(true);
      await rejectSubmission(rejectingSubmissionId, reason);
      toast.success('Submission rejected');
      setRejectModalOpen(false);
      setRejectingSubmissionId(null);
      setRejectReason('');
      const { pendingCount } = await loadData();
      if (pendingCount === 0) setPendingModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Rejection failed');
    } finally {
      setIsRejecting(false);
    }
  };

  const instructionSummary = useMemo(() => {
    const bank = Boolean(instructions.bankName || instructions.bankAccountNumber);
    const momo = Boolean(instructions.momoNumber);
    const text = Boolean(
      typeof instructions.instructionsText === 'string' && (instructions.instructionsText as string).trim()
    );
    return { bank, momo, text };
  }, [instructions]);

  const proofHref = (s: any) => {
    const url = s.proofUrl || s.proofAssetId?.publicUrl;
    if (!url) return '';
    return publicUploadUrl(String(url));
  };

  /** When MIME or URL indicates an image, show inline preview. */
  const proofImageSrc = (s: any): string | null => {
    const href = proofHref(s);
    if (!href) return null;
    const mime = String(s.proofAssetId?.mimeType || '').toLowerCase();
    if (mime.startsWith('image/')) return href;
    if (s.proofAssetId?.category === 'image') return href;
    if (/\.(jpe?g|png|gif|webp|heic|heif)(\?|#|$)/i.test(href)) return href;
    return null;
  };

  const bulkCohortPreviewLabel = useMemo(() => {
    if (bulkMode !== 'COHORT') return null;
    const s = bulkSeason.charAt(0).toUpperCase() + bulkSeason.slice(1);
    return `${s} ${bulkCohortYear}`;
  }, [bulkMode, bulkSeason, bulkCohortYear]);

  /** Enough to call the API: amount set, and cohort fields when in COHORT mode. Preview is optional. */
  const bulkFormValid = useMemo(() => {
    if (String(bulkAmount).trim() === '') return false;
    const amt = Number(bulkAmount);
    if (Number.isNaN(amt) || amt < 0) return false;
    if (bulkMode === 'COHORT') {
      const y = Number(bulkCohortYear);
      if (Number.isNaN(y) || y < 2000 || y > 2100) return false;
    }
    return true;
  }, [bulkAmount, bulkMode, bulkCohortYear]);

  const bulkApplyDisabled =
    bulkApplying ||
    bulkPreviewLoading ||
    !bulkFormValid ||
    (bulkPreview !== null && bulkPreview.total === 0);

  const openBulkModal = () => {
    setBulkMode('ALL_ACTIVE');
    setBulkSeason('fall');
    setBulkCohortYear(new Date().getFullYear());
    setBulkOnlyActive(true);
    setBulkAmount('');
    setBulkPreview(null);
    setBulkModalOpen(true);
  };

  const runBulkPreview = async () => {
    const amt = Number(bulkAmount);
    if (Number.isNaN(amt) || amt < 0) {
      toast.error('Enter a valid amount (RWF)');
      return;
    }
    setBulkPreviewLoading(true);
    setBulkPreview(null);
    try {
      const body: Record<string, unknown> = {
        mode: bulkMode,
        totalAmountDue: amt,
        onlyActive: bulkOnlyActive,
        dryRun: true,
      };
      if (bulkMode === 'COHORT') {
        body.enrollmentSeason = bulkSeason;
        body.enrollmentCohortYear = Number(bulkCohortYear);
      }
      const res = await bulkUpsertFeeAccounts(body);
      const d = res.data as {
        total: number;
        feeBucketKey: string;
        sample: { _id?: string; name?: string; studentId?: string; cohortLabel?: string }[];
        skippedMissingCohort?: number;
      };
      if (d == null) {
        toast.error('Unexpected preview response');
        return;
      }
      setBulkPreview({
        total: d.total,
        feeBucketKey: d.feeBucketKey,
        sample: d.sample || [],
        skippedMissingCohort: d.skippedMissingCohort ?? 0,
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Preview failed');
      setBulkPreview(null);
    } finally {
      setBulkPreviewLoading(false);
    }
  };

  const applyBulkFees = async () => {
    const amt = Number(bulkAmount);
    if (Number.isNaN(amt) || amt < 0) {
      toast.error('Enter a valid amount (RWF)');
      return;
    }
    setBulkApplying(true);
    try {
      const body: Record<string, unknown> = {
        mode: bulkMode,
        totalAmountDue: amt,
        onlyActive: bulkOnlyActive,
        dryRun: false,
      };
      if (bulkMode === 'COHORT') {
        body.enrollmentSeason = bulkSeason;
        body.enrollmentCohortYear = Number(bulkCohortYear);
      }
      const res = await bulkUpsertFeeAccounts(body);
      const d = res.data as { applied?: number; failed?: { studentId: string; reason: string }[]; feeBucketKey?: string };
      const applied = d?.applied ?? 0;
      const failed = d?.failed?.length ?? 0;
      const label = bulkMode === 'COHORT' && bulkCohortPreviewLabel ? bulkCohortPreviewLabel : 'all active students';
      if (failed > 0) {
        toast.success(
          `Updated ${applied} fee ${applied === 1 ? 'account' : 'accounts'} (${label}). ${failed} could not be updated.`
        );
      } else {
        toast.success(`Updated ${applied} fee ${applied === 1 ? 'account' : 'accounts'} (${label})`);
      }
      setBulkModalOpen(false);
      setBulkPreview(null);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Bulk update failed');
    } finally {
      setBulkApplying(false);
    }
  };

  return (
    <DashboardLayout>
      <ToastContainer position="top-right" autoClose={2500} />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School fees</h1>
          <p className="mt-1 text-sm text-gray-600">
            Each area below is separate: review submissions, view accounts, single or bulk fee assignment, and payment instructions.
          </p>
        </div>

        {/* 1 — Pending submissions (card only; full queue in modal) */}
        <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/80 to-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Pending payment submissions</h2>
                  <p className="text-sm text-gray-600">Student payment proofs waiting for your decision.</p>
                </div>
              </div>
              <p className="mt-4 text-3xl font-bold text-gray-900">{submissions.length}</p>
              <p className="text-xs text-gray-500">Awaiting review</p>
            </div>
            <button
              type="button"
              onClick={() => setPendingModalOpen(true)}
              className="shrink-0 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-amber-700 disabled:opacity-50"
              disabled={submissions.length === 0}
            >
              Open review queue
            </button>
          </div>
        </div>


        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 [&>div:last-of-type]:lg:col-span-2">
          {/* 3 — Create / update fee account (card + modal) */}
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-gray-900">Create or update student fee account</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Assign total due, academic year, and term for a student. Opens in its own form so it stays separate from submissions and instructions.
                </p>
                <button
                  type="button"
                  onClick={openAccountModal}
                  className="mt-4 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
                >
                  Open fee account form
                </button>
              </div>
            </div>
          </div>

          {/* Bulk fee assignment */}
          <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/60 to-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-800">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-gray-900">Bulk fee assignment</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Set the same total due (RWF) for all active students or for one intake cohort (e.g. Fall 2026). Amounts already paid are unchanged; balance updates from the model.
                </p>
                <button
                  type="button"
                  onClick={openBulkModal}
                  className="mt-4 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-teal-700"
                >
                  Open bulk assignment
                </button>
              </div>
            </div>
          </div>

          {/* Payment instructions (card + modal) */}
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-gray-900">Payment instructions</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Official channels and notes shown to students and parents. Edited only in the dedicated editor below.
                </p>
                {(instructions.bankAccountName as string | undefined)?.trim() ? (
                  <p className="mt-2 text-sm text-gray-700">
                    <span className="font-medium text-gray-900">Bank account holder:</span>{' '}
                    {String(instructions.bankAccountName)}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                      instructionSummary.bank ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Bank {instructionSummary.bank ? 'on' : 'off'}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                      instructionSummary.momo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    MoMo {instructionSummary.momo ? 'on' : 'off'}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                      instructionSummary.text ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Notes {instructionSummary.text ? 'set' : 'empty'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={openInstructionsModal}
                  className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                >
                  Edit payment instructions
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2 — Fee accounts (read-only table card) */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </span>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Fee accounts</h2>
                <p className="text-sm text-gray-600">Balances and status per student (read-only here).</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => loadData()}
              disabled={loading}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <p className="text-sm text-gray-500">No fee accounts yet. Use “Create or update fee account” to add one.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-700">
                  <tr>
                    <th className="px-4 py-3 font-medium">Student</th>
                    <th className="px-4 py-3 font-medium">Cohort / bucket</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Due</th>
                    <th className="px-4 py-3 font-medium">Paid</th>
                    <th className="px-4 py-3 font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {accounts.map((a) => (
                    <tr key={a._id} className="hover:bg-gray-50/80">
                      <td className="px-4 py-3 font-medium text-gray-900">{a.studentId?.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{formatFeeAccountCohort(a)}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{formatRwf(a.totalAmountDue)}</td>
                      <td className="px-4 py-3 text-gray-700">{formatRwf(a.totalAmountPaid)}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{formatRwf(a.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

       
      </div>

      {/* Modal: pending submissions queue */}
      <Modal
        isOpen={pendingModalOpen}
        onClose={() => {
          if (!isRejecting && !rejectModalOpen) setPendingModalOpen(false);
        }}
        title="Review pending submissions"
        size="lg"
      >
        <p className="mb-4 text-sm text-gray-600">Approve or reject each proof. Reject opens a short reason form.</p>
        <div
          className={`max-h-[60vh] space-y-3 overflow-y-auto pr-1 transition-opacity ${
            isRejecting ? 'pointer-events-none opacity-50' : ''
          }`}
        >
          {submissions.length === 0 ? (
            <p className="text-sm text-gray-500">No pending submissions.</p>
          ) : (
            submissions.map((s) => (
              <div
                key={s._id}
                className="rounded-xl border border-gray-200 bg-gray-50/50 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold text-gray-900">{s.studentId?.name || 'Student'}</p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{formatRwf(s.amountSubmitted)}</span> · {s.paymentMethod}
                    </p>
                    <p className="text-xs text-gray-600">Reference: {s.paymentReference || '—'}</p>
                    {(() => {
                      const imgSrc = proofImageSrc(s);
                      const href = proofHref(s);
                      if (imgSrc) {
                        return (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open payment proof"
                            className="mt-2 inline-block max-w-full rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <img
                              src={imgSrc}
                              alt={`Payment proof from ${s.studentId?.name || 'student'}`}
                              className="max-h-48 max-w-full rounded-lg object-contain"
                            />
                          </a>
                        );
                      }
                      if (href) {
                        return (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-block text-xs font-medium text-blue-600 hover:underline"
                          >
                            View payment proof
                          </a>
                        );
                      }
                      return <p className="text-xs text-gray-500">No proof image</p>;
                    })()}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(s._id)}
                      disabled={Boolean(approvingId) || isRejecting}
                      className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
                    >
                      {approvingId === s._id ? (
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : null}
                      {approvingId === s._id ? 'Approving…' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openRejectModal(s._id)}
                      disabled={Boolean(approvingId) || isRejecting}
                      className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-6 flex justify-end border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={() => {
              if (!isRejecting) setPendingModalOpen(false);
            }}
            disabled={isRejecting}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </Modal>

      {/* Modal: bulk fee assignment */}
      <Modal
        isOpen={bulkModalOpen}
        onClose={() => {
          if (!bulkApplying && !bulkPreviewLoading) setBulkModalOpen(false);
        }}
        title="Bulk fee assignment"
        size="lg"
      >
        <div className="space-y-4 text-sm text-gray-700">
          <p>
            Choose who receives the same <strong>total amount due</strong> (RWF). This flow does not use academic year or
            term. Existing <strong>amounts paid</strong> on each row stay as stored; balance and status follow the fee
            account rules.
          </p>
          <fieldset>
            <legend className="mb-2 font-medium text-gray-900">Who</legend>
            <div className="flex flex-col gap-2">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="bulkMode"
                  checked={bulkMode === 'ALL_ACTIVE'}
                  onChange={() => {
                    setBulkMode('ALL_ACTIVE');
                    setBulkPreview(null);
                  }}
                />
                <span>All active students in this school</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="bulkMode"
                  checked={bulkMode === 'COHORT'}
                  onChange={() => {
                    setBulkMode('COHORT');
                    setBulkPreview(null);
                  }}
                />
                <span>By intake cohort (enrollment season + cohort year)</span>
              </label>
            </div>
          </fieldset>
          {bulkMode === 'COHORT' ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-medium text-gray-900">Season</label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  value={bulkSeason}
                  onChange={(e) => {
                    setBulkSeason(e.target.value as 'fall' | 'spring' | 'summer' | 'winter');
                    setBulkPreview(null);
                  }}
                >
                  <option value="fall">Fall</option>
                  <option value="spring">Spring</option>
                  <option value="summer">Summer</option>
                  <option value="winter">Winter</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block font-medium text-gray-900">Cohort year</label>
                <input
                  type="number"
                  min={2000}
                  max={2100}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  value={bulkCohortYear}
                  onChange={(e) => {
                    setBulkCohortYear(Number(e.target.value));
                    setBulkPreview(null);
                  }}
                />
              </div>
              <p className="sm:col-span-2 text-xs text-gray-600">
                Cohort label: <span className="font-semibold text-gray-900">{bulkCohortPreviewLabel}</span>
              </p>
            </div>
          ) : null}
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={bulkOnlyActive}
              onChange={(e) => {
                setBulkOnlyActive(e.target.checked);
                setBulkPreview(null);
              }}
            />
            <span>Only active students</span>
          </label>
          <div>
            <label className="mb-1 block font-medium text-gray-900">Total amount due (RWF)</label>
            <input
              type="number"
              min={0}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="e.g. 500000"
              value={bulkAmount}
              onChange={(e) => {
                setBulkAmount(e.target.value);
                setBulkPreview(null);
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              disabled={bulkPreviewLoading || bulkApplying}
              onClick={() => void runBulkPreview()}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
            >
              {bulkPreviewLoading ? 'Loading preview…' : 'Preview'}
            </button>
            <button
              type="button"
              disabled={bulkApplyDisabled}
              onClick={() => void applyBulkFees()}
              className="rounded-lg bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {bulkApplying
                ? 'Applying…'
                : bulkPreview && bulkPreview.total > 0
                  ? `Apply to ${bulkPreview.total} student${bulkPreview.total === 1 ? '' : 's'}`
                  : 'Apply fees'}
            </button>
          </div>
          {bulkPreviewLoading ? (
            <div
              className="rounded-xl border border-gray-200 bg-gray-50/80 p-4"
              aria-busy="true"
              aria-label="Loading preview"
            >
              <div className="space-y-2">
                <div className="h-4 w-3/4 max-w-xs animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
              </div>
              <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="grid grid-cols-3 gap-2 border-b border-gray-100 bg-gray-50 px-2 py-2">
                  <div className="h-3 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 animate-pulse rounded bg-gray-200" />
                </div>
                <div className="divide-y divide-gray-100 px-2 py-1">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="grid grid-cols-3 gap-2 py-2">
                      <div className="h-3 animate-pulse rounded bg-gray-100" />
                      <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-500">Loading preview…</p>
            </div>
          ) : bulkPreview ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4">
              <p className="font-medium text-gray-900">
                {bulkPreview.total} student{bulkPreview.total === 1 ? '' : 's'} · bucket{' '}
                <code className="rounded bg-gray-200 px-1 text-xs">{bulkPreview.feeBucketKey}</code>
              </p>
              {bulkMode === 'COHORT' && bulkPreview.skippedMissingCohort > 0 ? (
                <p className="mt-2 text-xs text-amber-800">
                  Note: {bulkPreview.skippedMissingCohort} active student
                  {bulkPreview.skippedMissingCohort === 1 ? '' : 's'} in the school lack enrollment season or cohort year
                  and are not included in this cohort.
                </p>
              ) : null}
              {bulkPreview.sample.length > 0 ? (
                <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-white">
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-50 text-left text-gray-700">
                      <tr>
                        <th className="px-2 py-2 font-medium">Name</th>
                        <th className="px-2 py-2 font-medium">Student ID</th>
                        <th className="px-2 py-2 font-medium">Cohort</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {bulkPreview.sample.map((row, idx) => (
                        <tr key={String(row._id || row.studentId || `${row.name || 'row'}-${idx}`)}>
                          <td className="px-2 py-2">{row.name || '—'}</td>
                          <td className="px-2 py-2 text-gray-600">{row.studentId || '—'}</td>
                          <td className="px-2 py-2 text-gray-600">{row.cohortLabel || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
              <p className="mt-2 text-xs text-gray-500">Sample shows up to 20 students (sorted by name).</p>
            </div>
          ) : null}
        </div>
      </Modal>

      {/* Modal: fee account form */}
      <Modal
        isOpen={accountModalOpen}
        onClose={() => !savingAccount && setAccountModalOpen(false)}
        title="Create or update student fee account"
        size="lg"
      >
        <form onSubmit={saveAccount} className="space-y-4">
          <p className="text-sm text-gray-600">Set total due and period for one student.</p>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Student</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={accountForm.studentId}
              onChange={(e) => setAccountForm({ ...accountForm, studentId: e.target.value })}
              required
            >
              <option value="">Select student</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.studentId || s._id})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Total amount due (RWF)</label>
            <input
              type="number"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. 500000"
              value={accountForm.totalAmountDue}
              onChange={(e) => setAccountForm({ ...accountForm, totalAmountDue: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Academic year</label>
              <input
                type="number"
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                value={accountForm.academicYear}
                onChange={(e) => setAccountForm({ ...accountForm, academicYear: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Term</label>
              <input
                type="number"
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                value={accountForm.term}
                onChange={(e) => setAccountForm({ ...accountForm, term: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              disabled={savingAccount}
              onClick={() => setAccountModalOpen(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingAccount}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {savingAccount ? 'Saving…' : 'Save fee account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: payment instructions */}
      <Modal
        isOpen={instructionsModalOpen}
        onClose={() => !savingInstructions && setInstructionsModalOpen(false)}
        title="Payment instructions"
        size="lg"
      >
        <p className="mb-4 text-sm text-gray-600">These details are shown to students and parents for fee payment.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Bank name</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="Bank name"
              value={String(instructionsDraft.bankName ?? '')}
              onChange={(e) => setInstructionsDraft({ ...instructionsDraft, bankName: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Bank account name</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="Account name"
              value={String(instructionsDraft.bankAccountName ?? '')}
              onChange={(e) => setInstructionsDraft({ ...instructionsDraft, bankAccountName: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Bank account number</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="Account number"
              value={String(instructionsDraft.bankAccountNumber ?? '')}
              onChange={(e) => setInstructionsDraft({ ...instructionsDraft, bankAccountNumber: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">MoMo number</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="MoMo number"
              value={String(instructionsDraft.momoNumber ?? '')}
              onChange={(e) => setInstructionsDraft({ ...instructionsDraft, momoNumber: e.target.value })}
            />
          </div>
        </div>
        <div className="mt-3">
          <label className="mb-1 block text-sm font-medium text-gray-700">Instructions for parents / students</label>
          <textarea
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            rows={4}
            placeholder="e.g. reference format, deadlines, branches…"
            value={String(instructionsDraft.instructionsText ?? '')}
            onChange={(e) => setInstructionsDraft({ ...instructionsDraft, instructionsText: e.target.value })}
          />
        </div>
        <div className="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-4">
          <button
            type="button"
            disabled={savingInstructions}
            onClick={() => setInstructionsModalOpen(false)}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={savingInstructions}
            onClick={saveInstructions}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {savingInstructions ? 'Saving…' : 'Save instructions'}
          </button>
        </div>
      </Modal>

      {/* Modal: reject reason */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => {
          if (!isRejecting) {
            setRejectModalOpen(false);
            setRejectingSubmissionId(null);
          }
        }}
        title="Reject submission"
        size="md"
      >
        <div className={isRejecting ? 'pointer-events-none opacity-60' : ''}>
          <p className="mb-3 text-sm text-gray-600">Provide a short reason for the student or parent.</p>
          <textarea
            className="w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-gray-50"
            rows={3}
            placeholder="Reason for rejection"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            disabled={isRejecting}
            aria-busy={isRejecting}
          />
        </div>
        {isRejecting ? (
          <p className="mt-2 text-sm font-medium text-gray-600">Submitting rejection…</p>
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              if (!isRejecting) {
                setRejectModalOpen(false);
                setRejectingSubmissionId(null);
              }
            }}
            disabled={isRejecting}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmReject}
            disabled={isRejecting}
            aria-busy={isRejecting}
            className="inline-flex min-w-[10rem] items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {isRejecting ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : null}
            {isRejecting ? 'Rejecting…' : 'Confirm reject'}
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default FeesPage;
