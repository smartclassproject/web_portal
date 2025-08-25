import React from 'react';
import Modal from '../ui/Modal';
import type { School } from '../../types';

interface DeleteSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  school: School;
  onDelete: () => void;
  loading?: boolean;
}

const DeleteSchoolModal: React.FC<DeleteSchoolModalProps> = ({ isOpen, onClose, school, onDelete, loading }) => {
  if (!school) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete School" size="sm">
      <div className="space-y-6">
        <p className="text-gray-700">Are you sure you want to delete <span className="font-bold">{school.name}</span>?</p>
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">Cancel</button>
          <button type="button" onClick={onDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                Deleting...
              </span>
            ) : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteSchoolModal; 