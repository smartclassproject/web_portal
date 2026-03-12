import axiosInstance from './axiosInstance';

export interface TermResultEntry {
  studentId: string;
  examMarks: number;
  disciplineMarks: number;
  remarks?: string;
}

export const getTermsConfig = async () => {
  const response = await axiosInstance.get('/api/report-cards/terms-config');
  return response.data;
};

export const getStudentsForTerm = async (courseId: string, academicYear: number, term: number) => {
  const response = await axiosInstance.get(
    `/api/report-cards/students-for-term?courseId=${courseId}&academicYear=${academicYear}&term=${term}`
  );
  return response.data;
};

export const submitTermResults = async (
  academicYear: number,
  term: number,
  courseId: string,
  results: TermResultEntry[]
) => {
  const response = await axiosInstance.post('/api/report-cards/term-results', {
    academicYear,
    term,
    courseId,
    results
  });
  return response.data;
};

export const getMyTermResults = async (params?: {
  academicYear?: number;
  term?: number;
  courseId?: string;
  page?: number;
  limit?: number;
}) => {
  const sp = new URLSearchParams();
  if (params?.academicYear != null) sp.set('academicYear', String(params.academicYear));
  if (params?.term != null) sp.set('term', String(params.term));
  if (params?.courseId) sp.set('courseId', params.courseId);
  if (params?.page != null) sp.set('page', String(params.page));
  if (params?.limit != null) sp.set('limit', String(params.limit));
  const response = await axiosInstance.get(`/api/report-cards/my-results?${sp.toString()}`);
  return response.data;
};

export const getReportCards = async (params?: {
  academicYear?: number;
  term?: number;
  studentId?: string;
  courseId?: string;
  class?: string;
  page?: number;
  limit?: number;
}) => {
  const sp = new URLSearchParams();
  if (params?.academicYear != null) sp.set('academicYear', String(params.academicYear));
  if (params?.term != null) sp.set('term', String(params.term));
  if (params?.studentId) sp.set('studentId', params.studentId);
  if (params?.courseId) sp.set('courseId', params.courseId);
  if (params?.class) sp.set('class', params.class);
  if (params?.page != null) sp.set('page', String(params.page));
  if (params?.limit != null) sp.set('limit', String(params.limit));
  const response = await axiosInstance.get(`/api/report-cards?${sp.toString()}`);
  return response.data;
};

export const getReportCardByStudent = async (studentId: string, academicYear?: number) => {
  const sp = academicYear != null ? `?academicYear=${academicYear}` : '';
  const response = await axiosInstance.get(`/api/report-cards/student/${studentId}${sp}`);
  return response.data;
};
