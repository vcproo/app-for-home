// #ifdef H5
const API_BASE = '/api/v1';
// #endif
// #ifndef H5
const API_BASE = 'https://app-for-home-worker.hants666.workers.dev/api/v1';
// #endif

export function getToken() {
  return uni.getStorageSync('token') || '';
}

export function setToken(token) {
  uni.setStorageSync('token', token);
}

export function clearToken() {
  uni.removeStorageSync('token');
  uni.removeStorageSync('userInfo');
}

export function getUserInfo() {
  return uni.getStorageSync('userInfo') || null;
}

export function setUserInfo(info) {
  uni.setStorageSync('userInfo', info);
}

export function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}${path}`;
    const header = {
      'Content-Type': 'application/json',
      ...options.header,
    };
    const token = getToken();
    if (token) {
      header['Authorization'] = `Bearer ${token}`;
    }
    uni.request({
      url,
      method: options.method || 'GET',
      data: options.data,
      header,
      success: (res) => {
        const result = res.data;
        if (result.code === 1005) {
          clearToken();
          uni.reLaunch({ url: '/pages/login/index' });
          reject(new Error('登录已过期'));
          return;
        }
        if (result.code !== 0) {
          uni.showToast({ title: result.message || '请求失败', icon: 'none' });
          reject(new Error(result.message));
          return;
        }
        resolve(result.data);
      },
      fail: (err) => {
        uni.showToast({ title: '网络请求失败', icon: 'none' });
        reject(err);
      },
    });
  });
}

export const api = {
  get: (path) => request(path),
  post: (path, data) => request(path, { method: 'POST', data }),
  put: (path, data) => request(path, { method: 'PUT', data }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
