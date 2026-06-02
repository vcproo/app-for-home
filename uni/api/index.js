var API_BASE = 'https://app-for-home-worker.hants666.workers.dev/api/v1';

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
  var info = uni.getStorageSync('userInfo');
  if (info && typeof info === 'object') return info;
  return null;
}

export function setUserInfo(info) {
  uni.setStorageSync('userInfo', info);
}

export function request(path, options) {
  if (!options) options = {};
  return new Promise(function(resolve, reject) {
    var url = API_BASE + path;
    var header = {
      'Content-Type': 'application/json'
    };
    if (options.header) {
      var keys = Object.keys(options.header);
      for (var i = 0; i < keys.length; i++) {
        header[keys[i]] = options.header[keys[i]];
      }
    }
    var token = getToken();
    if (token) {
      header['Authorization'] = 'Bearer ' + token;
    }
    uni.request({
      url: url,
      method: options.method || 'GET',
      data: options.data,
      header: header,
      success: function(res) {
        var result = res.data;
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
      fail: function(err) {
        uni.showToast({ title: '网络请求失败', icon: 'none' });
        reject(err);
      }
    });
  });
}

export var api = {
  get: function(path) { return request(path); },
  post: function(path, data) { return request(path, { method: 'POST', data: data }); },
  put: function(path, data) { return request(path, { method: 'PUT', data: data }); },
  delete: function(path) { return request(path, { method: 'DELETE' }); }
};
