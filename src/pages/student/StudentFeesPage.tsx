import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getStudentFees, submitStudentFeeProof } from '../../services/studentPortalService';
import { uploadFileAsset } from '../../services/uploadService';
import { publicUploadUrl } from '../../utils/publicUploadUrl';

const StudentFeesPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [uploadedProof, setUploadedProof] = useState<{ assetId: string; url: string } | null>(null);
  const [form, setForm] = useState({ amountSubmitted: '', paymentMethod: 'MOMO', paymentReference: '', notes: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await getStudentFees();
      setData(res.data || {});
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to load fees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedProof?.assetId) {
      toast.error('Please upload payment proof image before submitting.');
      return;
    }
    try {
      setIsSubmitting(true);
      await submitStudentFeeProof({
        amountSubmitted: Number(form.amountSubmitted),
        paymentMethod: form.paymentMethod,
        paymentReference: form.paymentReference,
        notes: form.notes,
        proofAssetId: uploadedProof.assetId,
      });
      toast.success('Payment proof submitted');
      setForm({ amountSubmitted: '', paymentMethod: 'MOMO', paymentReference: '', notes: '' });
      setUploadedProof(null);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit proof');
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadProof = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Payment proof must be an image.');
      return;
    }
    try {
      setIsUploadingProof(true);
      const res = await uploadFileAsset('fees_proof', file);
      const payload = res?.data;
      if (!payload?.assetId) throw new Error('Upload failed');
      setUploadedProof({ assetId: String(payload.assetId), url: String(payload.url || '') });
      toast.success('Proof uploaded successfully');
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message || 'Failed to upload proof');
    } finally {
      setIsUploadingProof(false);
    }
  };

  if (loading) return <div className="bg-white rounded-xl p-6">Loading fees...</div>;

  const account = data?.account;
  const pi = data?.paymentInstructions;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-semibold mb-3">Fee Status</h2>
          {account ? (
            <div className="space-y-2 text-sm text-gray-700">
              <p><span className="font-medium">Total due:</span> {account.totalAmountDue}</p>
              <p><span className="font-medium">Total paid:</span> {account.totalAmountPaid}</p>
              <p><span className="font-medium">Balance:</span> {account.balance}</p>
              <p><span className="font-medium">Status:</span> {account.status}</p>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No fee account yet. Contact your school admin.</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-semibold mb-3">Where To Pay School Fees</h2>
          {pi ? (
            <div className="space-y-2 text-sm text-gray-700">
              <p><span className="font-medium">Methods:</span> {(pi.paymentMethods || []).join(', ') || 'Not set'}</p>
              <p><span className="font-medium">Account name:</span> {pi.accountName || 'Not set'}</p>
              <p><span className="font-medium">Account number:</span> {pi.accountNumber || 'Not set'}</p>
              <p><span className="font-medium">Wallet number:</span> {pi.walletNumber || 'Not set'}</p>
              <p><span className="font-medium">Bank:</span> {pi.bankName || 'Not set'}</p>
              <p><span className="font-medium">Notes:</span> {pi.notes || 'No extra notes'}</p>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Payment instructions are not configured yet. Contact your school admin.</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-lg font-semibold mb-3">Submit Payment Proof</h2>
        <form className="space-y-3" onSubmit={submit}>
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Amount paid"
            type="number"
            value={form.amountSubmitted}
            onChange={(e) => setForm((p) => ({ ...p, amountSubmitted: e.target.value }))}
            required
          />
          <select
            className="w-full border rounded-lg px-3 py-2"
            value={form.paymentMethod}
            onChange={(e) => setForm((p) => ({ ...p, paymentMethod: e.target.value }))}
          >
            <option value="MOMO">MoMo</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
          </select>
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Transaction / reference number"
            value={form.paymentReference}
            onChange={(e) => setForm((p) => ({ ...p, paymentReference: e.target.value }))}
          />
          <textarea
            className="w-full border rounded-lg px-3 py-2"
            rows={4}
            placeholder="Optional note"
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Payment proof image *</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => uploadProof(e.target.files?.[0])}
              disabled={isUploadingProof || isSubmitting}
              className="w-full border rounded-lg px-3 py-2"
            />
            {isUploadingProof && <p className="text-xs text-blue-600">Uploading image...</p>}
            {uploadedProof?.url ? (
              <img src={publicUploadUrl(uploadedProof.url)} alt="Payment proof preview" className="max-h-44 rounded-lg border" />
            ) : null}
          </div>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-60"
            disabled={isSubmitting || isUploadingProof}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Proof'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentFeesPage;
