import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getReportCards, getReportCardByStudent } from '../../services/reportCardService';
import { getSchoolStudents } from '../../services/studentService';
import { getSchoolCourses } from '../../services/courseService';
import { toast } from 'react-toastify';

const currentYear = new Date().getFullYear();

const ReportCardsPage: React.FC = () => {
  const [academicYear, setAcademicYear] = useState(currentYear);
  const [term, setTerm] = useState(1);
  const [studentFilter, setStudentFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [entries, setEntries] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewStudentId, setViewStudentId] = useState<string | null>(null);
  const [reportCard, setReportCard] = useState<any>(null);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const params: any = { academicYear, term, page: 1, limit: 200 };
      if (studentFilter) params.studentId = studentFilter;
      if (courseFilter) params.courseId = courseFilter;
      if (classFilter) params.class = classFilter;
      const res = await getReportCards(params);
      setEntries(res.data || []);
    } catch (e) {
      toast.error('Failed to load report cards');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [academicYear, term, studentFilter, courseFilter, classFilter]);

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, cRes] = await Promise.all([
          getSchoolStudents(1, 500),
          getSchoolCourses(1, 100)
        ]);
        setStudents(sRes.data || []);
        setCourses(cRes.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  const openStudentReport = async (studentId: string) => {
    setViewStudentId(studentId);
    try {
      const res = await getReportCardByStudent(studentId, academicYear);
      setReportCard(res.data || res);
    } catch (e) {
      toast.error('Failed to load report card');
      setReportCard(null);
    }
  };

  const closeReport = () => {
    setViewStudentId(null);
    setReportCard(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Report Cards</h1>
        <p className="text-gray-600">View end-of-term exam and discipline marks for all students. Filter by year, term, student, or course.</p>

        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic year</label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(parseInt(e.target.value, 10))}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              {[currentYear, currentYear - 1, currentYear - 2].map(y => (
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
              {[1, 2, 3, 4, 5, 6].map(t => (
                <option key={t} value={t}>Term {t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
            <select
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg min-w-[180px]"
            >
              <option value="">All students</option>
              {students.map(s => (
                <option key={s._id} value={s._id}>{s.name} ({s.studentId})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg min-w-[160px]"
            >
              <option value="">All courses</option>
              {courses.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <input
              type="text"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              placeholder="e.g. A"
              className="px-3 py-2 border border-gray-300 rounded-lg w-24"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : entries.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No report card entries for the selected filters.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discipline</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {entries.map((entry: any) => (
                  <tr key={entry._id}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {entry.studentId?.name} ({entry.studentId?.studentId})
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{entry.studentId?.class}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{entry.courseId?.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{entry.teacherId?.name}</td>
                    <td className="px-4 py-3 text-sm">{entry.examMarks}</td>
                    <td className="px-4 py-3 text-sm">{entry.disciplineMarks}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openStudentReport(entry.studentId?._id || entry.studentId)}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        View full report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {viewStudentId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6 flex justify-between items-start">
                <h2 className="text-xl font-bold text-gray-900">Student Report Card</h2>
                <button onClick={closeReport} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              {reportCard && (
                <div className="px-6 pb-6">
                  <p className="text-gray-700 font-medium">
                    {reportCard.student?.name} — {reportCard.student?.studentId} — Class {reportCard.student?.class}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    {reportCard.student?.major?.name}
                  </p>
                  {reportCard.terms?.length === 0 ? (
                    <p className="text-gray-500">No term results yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {reportCard.terms?.map((t: any) => (
                        <div key={`${t.academicYear}-${t.term}`} className="border rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900">Year {t.academicYear} — Term {t.term}</h3>
                          <table className="mt-2 w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2">Course</th>
                                <th className="text-left py-2">Teacher</th>
                                <th className="text-right py-2">Exam</th>
                                <th className="text-right py-2">Discipline</th>
                              </tr>
                            </thead>
                            <tbody>
                              {t.courses?.map((c: any, i: number) => (
                                <tr key={i} className="border-b border-gray-100">
                                  <td className="py-2">{c.courseName}</td>
                                  <td className="py-2">{c.teacherName}</td>
                                  <td className="py-2 text-right">{c.examMarks}</td>
                                  <td className="py-2 text-right">{c.disciplineMarks}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReportCardsPage;
