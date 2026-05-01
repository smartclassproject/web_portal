import axiosInstance from './axiosInstance';

export type DashboardSummaryResponse = {
  sections: Record<string, { total: number; label: string }>;
  allowedModules: string[];
};

export type DashboardGraphsResponse = {
  graphs: Record<string, Array<{ month: string; value: number }>>;
  allowedModules: string[];
};

export type CreatorAnalyticsResponse = {
  countsByCreatorRole: Array<{ role: string; count: number }>;
  recentCreated: {
    teachers: Array<Record<string, unknown>>;
    students: Array<Record<string, unknown>>;
    announcements: Array<Record<string, unknown>>;
  };
};

export const getDashboardSummary = async (schoolId?: string) => {
  const query = schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : '';
  const res = await axiosInstance.get(`/api/dashboard/summary${query}`);
  return res.data as { success: boolean; data: DashboardSummaryResponse };
};

export const getDashboardGraphs = async (schoolId?: string) => {
  const query = schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : '';
  const res = await axiosInstance.get(`/api/dashboard/graphs${query}`);
  return res.data as { success: boolean; data: DashboardGraphsResponse };
};

export const getCreatorAnalytics = async () => {
  const res = await axiosInstance.get('/api/dashboard/creator-analytics');
  return res.data as { success: boolean; data: CreatorAnalyticsResponse };
};
