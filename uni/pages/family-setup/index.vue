<template>
  <view class="family-page">
    <view class="auth-hero">
      <text class="eyebrow">家庭空间</text>
      <text class="title">加入或创建家庭</text>
      <text class="desc">先设置你的昵称，再创建家庭或通过邀请码加入家庭。</text>
    </view>

    <view class="form">
      <view class="field">
        <text class="label">我的昵称</text>
        <input v-model="nickname" type="text" maxlength="10" placeholder="例如：小明、爸爸、妈妈" />
      </view>

      <view class="action-panel">
        <view class="action-info">
          <text class="action-title">创建家庭</text>
          <text class="action-desc">创建后会生成家庭账本空间。</text>
        </view>
        <button class="action-btn" @tap="handleCreate">创建</button>
      </view>

      <view class="action-panel">
        <view class="action-info">
          <text class="action-title">加入家庭</text>
          <text class="action-desc">输入家人提供的邀请码加入共享账本。</text>
        </view>
        <view class="field inline">
          <text class="label">邀请码</text>
          <input v-model="inviteCode" type="text" maxlength="12" placeholder="例如：HOME8624" />
        </view>
        <button class="save-button" @tap="handleJoin">加入家庭</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { api, setToken, setUserInfo } from '@/api/index.js';

const nickname = ref('');
const inviteCode = ref('');

async function handleCreate() {
  if (!nickname.value.trim()) {
    uni.showToast({ title: '请先填写昵称', icon: 'none' });
    return;
  }
  try {
    const data = await api.post('/family/create', {
      name: '我的家庭',
      nickname: nickname.value.trim(),
    });
    setToken(data.token);
    setUserInfo({ ...uni.getStorageSync('userInfo'), family_id: data.family.id, nickname: nickname.value.trim() });
    uni.showToast({ title: '已创建家庭', icon: 'success' });
    setTimeout(() => uni.switchTab({ url: '/pages/home/index' }), 800);
  } catch (e) {}
}

async function handleJoin() {
  if (!nickname.value.trim()) {
    uni.showToast({ title: '请先填写昵称', icon: 'none' });
    return;
  }
  if (!inviteCode.value.trim()) {
    uni.showToast({ title: '请输入邀请码', icon: 'none' });
    return;
  }
  try {
    const data = await api.post('/family/join', {
      invite_code: inviteCode.value.trim(),
      nickname: nickname.value.trim(),
    });
    setToken(data.token);
    setUserInfo({ ...uni.getStorageSync('userInfo'), family_id: data.family.id, nickname: nickname.value.trim() });
    uni.showToast({ title: '已加入家庭', icon: 'success' });
    setTimeout(() => uni.switchTab({ url: '/pages/home/index' }), 800);
  } catch (e) {}
}
</script>

<style scoped>
.family-page {
  min-height: 100vh;
  padding: 60rpx 48rpx;
  background: linear-gradient(180deg, #ffffff 0%, #f5f6f4 100%);
}

.auth-hero { margin-bottom: 48rpx; }
.eyebrow { font-size: 24rpx; color: #737a72; font-weight: 700; }
.title { display: block; font-size: 56rpx; font-weight: 700; margin-top: 12rpx; }
.desc { display: block; font-size: 26rpx; color: #737a72; margin-top: 12rpx; }

.form { display: flex; flex-direction: column; gap: 24rpx; }
.field { display: flex; flex-direction: column; gap: 8rpx; }
.field.inline { flex-direction: row; align-items: center; gap: 16rpx; margin-top: 16rpx; }
.field.inline input { flex: 1; }
.label { font-size: 24rpx; color: #737a72; font-weight: 600; }
.field input { height: 88rpx; padding: 0 24rpx; background: #f7f8f6; border-radius: 12rpx; font-size: 28rpx; }

.action-panel {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 28rpx;
  border: 2rpx solid #e7ebe5;
}

.action-info { margin-bottom: 16rpx; }
.action-title { display: block; font-size: 30rpx; font-weight: 600; }
.action-desc { display: block; font-size: 24rpx; color: #737a72; margin-top: 6rpx; }

.action-btn {
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;
  background: #f7f8f6;
  color: #171916;
  font-size: 28rpx;
  font-weight: 600;
  border: none;
}
.action-btn::after { border: none; }
</style>
