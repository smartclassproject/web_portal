import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import type { Material, Course } from '../../types';
import { toast } from 'react-toastify';
import { uploadFileAsset } from '../../services/uploadService';

type MaterialFileType = Material['fileType'];

function inferFileTypeFromFileName(fileName: string): MaterialFileType {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'ppt') return 'ppt';
  if (ext === 'pptx') return 'pptx';
  if (['mp4', 'webm', 'mov', 'mkv', 'avi', 'm4v'].includes(ext)) return 'video';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'heic'].includes(ext)) return 'image';
  if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext)) return 'document';
  return 'other';
}

function normalizeHttpUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return '';
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

export type MaterialSubmitPayload = {
  courseId: string;
  title: string;
  description?: string;
  fileType: MaterialFileType;
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  isPublished?: boolean;
};

interface AddMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (materialData: MaterialSubmitPayload) => void;
  initialData?: Material | null;
  courses: Course[];
  isEdit?: boolean;
  loading?: boolean;
}

const AddMaterialModal: React.FC<AddMaterialModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  courses,
  isEdit = false,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    courseId: '',
    title: '',
    description: '',
    fileType: 'document' as MaterialFileType,
    fileUrl: '',
    fileName: '',
    fileSize: 0,
    isPublished: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploadingAsset, setIsUploadingAsset] = useState(false);

  useEffect(() => {
    if (initialData && isEdit) {
      setFormData({
        courseId: typeof initialData.courseId === 'string' ? initialData.courseId : initialData.courseId._id,
        title: initialData.title,
        description: initialData.description || '',
        fileType: initialData.fileType,
        fileUrl: initialData.fileUrl,
        fileName: initialData.fileName || '',
        fileSize: initialData.fileSize || 0,
        isPublished: initialData.isPublished
      });
    }
  }, [initialData, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileTypeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as MaterialFileType;
    setFormData(prev => {
      if (next === 'link' && prev.fileType !== 'link') {
        return { ...prev, fileType: 'link', fileUrl: '', fileName: '', fileSize: 0 };
      }
      if (next !== 'link' && prev.fileType === 'link') {
        return { ...prev, fileType: next, fileUrl: '', fileName: '', fileSize: 0 };
      }
      return { ...prev, fileType: next };
    });
    setErrors(prev => ({ ...prev, fileUrl: '', fileType: '' }));
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        courseId: '',
        title: '',
        description: '',
        fileType: 'document',
        fileUrl: '',
        fileName: '',
        fileSize: 0,
        isPublished: false
      });
      setErrors({});
    }
    onClose();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.courseId.trim()) newErrors.courseId = 'Course is required';
    if (!formData.title.trim()) newErrors.title = 'Title is required';

    if (formData.fileType === 'link') {
      const url = normalizeHttpUrl(formData.fileUrl);
      if (!formData.fileUrl.trim()) newErrors.fileUrl = 'Enter the link URL';
      else if (!/^https?:\/\/.+/i.test(url)) newErrors.fileUrl = 'Enter a valid http(s) URL';
    } else {
      if (!formData.fileUrl.trim()) {
        newErrors.fileUrl = isEdit ? 'Add a file or keep the existing resource' : 'Upload a file to attach this material';
      } else if (!/^https?:\/\/.+/i.test(formData.fileUrl.trim())) {
        newErrors.fileUrl = 'Invalid resource URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const fileUrl =
      formData.fileType === 'link'
        ? normalizeHttpUrl(formData.fileUrl)
        : formData.fileUrl.trim();

    onSubmit({
      courseId: formData.courseId.trim(),
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      fileType: formData.fileType,
      fileUrl,
      fileName: formData.fileName.trim() || undefined,
      fileSize: formData.fileSize || undefined,
      isPublished: formData.isPublished
    });
    if (!loading) {
      setFormData({
        courseId: '',
        title: '',
        description: '',
        fileType: 'document',
        fileUrl: '',
        fileName: '',
        fileSize: 0,
        isPublished: false
      });
      setErrors({});
    }
  };

  const handleUploadFile = async (file?: File | null) => {
    if (!file || formData.fileType === 'link') return;
    try {
      setIsUploadingAsset(true);
      const res = await uploadFileAsset('study_material', file);
      const data = res?.data || {};
      if (!data.url) {
        throw new Error('Upload did not return file URL');
      }
      const name = (data.originalName as string) || file.name;
      const detected = inferFileTypeFromFileName(name);
      setFormData((prev) => ({
        ...prev,
        fileUrl: data.url as string,
        fileName: name,
        fileSize: Number(data.sizeBytes || file.size || 0),
        fileType: detected
      }));
      setErrors((prev) => ({ ...prev, fileUrl: '' }));
      toast.success(`Uploaded — type set to ${detected.toUpperCase()} (you can change it below)`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(err.response?.data?.message || err.message || 'Failed to upload file');
    } finally {
      setIsUploadingAsset(false);
    }
  };

  const isLink = formData.fileType === 'link';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEdit ? 'Edit material' : 'Upload material'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="courseId" className="block text-sm font-medium text-gray-700 mb-2">Course *</label>
          <select
            id="courseId"
            name="courseId"
            value={formData.courseId}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.courseId ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">Select a course</option>
            {courses.map(course => (
              <option key={course._id} value={course._id}>{course.name}</option>
            ))}
          </select>
          {errors.courseId && <p className="mt-1 text-sm text-red-600">{errors.courseId}</p>}
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="e.g. Chapter 3 — Forces"
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            placeholder="Short note for students"
          />
        </div>

        <div>
          <label htmlFor="fileType" className="block text-sm font-medium text-gray-700 mb-2">File type *</label>
          <select
            id="fileType"
            name="fileType"
            value={formData.fileType}
            onChange={handleFileTypeSelect}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="pdf">PDF</option>
            <option value="ppt">PowerPoint (PPT)</option>
            <option value="pptx">PowerPoint (PPTX)</option>
            <option value="video">Video</option>
            <option value="image">Image</option>
            <option value="document">Document</option>
            <option value="other">Other</option>
            <option value="link">External link</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            {isLink
              ? 'Paste any web address (YouTube, Drive, article, …).'
              : 'Upload a file — we detect the type from the file; you can change it here after upload.'}
          </p>
        </div>

        {isLink ? (
          <div>
            <label htmlFor="linkUrl" className="block text-sm font-medium text-gray-700 mb-2">URL *</label>
            <input
              type="text"
              id="linkUrl"
              name="fileUrl"
              value={formData.fileUrl}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.fileUrl ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="https://… or example.com/resource"
            />
            {errors.fileUrl && <p className="mt-1 text-sm text-red-600">{errors.fileUrl}</p>}
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 space-y-3">
            <label className="block text-sm font-medium text-gray-700">File</label>
            <input
              type="file"
              onChange={(e) => handleUploadFile(e.target.files?.[0])}
              disabled={loading || isUploadingAsset}
              className="w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-white file:text-sm"
            />
            {isUploadingAsset ? (
              <p className="text-xs text-blue-600">Uploading…</p>
            ) : null}
            {formData.fileUrl && !isLink ? (
              <p className="text-xs text-green-700 break-all">
                Resource ready. {formData.fileName ? <span className="font-medium">{formData.fileName}</span> : null}
                {formData.fileSize ? <span> · {(formData.fileSize / 1024).toFixed(1)} KB</span> : null}
              </p>
            ) : null}
            {errors.fileUrl && <p className="text-sm text-red-600">{errors.fileUrl}</p>}
            {isEdit && formData.fileUrl && !isUploadingAsset ? (
              <p className="text-xs text-gray-500">Upload a new file to replace the current one.</p>
            ) : null}
          </div>
        )}

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="isPublished"
              checked={formData.isPublished}
              onChange={handleChange}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Publish to students</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading || isUploadingAsset}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || isUploadingAsset}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading || isUploadingAsset ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                {isUploadingAsset ? 'Uploading…' : isEdit ? 'Saving…' : 'Saving…'}
              </>
            ) : (
              isEdit ? 'Save changes' : 'Add material'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddMaterialModal;
