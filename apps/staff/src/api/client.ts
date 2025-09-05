import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
});

// 请求拦截器：添加认证token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('staff_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：处理错误
api.interceptors.response.use(
  (r) => r,
  (err) => {
    console.error('[API]', err.response?.data || err.message);

    // 如果是401错误，清除token并跳转到登录页
    if (err.response?.status === 401) {
      localStorage.removeItem('staff_token');
      window.location.href = '/login';
    }

    return Promise.reject(err);
  }
);

export default api;
