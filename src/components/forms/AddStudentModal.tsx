import React, { useState, useEffect, useRef, useMemo } from 'react';
import { format, subYears } from 'date-fns';
import Modal from '../ui/Modal';
import type { Student, Major, EnrollmentSeason } from '../../types';
import type { ClassItem } from '../../services/classService';
import { uploadStudentPhoto } from '../../services/studentService';
import { publicUploadUrl } from '../../utils/publicUploadUrl';

/** Default DOB for “Add student”: ~15 years old (eligible vs backend 10–100 year rule). */
function defaultDateOfBirthFifteenYearsAgo(): string {
  return format(subYears(new Date(), 15), 'yyyy-MM-dd');
}

const SEASON_LABELS: Record<EnrollmentSeason, string> = {
  fall: 'Fall',
  spring: 'Spring',
  summer: 'Summer',
  winter: 'Winter',
};

function pickDefaultEnrollmentSeason(
  enabled: string[],
  def: string | null | undefined
): EnrollmentSeason {
  const list = (enabled.length ? enabled : ['fall', 'spring', 'summer', 'winter']) as EnrollmentSeason[];
  const d = def && list.includes(def as EnrollmentSeason) ? (def as EnrollmentSeason) : list[0];
  return d;
}

export interface StudentFormSubmitValues {
  name: string;
  cardId?: string;
  majorId: string;
  classId: string;
  dateOfBirth: string;
  email?: string;
  phone?: string;
  parentFirstName?: string;
  parentLastName?: string;
  parentPhoneNumber?: string;
  profileUrl?: string;
  isActive: boolean;
  gender: string;
  entryTerm: number;
  enrollmentSeason: EnrollmentSeason;
  academicYear: number;
}

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (studentData: StudentFormSubmitValues) => void | Promise<void>;
  majors: Major[];
  classes: ClassItem[];
  numberOfTerms: number;
  enrollmentSemestersEnabled: string[];
  defaultEnrollmentSemester?: string | null;
  initialData?: Student | null;
  isEdit?: boolean;
  loading?: boolean;
}

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  majors,
  classes,
  numberOfTerms,
  enrollmentSemestersEnabled,
  defaultEnrollmentSemester,
  initialData,
  isEdit = false,
  loading = false,
}) => {
  const currentYear = new Date().getFullYear();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    cardId: '',
    majorId: '',
    classId: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    parentFirstName: '',
    parentLastName: '',
    parentPhoneNumber: '',
    isActive: true,
    gender: 'male',
    entryTerm: 1,
    enrollmentSeason: 'fall' as EnrollmentSeason,
    academicYear: currentYear,
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [existingProfileUrl, setExistingProfileUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);

  const maxTerm = Math.min(Math.max(numberOfTerms || 3, 1), 6);
  const showBusyOverlay = loading || isSubmitting;

  const enrollmentSeasonOptions = useMemo(() => {
    const base = (
      enrollmentSemestersEnabled.length ? enrollmentSemestersEnabled : ['fall', 'spring', 'summer', 'winter']
    ).map((s) => s.toLowerCase() as EnrollmentSeason);
    const uniq = new Set(base);
    if (formData.enrollmentSeason) uniq.add(formData.enrollmentSeason);
    return [...uniq];
  }, [enrollmentSemestersEnabled, formData.enrollmentSeason]);

  useEffect(() => {
    if (!isOpen) return;
    if (initialData && isEdit) {
      const majorId =
        typeof initialData.majorId === 'object' && initialData.majorId !== null
          ? (initialData.majorId as { _id: string })._id
          : (initialData.majorId as string);
      const classId =
        typeof (initialData as Student).classId === 'object' &&
        (initialData as Student).classId !== null
          ? ((initialData as Student).classId as { _id: string })._id
          : (((initialData as Student).classId as string) || '');
      const st = initialData as Student;
      const termVal = st.entryTerm ?? (st as unknown as { semester?: number }).semester;
      const seasonRaw = st.enrollmentSeason
        ? (String(st.enrollmentSeason).toLowerCase() as EnrollmentSeason)
        : pickDefaultEnrollmentSeason(enrollmentSemestersEnabled, defaultEnrollmentSemester);
      setFormData({
        name: initialData.name,
        cardId: initialData.cardId ?? '',
        majorId: majorId || '',
        classId: classId || '',
        dateOfBirth: initialData.dateOfBirth?.split?.('T')[0] || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        parentFirstName: initialData.parentFirstName || '',
        parentLastName: initialData.parentLastName || '',
        parentPhoneNumber: initialData.parentPhoneNumber || '',
        isActive: initialData.isActive,
        gender: st.gender || 'prefer_not_to_say',
        entryTerm: Math.min(Math.max(termVal || 1, 1), maxTerm),
        enrollmentSeason: seasonRaw,
        academicYear: st.academicYear || st.enrollmentCohortYear || initialData.enrollmentYear || currentYear,
      });
      setExistingProfileUrl(initialData.profileUrl || null);
      setPhotoFile(null);
      setPhotoPreview(null);
    } else if (!isEdit && isOpen) {
      const season = pickDefaultEnrollmentSeason(enrollmentSemestersEnabled, defaultEnrollmentSemester);
      setFormData({
        name: '',
        cardId: '',
        majorId: '',
        classId: '',
        dateOfBirth: defaultDateOfBirthFifteenYearsAgo(),
        email: '',
        phone: '',
        parentFirstName: '',
        parentLastName: '',
        parentPhoneNumber: '',
        isActive: true,
        gender: 'male',
        entryTerm: 1,
        enrollmentSeason: season,
        academicYear: currentYear,
      });
      setPhotoFile(null);
      setPhotoPreview(null);
      setExistingProfileUrl(null);
    }
  }, [
    initialData,
    isEdit,
    isOpen,
    maxTerm,
    currentYear,
    enrollmentSemestersEnabled,
    defaultEnrollmentSemester,
  ]);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview, cameraStream]);

  useEffect(() => {
    if (cameraVideoRef.current && cameraStream) {
      cameraVideoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, isCameraModalOpen]);

  useEffect(() => {
    if (!isOpen) setIsSubmitting(false);
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === 'entryTerm' || name === 'academicYear') {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value, 10) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const onPickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (photoPreview?.startsWith('blob:')) URL.revokeObjectURL(photoPreview);
    setPhotoFile(f);
    setPhotoPreview(URL.createObjectURL(f));
    setErrors((prev) => ({ ...prev, photo: '' }));
  };

  const isLikelyMobileDevice = () =>
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');

  const stopCameraStream = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  const openCameraCapture = async () => {
    setCameraError('');
    if (isLikelyMobileDevice()) {
      fileInputRef.current?.click();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      fileInputRef.current?.click();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      setCameraStream(stream);
      setIsCameraModalOpen(true);
    } catch {
      setCameraError('Camera access denied or unavailable. You can upload an existing photo instead.');
      fileInputRef.current?.click();
    }
  };

  const closeCameraModal = () => {
    stopCameraStream();
    setIsCameraModalOpen(false);
  };

  const captureFromCamera = async () => {
    if (!cameraVideoRef.current) return;
    setIsCapturingPhoto(true);
    try {
      const video = cameraVideoRef.current;
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setCameraError('Failed to capture photo. Try upload instead.');
        return;
      }
      ctx.drawImage(video, 0, 0, width, height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.92)
      );
      if (!blob) {
        setCameraError('Failed to capture photo. Try upload instead.');
        return;
      }

      const capturedFile = new File([blob], `student-camera-${Date.now()}.jpg`, {
        type: 'image/jpeg',
      });
      if (photoPreview?.startsWith('blob:')) URL.revokeObjectURL(photoPreview);
      setPhotoFile(capturedFile);
      setPhotoPreview(URL.createObjectURL(capturedFile));
      setErrors((prev) => ({ ...prev, photo: '' }));
      closeCameraModal();
    } finally {
      setIsCapturingPhoto(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (formData.cardId.trim() && formData.cardId.trim().length > 50) {
      newErrors.cardId = 'Card ID cannot exceed 50 characters';
    }
    if (!formData.majorId) newErrors.majorId = 'Major is required';
    if (!formData.classId) newErrors.classId = 'Class is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.academicYear || formData.academicYear < 2000) {
      newErrors.academicYear = 'Academic year is required';
    }
    const enabled = enrollmentSemestersEnabled.length
      ? enrollmentSemestersEnabled.map((s) => s.toLowerCase())
      : ['fall', 'spring', 'summer', 'winter'];
    if (!enabled.includes(formData.enrollmentSeason)) {
      newErrors.enrollmentSeason = 'Pick an enrollment semester your school allows';
    }
    if (!formData.entryTerm || formData.entryTerm < 1 || formData.entryTerm > maxTerm) {
      newErrors.entryTerm = `Term must be between 1 and ${maxTerm}`;
    }
    if (formData.email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email.trim())) {
      newErrors.email = 'Invalid email format';
    }
    if (formData.parentPhoneNumber.trim() && formData.parentPhoneNumber.trim().length > 20) {
      newErrors.parentPhoneNumber = 'Max 20 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      let profileUrl = existingProfileUrl || undefined;
      if (photoFile) {
        const up = await uploadStudentPhoto(photoFile);
        if (!up.success || !up.data?.profileUrl) {
          setErrors((prev) => ({ ...prev, photo: up.message || 'Photo upload failed' }));
          return;
        }
        profileUrl = up.data.profileUrl;
      }

      await onSubmit({
        name: formData.name.trim(),
        cardId: formData.cardId.trim() || undefined,
        majorId: formData.majorId,
        classId: formData.classId,
        dateOfBirth: formData.dateOfBirth,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        parentFirstName: formData.parentFirstName.trim() || undefined,
        parentLastName: formData.parentLastName.trim() || undefined,
        parentPhoneNumber: formData.parentPhoneNumber.trim() || undefined,
        profileUrl,
        isActive: formData.isActive,
        gender: formData.gender,
        entryTerm: formData.entryTerm,
        enrollmentSeason: formData.enrollmentSeason,
        academicYear: formData.academicYear,
      });
      setErrors({});
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!loading && !isSubmitting) {
      closeCameraModal();
      if (photoPreview?.startsWith('blob:')) URL.revokeObjectURL(photoPreview);
      setPhotoFile(null);
      setPhotoPreview(null);
      setErrors({});
    }
    onClose();
  };

  const displayImg = photoPreview || (existingProfileUrl ? publicUploadUrl(existingProfileUrl) : null);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? 'Edit Student' : 'Add New Student'}
      size="lg"
    >
      <div className="relative">
        {showBusyOverlay && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-lg bg-white/85 backdrop-blur-[1px]"
            aria-busy="true"
            aria-live="polite"
          >
            <span className="inline-block h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <span className="text-sm font-medium text-gray-700">
              {isSubmitting && !loading ? 'Saving…' : 'Please wait…'}
            </span>
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className={`space-y-6 ${showBusyOverlay ? 'pointer-events-none opacity-50' : ''}`}
        >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Profile photo (optional)</label>
            <div className="flex flex-wrap items-center gap-4">
              <div className="h-20 w-20 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                <button
                  type="button"
                  onClick={openCameraCapture}
                  className="h-full w-full"
                  title="Capture from camera or upload"
                >
                  {displayImg ? (
                    <img src={displayImg} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs text-gray-400 text-center px-1">Take photo</span>
                  )}
                </button>
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={onPickPhoto}
                />
                <button
                  type="button"
                  onClick={openCameraCapture}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300"
                >
                  {isEdit ? 'Capture / Change photo' : 'Capture / Upload photo'}
                </button>
                <p className="text-xs text-gray-500 mt-1">Tap/click image to open camera. Optional. JPEG/PNG/WebP, max 5 MB.</p>
                {cameraError ? <p className="mt-1 text-xs text-amber-700">{cameraError}</p> : null}
              </div>
            </div>
            {errors.photo && <p className="mt-1 text-sm text-red-600">{errors.photo}</p>}
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter full name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {isEdit && initialData && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
              <input
                type="text"
                readOnly
                value={initialData.studentId}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">Assigned by the system and cannot be changed.</p>
            </div>
          )}

          {!isEdit && (
            <div className="md:col-span-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-sm text-blue-800">
              Student ID will be generated automatically when you save (school short code + year + random suffix).
            </div>
          )}

          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
              Gender *
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.gender ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
            {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
          </div>

          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth *
            </label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.dateOfBirth && <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>}
          </div>

          <div>
            <label htmlFor="majorId" className="block text-sm font-medium text-gray-700 mb-2">
              Major *
            </label>
            <select
              id="majorId"
              name="majorId"
              value={formData.majorId}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.majorId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a major</option>
              {majors.map((major) => (
                <option key={major._id} value={major._id}>
                  {major.name}
                </option>
              ))}
            </select>
            {errors.majorId && <p className="mt-1 text-sm text-red-600">{errors.majorId}</p>}
          </div>

          <div>
            <label htmlFor="classId" className="block text-sm font-medium text-gray-700 mb-2">
              Class *
            </label>
            <select
              id="classId"
              name="classId"
              value={formData.classId}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.classId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a class</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.code ? `(${c.code})` : ''}
                </option>
              ))}
            </select>
            {errors.classId && <p className="mt-1 text-sm text-red-600">{errors.classId}</p>}
          </div>

          <div>
            <label htmlFor="academicYear" className="block text-sm font-medium text-gray-700 mb-2">
              Academic year *
            </label>
            <select
              id="academicYear"
              name="academicYear"
              value={formData.academicYear}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.academicYear ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {Array.from({ length: 25 }, (_, i) => currentYear - 10 + i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Start year of the academic year (e.g. 2025 for 2025/2026). Also used as the cohort year for enrollment
              (e.g. Fall 2025).
            </p>
            {errors.academicYear && <p className="mt-1 text-sm text-red-600">{errors.academicYear}</p>}
          </div>

          <div>
            <label htmlFor="enrollmentSeason" className="block text-sm font-medium text-gray-700 mb-2">
              Enrollment semester *
            </label>
            <select
              id="enrollmentSeason"
              name="enrollmentSeason"
              value={formData.enrollmentSeason}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.enrollmentSeason ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {enrollmentSeasonOptions.map((key) => (
                <option key={key} value={key}>
                  {SEASON_LABELS[key] ?? key}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">When the student joined this intake (Fall, Spring, …).</p>
            {errors.enrollmentSeason && <p className="mt-1 text-sm text-red-600">{errors.enrollmentSeason}</p>}
          </div>

          <div>
            <label htmlFor="entryTerm" className="block text-sm font-medium text-gray-700 mb-2">
              Current term (reports and exams) *
            </label>
            <select
              id="entryTerm"
              name="entryTerm"
              value={formData.entryTerm}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.entryTerm ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {Array.from({ length: maxTerm }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  Term {n}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">Grading period for marks and report cards (1…{maxTerm}).</p>
            {errors.entryTerm && <p className="mt-1 text-sm text-red-600">{errors.entryTerm}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Optional"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Optional"
            />
          </div>

          <div className="md:col-span-2 border-t border-gray-100 pt-4 mt-2">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Parent / guardian</h3>
            <p className="text-xs text-gray-500 mb-4">Optional. Used for parent portal accounts when provided.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="parentFirstName" className="block text-sm font-medium text-gray-700 mb-2">
                  Parent first name
                </label>
                <input
                  type="text"
                  id="parentFirstName"
                  name="parentFirstName"
                  value={formData.parentFirstName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label htmlFor="parentLastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Parent last name
                </label>
                <input
                  type="text"
                  id="parentLastName"
                  name="parentLastName"
                  value={formData.parentLastName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="parentPhoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Parent phone number
                </label>
                <input
                  type="tel"
                  id="parentPhoneNumber"
                  name="parentPhoneNumber"
                  value={formData.parentPhoneNumber}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.parentPhoneNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Optional"
                />
                {errors.parentPhoneNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.parentPhoneNumber}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="cardId" className="block text-sm font-medium text-gray-700 mb-2">
              RFID card ID (optional)
            </label>
            <input
              type="text"
              id="cardId"
              name="cardId"
              value={formData.cardId}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.cardId ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Assign later if needed"
            />
            {errors.cardId && <p className="mt-1 text-sm text-red-600">{errors.cardId}</p>}
          </div>

          <div>
            <label htmlFor="isActive" className="block text-sm font-medium text-gray-700 mb-1">
              Is active *
            </label>
            <select
              id="isActive"
              name="isActive"
              value={formData.isActive ? 'yes' : 'no'}
              onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.value === 'yes' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            disabled={showBusyOverlay}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={showBusyOverlay}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {showBusyOverlay ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                {isEdit ? 'Updating...' : 'Adding...'}
              </>
            ) : isEdit ? (
              'Update Student'
            ) : (
              'Add Student'
            )}
          </button>
        </div>
      </form>
      </div>
      {isCameraModalOpen ? (
        <div className="fixed inset-0 z-[120] bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-4 space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Take Student Photo</h3>
            <div className="overflow-hidden rounded-lg bg-black">
              <video ref={cameraVideoRef} autoPlay playsInline className="w-full max-h-[60vh] object-contain" />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeCameraModal}
                className="px-3 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={captureFromCamera}
                disabled={isCapturingPhoto}
                className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isCapturingPhoto ? 'Capturing...' : 'Capture'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

export default AddStudentModal;
