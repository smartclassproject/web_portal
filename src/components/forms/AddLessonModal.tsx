import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../ui/Modal';
import type { Lesson, Course, LessonMaterial, LessonMaterialFileType } from '../../types';
import { toast } from 'react-toastify';
import { uploadFileAsset } from '../../services/uploadService';
import { publicUploadUrl } from '../../utils/publicUploadUrl';

const LESSON_MATERIAL_TYPES: LessonMaterialFileType[] = [
  'pdf',
  'ppt',
  'pptx',
  'video',
  'image',
  'document',
  'other',
  'link',
];

function normalizeLessonMaterialType(t: string | undefined): LessonMaterialFileType {
  if (t && LESSON_MATERIAL_TYPES.includes(t as LessonMaterialFileType)) {
    return t as LessonMaterialFileType;
  }
  return 'link';
}

function inferFileTypeFromFileName(fileName: string): LessonMaterialFileType {
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

/** Browser-openable href for stored lesson material URLs */
function materialHref(url: string): string {
  const u = String(url || '').trim();
  if (!u) return '#';
  if (/^https?:\/\//i.test(u)) return u;
  return publicUploadUrl(u);
}

function formatMaterialSize(bytes?: number): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface AddLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (lessonData: {
    courseId: string;
    title: string;
    description?: string;
    lessonDate: string;
    materials?: LessonMaterial[];
    isPublished?: boolean;
  }) => void;
  initialData?: Lesson | null;
  courses: Course[];
  isEdit?: boolean;
  loading?: boolean;
}

const AddLessonModal: React.FC<AddLessonModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  courses,
  isEdit = false,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    courseId: '',
    title: '',
    description: '',
    lessonDate: '',
    materials: [] as LessonMaterial[],
    isPublished: false,
  });

  const [draftName, setDraftName] = useState('');
  const [draftFileType, setDraftFileType] = useState<LessonMaterialFileType>('document');
  const [draftLinkUrl, setDraftLinkUrl] = useState('');
  const [draftSelectedFile, setDraftSelectedFile] = useState<File | null>(null);
  const [draftRemoteMeta, setDraftRemoteMeta] = useState({ fileName: '', fileSize: 0, type: 'document' as LessonMaterialFileType });
  const [isUploadingDraft, setIsUploadingDraft] = useState(false);
  const [draftError, setDraftError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetDraft = useCallback(() => {
    setDraftName('');
    setDraftFileType('document' as LessonMaterialFileType);
    setDraftLinkUrl('');
    setDraftSelectedFile(null);
    setDraftRemoteMeta({ fileName: '', fileSize: 0, type: 'document' });
    setDraftError('');
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    if (initialData && isEdit) {
      const rawMaterials = initialData.materials;
      const materialsList = Array.isArray(rawMaterials)
        ? rawMaterials.map((m) => ({
            name: m.name,
            url: m.url,
            type: normalizeLessonMaterialType(m.type),
            fileName: m.fileName,
            fileSize: m.fileSize,
          }))
        : [];

      const dateRaw = initialData.lessonDate ? String(initialData.lessonDate) : '';
      const lessonDate = dateRaw.includes('T') ? dateRaw.split('T')[0] : dateRaw.slice(0, 10);

      setFormData({
        courseId: typeof initialData.courseId === 'string' ? initialData.courseId : initialData.courseId._id,
        title: initialData.title,
        description: initialData.description || '',
        lessonDate,
        materials: materialsList,
        isPublished: initialData.isPublished,
      });
      resetDraft();
      setErrors({});
      return;
    }

    setFormData({
      courseId: '',
      title: '',
      description: '',
      lessonDate: '',
      materials: [],
      isPublished: false,
    });
    resetDraft();
    setErrors({});
  }, [isOpen, initialData, isEdit, resetDraft]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleDraftFileTypeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as LessonMaterialFileType;
    setDraftFileType(next);
    if (next === 'link') {
      setDraftSelectedFile(null);
      setDraftRemoteMeta({ fileName: '', fileSize: 0, type: 'document' });
    } else {
      setDraftLinkUrl('');
    }
    setDraftError('');
  };

  const handleDraftChooseFile = (file?: File | null) => {
    if (!file || draftFileType === 'link') return;
    const detected = inferFileTypeFromFileName(file.name);
    setDraftSelectedFile(file);
    setDraftName((prev) => (prev.trim() ? prev : file.name));
    setDraftRemoteMeta({
      fileName: file.name,
      fileSize: Number(file.size || 0),
      type: detected,
    });
    setDraftFileType(detected);
    setDraftError('');
  };

  const handleAddMaterial = async () => {
    setDraftError('');

    if (draftFileType === 'link') {
      const url = normalizeHttpUrl(draftLinkUrl);
      if (!draftLinkUrl.trim()) {
        setDraftError('Enter the link URL');
        return;
      }
      if (!/^https?:\/\/.+/i.test(url)) {
        setDraftError('Enter a valid http(s) URL');
        return;
      }
      const name = draftName.trim() || 'External link';
      setFormData((prev) => ({
        ...prev,
        materials: [...prev.materials, { name, url, type: 'link' }],
      }));
      resetDraft();
      return;
    }

    let url = '';
    let type = draftRemoteMeta.type || draftFileType;
    let fileName = draftRemoteMeta.fileName || undefined;
    let fileSize = draftRemoteMeta.fileSize || undefined;

    if (draftSelectedFile) {
      try {
        setIsUploadingDraft(true);
        const res = await uploadFileAsset('study_material', draftSelectedFile);
        const data = res?.data || {};
        if (!data.url) throw new Error('Upload did not return file URL');
        const fname = (data.originalName as string) || draftSelectedFile.name;
        url = String(data.url);
        type = inferFileTypeFromFileName(fname);
        fileName = fname;
        fileSize = Number(data.sizeBytes || draftSelectedFile.size || 0) || undefined;
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } }; message?: string };
        toast.error(err.response?.data?.message || err.message || 'Failed to upload file');
        setIsUploadingDraft(false);
        return;
      } finally {
        setIsUploadingDraft(false);
      }
    }

    if (!url) {
      setDraftError('Choose a file to upload');
      return;
    }

    const name =
      draftName.trim() ||
      fileName ||
      draftRemoteMeta.fileName ||
      'Untitled attachment';

    setFormData((prev) => ({
      ...prev,
      materials: [...prev.materials, { name, url, type, fileName, fileSize }],
    }));
    resetDraft();
  };

  const handleRemoveMaterial = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index),
    }));
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        courseId: '',
        title: '',
        description: '',
        lessonDate: '',
        materials: [],
        isPublished: false,
      });
      resetDraft();
      setErrors({});
    }
    onClose();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.courseId.trim()) newErrors.courseId = 'Course is required';
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.lessonDate) newErrors.lessonDate = 'Date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        courseId: formData.courseId.trim(),
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        lessonDate: formData.lessonDate,
        materials: formData.materials.length > 0 ? formData.materials : undefined,
        isPublished: formData.isPublished,
      });
      if (!loading) {
        setFormData({
          courseId: '',
          title: '',
          description: '',
          lessonDate: '',
          materials: [],
          isPublished: false,
        });
        resetDraft();
        setErrors({});
      }
    }
  };

  const isLinkMode = draftFileType === 'link';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEdit ? 'Edit Chapter' : 'Add New Chapter'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
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
            {courses.map((course) => (
              <option key={course._id} value={course._id}>{course.name}</option>
            ))}
          </select>
          {errors.courseId && <p className="mt-1 text-sm text-red-600">{errors.courseId}</p>}
        </div>
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">Chapter Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
          />
        </div>
        <div>
          <label htmlFor="lessonDate" className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
          <input
            type="date"
            id="lessonDate"
            name="lessonDate"
            value={formData.lessonDate}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.lessonDate ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.lessonDate && <p className="mt-1 text-sm text-red-600">{errors.lessonDate}</p>}
        </div>

        <div className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50/50">
          <label className="block text-sm font-medium text-gray-700">Chapter materials</label>
          <div className="space-y-2">
            {formData.materials.map((material, index) => {
              const label = material.fileName?.trim() || material.name || 'Attachment';
              const sizeHint = formatMaterialSize(material.fileSize);
              const href = materialHref(material.url);
              return (
                <div key={`${material.url}-${index}`} className="flex flex-wrap items-start gap-2 p-3 bg-white rounded border border-gray-100">
                  <div className="flex-1 min-w-0 text-sm">
                    <div className="font-medium text-gray-900 truncate" title={label}>
                      {label}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      <span className="uppercase">{material.type}</span>
                      {sizeHint ? <span>{` · ${sizeHint}`}</span> : null}
                      {material.fileName && material.name !== material.fileName ? (
                        <span className="block truncate text-gray-400" title={material.name}>
                          Label: {material.name}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline shrink-0 font-medium"
                  >
                    Open
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemoveMaterial(index)}
                    className="text-red-600 hover:text-red-800 text-sm shrink-0"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>

          <div className="space-y-3 pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Add a file (upload) or an external link. For uploads, the file name fills the label automatically — change it if you want.
            </p>
            <input
              type="text"
              placeholder={isLinkMode ? 'Link label (optional, defaults to "External link")' : 'Label (optional — defaults to file name)'}
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
            <select
              value={draftFileType}
              onChange={handleDraftFileTypeSelect}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
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

            {isLinkMode ? (
              <input
                type="text"
                placeholder="https://…"
                value={draftLinkUrl}
                onChange={(e) => setDraftLinkUrl(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            ) : (
              <div>
                <input
                  type="file"
                  onChange={(e) => handleDraftChooseFile(e.target.files?.[0])}
                  disabled={loading || isUploadingDraft}
                  className="w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-white file:text-sm"
                />
                {draftSelectedFile ? (
                  <p className="mt-1 text-xs text-green-700">
                    {draftRemoteMeta.fileName || draftSelectedFile?.name || 'Attachment ready'}
                    {draftRemoteMeta.fileSize ? ` · ${(draftRemoteMeta.fileSize / 1024).toFixed(1)} KB` : ''}
                  </p>
                ) : null}
              </div>
            )}

            {draftError ? <p className="text-sm text-red-600">{draftError}</p> : null}

            <button
              type="button"
              onClick={() => void handleAddMaterial()}
              disabled={loading || isUploadingDraft}
              className="w-full sm:w-auto px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {isUploadingDraft ? 'Uploading…' : 'Add to chapter'}
            </button>
          </div>
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isPublished"
              checked={formData.isPublished}
              onChange={handleChange}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Publish to students</span>
          </label>
        </div>
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || isUploadingDraft}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                {isEdit ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              isEdit ? 'Update Chapter' : 'Create Chapter'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddLessonModal;
