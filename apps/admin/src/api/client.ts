import axios from 'axios';
import { useAuthStore } from '../stores/auth';

/**
 * API客户端配置
 * @description 创建配置好的axios实例，用于管理员端的API调用
 * 自动添加认证头，处理请求和响应拦截
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // 从环境变量获取API基础URL
});

/**
 * 请求拦截器
 * @description 自动为所有请求添加JWT认证头
 */
api.interceptors.request.use((config) => {
  const auth = useAuthStore();
  // 如果用户已登录，添加Authorization头
  if (auth.token) {
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${auth.token}`
    };
  }
  return config;
});

/**
 * 响应拦截器
 * @description 统一处理API响应和错误
 */
api.interceptors.response.use(
  (response) => response, // 成功响应直接返回
  (error) => {
    // 记录API错误日志
    console.error('[API Error]', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
