<template>
  <view class="login-page">
    <view class="auth-hero">
      <text class="eyebrow">家庭共享记账</text>
      <text class="title">{{ authMode === 'login' ? '欢迎回来' : '创建账号' }}</text>
      <text class="desc">用手机号登录或注册家庭账本。</text>
    </view>

    <view class="tabs">
      <view :class="['tab', authMode === 'login' ? 'active' : '']" @tap="authMode = 'login'">登录</view>
      <view :class="['tab', authMode === 'register' ? 'active' : '']" @tap="authMode = 'register'">注册</view>
    </view>

    <view class="form">
      <view class="field">
        <text class="label">手机号</text>
        <input v-model="phone" type="number" maxlength="11" placeholder="请输入手机号" />
      </view>
      <view class="field">
        <text class="label">密码</text>
        <input v-model="password" type="password" placeholder="请输入密码" />
      </view>
      <button class="save-button" @tap="handleSubmit">{{ authMode === 'login' ? '登录' : '注册' }}</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { api, setToken, setUserInfo, getToken, getUserInfo } from '@/api/index.js';

const authMode = ref('login');
const phone = ref('');
const password = ref('');

onShow(() => {
  const token = getToken();
  const user = getUserInfo();
  if (token && user && user.family_id) {
    uni.switchTab({ url: '/pages/home/index' });
  }
});

async function handleSubmit() {
  if (!/^1\d{10}$/.test(phone.value)) {
    uni.showToast({ title: '请输入正确手机号', icon: 'none' });
    return;
  }
  if (password.value.length < 6) {
    uni.showToast({ title: '密码至少6位', icon: 'none' });
    return;
  }

  try {
    const endpoint = authMode.value === 'login' ? '/auth/login' : '/auth/register';
    const data = await api.post(endpoint, { phone: phone.value, password: password.value });
    setToken(data.token);
    setUserInfo(data.user);

    if (authMode.value === 'login' && data.user.family_id) {
      uni.switchTab({ url: '/pages/home/index' });
    } else {
      uni.redirectTo({ url: '/pages/family-setup/index' });
    }
  } catch (e) {}
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  padding: 60rpx 48rpx;
  background: linear-gradient(180deg, #ffffff 0%, #f5f6f4 100%);
}

.auth-hero {
  margin-bottom: 60rpx;
}

.eyebrow {
  font-size: 24rpx;
  color: #737a72;
  font-weight: 700;
}

.title {
  display: block;
  font-size: 56rpx;
  font-weight: 700;
  margin-top: 12rpx;
}

.desc {
  display: block;
  font-size: 26rpx;
  color: #737a72;
  margin-top: 12rpx;
}

.tabs {
  display: flex;
  background: #f5f6f4;
  border-radius: 16rpx;
  padding: 6rpx;
  margin-bottom: 40rpx;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  border-radius: 12rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: #737a72;
}

.tab.active {
  background: #ffffff;
  color: #171916;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.label {
  font-size: 24rpx;
  color: #737a72;
  font-weight: 600;
}

.field input {
  height: 88rpx;
  padding: 0 24rpx;
  background: #f7f8f6;
  border-radius: 12rpx;
  font-size: 28rpx;
}
</style>
