import ApiSettings from '@/lib/api-settings';

const api = new ApiSettings();

// Auth API
export const authApi = {
  login: async (username: string, password: string) => {
    return api.post('/users/login/', { username, password });
  },
  register: async (username: string, password: string, firstName: string, lastName: string) => {
    return api.post('/users/register/', { 
      username, 
      password, 
      password2: password,
      first_name: firstName,
      last_name: lastName
    });
  },
  me: async () => {
    return api.get('/users/me/');
  },
  changePassword: async (oldPassword: string, newPassword: string) => {
    return api.post('/users/change_password/', { old_password: oldPassword, new_password: newPassword });
  },
};

// Users API
export const usersApi = {
  getAll: async (params?: Record<string, any>) => {
    return api.get('/users/', params);
  },
  getById: async (id: string) => {
    return api.get(`/users/${id}/`);
  },
  create: async (data: any) => {
    return api.post('/users/', data);
  },
  update: async (id: string, data: any) => {
    return api.put(`/users/${id}/`, data);
  },
  delete: async (id: string) => {
    return api.delete(`/users/${id}/`);
  },
  block: async (id: string) => {
    return api.post(`/users/${id}/block/`, {});
  },
  unblock: async (id: string) => {
    return api.post(`/users/${id}/unblock/`, {});
  },
  getStats: async () => {
    return api.get('/users/stats/');
  },
};

// Categories API
export const categoriesApi = {
  getAll: async (params?: Record<string, any>) => {
    return api.get('/categories/', params);
  },
  getById: async (id: string) => {
    return api.get(`/categories/${id}/`);
  },
  create: async (data: any) => {
    return api.post('/categories/', data);
  },
  update: async (id: string, data: any) => {
    return api.put(`/categories/${id}/`, data);
  },
  delete: async (id: string) => {
    return api.delete(`/categories/${id}/`);
  },
};

// Videos API
export const videosApi = {
  getAll: async (params?: Record<string, any>) => {
    return api.get('/videos/', params);
  },
  getById: async (id: string) => {
    return api.get(`/videos/${id}/`);
  },
  getByCategory: async (categoryId: string) => {
    return api.get(`/videos/by_category/?category_id=${categoryId}`);
  },
  create: async (data: FormData) => {
    return api.post('/videos/', data, true);
  },
  update: async (id: string, data: FormData) => {
    return api.put(`/videos/${id}/`, data, true);
  },
  delete: async (id: string) => {
    return api.delete(`/videos/${id}/`);
  },
  incrementView: async (id: string) => {
    return api.post(`/videos/${id}/increment_view/`, {});
  },
};

// Tasks API
export const tasksApi = {
  getAll: async (params?: Record<string, any>) => {
    return api.get('/tasks/', params);
  },
  getById: async (id: string) => {
    return api.get(`/tasks/${id}/`);
  },
  getByVideo: async (videoId: string) => {
    return api.get(`/tasks/by_video/?video_id=${videoId}`);
  },
  create: async (data: any) => {
    return api.post('/tasks/', data);
  },
  update: async (id: string, data: any) => {
    return api.put(`/tasks/${id}/`, data);
  },
  delete: async (id: string) => {
    return api.delete(`/tasks/${id}/`);
  },
};

// User Courses API
export const userCoursesApi = {
  getAll: async (params?: Record<string, any>) => {
    return api.get('/user-courses/', params);
  },
  getMyCourses: async () => {
    return api.get('/user-courses/my_courses/');
  },
  grantCourse: async (userId: string, categoryId: string, grantedBy: string) => {
    return api.post('/user-courses/grant_course/', { user_id: userId, category_id: categoryId, granted_by: grantedBy });
  },
};

// Progress API
export const progressApi = {
  getMyProgress: async () => {
    return api.get('/progress/my_progress/');
  },
  completeVideo: async (videoId: string) => {
    return api.post('/progress/complete_video/', { video_id: videoId });
  },
  completeTask: async (taskId: string) => {
    return api.post('/progress/complete_task/', { task_id: taskId });
  },
};

// Task Submissions API
export const submissionsApi = {
  getAll: async (params?: Record<string, any>) => {
    return api.get('/submissions/', params);
  },
  getMySubmissions: async () => {
    return api.get('/submissions/my_submissions/');
  },
  submit: async (data: FormData) => {
    return api.post('/submissions/submit/', data, true);
  },
};

// Payments API
export const paymentsApi = {
  getAll: async (params?: Record<string, any>) => {
    return api.get('/payments/', params);
  },
  getById: async (id: string) => {
    return api.get(`/payments/${id}/`);
  },
  getMyPayments: async () => {
    return api.get('/payments/my_payments/');
  },
  create: async (data: any) => {
    return api.post('/payments/', data);
  },
  update: async (id: string, data: any) => {
    return api.put(`/payments/${id}/`, data);
  },
  updateStatus: async (id: string, status: string) => {
    return api.post(`/payments/${id}/update_status/`, { status });
  },
  delete: async (id: string) => {
    return api.delete(`/payments/${id}/`);
  },
  getStats: async () => {
    return api.get('/payments/stats/');
  },
};

// Notifications API
export const notificationsApi = {
  getAll: async (params?: Record<string, any>) => {
    return api.get('/notifications/', params);
  },
  getById: async (id: string) => {
    return api.get(`/notifications/${id}/`);
  },
  send: async (data: { title: string; message: string; type: string; send_to_all?: boolean; user_ids?: string[] }) => {
    return api.post('/notifications/send_notification/', data);
  },
  delete: async (id: string) => {
    return api.delete(`/notifications/${id}/`);
  },
  getStats: async () => {
    return api.get('/notifications/stats/');
  },
  // User notifications
  getMyNotifications: async () => {
    return api.get('/user-notifications/my_notifications/');
  },
  getUnreadCount: async () => {
    return api.get('/user-notifications/unread_count/');
  },
  markAsRead: async (id: string) => {
    return api.post(`/user-notifications/${id}/mark_as_read/`, {});
  },
  markAllRead: async () => {
    return api.post('/user-notifications/mark_all_read/', {});
  },
};

// Dashboard Stats API
export const dashboardApi = {
  getAdminStats: async () => {
    return api.get('/dashboard/admin-stats/');
  },
  getStudentStats: async () => {
    return api.get('/dashboard/student-stats/');
  },
  getRecentActivity: async () => {
    return api.get('/dashboard/recent-activity/');
  },
};

export default api;
