import React, { useMemo, useState } from 'react';
import Modal from '../ui/Modal';
import type { StudentCsvImportResponse } from '../../services/studentService';

interface StudentCsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<void>;
  loading?: boolean;
  result: StudentCsvImportResponse | null;
}

const StudentCsvImportModal: React.FC<StudentCsvImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  loading = false,
  result,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  const failedRows = useMemo(
    () => (result?.results || []).filter((row) => row.status === 'failed'),
    [result]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please choose a CSV file to import.');
      return;
    }
    setError('');
    await onImport(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setSelectedFile(null);
      setError('Only .csv files are allowed.');
      return;
    }
    setError('');
    setSelectedFile(file);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Students CSV" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
          Required columns: <code>name</code>, <code>gender</code>, <code>classCode</code>, <code>dateOfBirth</code>.
          Accepted genders: <code>male</code>, <code>female</code>, <code>other</code>, <code>prefer_not_to_say</code> (or M/F).
          Dates: <code>YYYY-MM-DD</code> or <code>DD/MM/YYYY</code>. Max file size: 5MB.
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
          Alias headers supported for existing sheets: Names, Gender, Class, Father, Mother, Phone, Birthday.
        </div>

        <div>
          <label htmlFor="csv-file" className="mb-1 block text-sm font-medium text-gray-700">
            CSV file
          </label>
          <input
            id="csv-file"
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          />
          {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          >
            Close
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Importing...' : 'Upload and Import'}
          </button>
        </div>
      </form>

      {result ? (
        <div className="mt-5 space-y-3 border-t border-gray-100 pt-4">
          <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
            <div className="rounded-md border border-gray-200 bg-white p-2">
              <div className="text-gray-500">Total rows</div>
              <div className="font-semibold">{result.summary.totalRows}</div>
            </div>
            <div className="rounded-md border border-green-200 bg-green-50 p-2">
              <div className="text-green-700">Created</div>
              <div className="font-semibold text-green-800">{result.summary.createdCount}</div>
            </div>
            <div className="rounded-md border border-red-200 bg-red-50 p-2">
              <div className="text-red-700">Failed</div>
              <div className="font-semibold text-red-800">{result.summary.failedCount}</div>
            </div>
            <div className="rounded-md border border-blue-200 bg-blue-50 p-2">
              <div className="text-blue-700">Valid rows</div>
              <div className="font-semibold text-blue-800">{result.summary.validRows}</div>
            </div>
          </div>

          {failedRows.length > 0 ? (
            <div className="max-h-64 overflow-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-2">Row</th>
                    <th className="px-3 py-2">Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {failedRows.map((row) => (
                    <tr key={`row-${row.rowNumber}`} className="border-t border-gray-100 align-top">
                      <td className="px-3 py-2 font-medium text-gray-700">{row.rowNumber}</td>
                      <td className="px-3 py-2 text-red-700">{row.errors.join('; ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-green-700">No row-level errors reported.</p>
          )}
        </div>
      ) : null}
    </Modal>
  );
};

export default StudentCsvImportModal;
