import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getTermsConfig, getStudentsForTerm, submitTermResults } from '../../services/reportCardService';
import { getSchoolCourses } from '../../services/courseService';
import { toast } from 'react-toastify';

const currentYear = new Date().getFullYear();

interface StudentRow {
  _id: string;
  name: string;
  studentId: string;
  class: string;
  examMarks: number | string;
  disciplineMarks: number | string;
  remarks: string;
}

const TeacherTermResultsPage: React.FC = () => {
  const [numberOfTerms, setNumberOfTerms] = useState(3);
  const [academicYear, setAcademicYear] = useState(currentYear);
  const [term, setTerm] = useState(1);
  const [courseId, setCourseId] = useState('');
  const [courses, setCourses] = useState<any[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [courseInfo, setCourseInfo] = useState<{ name: string; code: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getTermsConfig();
        const data = res.data ?? res;
        setNumberOfTerms(data.numberOfTerms ?? 3);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  useEffect(() => {
    setCoursesLoading(true);
    const load = async () => {
      try {
        const res = await getSchoolCourses(1, 100);
        setCourses(res.data || []);
      } catch (e) {
        toast.error('Failed to load courses');
      } finally {
        setCoursesLoading(false);
      }
    };
    load();
  }, []);

  const loadStudents = async () => {
    if (!courseId || !academicYear || !term) {
      toast.error('Select course, year, and term');
      return;
    }
    setLoading(true);
    try {
      const res = await getStudentsForTerm(courseId, academicYear, term);
      const data = res.data || [];
      const info = res.course || { name: '', code: '' };
      setCourseInfo(info);
      setStudents(data.map((s: any) => ({
        _id: s._id,
        name: s.name,
        studentId: s.studentId,
        class: s.class,
        examMarks: s.examMarks !== '' && s.examMarks != null ? s.examMarks : '',
        disciplineMarks: s.disciplineMarks !== '' && s.disciplineMarks != null ? s.disciplineMarks : '',
        remarks: s.remarks || ''
      })));
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to load students');
      setStudents([]);
      setCourseInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const updateRow = (index: number, field: 'examMarks' | 'disciplineMarks' | 'remarks', value: number | string) => {
    setStudents(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSave = async () => {
    if (!courseId) {
      toast.error('Select a course');
      return;
    }
    const results = students
      .map(s => {
        const exam = typeof s.examMarks === 'number' ? s.examMarks : parseFloat(String(s.examMarks));
        const disc = typeof s.disciplineMarks === 'number' ? s.disciplineMarks : parseFloat(String(s.disciplineMarks));
        if (isNaN(exam) || exam < 0 || exam > 100 || isNaN(disc) || disc < 0 || disc > 100) return null;
        return {
          studentId: s._id,
          examMarks: exam,
          disciplineMarks: disc,
          remarks: (s.remarks || '').trim()
        };
      })
      .filter(Boolean) as any[];

    if (results.length === 0) {
      toast.error('Enter valid exam and discipline marks (0–100) for at least one student');
      return;
    }

    setSaving(true);
    try {
      await submitTermResults(academicYear, term, courseId, results);
      toast.success('Term results saved');
      loadStudents();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Term Results (Report Cards)</h1>
        <p className="text-gray-600">Enter end-of-term exam marks and discipline marks for your courses. Select course, academic year, and term, then fill in the marks and save.</p>

        <div className="flex flex-wrap gap-4 items-end bg-white p-4 rounded-xl shadow-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic year</label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(parseInt(e.target.value, 10))}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              {[currentYear, currentYear - 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
            <select
              value={term}
              onChange={(e) => setTerm(parseInt(e.target.value, 10))}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              {Array.from({ length: numberOfTerms }, (_, i) => i + 1).map(t => (
                <option key={t} value={t}>Term {t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              disabled={coursesLoading}
              className="px-3 py-2 border border-gray-300 rounded-lg min-w-[200px] disabled:opacity-70 disabled:cursor-wait"
            >
              <option value="">
                {coursesLoading ? 'Loading courses...' : 'Select course'}
              </option>
              {!coursesLoading && courses.map(c => (
                <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>
          <button
            onClick={loadStudents}
            disabled={loading || !courseId}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load students'}
          </button>
        </div>

        {courseInfo && (
          <>
            <p className="text-gray-700 font-medium">
              {courseInfo.name} — Term {term}, {academicYear}
            </p>
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {loading ? (
                <div className="p-12 flex flex-col items-center justify-center text-gray-500">
                  <span className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mb-3" />
                  Loading students...
                </div>
              ) : students.length === 0 ? (
                <div className="p-12 text-center">
                  <svg className="mx-auto h-14 w-14 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <h3 className="mt-3 text-sm font-medium text-gray-900">No students in this course</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    There are no students enrolled in the major for this course yet. Add students to the corresponding major and class, then try again.
                  </p>
                </div>
              ) : (
                <>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam (0-100)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discipline (0-100)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {students.map((row, index) => (
                        <tr key={row._id}>
                          <td className="px-4 py-2 text-sm text-gray-900">{row.name}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{row.studentId}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{row.class}</td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.5}
                              value={row.examMarks === '' ? '' : row.examMarks}
                              onChange={(e) => updateRow(index, 'examMarks', e.target.value === '' ? '' : parseFloat(e.target.value))}
                              className="w-20 px-2 py-1 border border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.5}
                              value={row.disciplineMarks === '' ? '' : row.disciplineMarks}
                              onChange={(e) => updateRow(index, 'disciplineMarks', e.target.value === '' ? '' : parseFloat(e.target.value))}
                              className="w-20 px-2 py-1 border border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={row.remarks}
                              onChange={(e) => updateRow(index, 'remarks', e.target.value)}
                              placeholder="Optional"
                              className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="p-4 border-t">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save term results'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeacherTermResultsPage;
